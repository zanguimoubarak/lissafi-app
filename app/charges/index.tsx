import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import type { FixedCharge } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import * as chargesService from "@/services/charges.service";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function PieBar({ data }: { data: { value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <View
      style={{
        flexDirection: "row",
        height: 12,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      {data.map((d, i) => (
        <View
          key={i}
          style={{ flex: d.value / total, backgroundColor: d.color }}
        />
      ))}
    </View>
  );
}

export default function ChargesScreen() {
  const router = useRouter();
  const { charges: localCharges, setCharges } = useApp();
  const [charges, setItems] = useState<FixedCharge[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const setChargesRef = useRef(setCharges);
  const localChargesRef = useRef<FixedCharge[]>([]);
  const fetchRequestIdRef = useRef(0);

  setChargesRef.current = setCharges;
  localChargesRef.current = localCharges;

  const fetchCharges = useCallback(async (opts?: { silent?: boolean }) => {
    const requestId = ++fetchRequestIdRef.current;
    if (!opts?.silent) setIsLoading(true);

    try {
      const result = await chargesService.listCharges();
      if (requestId !== fetchRequestIdRef.current) return;
      setUsingFallback(false);
      setItems(result.items);
      setMonthlyTotal(result.summary.monthlyEquivalent);
      setChargesRef.current(result.items);
    } catch {
      if (requestId === fetchRequestIdRef.current) {
        const fallback = localChargesRef.current;
        setItems(fallback);
        setMonthlyTotal(fallback.reduce((s, c) => s + c.amount, 0));
        setUsingFallback(true);
      }
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const fetchChargesRef = useRef(fetchCharges);
  fetchChargesRef.current = fetchCharges;

  const skipFocusRefreshRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        void fetchChargesRef.current();
        return;
      }
      void fetchChargesRef.current({ silent: true });
    }, []),
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchChargesRef.current({ silent: true });
  }, []);

  const chartColors = [
    COLORS.green500,
    COLORS.amber500,
    COLORS.blue400,
    COLORS.red500,
    COLORS.navy700,
  ];

  const FREQ_LABELS: Record<string, string> = {
    MONTHLY: "Mensuel",
    QUARTERLY: "Trimestriel",
    YEARLY: "Annuel",
  };

  const totalCharges =
    monthlyTotal > 0
      ? monthlyTotal
      : charges.reduce((s, c) => s + c.amount, 0);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity style={st.back} onPress={() => router.back()}>
          <Text style={st.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={st.title}>Mes Charges Fixes</Text>
        <TouchableOpacity
          style={st.addBtn}
          onPress={() => router.push("/charges/new-charge" as any)}
        >
          <Text style={st.addBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading && charges.length === 0 ? (
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.green600}
            />
          }
        >
          {usingFallback && (
            <View style={st.offlineBanner}>
              <Text style={st.offlineTxt}>
                Données locales — connexion indisponible
              </Text>
            </View>
          )}

          <View style={st.grid}>
            {charges.map((c, i) => (
              <TouchableOpacity
                key={c.id}
                style={st.chargeCard}
                activeOpacity={0.8}
              >
                <View style={st.chargeIconBox}>
                  <IconSymbol name={c.icon} size={30} color={chartColors[i % chartColors.length]} />
                </View>
                <Text style={st.chargeName}>{c.label}</Text>
                <Text
                  style={[
                    st.chargeAmt,
                    { color: chartColors[i % chartColors.length] },
                  ]}
                >
                  {fmt(c.amount)}
                </Text>
                <Text style={st.chargePeriod}>{FREQ_LABELS[c.frequency]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[st.chargeCard, st.addCard]}
              onPress={() => router.push("/charges/new-charge" as any)}
            >
              <View style={st.chargeIconBox}>
                <IconSymbol name="plus" size={30} color={COLORS.green600} />
              </View>
              <Text style={[st.chargeName, { color: COLORS.green600 }]}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          <View style={st.totalCard}>
            <View style={st.totalHeader}>
              <IconSymbol name="banknote" size={28} color={COLORS.green600} />
              <View>
                <Text style={st.totalLabel}>TOTAL CHARGES (équiv. mensuel) :</Text>
                <Text style={st.totalAmount}>{fmt(totalCharges)}</Text>
              </View>
            </View>

            <View style={st.legendGrid}>
              {charges.map((c, i) => (
                <View key={c.id} style={st.legendItem}>
                  <View
                    style={[
                      st.legendDot,
                      { backgroundColor: chartColors[i % chartColors.length] },
                    ]}
                  />
                  <Text style={st.legendTxt}>{c.label}</Text>
                  <Text style={st.legendPct}>
                    {totalCharges > 0
                      ? Math.round((c.amount / totalCharges) * 100)
                      : 0}
                    %
                  </Text>
                </View>
              ))}
            </View>

            {charges.length > 0 && (
              <PieBar
                data={charges.map((c, i) => ({
                  value: c.amount,
                  color: chartColors[i % chartColors.length],
                }))}
              />
            )}
          </View>

          <View style={st.section}>
            <View style={st.sectionTitleRow}>
              <IconSymbol name="calendar" size={20} color={COLORS.gray800} />
              <Text style={st.sectionTitle}>Prochaines échéances</Text>
            </View>
            {charges.length === 0 && (
              <Text style={st.emptyTxt}>Aucune charge enregistrée</Text>
            )}
            {[...charges]
              .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
              .map((c, i) => {
                const daysLeft = Math.ceil(
                  (new Date(c.nextDueDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                const urgent = daysLeft <= 7;
                return (
                  <View
                    key={c.id}
                    style={[st.dueRow, urgent ? st.dueRowUrgent : null]}
                  >
                    <IconSymbol name={c.icon} size={22} color={chartColors[i % chartColors.length]} />
                    <View style={{ flex: 1 }}>
                      <Text style={st.dueName}>{c.label}</Text>
                      <Text style={st.dueDate}>Échéance : {c.nextDueDate}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={[
                          st.dueAmt,
                          { color: chartColors[i % chartColors.length] },
                        ]}
                      >
                        {fmt(c.amount)}
                      </Text>
                      {urgent && (
                        <View style={st.urgentBadge}>
                          <IconSymbol name="alert" size={12} color={COLORS.amber500} />
                          <Text style={st.urgentBadgeTxt}>{daysLeft}j</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  offlineBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.amber100,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  offlineTxt: {
    fontSize: FONT_SIZE.xs,
    color: "#78350f",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    ...SHADOW.sm,
  },
  back: {
    width: 36,
    height: 36,
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
    fontSize: FONT_SIZE.xl,
    color: COLORS.navy800,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.green,
  },
  addBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  chargeCard: {
    width: "46%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    gap: 6,
    ...SHADOW.md,
  },
  addCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.green400,
    backgroundColor: COLORS.green50,
  },
  chargeIconBox: {
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  chargeName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray700,
    textAlign: "center",
  },
  chargeAmt: { fontWeight: FONT_WEIGHT.extrabold, fontSize: FONT_SIZE.lg },
  chargePeriod: { fontSize: FONT_SIZE.xs, color: COLORS.gray400 },
  totalCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray500,
    textTransform: "uppercase",
  },
  totalAmount: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
  },
  legendGrid: { gap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendTxt: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.gray600 },
  legendPct: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray700,
  },
  section: { paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emptyTxt: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  dueRowUrgent: {
    borderWidth: 1.5,
    borderColor: "#fcd34d",
    backgroundColor: COLORS.amber100,
  },
  dueName: {
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray800,
  },
  dueDate: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 2 },
  dueAmt: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  urgentBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  urgentBadgeTxt: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.amber500,
    fontWeight: FONT_WEIGHT.bold,
  },
});
