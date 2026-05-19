import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { ActivityType, useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";

const ACTIVITIES: { id: ActivityType; label: string; icon: string }[] = [
  { id: "commerce", label: "Boutique / Commerce général", icon: "bag" },
  {
    id: "mecanique",
    label: "Garage Mécanique",
    icon: "wrench.and.screwdriver",
  },
  { id: "restauration", label: "Restauration", icon: "fork.knife" },
  { id: "beaute", label: "Salon de Beauté", icon: "scissors" },
  { id: "autre", label: "Autre activité", icon: "gear" },
];

function AnimatedTouchable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  const [selected, setSelected] = useState<ActivityType>("commerce");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    try {
      setIsLoading(true);
      setError("");
      const updatedUser = await authService.updateProfile({ activityType: selected });
      setUser(updatedUser);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue");
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        router.replace("/");
      } catch {
        router.replace("/auth/register");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconSymbol
            name="chevron.left"
            style={{ width: 16, height: 16, marginRight: 4 }}
            color={COLORS.gray600}
          />
          <Text style={styles.backText}>Retour</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoRow}>
          <View style={styles.miniIcon}>
            <Text style={styles.miniIconText}>L</Text>
          </View>
          <Text style={styles.brandName}>LISSAFI-P</Text>
        </View>

        <Text style={styles.heading}>Quel est votre m&eacute;tier ?</Text>
        <Text style={styles.sub}>
          Choisissez votre secteur d&apos;activit&eacute;
        </Text>

        <View style={styles.list}>
          {ACTIVITIES.map((a) => (
            <AnimatedTouchable
              key={a.id}
              style={[
                styles.item,
                selected === a.id ? styles.itemSelected : null,
              ]}
              onPress={() => setSelected(a.id)}
            >
              <IconSymbol
                name={a.icon as any}
                style={{ width: 24, height: 24 }}
                color={selected === a.id ? COLORS.white : COLORS.gray600}
              />
              <Text
                style={[
                  styles.itemLabel,
                  selected === a.id ? styles.itemLabelSelected : null,
                ]}
              >
                {a.label}
              </Text>
              {selected === a.id && (
                <IconSymbol
                  name="checkmark"
                  style={{ width: 16, height: 16 }}
                  color={COLORS.white}
                />
              )}
            </AnimatedTouchable>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading ? styles.btnDisabled : null]}
          onPress={() => {
            void handleNext();
          }}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.btnText}>Suivant →</Text>}
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  back: { padding: SPACING.lg },
  backText: {
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
  scroll: { flexGrow: 1, padding: SPACING.xxl, paddingTop: 0 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SPACING.xl,
    justifyContent: "center",
  },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.navy700,
    alignItems: "center",
    justifyContent: "center",
  },
  miniIconText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.md,
  },
  brandName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy700,
  },
  heading: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray500,
    marginBottom: SPACING.xl,
  },
  list: { gap: SPACING.sm, marginBottom: SPACING.xl },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  itemSelected: {
    backgroundColor: COLORS.green50,
    borderColor: COLORS.green400,
  },
  itemIcon: { fontSize: 24 },
  itemLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray700,
  },
  itemLabelSelected: { color: COLORS.green600 },
  check: {
    color: COLORS.green500,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
  },
  btnPrimary: {
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    ...SHADOW.green,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  btnDisabled: { opacity: 0.6 },
  errorText: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.md,
    textAlign: "center",
  },
});
