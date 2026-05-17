import React from "react";

import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Link } from "expo-router";

import {
  BodyText,
  SectionCard,
  ThemedScreen,
} from "@/utils/Theme/ThemedScreen";

import { radii, spacing, useTheme } from "@/constants/theme";

export default function Signup() {
  const { colors } = useTheme();

  return (
    <ThemedScreen
      title="Create account"
      subtitle="Use your school email to keep your network focused and useful."
    >
      <SectionCard>
        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Full name
          </Text>

          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Email
          </Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@university.edu"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
              },
            ]}
          >
            Password
          </Text>

          <TextInput
            secureTextEntry
            placeholder="Create a password"
            placeholderTextColor={colors.subText}
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: colors.bg,
              },
            ]}
          >
            Sign up
          </Text>
        </Pressable>
      </SectionCard>

      <BodyText>
        Already have an account?{" "}
        <Link
          href="/(auth)"
          style={[
            styles.link,
            {
              color: colors.text,
            },
          ]}
        >
          Log in
        </Link>
      </BodyText>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
  },

  input: {
    minHeight: 48,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
  },

  primaryButton: {
    minHeight: 48,
    marginTop: spacing.sm,
    borderRadius: radii.sm,

    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },

  link: {
    fontWeight: "800",
  },
});
