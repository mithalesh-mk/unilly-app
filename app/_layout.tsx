import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppThemeProvider, useTheme } from "@/utils/Theme/theme";

import { AuthProvider } from "@/utils/Auths/AuthContext";

function RootNavigator() {
  const { navigationTheme, colors, isDark } = useTheme();

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.bg}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </AuthProvider>
  );
}
