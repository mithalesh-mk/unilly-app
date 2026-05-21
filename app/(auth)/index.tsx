import React, { useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Link } from "expo-router";

import { useTheme, radii, spacing } from "@/utils/Theme/theme";
import { useAuth } from "@/utils/Auths/AuthContext";

export default function Login() {
  const { colors } = useTheme();

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login({
        Identifier: identifier,
        password,
      });
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Welcome Back
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.subText,
            },
          ]}
        >
          Login to continue
        </Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.subText}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.subText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          {!!error && (
            <Text
              style={{
                color: colors.error,
              }}
            >
              {error}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: colors.bg,
                  },
                ]}
              >
                Login
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={{
              color: colors.subText,
              textAlign: "center",
            }}
          >
            Don't have an account?{" "}
            <Link
              href="/(auth)/signup"
              style={{
                color: colors.text,
                fontWeight: "700",
              }}
            >
              Signup
            </Link>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 15,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  form: {
    gap: spacing.md,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },

  button: {
    height: 52,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
