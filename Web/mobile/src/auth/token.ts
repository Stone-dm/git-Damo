import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

let memoryToken: string | null = null;

export function getToken(): string | null {
  return memoryToken;
}

export async function loadToken(): Promise<string | null> {
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return memoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}
