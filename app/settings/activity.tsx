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
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTIVITIES: { id: ActivityType; label: string; icon: string }[] = [
  { id: "commerce", label: "Boutique / Commerce général", icon: "bag" },
  { id: "mecanique", label: "Garage mécanique", icon: "wrench.and.screwdriver" },
  { id: "restauration", label: "Restauration", icon: "fork.knife" },
  { id: "beaute", label: "Salon de beauté", icon: "scissors" },
  { id: "autre", label: "Autre activité", icon: "gear" },
];

export default function SettingsActivityScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [selected, setSelected] = useState<ActivityType>(
    user?.activityType ?? "commerce",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(): Promise<void> {
    try {
      setIsSubmitting(true);
      setError("");
      const updated = await authService.updateProfile({ activityType: selected });
      setUser(updated);
      Alert.alert("Activité mise à jour", "Votre type d'activité a été enregistré.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible de mettre à jour l'activité",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={22} color={COLORS.gray600} />
        </TouchableOpacity>
        <Text style={styles.title}>Type d&apos;activité</Text>
        <View style={styles.close} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {ACTIVITIES.map((activity) => {
          const isActive = selected === activity.id;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[styles.card, isActive ? styles.cardActive : null]}
              onPress={() => setSelected(activity.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, isActive ? styles.iconWrapActive : null]}>
                <IconSymbol
                  name={activity.icon}
                  style={{ width: 22, height: 22 }}
                  color={isActive ? COLORS.white : COLORS.gray600}
                />
              </View>
              <Text style={[styles.cardLabel, isActive ? styles.cardLabelActive : null]}>
                {activity.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submit, isSubmitting ? styles.disabled : null]}
          disabled={isSubmitting}
          onPress={() => {
            void handleSave();
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.submitText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.gray50, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.gray100,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.lg,
  },
  close: {
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeText: {
    color: COLORS.gray600,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  title: {
    color: COLORS.navy800,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  body: { flex: 1, padding: SPACING.lg },
  card: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  cardActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green600,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  iconWrapActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  cardLabel: {
    color: COLORS.gray800,
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cardLabelActive: { color: COLORS.white },
  error: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  footer: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.gray100,
    borderTopWidth: 1,
    padding: SPACING.lg,
  },
  submit: {
    alignItems: "center",
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    ...SHADOW.green,
  },
  submitText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  disabled: { opacity: 0.6 },
});
