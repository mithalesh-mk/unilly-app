import React from "react";

import {
  BodyText,
  SectionCard,
  ThemedScreen,
} from "@/utils/Theme/ThemedScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native";

const CreatePost = () => {
  return (
    <SafeAreaView>
      <Text style={{ color: "white" }}>Create Post</Text>
    </SafeAreaView>
  );
};

export default CreatePost;
