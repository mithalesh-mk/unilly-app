import React from "react";

import { BodyText, SectionCard, ThemedScreen } from "@/components/ThemedScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  return (
    <SafeAreaView>
      <SectionCard>
        <BodyText>
          Upcoming events, community posts, and quick campus updates will appear
          here.
        </BodyText>
      </SectionCard>
    </SafeAreaView>
  );
};

export default Home;
