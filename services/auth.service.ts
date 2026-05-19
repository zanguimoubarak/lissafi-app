// Authentication service: public auth flows, profile updates and password changes.
import type { ActivityType, User } from "@/context/AppContext";
import { apiFetch, type ApiError } from "@/services/api";
import { saveTokens, clearTokens } from "@/utils/tokenStorage";
import {
  type ApiUser,
  mapActivityTypeToApi,
  mapUserFromApi,
} from "@/utils/mappers";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface ApiAuthResponse extends AuthTokens {
  user: ApiUser;
}

interface ApiUserResponse {
  user: ApiUser;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface UpdateProfilePayload {
  boutiqueName: string;
  activityType: ActivityType;
  address: string;
  description: string;
  logoUrl: string;
  workHoursStart: string;
  workHoursEnd: string;
}

function withCameroonPrefix(phone: string): string {
  return phone.startsWith("+237") ? phone : `+237${phone}`;
}

function mapAuthResponse(data: ApiAuthResponse): AuthResponse {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapUserFromApi(data.user),
  };
}

function mapProfilePayload(
  data: Partial<UpdateProfilePayload>,
): Record<string, string> {
  const payload: Record<string, string> = {};
  if (data.boutiqueName !== undefined) payload.boutique_name = data.boutiqueName;
  if (data.activityType !== undefined) {
    payload.activity_type = mapActivityTypeToApi(data.activityType);
  }
  if (data.address !== undefined) payload.address = data.address;
  if (data.description !== undefined) payload.description = data.description;
  if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
  if (data.workHoursStart !== undefined) {
    payload.work_hours_start = data.workHoursStart;
  }
  if (data.workHoursEnd !== undefined) payload.work_hours_end = data.workHoursEnd;
  return payload;
}

/**
 * Registers a phone number and optionally sends the selected activity type.
 * @param phone Local or +237 phone number.
 * @param activityType Optional local activity type.
 * @returns The backend registration identifier.
 * @throws ApiError
 */
export async function register(
  phone: string,
  activityType?: ActivityType,
): Promise<{ userId: string; identifier: string }> {
  return apiFetch("/auth/register", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      phone: withCameroonPrefix(phone),
      activity_type: mapActivityTypeToApi(activityType),
    }),
  });
}

/**
 * Verifies a one-time password sent to the user.
 * @param identifier Phone or email identifier.
 * @param token Six-digit OTP token.
 * @returns User id and password requirement flag.
 * @throws ApiError
 */
export async function verifyOtp(
  identifier: string,
  token: string,
): Promise<{ userId: string; requiresPassword: boolean }> {
  return apiFetch("/auth/verify-otp", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ identifier, token }),
  });
}

/**
 * Sets the initial user password/PIN and persists returned tokens.
 * @param userId Backend user id.
 * @param password New password or PIN.
 * @returns Authenticated user and tokens.
 * @throws ApiError
 */
export async function setPassword(
  userId: string,
  password: string,
): Promise<AuthResponse> {
  const data = await apiFetch<ApiAuthResponse>("/auth/set-password", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ userId, password }),
  });
  await saveTokens(data.accessToken, data.refreshToken);
  return mapAuthResponse(data);
}

/**
 * Logs in with an identifier and password/PIN, then persists returned tokens.
 * @param identifier Phone or email identifier.
 * @param password Password or PIN.
 * @returns Authenticated user and tokens.
 * @throws ApiError
 */
export async function login(
  identifier: string,
  password: string,
): Promise<AuthResponse> {
  const data = await apiFetch<ApiAuthResponse>("/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ identifier, password }),
  });
  await saveTokens(data.accessToken, data.refreshToken);
  return mapAuthResponse(data);
}

/**
 * Logs out the current session and clears local tokens even if the API fails.
 * @param refreshToken Refresh token to invalidate server-side.
 * @returns Nothing.
 * @throws ApiError
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    if (!refreshToken) return;
    await apiFetch<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } finally {
    await clearTokens();
  }
}

/**
 * Loads the authenticated user profile.
 * @returns Current user.
 * @throws ApiError
 */
export async function getProfile(): Promise<User> {
  const data = await apiFetch<ApiUserResponse>("/auth/me");
  return mapUserFromApi(data.user);
}

/**
 * Updates the authenticated user profile.
 * @param data Partial profile payload in app camelCase shape.
 * @returns Updated user.
 * @throws ApiError
 */
export async function updateProfile(
  data: Partial<UpdateProfilePayload>,
): Promise<User> {
  const updated = await apiFetch<ApiUserResponse>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(mapProfilePayload(data)),
  });
  return mapUserFromApi(updated.user);
}

/**
 * Changes the authenticated user's password/PIN.
 * @param currentPassword Current password or PIN.
 * @param newPassword New password or PIN.
 * @returns Nothing.
 * @throws ApiError
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<void>("/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

/**
 * Requests a fresh OTP for the provided identifier.
 * @param identifier Phone or email identifier.
 * @returns Nothing.
 * @throws ApiError
 */
export async function resendOtp(identifier: string): Promise<void> {
  await apiFetch<void>("/auth/resend-otp", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ identifier }),
  });
}

export type { ApiError };
