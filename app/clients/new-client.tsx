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
import * as clientsService from "@/services/clients.service";
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

export default function NewClientScreen() {
  const router = useRouter();
  const { addClient, clients, user } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPro = user?.plan === "pro";
  const canAdd = isPro || clients.length < 10;

  async function handleSave(): Promise<void> {
    if (!canAdd) {
      Alert.alert(
        "Limite atteinte",
        "Passez à Pro pour enregistrer plus de 10 clients.",
      );
      return;
    }
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le nom du client");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await clientsService.createClient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      addClient(created);
      Alert.alert("Client ajouté", `${name} a été ajouté à votre carnet clients`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        Alert.alert(
          "Limite atteinte",
          "Vous avez atteint la limite de clients gratuits.\n\nPassez au plan Pro pour un fichier illimité.",
          [
            { text: "Plus tard", style: "cancel" },
            { text: "Passer Pro", onPress: () => router.push("/pro/upgrade") },
          ],
        );
        return;
      }
      const message =
        err instanceof ApiError ? err.message : "Impossible d'ajouter le client";
      Alert.alert("Erreur", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={st.header}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={COLORS.gray600} />
          </TouchableOpacity>
          <Text style={st.title}>Nouveau Client</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={st.body}>
            {!isPro && (
              <View style={st.limitBanner}>
                <IconSymbol name="person.2" size={18} color="#78350f" />
                <Text style={st.limitTxt}>
                  {clients.length} / 10 clients (gratuit) ·{" "}
                  <Text style={{ color: COLORS.green600, fontWeight: FONT_WEIGHT.bold }}>
                    Pro = illimité
                  </Text>
                </Text>
              </View>
            )}
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="person" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Nom complet *</Text>
              </View>
              <TextInput
                style={st.input}
                placeholder="Ex: Ousmanou Bello"
                placeholderTextColor={COLORS.gray400}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="phone" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Téléphone</Text>
              </View>
              <View style={st.phoneRow}>
                <View style={st.prefix}>
                  <Text style={st.prefixTxt}>CM +237</Text>
                </View>
                <TextInput
                  style={[st.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="6XX XXX XXX"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="location" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Adresse (optionnel)</Text>
              </View>
              <TextInput
                style={st.input}
                placeholder="Ex: Quartier Dougoi, Maroua"
                placeholderTextColor={COLORS.gray400}
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="message" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Notes (optionnel)</Text>
              </View>
              <TextInput
                style={[st.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="Informations complémentaires..."
                placeholderTextColor={COLORS.gray400}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>
        </ScrollView>
        <View style={st.footer}>
          <TouchableOpacity style={st.cancelBtn} onPress={() => router.back()}>
            <Text style={st.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.saveBtn, isSubmitting ? st.disabled : null]}
            disabled={isSubmitting}
            onPress={() => {
              void handleSave();
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <React.Fragment>
                <IconSymbol name="square.and.arrow.down" size={18} color={COLORS.white} />
                <Text style={st.saveTxt}>Enregistrer</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  backTxt: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.gray600,
    fontWeight: FONT_WEIGHT.bold,
  },
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy800,
  },
  body: { padding: SPACING.lg },
  limitBanner: {
    alignItems: "center",
    backgroundColor: COLORS.amber100,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  limitTxt: { fontSize: FONT_SIZE.sm, color: "#78350f" },
  field: { marginBottom: SPACING.md },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: 6,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray700,
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  phoneRow: { flexDirection: "row", gap: 8 },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    justifyContent: "center",
  },
  prefixTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray700,
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  cancelBtn: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  cancelTxt: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  saveBtn: {
    alignItems: "center",
    flex: 2,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    minHeight: 56,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.green600,
    ...SHADOW.green,
  },
  saveTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  disabled: { opacity: 0.6 },
});
