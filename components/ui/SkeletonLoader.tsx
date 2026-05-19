import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { COLORS, RADIUS, SPACING } from "@/constants/theme";

interface Props {
  count?: number;
  height?: number;
}

export function SkeletonLoader({ count = 5, height = 64 }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View
          key={index}
          style={[styles.row, { height, opacity }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  row: {
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.md,
  },
});
