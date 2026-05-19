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
import * as chargesService from "@/services/charges.service";
import { iconToChargeCategory } from "@/utils/mappers";
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

const ICONS = ["house", "lightbulb", "person.2", "tag", "vehicle", "phone", "building.2", "bag"];
const FREQUENCIES = [
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "YEARLY", label: "Annuel" },
] as const;

export default function NewChargeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { addCharge } = useApp();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [icon, setIcon] = useState("tag");
  const [frequency, setFrequency] = useState<
    "MONTHLY" | "QUARTERLY" | "YEARLY"
  >("MONTHLY");
  const [nextDue, setNextDue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(): Promise<void> {
    if (!label.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le nom de la charge");
      return;
    }
    if (!amount) {
      Alert.alert("Erreur", "Veuillez saisir le montant");
      return;
    }

    const nextDueDate =
      nextDue.trim() || new Date().toISOString().split("T")[0];

    try {
      setIsSubmitting(true);
      const created = await chargesService.createCharge({
        label: label.trim(),
        category: iconToChargeCategory(icon),
        amount: parseFloat(amount) || 0,
        frequency,
        nextDueDate,
      });
      addCharge(created);
      Alert.alert("Charge ajoutée", `${label} a été ajoutée`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Impossible d'ajouter la charge";
      Alert.alert("Erreur", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={[st.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={theme.muted} />
          </TouchableOpacity>
          <Text style={[st.title, { color: theme.text }]}>Nouvelle Charge</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={st.body}>
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="tag" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Icône</Text>
              </View>
              <View style={st.iconRow}>
                {ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      st.iconChip,
                      icon === ic ? st.iconChipActive : null,
                    ]}
                    onPress={() => setIcon(ic)}
                  >
                    <IconSymbol
                      name={ic}
                      size={24}
                      color={icon === ic ? COLORS.green600 : COLORS.gray600}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="file" size={16} color={theme.muted} />
                <Text style={[st.label, { color: theme.text }]}>Nom de la charge *</Text>
              </View>
              <TextInput
                style={[st.input, { backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: Loyer boutique"
                placeholderTextColor={COLORS.gray400}
                value={label}
                onChangeText={setLabel}
              />
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="banknote" size={16} color={theme.muted} />
                <Text style={[st.label, { color: theme.text }]}>Montant (FCFA) *</Text>
              </View>
              <View style={st.inputRow}>
                <TextInput
                  style={[st.input, { flex: 1, backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text }]}
                  placeholder="100 000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View style={st.suffix}>
                  <Text style={st.suffixTxt}>FCFA</Text>
                </View>
              </View>
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="sync" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Fréquence</Text>
              </View>
              <View style={st.freqRow}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      st.freqBtn,
                      frequency === f.value ? st.freqActive : null,
                    ]}
                    onPress={() => setFrequency(f.value)}
                  >
                    <Text
                      style={[
                        st.freqTxt,
                        frequency === f.value ? { color: COLORS.white } : null,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="calendar" size={16} color={theme.muted} />
                <Text style={[st.label, { color: theme.text }]}>Prochaine échéance</Text>
              </View>
              <TextInput
                style={[st.input, { backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text }]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={COLORS.gray400}
                value={nextDue}
                onChangeText={setNextDue}
              />
            </View>

            <View style={st.infoBox}>
              <IconSymbol name="bell" size={16} color="#1d4ed8" />
              <Text style={st.infoTxt}>
                Une notification de rappel sera envoyée 2 jours avant chaque échéance.
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={[st.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={st.cancelBtn}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={st.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.saveBtn, isSubmitting ? { opacity: 0.7 } : null]}
            onPress={() => void handleSave()}
            disabled={isSubmitting}
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
  safe: { flex: 1 },
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
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  suffix: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suffixTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray600,
  },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.transparent,
  },
  iconChipActive: {
    borderColor: COLORS.green500,
    backgroundColor: COLORS.green50,
  },
  freqRow: { flexDirection: "row", gap: 8 },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    alignItems: "center",
  },
  freqActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green600,
  },
  freqTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray600,
  },
  infoBox: {
    alignItems: "flex-start",
    backgroundColor: COLORS.blue100,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  infoTxt: { fontSize: FONT_SIZE.xs, color: "#1d4ed8", lineHeight: 18 },
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
});
