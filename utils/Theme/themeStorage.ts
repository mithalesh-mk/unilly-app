// utility/themeStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

export const THEME_KEY = "app_theme";

export const themeStorage = {
  async getTheme() {
    return AsyncStorage.getItem(THEME_KEY);
  },

  async setTheme(theme: "light" | "dark") {
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  async clearTheme() {
    await AsyncStorage.removeItem(THEME_KEY);
  },
};
