import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: "default" | "navy" | "success" | "danger";
}

export function Card({
  children,
  title,
  style,
  onPress,
  variant = "default",
}: CardProps) {
  const cardStyle = [
    styles.card,
    variant === "navy" && styles.navyCard,
    variant === "success" && styles.successCard,
    variant === "danger" && styles.dangerCard,
    style,
  ];

  const titleStyle = [
    styles.title,
    variant === "navy" && { color: COLORS.white },
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {title && <Text style={titleStyle}>{title}</Text>}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {children}
    </View>
  );
}

interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  style?: ViewStyle;
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  color = COLORS.green600,
  style,
}: KpiCardProps) {
  return (
    <View style={[styles.kpi, style]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + "20" }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={styles.kpiBody}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        {sub && <Text style={styles.kpiSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  navyCard: { backgroundColor: COLORS.navy800 },
  successCard: {
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green100,
  },
  dangerCard: {
    backgroundColor: COLORS.red100,
    borderWidth: 1.5,
    borderColor: "#fca5a5",
  },
  title: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  kpi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBody: { flex: 1 },
  kpiLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    marginTop: 1,
  },
  kpiSub: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 1 },
});
