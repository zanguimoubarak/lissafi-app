import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from "@/constants/theme";
import { IconSymbol } from "./icon-symbol";

interface Props {
  error: string | null;
  style?: ViewStyle;
}

export function ApiErrorMessage({ error, style }: Props) {
  const opacity = useRef(new Animated.Value(error ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: error ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [error, opacity]);

  if (!error) return null;

  return (
    <Animated.View style={[styles.container, { opacity }, style]}>
      <View style={styles.row}>
        <IconSymbol name="alert" size={16} color={COLORS.red500} />
        <Text style={styles.text}>{error}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
  },
  text: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
