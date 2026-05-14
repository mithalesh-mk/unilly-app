import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

const isWeb = Platform.OS === "web";

const getItem = async (key: string) => {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string) => {
  if (isWeb) {
    return AsyncStorage.setItem(key, value);
  }

  return SecureStore.setItemAsync(key, value);
};

const removeItem = async (key: string) => {
  if (isWeb) {
    return AsyncStorage.removeItem(key);
  }

  return SecureStore.deleteItemAsync(key);
};

export const authStorage = {
  async getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, accessToken),
      setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens() {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
