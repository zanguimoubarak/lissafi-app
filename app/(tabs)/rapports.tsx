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
import { useApp } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function fmt(n: number) {
  return (
    Math.round(n)
      .toLocaleString("fr-FR")
      .replace(/\u202f/g, " ") + " FCFA"
  );
}

function BarChart({
  data,
  muted,
}: {
  data: { label: string; value: number; color: string }[];
  muted: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        height: 110,
        paddingHorizontal: 4,
      }}
    >
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <Text
            style={{
              fontSize: 9,
              color: muted,
              fontWeight: FONT_WEIGHT.semibold,
              textAlign: "center",
            }}
          >
            {fmt(d.value).replace(" FCFA", "")}
          </Text>
          <View
            style={{
              width: "100%",
              height: Math.max(8, (d.value / max) * 72),
              backgroundColor: d.color,
              borderRadius: 6,
              opacity: 0.9,
            }}
          />
          <Text style={{ fontSize: 9, color: muted, textAlign: "center" }}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PieChart({
  data,
  muted,
  text,
}: {
  data: { label: string; value: number; color: string }[];
  muted: string;
  text: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 1);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: SPACING.sm,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          overflow: "hidden",
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {data.map((d, i) => (
          <View
            key={i}
            style={{
              width: `${Math.round((d.value / total) * 100)}%`,
              height: 40,
              backgroundColor: d.color,
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {data.map((d, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: d.color,
              }}
            />
            <Text style={{ fontSize: FONT_SIZE.xs, color: muted, flex: 1 }}>
              {d.label}
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZE.xs,
                fontWeight: FONT_WEIGHT.bold,
                color: text,
              }}
            >
              {Math.round((d.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RapportsScreen() {
  const router = useRouter();
  const { operations, charges, user } = useApp();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

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
  const txMarge =
    totalVentes > 0
      ? Math.round(((totalVentes - totalAchats) / totalVentes) * 100)
      : 0;

  const barData = [
    { label: "Ventes", value: totalVentes, color: COLORS.green500 },
    { label: "Achats", value: totalAchats, color: COLORS.red500 },
    { label: "Dépenses", value: totalDepenses, color: COLORS.amber500 },
    { label: "Charges", value: totalCharges, color: COLORS.blue400 },
  ];

  const pieData = charges.map((c) => ({
    label: c.label,
    value: c.amount,
    color: [COLORS.green500, COLORS.amber500, COLORS.blue400, COLORS.red500][
      charges.indexOf(c) % 4
    ],
  }));

  const isPro = user?.plan === "free";

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[
            st.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <Text style={[st.title, { color: theme.text }]}>
            Rapports Financiers
          </Text>
          <View style={[st.periodRow, { backgroundColor: theme.surface2 }]}>
            {(["day", "week", "month"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  st.periodBtn,
                  period === p
                    ? [st.periodActive, { backgroundColor: theme.surface }]
                    : null,
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    st.periodTxt,
                    { color: theme.muted },
                    period === p ? { color: COLORS.green600 } : null,
                  ]}
                >
                  {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KPI Grid */}
        <View style={st.kpiGrid}>
          <View
            style={[
              st.kpiCard,
              { backgroundColor: COLORS.green50, borderColor: COLORS.green100 },
            ]}
          >
            <IconSymbol
              name="arrow.up.right"
              size={22}
              color={COLORS.green600}
            />
            <Text style={st.kpiLbl}>Total Ventes</Text>
            <Text style={[st.kpiAmt, { color: COLORS.green600 }]}>
              {fmt(totalVentes)}
            </Text>
          </View>
          <View
            style={[
              st.kpiCard,
              { backgroundColor: COLORS.red100, borderColor: "#fca5a5" },
            ]}
          >
            <IconSymbol
              name="arrow.down.left"
              size={22}
              color={COLORS.red500}
            />
            <Text style={st.kpiLbl}>Total Achats</Text>
            <Text style={[st.kpiAmt, { color: COLORS.red500 }]}>
              {fmt(totalAchats)}
            </Text>
          </View>
          <View
            style={[
              st.kpiCard,
              { backgroundColor: COLORS.amber100, borderColor: "#fcd34d" },
            ]}
          >
            <IconSymbol name="building.2" size={22} color={COLORS.amber500} />
            <Text style={st.kpiLbl}>Charges fixes</Text>
            <Text style={[st.kpiAmt, { color: COLORS.amber500 }]}>
              {fmt(totalCharges)}
            </Text>
          </View>
          <View
            style={[
              st.kpiCard,
              {
                backgroundColor:
                  beneficeNet >= 0 ? COLORS.green50 : COLORS.red100,
                borderColor: beneficeNet >= 0 ? COLORS.green400 : "#fca5a5",
              },
            ]}
          >
            <IconSymbol
              name="banknote"
              size={22}
              color={beneficeNet >= 0 ? COLORS.green600 : COLORS.red500}
            />
            <Text style={st.kpiLbl}>Bénéfice Net</Text>
            <Text
              style={[
                st.kpiAmt,
                { color: beneficeNet >= 0 ? COLORS.green600 : COLORS.red500 },
              ]}
            >
              {fmt(beneficeNet)}
            </Text>
          </View>
        </View>

        {/* Indicateurs clés */}
        <View style={[st.card, { backgroundColor: theme.surface }]}>
          <View style={st.cardTitleRow}>
            <IconSymbol name="chart.bar" size={20} color={COLORS.green600} />
            <Text style={[st.cardTitle, { color: theme.text }]}>
              Indicateurs clés
            </Text>
          </View>
          <View style={st.indRow}>
            <View style={st.indItem}>
              <Text style={[st.indVal, { color: theme.text }]}>{txMarge}%</Text>
              <Text style={[st.indLbl, { color: theme.muted }]}>
                Taux de marge
              </Text>
            </View>
            <View style={[st.indDivider, { backgroundColor: theme.border }]} />
            <View style={st.indItem}>
              <Text style={[st.indVal, { color: theme.text }]}>
                {operations.filter((o) => o.type === "VENTE").length}
              </Text>
              <Text style={[st.indLbl, { color: theme.muted }]}>
                Ventes totales
              </Text>
            </View>
            <View style={[st.indDivider, { backgroundColor: theme.border }]} />
            <View style={st.indItem}>
              <Text style={[st.indVal, { color: theme.text }]}>
                {operations.filter((o) => o.paymentMode === "DETTE").length}
              </Text>
              <Text style={[st.indLbl, { color: theme.muted }]}>
                Dettes actives
              </Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={[st.card, { backgroundColor: theme.surface }]}>
          <View style={st.cardTitleRow}>
            <IconSymbol name="chart.bar" size={20} color={COLORS.green600} />
            <Text style={[st.cardTitle, { color: theme.text }]}>
              Comparatif des opérations
            </Text>
          </View>
          <BarChart data={barData} muted={theme.muted} />
        </View>

        {/* Pie chart charges */}
        <View style={[st.card, { backgroundColor: theme.surface }]}>
          <View style={st.cardTitleRow}>
            <IconSymbol name="chart.pie" size={20} color={COLORS.green600} />
            <Text style={[st.cardTitle, { color: theme.text }]}>
              Répartition des charges
            </Text>
          </View>
          <PieChart data={pieData} muted={theme.muted} text={theme.text} />
        </View>

        {/* Export / Pro banner */}
        {isPro ? (
          <View style={[st.card, { backgroundColor: theme.surface }]}>
            <View style={st.cardTitleRow}>
              <IconSymbol name="file" size={20} color={COLORS.green600} />
              <Text style={[st.cardTitle, { color: theme.text }]}>
                Exporter le rapport
              </Text>
            </View>
            <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
              <TouchableOpacity
                style={[
                  st.exportBtn,
                  {
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                  },
                ]}
              >
                <IconSymbol name="file" size={22} color={COLORS.green600} />
                <Text style={[st.exportTxt, { color: theme.text }]}>
                  Télécharger en PDF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  st.exportBtn,
                  {
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                  },
                ]}
              >
                <IconSymbol
                  name="chart.bar"
                  size={22}
                  color={COLORS.green600}
                />
                <Text style={[st.exportTxt, { color: theme.text }]}>
                  Exporter en Excel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={st.proCard}
            onPress={() => router.push("/pro/upgrade")}
            activeOpacity={0.85}
          >
            <View style={st.proIcon}>
              <IconSymbol name="star.fill" size={22} color={COLORS.amber500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.proTitle}>Rapports PDF & Excel</Text>
              <Text style={st.proSub}>
                Passez à Pro pour accéder aux exports et graphiques avancés
              </Text>
            </View>
            <Text style={st.proArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    ...SHADOW.sm,
  },
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.md,
  },
  periodRow: {
    flexDirection: "row",
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: RADIUS.sm,
  },
  periodActive: { ...SHADOW.sm },
  periodTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    gap: 4,
  },
  kpiLbl: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray600,
    fontWeight: FONT_WEIGHT.semibold,
  },
  kpiAmt: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  cardTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  indRow: { flexDirection: "row", alignItems: "center" },
  indItem: { flex: 1, alignItems: "center" },
  indVal: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
  },
  indLbl: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    textAlign: "center",
  },
  indDivider: { width: 1, height: 40 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: RADIUS.md,
    minHeight: 56,
    padding: SPACING.md,
    borderWidth: 1,
  },
  exportTxt: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  proCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.navy800,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  proIcon: {
    alignItems: "center",
    backgroundColor: COLORS.amber100,
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  proTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
  },
  proSub: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  proArrow: {
    color: COLORS.green400,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
});
