import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "pro";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

export function Badge({ label, variant = "neutral", icon }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      {icon && <Text style={{ fontSize: 10 }}>{icon}</Text>}
      <Text
        style={[
          styles.txt,
          styles[`txt_${variant}` as keyof typeof styles] as any,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  txt: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  success: { backgroundColor: COLORS.green100 },
  danger: { backgroundColor: COLORS.red100 },
  warning: { backgroundColor: COLORS.amber100 },
  info: { backgroundColor: COLORS.blue100 },
  neutral: { backgroundColor: COLORS.gray100 },
  pro: { backgroundColor: "rgba(245,158,11,0.15)" },
  txt_success: { color: COLORS.green600 },
  txt_danger: { color: COLORS.red500 },
  txt_warning: { color: "#78350f" },
  txt_info: { color: "#1d4ed8" },
  txt_neutral: { color: COLORS.gray600 },
  txt_pro: { color: COLORS.amber500 },
});
