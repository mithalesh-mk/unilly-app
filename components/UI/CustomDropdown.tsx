import { Ionicons } from "@expo/vector-icons";

import React, { useState } from "react";

import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { radii, spacing, useTheme } from "@/utils/Theme/theme";

type Props = {
  label?: string;
  data: string[];
  value: string | number;
  onSelect: (val: any) => void;
  placeholder: string;
};

export default function CustomDropdown({
  label,
  data,
  value,
  onSelect,
  placeholder,
}: Props) {
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);

  return (
    <>
      {!!label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.subText,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={{
            color: value ? colors.text : colors.subText,
          }}
        >
          {value || placeholder}
        </Text>

        <Ionicons name="chevron-down" size={18} color={colors.subText} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: "rgba(0,0,0,0.45)",
            },
          ]}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />

            <Text
              style={[
                styles.sheetTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {placeholder}
            </Text>

            <FlatList
              data={data}
              keyExtractor={(item, index) => `${item}-${index}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item === value;

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelect(item);

                      setVisible(false);
                    }}
                    style={[
                      styles.option,
                      selected && {
                        backgroundColor: colors.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {item}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              <Text
                style={{
                  color: colors.subText,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },

  trigger: {
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "70%",
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  option: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  cancelButton: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
