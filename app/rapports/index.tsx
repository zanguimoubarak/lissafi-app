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
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { FixedCharge } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import * as chargesService from "@/services/charges.service";
import * as reportsService from "@/services/reports.service";
import type {
  MonthlyReport,
  ReportIndicators,
} from "@/services/reports.service";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View
      style={{
        height: 8,
        backgroundColor: COLORS.gray100,
        borderRadius: 4,
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <View
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  );
}

function computeLocalTotals(
  operations: ReturnType<typeof useApp>["operations"],
  charges: FixedCharge[],
) {
  const totalVentes = operations
    .filter((o) => o.type === "VENTE")
    .reduce((s, o) => s + o.amount, 0);
  const totalAchats = operations
    .filter((o) => o.type === "ACHAT")
    .reduce((s, o) => s + o.amount, 0);
  const totalDepenses = operations
    .filter((o) => o.type === "DEPENSE")
    .reduce((s, o) => s + o.amount, 0);
  const totalRecettes = operations
    .filter((o) => o.type === "RECETTE")
    .reduce((s, o) => s + o.amount, 0);
  const totalCharges = charges.reduce((s, c) => s + c.amount, 0);
  const beneficeNet =
    totalVentes + totalRecettes - totalAchats - totalDepenses - totalCharges;
  return {
    totalVentes,
    totalAchats,
    totalDepenses,
    totalRecettes,
    totalCharges,
    beneficeNet,
    txMarge:
      totalVentes > 0
        ? Math.round(((totalVentes - totalAchats) / totalVentes) * 100)
        : 0,
    txRecouvrement:
      (operations.filter((o) => o.paymentMode === "CASH").length /
        Math.max(operations.length, 1)) *
      100,
    nbVentes: operations.filter((o) => o.type === "VENTE").length,
    nbDettes: operations.filter((o) => o.paymentMode === "DETTE").length,
  };
}

export default function RapportsFullScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { operations, charges: localCharges, user } = useApp();
  const isPro = user?.plan === "pro";

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [indicators, setIndicators] = useState<ReportIndicators | null>(null);
  const [chargeItems, setChargeItems] = useState<FixedCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const localChargesRef = useRef(localCharges);
  localChargesRef.current = localCharges;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        const [monthly, chargesResult] = await Promise.all([
          reportsService.getMonthlyReport(),
          chargesService.listCharges(),
        ]);
        if (cancelled) return;
        setReport(monthly);
        setChargeItems(chargesResult.items);
        setUsingFallback(false);

        if (isPro) {
          try {
            const ind = await reportsService.getIndicators();
            if (!cancelled) setIndicators(ind);
          } catch {
            if (!cancelled) setIndicators(null);
          }
        }
      } catch {
        if (!cancelled) {
          setUsingFallback(true);
          setChargeItems(localChargesRef.current);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPro]);

  const local = computeLocalTotals(operations, chargeItems);

  const totalVentes = report?.byType.VENTE.total ?? local.totalVentes;
  const totalAchats = report?.byType.ACHAT.total ?? local.totalAchats;
  const totalDepenses = report?.byType.DEPENSE.total ?? local.totalDepenses;
  const totalRecettes = report?.byType.RECETTE.total ?? local.totalRecettes;
  const totalCharges =
    report?.chargesImpact.totalCharges ?? local.totalCharges;
  const beneficeNet =
    report?.chargesImpact.netAfterCharges ?? local.beneficeNet;

  const txMarge = indicators?.marginRate ?? report?.totals.marginRate ?? local.txMarge;
  const txRecouvrement = indicators?.recoveryRate ?? local.txRecouvrement;
  const nbVentes = report?.byType.VENTE.count ?? local.nbVentes;
  const outstandingDebt = indicators?.outstandingDebt;

  const maxVal = Math.max(
    totalVentes,
    totalAchats,
    totalDepenses,
    totalRecettes,
    totalCharges,
    1,
  );

  const periodLabel = report?.period ?? "ce mois";

  const dailyBars = (report?.dailyBreakdown ?? []).slice(-7);
  const maxDailyNet = Math.max(
    ...dailyBars.map((d) => Math.abs(d.net)),
    1,
  );

  const handleExport = (type: "PDF" | "Excel") => {
    if (!isPro) {
      Alert.alert(
        "⭐ Fonctionnalité Pro",
        "Passez à Pro pour exporter vos rapports en " + type,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Passer à Pro",
            onPress: () => router.push("/pro/upgrade"),
          },
        ],
      );
      return;
    }
    if (type === "PDF") {
      Alert.alert(
        "Export PDF",
        "Le téléchargement PDF depuis l'app sera disponible prochainement. Consultez vos rapports sur le tableau de bord web.",
      );
      return;
    }
    Alert.alert(
      "Export Excel",
      "L'export Excel sera disponible prochainement.",
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

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <View style={[st.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={st.back} onPress={() => router.back()}>
          <IconSymbol
            name="chevron.left"
            style={{ width: 20, height: 20 }}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[st.title, { color: theme.text }]}>Rapports Financiers</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={st.exportBtn}
            onPress={() => handleExport("PDF")}
          >
            <Text style={st.exportBtnTxt}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.exportBtn, { backgroundColor: COLORS.green600 }]}
            onPress={() => handleExport("Excel")}
          >
            <Text style={[st.exportBtnTxt, { color: COLORS.white }]}>XLS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {usingFallback && (
          <View style={st.offlineBanner}>
            <Text style={st.offlineTxt}>
              Données locales — connexion indisponible
            </Text>
          </View>
        )}

        <View
          style={[
            st.heroCard,
            {
              backgroundColor:
                beneficeNet >= 0 ? COLORS.navy800 : COLORS.red500,
            },
          ]}
        >
          <Text style={st.heroLabel}>Bénéfice Net — {periodLabel}</Text>
          <Text style={st.heroAmt}>{fmt(beneficeNet)}</Text>
          <Text
            style={[
              st.heroSub,
              { color: beneficeNet >= 0 ? COLORS.green400 : COLORS.white },
            ]}
          >
            {beneficeNet >= 0 ? "↑ Résultat positif" : "↓ Résultat négatif"}
          </Text>
        </View>

        <View style={st.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <IconSymbol
              name="chart.pie"
              style={{ width: 20, height: 20, marginRight: 8 }}
              color={COLORS.gray800}
            />
            <Text style={st.cardTitle}>Répartition des opérations</Text>
          </View>
          {[
            { label: "Ventes", value: totalVentes, color: COLORS.green500 },
            { label: "Recettes", value: totalRecettes, color: COLORS.blue400 },
            { label: "Achats", value: totalAchats, color: COLORS.red500 },
            { label: "Dépenses", value: totalDepenses, color: COLORS.amber500 },
            { label: "Charges", value: totalCharges, color: COLORS.navy700 },
          ].map((item, i) => (
            <View key={i} style={st.barRow}>
              <Text style={st.barLabel}>{item.label}</Text>
              <View style={{ flex: 1 }}>
                <MiniBar pct={(item.value / maxVal) * 100} color={item.color} />
              </View>
              <Text style={[st.barAmt, { color: item.color }]}>
                {fmt(item.value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={st.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <IconSymbol
              name="chart.line.uptrend.xyaxis"
              style={{ width: 20, height: 20, marginRight: 8 }}
              color={COLORS.gray800}
            />
            <Text style={st.cardTitle}>Indicateurs de Performance</Text>
            {!isPro && (
              <Text style={st.proHint}> (aperçu)</Text>
            )}
          </View>
          <View style={st.kpiGrid}>
            <View
              style={[
                st.kpiCard,
                {
                  backgroundColor: COLORS.green50,
                  borderColor: COLORS.green100,
                },
              ]}
            >
              <Text style={st.kpiVal}>{Math.round(txMarge)}%</Text>
              <Text style={st.kpiLbl}>Taux de marge</Text>
            </View>
            <View
              style={[
                st.kpiCard,
                { backgroundColor: COLORS.blue100, borderColor: "#93c5fd" },
              ]}
            >
              <Text style={[st.kpiVal, { color: "#1d4ed8" }]}>
                {Math.round(txRecouvrement)}%
              </Text>
              <Text style={st.kpiLbl}>Taux recouvrement</Text>
            </View>
            <View
              style={[
                st.kpiCard,
                { backgroundColor: COLORS.amber100, borderColor: "#fcd34d" },
              ]}
            >
              <Text style={[st.kpiVal, { color: "#78350f" }]}>{nbVentes}</Text>
              <Text style={st.kpiLbl}>Nb. ventes</Text>
            </View>
            <View
              style={[
                st.kpiCard,
                { backgroundColor: COLORS.red100, borderColor: "#fca5a5" },
              ]}
            >
              <Text style={[st.kpiVal, { color: COLORS.red500 }]}>
                {outstandingDebt != null
                  ? fmt(outstandingDebt)
                  : local.nbDettes}
              </Text>
              <Text style={st.kpiLbl}>
                {outstandingDebt != null ? "Dettes en cours" : "Dettes actives"}
              </Text>
            </View>
          </View>
        </View>

        <View style={st.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <IconSymbol
              name="building.2"
              style={{ width: 20, height: 20, marginRight: 8 }}
              color={COLORS.gray800}
            />
            <Text style={st.cardTitle}>
              Charges Fixes — {fmt(totalCharges)}/mois
            </Text>
          </View>
          {chargeItems.length === 0 && (
            <Text style={st.emptyTxt}>Aucune charge enregistrée</Text>
          )}
          {chargeItems.map((c, i) => {
            const pct =
              totalCharges > 0
                ? Math.round((c.amount / totalCharges) * 100)
                : 0;
            const color = [
              COLORS.green500,
              COLORS.amber500,
              COLORS.blue400,
              COLORS.red500,
            ][i % 4];
            return (
              <View key={c.id} style={st.chargeRow}>
                <Text style={{ fontSize: 20 }}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={st.chargeName}>{c.label}</Text>
                    <Text style={[st.chargeAmt, { color }]}>
                      {fmt(c.amount)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 6,
                        backgroundColor: COLORS.gray100,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          backgroundColor: color,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: FONT_SIZE.xs,
                        color: COLORS.gray400,
                        width: 32,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={st.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <IconSymbol
              name="calendar"
              style={{ width: 20, height: 20, marginRight: 8 }}
              color={COLORS.gray800}
            />
            <Text style={st.cardTitle}>Évolution — {periodLabel}</Text>
          </View>
          {dailyBars.length === 0 ? (
            <Text style={st.emptyTxt}>Pas encore de données ce mois</Text>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 6,
                height: 80,
                paddingTop: 8,
              }}
            >
              {dailyBars.map((day, i) => {
                const h = Math.max(
                  8,
                  Math.round((Math.abs(day.net) / maxDailyNet) * 72),
                );
                const isLast = i === dailyBars.length - 1;
                const label = day.date.slice(8, 10);
                return (
                  <View
                    key={day.date}
                    style={{ flex: 1, alignItems: "center", gap: 4 }}
                  >
                    <View
                      style={{
                        width: "80%",
                        height: h,
                        backgroundColor: isLast
                          ? COLORS.green600
                          : day.net >= 0
                            ? COLORS.green100
                            : COLORS.red100,
                        borderRadius: 4,
                      }}
                    />
                    <Text style={{ fontSize: 9, color: COLORS.gray400 }}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!isPro && (
          <TouchableOpacity
            style={st.proBanner}
            onPress={() => router.push("/pro/upgrade" as any)}
          >
            <Text style={{ fontSize: 22 }}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.proBannerTitle}>Exportez vos rapports</Text>
              <Text style={st.proBannerSub}>
                Passez à Pro pour générer des rapports PDF & Excel
              </Text>
            </View>
            <Text style={{ color: COLORS.green400, fontSize: FONT_SIZE.xl }}>
              →
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
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
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy800,
  },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  exportBtnTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.gray600,
  },
  heroCard: { padding: SPACING.xxl, alignItems: "center", gap: 6 },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.6)",
    fontWeight: FONT_WEIGHT.semibold,
  },
  heroAmt: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: 28,
    color: COLORS.white,
  },
  heroSub: { fontSize: FONT_SIZE.sm },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  cardTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
  },
  proHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHT.regular,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SPACING.sm,
  },
  barLabel: {
    width: 70,
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray600,
    fontWeight: FONT_WEIGHT.semibold,
  },
  barAmt: {
    width: 90,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "right",
  },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
  },
  kpiVal: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.green600,
  },
  kpiLbl: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    textAlign: "center",
  },
  chargeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: SPACING.md,
  },
  chargeName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray800,
  },
  chargeAmt: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  emptyTxt: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.navy800,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  proBannerTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
  },
  proBannerSub: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
});
