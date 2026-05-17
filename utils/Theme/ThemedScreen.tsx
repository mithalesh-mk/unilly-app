import { PropsWithChildren } from "react";

import { StyleSheet, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { radii, spacing, useTheme } from "@/constants/theme";

type ThemedScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function ThemedScreen({ title, subtitle, children }: ThemedScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text
            style={[
              styles.eyebrow,
              {
                color: colors.subText,
              },
            ]}
          >
            Unilly
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {title}
          </Text>

          {!!subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.subText,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {!!children && <View style={styles.content}>{children}</View>}
      </View>
    </SafeAreaView>
  );
}

export function SectionCard({ children }: PropsWithChildren) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function BodyText({ children }: PropsWithChildren) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.body,
        {
          color: colors.subText,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    gap: spacing.sm,
  },

  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },

  content: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },

  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
