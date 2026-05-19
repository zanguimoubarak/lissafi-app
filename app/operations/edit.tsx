import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp, OperationType } from "@/context/AppContext";
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  RADIUS,
  SHADOW,
} from "@/constants/theme";
import { ApiError } from "@/services/api";
import * as operationsService from "@/services/operations.service";
import { IconSymbol } from "@/components/ui/icon-symbol";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

const TYPE_CONFIG: Record<
  OperationType,
  { label: string; icon: string; color: string; bg: string }
> = {
  VENTE: {
    label: "Vente",
    icon: "arrow.up.right",
    color: COLORS.green600,
    bg: COLORS.green50,
  },
  ACHAT: {
    label: "Achat",
    icon: "arrow.down.left",
    color: COLORS.blue400,
    bg: COLORS.blue100,
  },
  DEPENSE: {
    label: "Dépense",
    icon: "minus.circle",
    color: COLORS.red500,
    bg: COLORS.red100,
  },
  RECETTE: {
    label: "Recette",
    icon: "plus.circle",
    color: COLORS.green600,
    bg: COLORS.green100,
  },
};

export default function EditOperationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { replaceOperation } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [opType, setOpType] = useState<OperationType>("VENTE");
  const [itemName, setItemName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [qty, setQty] = useState(1);
  const [payMode, setPayMode] = useState<"CASH" | "DETTE">("CASH");
  const [comment, setComment] = useState("");
  const [opDate, setOpDate] = useState<string>(new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert("Erreur", "Opération introuvable", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    let cancelled = false;

    async function loadOperation(): Promise<void> {
      const operationId = id;
      if (!operationId) return;

      try {
        setIsLoading(true);
        const op = await operationsService.getOperation(operationId);
        if (cancelled) return;
        setOpType(op.type);
        setItemName(op.itemName);
        setUnitPrice(String(op.unitPrice));
        setQty(op.quantity);
        setPayMode(op.paymentMode);
        setComment(op.comment ?? op.description ?? "");
        setOpDate(op.date);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : "Impossible de charger l'opération";
        Alert.alert("Erreur", message, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadOperation();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const amount = (parseFloat(unitPrice.replace(/\s/g, "")) || 0) * qty;
  const cfg = TYPE_CONFIG[opType];
  const isDebt = opType === "VENTE" || opType === "ACHAT";

  const handleSave = async () => {
    if (!id) return;
    if (!itemName.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le nom de l'article");
      return;
    }
    if (!unitPrice.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le prix unitaire");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await operationsService.updateOperation(id, {
        type: opType,
        itemName: itemName.trim(),
        unitPrice: parseFloat(unitPrice.replace(/\s/g, "")) || 0,
        quantity: qty,
        description: comment.trim() || undefined,
        date: opDate,
      });

      replaceOperation({
        ...updated,
        paymentMode: payMode,
      });

      Alert.alert("Succès", `${cfg.label} mise à jour (${fmt(updated.amount)})`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        Alert.alert("Erreur", err.message);
      } else {
        Alert.alert("Erreur", "Une erreur inattendue est survenue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={COLORS.gray600} />
          </TouchableOpacity>
          <Text style={st.title}>Modifier l&apos;opération</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={st.typeRow}>
            {(Object.keys(TYPE_CONFIG) as OperationType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  st.typeBtn,
                  opType === t ? { backgroundColor: TYPE_CONFIG[t].color } : null,
                ]}
                onPress={() => setOpType(t)}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name={TYPE_CONFIG[t].icon}
                  size={18}
                  color={opType === t ? COLORS.white : TYPE_CONFIG[t].color}
                />
                <Text
                  style={[
                    st.typeBtnTxt,
                    opType === t ? { color: COLORS.white } : null,
                  ]}
                >
                  {TYPE_CONFIG[t].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={st.body}>
            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="package" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Article</Text>
              </View>
              <TextInput
                style={st.input}
                placeholder="Ex: Sac de Riz 50kg"
                placeholderTextColor={COLORS.gray400}
                value={itemName}
                onChangeText={setItemName}
              />
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="banknote" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Prix unitaire</Text>
              </View>
              <View style={st.inputWithSuffix}>
                <TextInput
                  style={[st.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="15 000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                />
                <View style={st.suffix}>
                  <Text style={st.suffixTxt}>FCFA</Text>
                </View>
              </View>
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="chart.bar" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Quantité</Text>
              </View>
              <View style={st.qtyRow}>
                <TouchableOpacity
                  style={st.qtyBtn}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <IconSymbol name="minus" size={22} color={COLORS.gray700} />
                </TouchableOpacity>
                <TextInput
                  style={st.qtyInput}
                  value={String(qty)}
                  onChangeText={(v) => setQty(Math.max(1, parseInt(v, 10) || 1))}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={st.qtyBtn}
                  onPress={() => setQty((q) => q + 1)}
                >
                  <IconSymbol name="plus" size={22} color={COLORS.gray700} />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                st.totalBox,
                { backgroundColor: cfg.bg, borderColor: cfg.color + "60" },
              ]}
            >
              <Text style={[st.totalLabel, { color: cfg.color }]}>Total</Text>
              <Text style={[st.totalAmount, { color: cfg.color }]}>
                {fmt(amount)}
              </Text>
            </View>

            {isDebt ? (
              <View style={st.payRow}>
                <TouchableOpacity
                  style={[st.payBtn, payMode === "CASH" ? st.payBtnCash : null]}
                  onPress={() => setPayMode("CASH")}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="checkmark.circle.fill" size={18} color={payMode === "CASH" ? COLORS.white : COLORS.gray600} />
                  <Text
                    style={[
                      st.payBtnTxt,
                      payMode === "CASH" ? { color: COLORS.white } : null,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.payBtn, payMode === "DETTE" ? st.payBtnDette : null]}
                  onPress={() => setPayMode("DETTE")}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="calendar" size={18} color={payMode === "DETTE" ? COLORS.white : COLORS.gray600} />
                  <Text
                    style={[
                      st.payBtnTxt,
                      payMode === "DETTE" ? { color: COLORS.white } : null,
                    ]}
                  >
                    Dette
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="message" size={16} color={COLORS.gray600} />
                <Text style={st.label}>Commentaire (optionnel)</Text>
              </View>
              <TextInput
                style={[st.input, { height: 72, textAlignVertical: "top" }]}
                placeholder="Note additionnelle..."
                placeholderTextColor={COLORS.gray400}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={255}
              />
            </View>
          </View>
        </ScrollView>

        <View style={st.footer}>
          <TouchableOpacity
            style={[st.validateBtn, { backgroundColor: cfg.color }, isSubmitting ? st.disabled : null]}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={st.validateTxt}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  loadingBox: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  backBtn: {
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
  typeRow: {
    flexDirection: "row",
    margin: SPACING.lg,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
    borderRadius: RADIUS.md,
  },
  typeBtnTxt: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray500,
  },
  body: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
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
    minHeight: 56,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  inputWithSuffix: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  qtyRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  qtyBtn: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray900,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  totalLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  totalAmount: { fontWeight: FONT_WEIGHT.extrabold, fontSize: FONT_SIZE.xl },
  payRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    minHeight: 56,
  },
  payBtnCash: { backgroundColor: COLORS.green600, borderColor: COLORS.green600 },
  payBtnDette: { backgroundColor: COLORS.red500, borderColor: COLORS.red500 },
  payBtnTxt: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray600,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    backgroundColor: COLORS.white,
  },
  validateBtn: {
    borderRadius: RADIUS.md,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.green,
  },
  validateTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  disabled: { opacity: 0.6 },
});
