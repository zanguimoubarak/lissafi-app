import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "lissafi_access_token";
const REFRESH_TOKEN_KEY = "lissafi_refresh_token";

type SecureStoreModule = typeof import("expo-secure-store");

const memoryStorage = new Map<string, string>();

async function getSecureStore(): Promise<SecureStoreModule | null> {
  if (Platform.OS === "web") return null;

  try {
    return await import("expo-secure-store");
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  const SecureStore = await getSecureStore();
  if (!SecureStore?.isAvailableAsync || !(await SecureStore.isAvailableAsync())) {
    memoryStorage.set(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  const SecureStore = await getSecureStore();
  if (!SecureStore?.isAvailableAsync || !(await SecureStore.isAvailableAsync())) {
    return memoryStorage.get(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  const SecureStore = await getSecureStore();
  if (!SecureStore?.isAvailableAsync || !(await SecureStore.isAvailableAsync())) {
    memoryStorage.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

/**
 * Saves the current access and refresh tokens in secure device storage.
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, accessToken),
    setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

/**
 * Reads the current access token from secure storage.
 */
export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

/**
 * Reads the current refresh token from secure storage.
 */
export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

/**
 * Removes all persisted authentication tokens.
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
}
