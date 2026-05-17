import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { themeStorage } from "./themeStorage";

type ThemeContextType = {
  colors: typeof lightColors;
  isDark: boolean;
  toggleTheme: () => void;
  navigationTheme: any;
};

export const lightColors = {
  bg: "#ffffff",
  card: "#f6f6f6",
  text: "#0a0a0a",
  subText: "#6b6b6b",
  border: "#dddddd",
  primary: "#000000",
  error: "#ff4d4d",
};

export const darkColors = {
  bg: "#050505",
  card: "#111111",
  text: "#f7f7f7",
  subText: "#8a8a8a",
  border: "#2d2d2d",
  primary: "#ffffff",
  error: "#ff4d4d",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await themeStorage.getTheme();

      if (savedTheme === "dark") {
        setIsDark(true);
      }
    } catch (error) {
      console.log("Failed to load theme", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const nextTheme = !isDark;

      setIsDark(nextTheme);

      await themeStorage.setTheme(nextTheme ? "dark" : "light");
    } catch (error) {
      console.log("Failed to save theme", error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  const value = useMemo(
    () => ({
      colors,
      isDark,
      toggleTheme,
      navigationTheme,
    }),
    [isDark],
  );

  if (loading) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside AppThemeProvider");
  }

  return context;
}
