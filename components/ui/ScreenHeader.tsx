import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, SHADOW } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
  dark?: boolean;
}

export function ScreenHeader({ title, showBack = true, right, dark = false }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, dark ? styles.headerDark : null]}>
      {showBack ? (
        <TouchableOpacity style={[styles.back, dark ? styles.backDark : null]} onPress={() => router.back()}>
          <Text style={[styles.backIcon, dark ? { color: COLORS.white } : null]}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={[styles.title, dark ? styles.titleDark : null]} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>{right ?? <View style={{ width: 40 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.xl,
    ...SHADOW.sm,
  },
  headerDark: { backgroundColor: COLORS.navy800 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  backIcon: { fontSize: FONT_SIZE.lg, color: COLORS.gray700, fontWeight: FONT_WEIGHT.bold },
  title: { flex: 1, textAlign: 'center', fontWeight: FONT_WEIGHT.extrabold, fontSize: FONT_SIZE.lg, color: COLORS.navy800 },
  titleDark: { color: COLORS.white },
  right: { width: 40, alignItems: 'flex-end' },
});
