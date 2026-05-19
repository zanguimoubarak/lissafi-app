import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  COLORS,
  Colors,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { OperationType, useApp } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ApiError } from "@/services/api";
import * as operationsService from "@/services/operations.service";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";
}

const TYPE_CONFIG: Record<
  OperationType,
  { label: string; icon: string; color: string; bg: string; helper: string }
> = {
  VENTE: { label: "Vente", icon: "arrow.up.right", color: COLORS.sale, bg: COLORS.green100, helper: "Argent reçu d'un client" },
  ACHAT: { label: "Achat", icon: "arrow.down.left", color: COLORS.purchase, bg: COLORS.blue100, helper: "Marchandise fournisseur" },
  DEPENSE: { label: "Dépense", icon: "minus.circle", color: COLORS.expense, bg: COLORS.red100, helper: "Charge ou sortie d'argent" },
  RECETTE: { label: "Recette", icon: "plus.circle", color: COLORS.sale, bg: COLORS.green100, helper: "Autre entrée d'argent" },
};

export default function NewOperationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const { addOperation, getDayRevenue, getDayExpenses } = useApp();

  const [step, setStep] = useState(0);
  const [opType, setOpType] = useState<OperationType>((params.type as OperationType) ?? "VENTE");
  const [itemName, setItemName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState(1);
  const [payMode, setPayMode] = useState<"CASH" | "DETTE">("CASH");
  const [dueDate, setDueDate] = useState("");
  const [comment, setComment] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amount = useMemo(() => (parseFloat(unitPrice.replace(/\s/g, "")) || 0) * qty, [unitPrice, qty]);
  const cfg = TYPE_CONFIG[opType];
  const isDebtCapable = opType === "VENTE" || opType === "ACHAT";
  const steps = ["Type", "Article", "Montant", "Détails"];

  const validateStep = () => {
    if (step === 1 && !itemName.trim()) {
      setError("Saisis le nom de l'article ou de l'opération.");
      return false;
    }
    if (step === 2 && amount <= 0) {
      setError("Saisis un montant supérieur à 0 FCFA.");
      return false;
    }
    setError("");
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    void Haptics.selectionAsync();
    setStep((s) => Math.min(3, s + 1));
  };

  const previous = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const handleValidate = async () => {
    if (!itemName.trim()) {
      setStep(1);
      setError("Saisis le nom de l'article ou de l'opération.");
      return;
    }
    if (amount <= 0) {
      setStep(2);
      setError("Saisis un montant supérieur à 0 FCFA.");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await operationsService.createOperation({
        type: opType,
        itemName: itemName.trim(),
        unitPrice: parseFloat(unitPrice.replace(/\s/g, "")) || 0,
        quantity: qty,
        description: comment.trim() || undefined,
        date: new Date().toISOString().split("T")[0],
      });

      addOperation({
        ...created,
        paymentMode: payMode,
        dueDate: payMode === "DETTE" ? dueDate : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Opération enregistrée", `${cfg.label} de ${fmt(created.amount)} ajoutée.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        Alert.alert("Limite atteinte", "Vous avez atteint les 30 opérations gratuites ce mois-ci.", [
          { text: "Plus tard", style: "cancel" },
          { text: "Passer Pro", onPress: () => router.push("/pro/upgrade") },
        ]);
      } else {
        Alert.alert("Erreur", err instanceof ApiError ? err.message : "Une erreur inattendue est survenue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayTotal = opType === "VENTE" || opType === "RECETTE" ? getDayRevenue() : getDayExpenses();
  const dayLabel = opType === "VENTE" ? "Ventes du jour" : opType === "ACHAT" ? "Achats du jour" : opType === "DEPENSE" ? "Dépenses du jour" : "Recettes du jour";

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[st.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[st.iconBtn, { backgroundColor: colors.surface2 }]} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[st.title, { color: colors.text }]}>Nouvelle opération</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={[st.stepper, { backgroundColor: colors.surface }]}>
          {steps.map((label, index) => (
            <View key={label} style={st.stepItem}>
              <View style={[st.stepDot, index <= step ? { backgroundColor: COLORS.primary } : { backgroundColor: colors.surface2 }]}>
                <Text style={[st.stepNumber, { color: index <= step ? COLORS.white : colors.muted }]}>{index + 1}</Text>
              </View>
              <Text style={[st.stepLabel, { color: index === step ? colors.text : colors.muted }]}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            <View style={st.typeGrid}>
              {(Object.keys(TYPE_CONFIG) as OperationType[]).map((type) => {
                const meta = TYPE_CONFIG[type];
                const active = opType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[st.typeCard, { backgroundColor: active ? meta.color : colors.surface, borderColor: active ? meta.color : colors.border }]}
                    onPress={() => {
                      setOpType(type);
                      void Haptics.selectionAsync();
                    }}
                    activeOpacity={0.86}
                  >
                    <IconSymbol name={meta.icon} size={28} color={active ? COLORS.white : meta.color} />
                    <Text style={[st.typeTitle, { color: active ? COLORS.white : colors.text }]}>{meta.label}</Text>
                    <Text style={[st.typeHelper, { color: active ? "rgba(255,255,255,0.78)" : colors.muted }]}>{meta.helper}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Text style={[st.screenQuestion, { color: colors.text }]}>Que veux-tu enregistrer ?</Text>
              <Text style={[st.label, { color: colors.muted }]}>Nom article ou description</Text>
              <TextInput
                style={[st.input, { backgroundColor: colors.surface, borderColor: error ? COLORS.expense : colors.border, color: colors.text }]}
                placeholder="Ex: Sucre 1kg"
                placeholderTextColor={colors.muted}
                value={itemName}
                onChangeText={(value) => {
                  setItemName(value);
                  setError("");
                }}
                autoFocus
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text style={[st.screenQuestion, { color: colors.text }]}>Quel montant ?</Text>
              <Text style={[st.label, { color: colors.muted }]}>Prix unitaire</Text>
              <View style={[st.amountBox, { backgroundColor: colors.surface, borderColor: error ? COLORS.expense : cfg.color }]}>
                <TextInput
                  style={[st.amountInput, { color: colors.text }]}
                  placeholder="15 000"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={unitPrice}
                  onChangeText={(value) => {
                    setUnitPrice(value);
                    setError("");
                  }}
                  autoFocus
                />
                <Text style={[st.currency, { color: colors.muted }]}>FCFA</Text>
              </View>
              <Text style={[st.label, { color: colors.muted, marginTop: SPACING.lg }]}>Quantité</Text>
              <View style={st.qtyRow}>
                <TouchableOpacity style={[st.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                  <IconSymbol name="minus" size={24} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={[st.qtyInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={String(qty)}
                  onChangeText={(v) => setQty(Math.max(1, parseInt(v, 10) || 1))}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity style={[st.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setQty((q) => q + 1)}>
                  <IconSymbol name="plus" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={[st.totalBox, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                <Text style={[st.totalLabel, { color: cfg.color }]}>Total</Text>
                <Text style={[st.totalAmount, { color: cfg.color }]}>{fmt(amount)}</Text>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <TouchableOpacity style={[st.accordionHead, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setDetailsOpen((v) => !v)}>
                <Text style={[st.screenQuestion, { color: colors.text, marginBottom: 0 }]}>Détails optionnels</Text>
                <IconSymbol name={detailsOpen ? "chevron.left" : "chevron.right"} size={22} color={colors.muted} />
              </TouchableOpacity>
              {detailsOpen ? (
                <View style={st.details}>
                  {isDebtCapable ? (
                    <>
                      <Text style={[st.label, { color: colors.muted }]}>Paiement</Text>
                      <View style={st.payRow}>
                        {(["CASH", "DETTE"] as const).map((mode) => (
                          <TouchableOpacity
                            key={mode}
                            style={[st.payBtn, { backgroundColor: payMode === mode ? (mode === "CASH" ? COLORS.primary : COLORS.debt) : colors.surface, borderColor: payMode === mode ? (mode === "CASH" ? COLORS.primary : COLORS.debt) : colors.border }]}
                            onPress={() => setPayMode(mode)}
                          >
                            <IconSymbol name={mode === "CASH" ? "checkmark.circle.fill" : "calendar"} size={18} color={payMode === mode ? COLORS.white : colors.muted} />
                            <Text style={[st.payBtnTxt, { color: payMode === mode ? COLORS.white : colors.text }]}>{mode === "CASH" ? "Cash" : "Dette"}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {payMode === "DETTE" ? (
                        <>
                          <Text style={[st.label, { color: colors.muted }]}>Échéance</Text>
                          <TextInput
                            style={[st.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="JJ/MM/AAAA"
                            placeholderTextColor={colors.muted}
                            value={dueDate}
                            onChangeText={setDueDate}
                          />
                        </>
                      ) : null}
                    </>
                  ) : null}
                  <Text style={[st.label, { color: colors.muted }]}>Commentaire</Text>
                  <TextInput
                    style={[st.input, st.commentInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Note additionnelle..."
                    placeholderTextColor={colors.muted}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    maxLength={255}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={st.error}>{error}</Text> : null}
        </ScrollView>

        <View style={[st.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={st.footerSummary}>
            <Text style={[st.footerLbl, { color: colors.muted }]}>{dayLabel}</Text>
            <Text style={[st.footerAmt, { color: cfg.color }]}>{fmt(dayTotal + amount)}</Text>
          </View>
          <View style={st.footerActions}>
            {step > 0 ? (
              <TouchableOpacity style={[st.secondaryBtn, { borderColor: colors.border }]} onPress={previous}>
                <Text style={[st.secondaryTxt, { color: colors.text }]}>Retour</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[st.primaryBtn, { backgroundColor: cfg.color }, isSubmitting ? st.disabled : null]}
              onPress={step === 3 ? handleValidate : next}
              disabled={isSubmitting}
              activeOpacity={0.86}
            >
              {isSubmitting ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={st.primaryTxt}>{step === 3 ? `Valider ${cfg.label}` : "Continuer"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: SPACING.lg },
  iconBtn: { alignItems: "center", borderRadius: RADIUS.md, height: 48, justifyContent: "center", width: 48 },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  stepper: { flexDirection: "row", paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg },
  stepItem: { alignItems: "center", flex: 1, gap: 6 },
  stepDot: { alignItems: "center", borderRadius: RADIUS.full, height: 30, justifyContent: "center", width: 30 },
  stepNumber: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  stepLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.semibold },
  body: { flexGrow: 1, padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  typeCard: { borderRadius: RADIUS.lg, borderWidth: 1.5, flexBasis: "47%", flexGrow: 1, minHeight: 132, padding: SPACING.lg },
  typeTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.sm },
  typeHelper: { fontSize: FONT_SIZE.xs, marginTop: 4 },
  screenQuestion: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, marginBottom: 6 },
  input: { borderRadius: RADIUS.md, borderWidth: 1.5, fontSize: FONT_SIZE.md, minHeight: 56, paddingHorizontal: 14 },
  amountBox: { alignItems: "center", borderRadius: RADIUS.lg, borderWidth: 1.5, flexDirection: "row", minHeight: 72, paddingHorizontal: SPACING.lg },
  amountInput: { flex: 1, fontSize: 30, fontWeight: FONT_WEIGHT.bold },
  currency: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  qtyRow: { alignItems: "center", flexDirection: "row", gap: SPACING.sm },
  qtyBtn: { alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1.5, height: 56, justifyContent: "center", width: 56 },
  qtyInput: { borderRadius: RADIUS.md, borderWidth: 1.5, flex: 1, fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, height: 56 },
  totalBox: { borderRadius: RADIUS.lg, borderWidth: 1.5, marginTop: SPACING.lg, padding: SPACING.lg },
  totalLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  totalAmount: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, marginTop: 4 },
  accordionHead: { alignItems: "center", borderRadius: RADIUS.lg, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 64, padding: SPACING.md },
  details: { gap: SPACING.sm, marginTop: SPACING.lg },
  payRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  payBtn: { alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1.5, flex: 1, flexDirection: "row", gap: SPACING.sm, justifyContent: "center", minHeight: 56 },
  payBtnTxt: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  commentInput: { height: 88, paddingTop: 14, textAlignVertical: "top" },
  error: { color: COLORS.expense, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.md },
  footer: { borderTopWidth: 1, padding: SPACING.lg },
  footerSummary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.md },
  footerLbl: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  footerAmt: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  footerActions: { flexDirection: "row", gap: SPACING.sm },
  secondaryBtn: { alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1.5, justifyContent: "center", minHeight: 56, paddingHorizontal: SPACING.lg },
  secondaryTxt: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  primaryBtn: { alignItems: "center", borderRadius: RADIUS.md, flex: 1, justifyContent: "center", minHeight: 56, ...SHADOW.green },
  primaryTxt: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  disabled: { opacity: 0.6 },
});
