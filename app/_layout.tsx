import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { NetworkBanner } from "@/components/ui";
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from "@/constants/theme";
import { AppProvider, useApp } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

function StartupLoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <View style={styles.loadingLogo}>
        <Text style={styles.loadingLogoText}>L</Text>
      </View>
      <Text style={styles.loadingBrand}>LISSAFI-P</Text>
      <ActivityIndicator color={COLORS.green600} size="small" />
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const app = useApp();
  const isAuthenticated = app?.isAuthenticated ?? false;
  const isLoading = app?.isLoading ?? false;
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    if (navigationState?.key) {
      setNavReady(true);
    }
  }, [navigationState?.key]);

  useEffect(() => {
    if (!navReady || isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const target =
      !isAuthenticated && !inAuthGroup
        ? "/auth/splash"
        : isAuthenticated && inAuthGroup
          ? "/"
          : null;
    if (!target) return;

    const timer = setTimeout(() => {
      router.replace(target);
    }, 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, segments, navReady, router]);

  if (isLoading) {
    return (
      <>
        <StartupLoadingScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="operations/new"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="operations/edit"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="stock/index" />
        <Stack.Screen
          name="stock/new-product"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="stock/movement"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="clients/index" />
        <Stack.Screen name="clients/detail" />
        <Stack.Screen
          name="clients/new-client"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="charges/index" />
        <Stack.Screen
          name="charges/new-charge"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="rapports/index" />
        <Stack.Screen name="boutique/index" />
        <Stack.Screen name="pro/upgrade" />
        <Stack.Screen
          name="settings/edit-profile"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="settings/work-hours"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="settings/change-pin"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="settings/activity"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <NetworkBanner />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    flex: 1,
    gap: SPACING.md,
    justifyContent: "center",
  },
  loadingLogo: {
    alignItems: "center",
    backgroundColor: COLORS.navy700,
    borderRadius: 14,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  loadingLogoText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  loadingBrand: {
    color: COLORS.navy700,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.lg,
  },
});
