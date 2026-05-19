import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW } from '@/constants/theme';

type Variant = 'primary' | 'danger' | 'outline' | 'ghost' | 'pro';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style, textStyle, fullWidth }: ButtonProps) {
  const isDisabled = disabled || loading;

  const btnStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    variant === 'primary' && styles.primary,
    variant === 'danger'  && styles.danger,
    variant === 'outline' && styles.outline,
    variant === 'ghost'   && styles.ghost,
    variant === 'pro'     && styles.pro,
    isDisabled && styles.disabled,
    style,
  ];

  const txtStyle = [
    styles.txt,
    variant === 'primary' && styles.txtLight,
    variant === 'danger'  && styles.txtLight,
    variant === 'pro'     && styles.txtLight,
    variant === 'outline' && styles.txtGreen,
    variant === 'ghost'   && styles.txtGray,
    textStyle,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={isDisabled} activeOpacity={0.82}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.green600 : COLORS.white} size="small" />
      ) : (
        <>
          {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
          <Text style={txtStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
  },
  fullWidth: { width: '100%' },
  primary:  { backgroundColor: COLORS.green600, ...SHADOW.green },
  danger:   { backgroundColor: COLORS.red500 },
  outline:  { borderWidth: 1.5, borderColor: COLORS.green600, backgroundColor: COLORS.white },
  ghost:    { backgroundColor: COLORS.gray100 },
  pro:      { backgroundColor: COLORS.navy700, ...SHADOW.md },
  disabled: { opacity: 0.5 },
  txt:      { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  txtLight: { color: COLORS.white },
  txtGreen: { color: COLORS.green600 },
  txtGray:  { color: COLORS.gray700 },
});
