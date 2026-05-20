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
import type { Client } from "@/context/AppContext";
import { ApiError } from "@/services/api";
import * as clientsService from "@/services/clients.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withCameroonPhonePrefix } from "@/utils/mappers";
import { IconSymbol } from "@/components/ui/icon-symbol";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function ClientDetailScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Client introuvable");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        const data = await clientsService.getClient(id);
        if (!cancelled) setClient(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Impossible de charger le client",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRelance = () => {
    if (!client) return;
    const phoneUrl = withCameroonPhonePrefix(client.phone);
    Alert.alert(
      "Relance client",
      `Contacter ${client.name} (${client.phone}) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Appeler / SMS",
          onPress: () => {
            if (phoneUrl) {
              void Linking.openURL(`tel:${phoneUrl}`).catch(() => {
                Alert.alert("Erreur", "Impossible d'ouvrir l'application téléphone");
              });
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (!client || error) {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={COLORS.gray700} />
        </TouchableOpacity>
        <View style={st.loadingBox}>
          <Text style={[st.errorTxt, { color: theme.muted }]}>{error || "Client introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasDebt = client.outstandingBalance > 0;

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <View style={[st.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[st.title, { color: theme.text }]}>{client.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={st.profileCard}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{client.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={st.clientName}>{client.name}</Text>
          <Text style={st.clientPhone}>{client.phone}</Text>
          {client.address ? (
            <View style={st.clientAddrRow}>
              <IconSymbol name="location" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={st.clientAddr}>{client.address}</Text>
            </View>
          ) : null}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statVal}>{client.visits.length}</Text>
              <Text style={st.statLbl}>Visites</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statVal}>{fmt(client.totalPurchases)}</Text>
              <Text style={st.statLbl}>CA Total</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text
                style={[
                  st.statVal,
                  hasDebt ? { color: COLORS.red500 } : { color: COLORS.green600 },
                ]}
              >
                {hasDebt ? fmt(client.outstandingBalance) : "Soldé"}
              </Text>
              <Text style={st.statLbl}>Solde</Text>
            </View>
          </View>
        </View>

        {hasDebt && (
          <View style={st.debtAlert}>
            <View style={{ flex: 1 }}>
              <View style={st.debtTitleRow}>
                <IconSymbol name="banknote" size={16} color={COLORS.red500} />
                <Text style={st.debtAlertTitle}>Montant dû</Text>
              </View>
              <Text style={st.debtAlertAmount}>
                {fmt(client.outstandingBalance)}
              </Text>
            </View>
            <TouchableOpacity style={st.relanceBtn} onPress={handleRelance}>
              <IconSymbol name="phone" size={16} color={COLORS.white} />
              <Text style={st.relanceBtnTxt}>Relancer</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: theme.text }]}>{client.name} — Historique</Text>
          {client.visits.length === 0 && (
            <View style={st.empty}>
              <IconSymbol name="tray" size={38} color={COLORS.gray300} />
              <Text style={[st.emptyTxt, { color: theme.muted }]}>Aucune visite enregistrée</Text>
            </View>
          )}
          {client.visits.map((v) => {
            const isPaid = v.status === "PAID";
            const isLate = v.status === "LATE";
            return (
              <View key={v.id} style={st.visitRow}>
                <View style={st.visitDate}>
                  <IconSymbol name="calendar" size={14} color={theme.muted} />
                  <Text style={[st.visitDateTxt, { color: theme.muted }]}>{v.visitDate}</Text>
                </View>
                <View style={st.visitBody}>
                  <View style={st.visitAmtRow}>
                    <IconSymbol name="bag" size={16} color={theme.muted} />
                    <Text style={[st.visitAmt, { color: theme.text }]}>{fmt(v.amount)}</Text>
                    <View
                      style={[
                        st.visitBadge,
                        isPaid
                          ? st.badgePaid
                          : isLate
                            ? st.badgeLate
                            : st.badgeCredit,
                      ]}
                    >
                      <Text
                        style={[
                          st.visitBadgeTxt,
                          isPaid
                            ? { color: COLORS.green600 }
                            : isLate
                              ? { color: COLORS.red500 }
                              : { color: COLORS.amber500 },
                        ]}
                      >
                        {isPaid ? "Payé" : isLate ? "En retard" : "Crédit"}
                      </Text>
                    </View>
                  </View>
                  {v.dueDate && !isPaid && (
                    <Text style={[st.dueDate, { color: theme.muted }]}>Échéance: {v.dueDate}</Text>
                  )}
                  {v.notes && <Text style={[st.visitNote, { color: theme.muted }]}>{v.notes}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={st.footer}>
          <Text style={st.footerLbl}>
            Total achats de {client.name.split(" ")[0]}
          </Text>
          <Text style={st.footerAmt}>{fmt(client.totalPurchases)}</Text>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorTxt: { color: COLORS.gray500, fontSize: FONT_SIZE.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    ...SHADOW.sm,
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
    color: COLORS.gray700,
    fontWeight: FONT_WEIGHT.bold,
  },
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy800,
    flex: 1,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: COLORS.navy800,
    padding: SPACING.xl,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxxl,
  },
  clientName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.white,
  },
  clientPhone: { fontSize: FONT_SIZE.sm, color: "rgba(255,255,255,0.6)" },
  clientAddrRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  clientAddr: { fontSize: FONT_SIZE.xs, color: "rgba(255,255,255,0.5)" },
  statsRow: {
    flexDirection: "row",
    marginTop: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: "100%",
  },
  stat: { flex: 1, alignItems: "center" },
  statVal: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.green400,
  },
  statLbl: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  debtAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.red100,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#fca5a5",
  },
  debtAlertTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.red500,
    fontWeight: FONT_WEIGHT.semibold,
  },
  debtTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  debtAlertAmount: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.red500,
  },
  relanceBtn: {
    alignItems: "center",
    backgroundColor: COLORS.red500,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    gap: SPACING.xs,
    minHeight: 48,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  relanceBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.sm,
  },
  section: { padding: SPACING.lg },
  sectionTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.navy800,
    marginBottom: SPACING.md,
  },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyTxt: { fontSize: FONT_SIZE.md, color: COLORS.gray400 },
  visitRow: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  visitDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  visitDateTxt: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    fontWeight: FONT_WEIGHT.semibold,
  },
  visitBody: {},
  visitAmtRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  visitAmt: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
    flex: 1,
  },
  visitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgePaid: { backgroundColor: COLORS.green100 },
  badgeLate: { backgroundColor: COLORS.red100 },
  badgeCredit: { backgroundColor: COLORS.amber100 },
  visitBadgeTxt: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  dueDate: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 4 },
  visitNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.navy800,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLbl: { fontSize: FONT_SIZE.xs, color: "rgba(255,255,255,0.6)" },
  footerAmt: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.green400,
  },
});
