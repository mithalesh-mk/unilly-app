import { Tabs } from "expo-router";

import Entypo from "@expo/vector-icons/Entypo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "@/constants/theme";
import { useAuth } from "@/utils/Auths/AuthContext";
import { Image } from "expo-image";
import { View } from "react-native";

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,

        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          marginBottom: 14,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        sceneStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events/index"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create/index"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community/index"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: `${user?.username || "Profile"}`,
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                borderColor: isDark ? "cyan" : "blue",
                borderWidth: 1,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={user?.profile_pic || undefined}
                style={{ width: size, height: size, borderRadius: size / 2 }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
