import React from "react";

import {
  BodyText,
  SectionCard,
  ThemedScreen,
} from "@/utils/Theme/ThemedScreen";

const Events = () => {
  return (
    <ThemedScreen
      title="Events"
      subtitle="Browse sessions, meetups, and campus moments in one monochrome space."
    >
      <SectionCard>
        <BodyText>
          Event cards can use this same surface, border, and text system.
        </BodyText>
      </SectionCard>
    </ThemedScreen>
  );
};

export default Events;
