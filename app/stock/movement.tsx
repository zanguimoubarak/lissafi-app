import { ApiError } from "@/services/api";
import * as stockService from "@/services/stock.service";
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { MovementType } from "@/services/stock.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

const MOVEMENTS: { type: MovementType; label: string; icon: string }[] = [
  { type: "IN", label: "Entrée", icon: "package" },
  { type: "OUT", label: "Sortie", icon: "arrow.up.right" },
  { type: "ADJUSTMENT", label: "Ajustement", icon: "wrench.and.screwdriver" },
];

export default function StockMovementScreen() {
  const router = useRouter();
  const {
    productId = "",
    productName = "",
    movementType = "IN",
  } = useLocalSearchParams<{
    productId: string;
    productName: string;
    movementType?: MovementType;
  }>();
  const { updateProductStock } = useApp();
  const initialType: MovementType =
    movementType === "OUT" || movementType === "ADJUSTMENT"
      ? movementType
      : "IN";
  const [selectedType, setSelectedType] = useState<MovementType>(initialType);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    if (!productId) {
      setError("Produit introuvable");
      return;
    }
    if (quantity <= 0) {
      setError("La quantité doit être supérieure à zéro");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await stockService.createMovement({
        productId,
        movementType: selectedType,
        quantity,
        reason: reason.trim() || undefined,
      });
      updateProductStock(productId, selectedType === "IN" ? quantity : -quantity);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.close} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={22} color={COLORS.gray600} />
          </TouchableOpacity>
          <Text style={styles.title}>Mouvement de stock</Text>
          <View style={styles.close} />
        </View>

        <View style={styles.body}>
          <Text style={styles.productName}>{productName}</Text>

          <View style={styles.typeRow}>
            {MOVEMENTS.map((movement) => (
              <TouchableOpacity
                key={movement.type}
                activeOpacity={0.82}
                onPress={() => setSelectedType(movement.type)}
                style={[
                  styles.typeButton,
                  selectedType === movement.type ? styles.typeButtonActive : null,
                ]}
              >
                <IconSymbol
                  name={movement.icon}
                  size={24}
                  color={selectedType === movement.type ? COLORS.white : COLORS.green600}
                />
                <Text
                  style={[
                    styles.typeText,
                    selectedType === movement.type ? styles.typeTextActive : null,
                  ]}
                >
                  {movement.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Quantité</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <IconSymbol name="minus" size={22} color={COLORS.gray700} />
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              textAlign="center"
              value={String(quantity)}
              onChangeText={(value) => setQuantity(Math.max(1, parseInt(value) || 1))}
            />
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity((value) => value + 1)}
            >
              <IconSymbol name="plus" size={22} color={COLORS.gray700} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Raison</Text>
          <TextInput
            style={[styles.input, styles.reasonInput]}
            placeholder="Livraison fournisseur, inventaire..."
            placeholderTextColor={COLORS.gray400}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={[styles.submit, isSubmitting ? styles.disabled : null]}
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
  safe: { flex: 1, backgroundColor: COLORS.white },
  root: { flex: 1 },
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
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  title: {
    color: COLORS.navy800,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  body: { flex: 1, padding: SPACING.lg },
  productName: {
    color: COLORS.gray900,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    marginBottom: SPACING.lg,
  },
  typeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xl },
  typeButton: {
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flex: 1,
    gap: SPACING.xs,
    minHeight: 72,
    paddingVertical: SPACING.md,
  },
  typeButtonActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green600,
  },
  typeText: {
    color: COLORS.gray600,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  typeTextActive: { color: COLORS.white },
  label: {
    color: COLORS.gray700,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.sm,
  },
  qtyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  qtyButton: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  qtyInput: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    color: COLORS.gray900,
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    height: 56,
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
    minHeight: 56,
  },
  reasonInput: { height: 88, textAlignVertical: "top" },
  errorText: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
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
    minHeight: 56,
    justifyContent: "center",
    ...SHADOW.green,
  },
  submitText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  disabled: { opacity: 0.6 },
});
