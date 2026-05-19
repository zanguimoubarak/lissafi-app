import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/utils/tokenStorage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const TIMEOUT_MS = 20_000;

type ApiFieldError = { field: string; message: string };

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: ApiFieldError[];
}

interface RefreshTokensResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
}

export type ApiFetchOptions = RequestInit & { skipAuth?: boolean };

/**
 * Error thrown by the API layer for HTTP, auth, timeout and network failures.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: ApiFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string): string {
  const normalizedBase = BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function mergeHeaders(
  baseHeaders: HeadersInit | undefined,
  token: string | null,
): Headers {
  const headers = new Headers(baseHeaders);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) {
    return { success: response.ok, data: undefined as T };
  }

  return JSON.parse(text) as ApiEnvelope<T>;
}

async function request<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ response: Response; envelope: ApiEnvelope<T> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = options.skipAuth === true ? null : await getAccessToken();
  const { skipAuth: _skipAuth, headers: rawHeaders, ...fetchOptions } = options;

  try {
    const response = await fetch(buildUrl(path), {
      ...fetchOptions,
      headers: mergeHeaders(rawHeaders, token),
      signal: controller.signal,
    });
    const envelope = await parseEnvelope<T>(response);
    return { response, envelope };
  } finally {
    clearTimeout(timeout);
  }
}

let refreshInFlight: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  // single-flight : évite que plusieurs appels concurrents refreshent en boucle
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, "Session expirée");
    }

    const { response, envelope } = await request<RefreshTokensResponse>(
      "/auth/refresh",
      {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );



    if (!response.ok || !envelope.success) {
      throw new ApiError(
        response.status,
        envelope.message ?? "Session expirée",
        envelope.errors,
      );
    }

    const accessToken = envelope.data.accessToken ?? envelope.data.access_token;
    const nextRefreshToken =
      envelope.data.refreshToken ?? envelope.data.refresh_token ?? refreshToken;

    if (!accessToken) {
      throw new ApiError(401, "Session expirée");
    }

    await saveTokens(accessToken, nextRefreshToken);
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}


/**
 * Calls the backend API, injects auth headers, refreshes expired tokens and
 * returns the unwrapped `data` payload.
 *
 * @param path Backend path beginning with `/`.
 * @param options Native fetch options plus `skipAuth` for public routes.
 * @returns The API envelope `data` payload.
 * @throws ApiError when the request fails.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  try {
    const firstAttempt = await request<T>(path, options);



    if (
      firstAttempt.response.status === 401 &&
      path !== "/auth/refresh" &&
      path !== "/auth/login"
    ) {
      try {
        await refreshTokens();
        const retry = await request<T>(path, options);
        if (!retry.response.ok || !retry.envelope.success) {
          throw new ApiError(
            retry.response.status,
            retry.envelope.message ?? "Erreur API",
            retry.envelope.errors,
          );
        }
        return retry.envelope.data;
      } catch {
        await clearTokens();
        throw new ApiError(401, "Session expirée");
      }
    }


    if (!firstAttempt.response.ok || !firstAttempt.envelope.success) {
      throw new ApiError(
        firstAttempt.response.status,
        firstAttempt.envelope.message ?? "Erreur API",
        firstAttempt.envelope.errors,
      );
    }

    return firstAttempt.envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(0, "La requête a expiré. Réessayez.");
    }

    throw new ApiError(0, "Vérifiez votre connexion Internet");
  }
}
