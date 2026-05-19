import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOW } from '@/constants/theme';
import { IconSymbol } from './icon-symbol';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'tray', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <IconSymbol name={icon} size={34} color={COLORS.green600} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingTop: 60,
    gap: 12,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: COLORS.green100,
    borderRadius: RADIUS.xl,
    height: 72,
    justifyContent: 'center',
    marginBottom: 8,
    width: 72,
  },
  title: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, color: COLORS.gray700, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.gray400, textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: 28,
    ...SHADOW.green,
  },
  btnTxt: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
});
