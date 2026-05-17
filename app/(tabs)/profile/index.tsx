import React from "react";

import {
  BodyText,
  SectionCard,
  ThemedScreen,
} from "@/utils/Theme/ThemedScreen";
import { Pressable, Text } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/utils/Theme/theme";

const Profile = () => {
  const { colors } = useTheme();
  return (
    <ThemedScreen
      title="Profile"
      subtitle="Your profile, settings, and activity in the same monochrome system."
    >
      <SectionCard>
        <BodyText>
          Profile details and actions will inherit the shared black and white
          palette.
        </BodyText>
      </SectionCard>
      <Link href={"/settings"} style={{ marginTop: 20 }}>
        <Text style={{ color: colors.primary }}>Go to Settings</Text>
      </Link>
    </ThemedScreen>
  );
};

export default Profile;
