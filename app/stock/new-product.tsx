import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useApp } from "@/context/AppContext";
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
import { ApiError } from "@/services/api";
import * as productsService from "@/services/products.service";

const UNITS = [
  "sac",
  "kg",
  "litre",
  "bidon",
  "carton",
  "pièce",
  "boîte",
  "paquet",
];

export default function NewProductScreen() {
  const router = useRouter();
  const { addProduct } = useApp();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pièce");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const margin =
    sellPrice && buyPrice
      ? Math.round(
          ((parseFloat(sellPrice) - parseFloat(buyPrice)) /
            parseFloat(sellPrice)) *
            100,
        )
      : 0;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le nom du produit");
      return;
    }
    if (!buyPrice || !sellPrice) {
      Alert.alert("Erreur", "Veuillez saisir les prix d'achat et de vente");
      return;
    }
    if (parseFloat(sellPrice) < parseFloat(buyPrice)) {
      Alert.alert(
        "Attention",
        "Le prix de vente est inférieur au prix d'achat. Continuer quand même ?",
        [
          { text: "Non", style: "cancel" },
          { text: "Oui", onPress: doSave },
        ],
      );
      return;
    }
    doSave();
  };

  const doSave = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      const created = await productsService.createProduct({
        name: name.trim(),
        unit,
        purchasePrice: parseFloat(buyPrice) || 0,
        salePrice: parseFloat(sellPrice) || 0,
        stockQty: parseInt(stock) || 0,
        alertThreshold: parseInt(threshold) || 5,
      });

      addProduct(created);
      Alert.alert("Article ajouté", `${name} a été ajouté à votre catalogue`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          Alert.alert(
            "Limite atteinte",
            "Vous avez atteint les 20 produits gratuits.\n\nPassez au plan Pro pour gérer plus d'articles.",
            [
              { text: "Plus tard", style: "cancel" },
              { text: "Passer Pro", onPress: () => router.push("/pro/upgrade") },
            ],
          );
        } else if (err.statusCode === 400) {
          setError(err.message);
        } else {
          Alert.alert("Erreur", err.message);
        }
      } else {
        Alert.alert("Erreur", "Une erreur inattendue est survenue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={st.header}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <IconSymbol
              name="xmark"
              style={{ width: 16, height: 16 }}
              color={COLORS.gray600}
            />
          </TouchableOpacity>
          <Text style={st.title}>Nouvel Article</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={st.body}>
            <View style={st.field}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <IconSymbol
                  name="shippingbox"
                  style={{ width: 16, height: 16, marginRight: 6 }}
                  color={COLORS.gray700}
                />
                <Text style={st.label}>Nom du produit</Text>
              </View>
              <TextInput
                style={st.input}
                placeholder="Ex: Sac de Riz 50kg"
                placeholderTextColor={COLORS.gray400}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={st.field}>
              <View style={st.labelRow}>
                <IconSymbol name="tag" size={16} color={COLORS.gray700} />
                <Text style={st.label}>Unité</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 0 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        st.unitChip,
                        unit === u ? st.unitChipActive : null,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          st.unitChipTxt,
                          unit === u ? { color: COLORS.white } : null,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={st.row2}>
              <View style={[st.field, { flex: 1 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <IconSymbol
                    name="dollarsign.circle"
                    style={{ width: 16, height: 16, marginRight: 6 }}
                    color={COLORS.gray700}
                  />
                  <Text style={st.label}>Prix d&apos;achat (FCFA)</Text>
                </View>
                <TextInput
                  style={st.input}
                  placeholder="13 000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                />
              </View>
              <View style={[st.field, { flex: 1 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <IconSymbol
                    name="tag"
                    style={{ width: 16, height: 16, marginRight: 6 }}
                    color={COLORS.gray700}
                  />
                  <Text style={st.label}>Prix de vente (FCFA)</Text>
                </View>
                <TextInput
                  style={st.input}
                  placeholder="15 000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={sellPrice}
                  onChangeText={setSellPrice}
                />
              </View>
            </View>

            {buyPrice && sellPrice && (
              <View
                style={[
                  st.marginBox,
                  {
                    borderColor: margin >= 0 ? COLORS.green400 : "#fca5a5",
                    backgroundColor:
                      margin >= 0 ? COLORS.green50 : COLORS.red100,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconSymbol
                    name={
                      margin >= 0
                        ? "checkmark.circle.fill"
                        : "exclamationmark.triangle.fill"
                    }
                    style={{ width: 16, height: 16, marginRight: 6 }}
                    color={margin >= 0 ? COLORS.green600 : COLORS.red500}
                  />
                  <Text
                    style={[
                      st.marginTxt,
                      { color: margin >= 0 ? COLORS.green600 : COLORS.red500 },
                    ]}
                  >
                    Marge brute : {margin}%
                  </Text>
                </View>
              </View>
            )}

            <View style={st.row2}>
              <View style={[st.field, { flex: 1 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <IconSymbol
                    name="chart.bar"
                    style={{ width: 16, height: 16, marginRight: 6 }}
                    color={COLORS.gray700}
                  />
                  <Text style={st.label}>Stock initial</Text>
                </View>
                <TextInput
                  style={st.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
              <View style={[st.field, { flex: 1 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <IconSymbol
                    name="bell"
                    style={{ width: 16, height: 16, marginRight: 6 }}
                    color={COLORS.gray700}
                  />
                  <Text style={st.label}>Seuil d&apos;alerte</Text>
                </View>
                <TextInput
                  style={st.input}
                  placeholder="5"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  value={threshold}
                  onChangeText={setThreshold}
                />
              </View>
            </View>

            <View style={st.infoBox}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <IconSymbol
                  name="lightbulb"
                  style={{
                    width: 16,
                    height: 16,
                    marginRight: 6,
                    marginTop: 2,
                  }}
                  color="#1d4ed8"
                />
                <Text style={st.infoTxt}>
                  Une notification sera envoyée lorsque le stock atteint le
                  seuil d&apos;alerte.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={st.footer}>
          <TouchableOpacity style={st.cancelBtn} onPress={() => router.back()}>
            <Text style={st.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.saveBtn, isSubmitting ? st.disabled : null]}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconSymbol
                  name="square.and.arrow.down"
                  style={{ width: 16, height: 16, marginRight: 6 }}
                  color={COLORS.white}
                />
                <Text style={st.saveTxt}>Enregistrer</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {error ? <Text style={st.errorTxt}>{error}</Text> : null}
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
  row2: { flexDirection: "row", gap: SPACING.md },
  unitChip: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    marginVertical: 4,
  },
  unitChipActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green600,
  },
  unitChipTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  marginBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  marginTxt: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  infoBox: {
    backgroundColor: COLORS.blue100,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
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
  errorTxt: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    textAlign: "center",
  },
});
