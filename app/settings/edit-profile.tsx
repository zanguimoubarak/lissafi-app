import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [boutiqueName, setBoutiqueName] = useState(user?.boutiqueName ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(): Promise<void> {
    if (!boutiqueName.trim()) {
      setError("Le nom de la boutique est obligatoire");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const updated = await authService.updateProfile({
        boutiqueName: boutiqueName.trim(),
        address: address.trim(),
        description: description.trim(),
      });
      setUser(updated);
      Alert.alert("Profil mis à jour", "Vos informations ont été enregistrées.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible de mettre à jour le profil",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.close} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={COLORS.gray600} />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier le profil</Text>
          <View style={styles.close} />
        </View>

        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Nom de la boutique</Text>
          <TextInput
            style={styles.input}
            value={boutiqueName}
            onChangeText={setBoutiqueName}
            placeholder="Ma boutique"
            placeholderTextColor={COLORS.gray400}
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Quartier, ville..."
            placeholderTextColor={COLORS.gray400}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Présentez votre activité..."
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={500}
          />

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.white, flex: 1 },
  flex: { flex: 1 },
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
    fontSize: FONT_SIZE.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: { height: 100, textAlignVertical: "top" },
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
