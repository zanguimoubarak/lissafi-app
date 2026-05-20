import {
  COLORS,
  Colors,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

const TIME_PATTERN = /^\d{2}:\d{2}$/;

function normalizeTime(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export default function WorkHoursScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { user, setUser } = useApp();
  const [workHoursStart, setWorkHoursStart] = useState(
    user?.workHoursStart ?? "08:00",
  );
  const [workHoursEnd, setWorkHoursEnd] = useState(user?.workHoursEnd ?? "18:00");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(): Promise<void> {
    const start = workHoursStart.trim();
    const end = workHoursEnd.trim();

    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      setError("Format attendu : HH:MM (ex. 08:00)");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const updated = await authService.updateProfile({
        workHoursStart: start,
        workHoursEnd: end,
      });
      setUser(updated);
      Alert.alert("Horaires enregistrés", "Vos heures de gestion ont été mises à jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible d'enregistrer les horaires",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={22} color={theme.muted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Heures de gestion</Text>
        <View style={styles.close} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.hint, { color: theme.muted }]}>
          Indiquez vos heures d&apos;ouverture habituelles (format 24h).
        </Text>

        <Text style={[styles.label, { color: theme.text }]}>Ouverture</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text }]}
          value={workHoursStart}
          onChangeText={(value) => setWorkHoursStart(normalizeTime(value))}
          placeholder="08:00"
          placeholderTextColor={COLORS.gray400}
          keyboardType="number-pad"
          maxLength={5}
        />

        <Text style={[styles.label, { color: theme.text }]}>Fermeture</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text }]}
          value={workHoursEnd}
          onChangeText={(value) => setWorkHoursEnd(normalizeTime(value))}
          placeholder="18:00"
          placeholderTextColor={COLORS.gray400}
          keyboardType="number-pad"
          maxLength={5}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
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
  safe: { flex: 1 },
  header: {
    alignItems: "center",
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
  hint: {
    color: COLORS.gray500,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.gray700,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    color: COLORS.gray900,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  error: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.md,
  },
  footer: {
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
