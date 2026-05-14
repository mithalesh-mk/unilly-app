import React from "react";

import { BodyText, SectionCard, ThemedScreen } from "@/components/ThemedScreen";

const Community = () => {
  return (
    <ThemedScreen
      title="Community"
      subtitle="Keep conversations readable with strong contrast and quiet surfaces."
    >
      <SectionCard>
        <BodyText>Groups, discussions, and updates can share this card treatment.</BodyText>
      </SectionCard>
    </ThemedScreen>
  );
};

export default Community;
