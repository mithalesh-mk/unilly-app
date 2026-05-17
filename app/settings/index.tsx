import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/utils/Theme/theme";
import { useAuth } from "@/utils/Auths/AuthContext";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SettingItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  arrow?: boolean;
  toggle?: boolean;
  danger?: boolean;
};

type Section = {
  title: string;
  items: SettingItem[];
};

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    title: "Account",
    items: [
      {
        id: "edit_profile",
        icon: "person-outline",
        title: "Edit Profile",
        arrow: true,
      },
      {
        id: "saved",
        icon: "bookmark-outline",
        title: "Saved Posts",
        arrow: true,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        id: "dark_mode",
        icon: "moon-outline",
        title: "Dark Mode",
        toggle: true,
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        title: "Notifications",
        arrow: true,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        id: "help",
        icon: "help-circle-outline",
        title: "Help Center",
        arrow: true,
      },
      {
        id: "about",
        icon: "information-circle-outline",
        title: "About",
        arrow: true,
      },
    ],
  },
  {
    title: "Session",
    items: [
      {
        id: "logout",
        icon: "log-out-outline",
        title: "Logout",
        danger: true,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();

  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handlePress = async (id: string) => {
    switch (id) {
      case "logout":
        await logout();
        break;

      case "edit_profile":
        router.push("/(tabs)/profile");
        break;

      case "saved":
        router.push("/");
        break;

      case "notifications":
        router.push("/");
        break;
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 14 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "700",
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 60,
        }}
      >
        {/* Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/profile")}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 24,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <Image
            source={{
              uri: user?.profile_pic || "https://i.pravatar.cc/300",
            }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
            }}
          />

          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              {user?.name || "Unknown User"}
            </Text>

            <Text
              style={{
                color: colors.subText,
                marginTop: 4,
                fontSize: 13,
              }}
            >
              View your profile
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 26 }}>
            <Text
              style={{
                color: colors.subText,
                fontSize: 12,
                fontWeight: "700",
                marginBottom: 10,
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {section.title}
            </Text>

            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 22,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={
                      item.toggle ? undefined : () => handlePress(item.id)
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    {/* Icon */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? "#1a1a1a" : "#f2f2f2",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.danger ? "#ff4d4d" : colors.primary}
                      />
                    </View>

                    {/* Text */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: item.danger ? "#ff4d4d" : colors.text,
                          fontSize: 15,
                          fontWeight: "500",
                        }}
                      >
                        {item.title}
                      </Text>

                      {item.subtitle && (
                        <Text
                          style={{
                            color: colors.subText,
                            marginTop: 4,
                            fontSize: 12,
                          }}
                        >
                          {item.subtitle}
                        </Text>
                      )}
                    </View>

                    {/* Right Side */}
                    {item.toggle ? (
                      <Switch
                        value={
                          item.id === "dark_mode"
                            ? isDark
                            : notificationsEnabled
                        }
                        onValueChange={
                          item.id === "dark_mode"
                            ? toggleTheme
                            : setNotificationsEnabled
                        }
                        trackColor={{
                          false: colors.border,
                          true: colors.primary,
                        }}
                        thumbColor="#ffffff"
                      />
                    ) : item.arrow ? (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.subText}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View
          style={{
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color: colors.subText,
              fontSize: 12,
            }}
          >
            Unilly © 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
