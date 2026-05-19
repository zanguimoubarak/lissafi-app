import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW } from "@/constants/theme";

interface Props {
  label: string;
  onPress: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  color?: string;
  style?: ViewStyle;
}

export function LoadingButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  color = COLORS.green600,
  style,
}: Props) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      onPress={() => {
        void onPress();
      }}
      style={[
        styles.button,
        { backgroundColor: color },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    ...SHADOW.green,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});
