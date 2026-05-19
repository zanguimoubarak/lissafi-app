import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
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

function PinField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        placeholderTextColor={COLORS.gray400}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
      />
    </View>
  );
}

export default function ChangePinScreen() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(): Promise<void> {
    if (currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
      setError("Chaque PIN doit contenir 4 chiffres");
      return;
    }
    if (newPin !== confirmPin) {
      setError("La confirmation ne correspond pas au nouveau PIN");
      return;
    }
    if (currentPin === newPin) {
      setError("Le nouveau PIN doit être différent de l'actuel");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await authService.changePassword(currentPin, newPin);
      Alert.alert("PIN modifié", "Votre code PIN a été mis à jour.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible de modifier le PIN",
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
        <Text style={styles.title}>Modifier le PIN</Text>
        <View style={styles.close} />
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>
          Votre PIN protège l&apos;accès à vos données financières.
        </Text>
        <PinField label="PIN actuel" value={currentPin} onChangeText={setCurrentPin} />
        <PinField label="Nouveau PIN" value={newPin} onChangeText={setNewPin} />
        <PinField
          label="Confirmer le PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

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
  safe: { backgroundColor: COLORS.white, flex: 1 },
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
  field: { marginBottom: SPACING.md },
  label: {
    color: COLORS.gray700,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    color: COLORS.gray900,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  error: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
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
