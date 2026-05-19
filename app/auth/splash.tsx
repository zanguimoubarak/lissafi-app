import { COLORS, FONT_SIZE, FONT_WEIGHT } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const timer = setTimeout(() => router.replace("/auth/register"), 2800);
    return () => clearTimeout(timer);
  }, [barAnim, fadeAnim, router, scaleAnim]);

  const barTranslate = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoBox}>
          <IconSymbol name="chart.bar" size={36} color={COLORS.white} />
        </View>
        <Text style={styles.appName}>
          LISSAFI<Text style={styles.appNameAccent}>-P</Text>
        </Text>
        <Text style={styles.tagline}>
          Votre Comptabilité,{"\n"}Simple & Sécurisée
        </Text>
        <Text style={styles.university}>
          Une innovation de{"\n"}l&apos;Universit&eacute; de Maroua
        </Text>
      </Animated.View>

      <View style={styles.loaderContainer}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderBar,
              { transform: [{ translateX: barTranslate }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy900,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: COLORS.green600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: 1,
  },
  appNameAccent: { color: COLORS.green400 },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 22,
  },
  university: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 16,
  },
  loaderContainer: {
    position: "absolute",
    bottom: 80,
    width: 50,
    overflow: "hidden",
  },
  loaderTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  loaderBar: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "60%",
    height: "100%",
    backgroundColor: COLORS.green500,
    borderRadius: 2,
  },
});
