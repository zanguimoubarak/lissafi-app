import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from "@/constants/theme";
import { IconSymbol } from "./icon-symbol";

export function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -80,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  return (
    <Animated.View
      pointerEvents={isOffline ? "auto" : "none"}
      style={[
        styles.banner,
        { paddingTop: insets.top + SPACING.sm, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        <IconSymbol name="alert" size={18} color={COLORS.white} />
        <Text style={styles.text}>Pas de connexion Internet</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.red500,
    left: 0,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    minHeight: 32,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
});
