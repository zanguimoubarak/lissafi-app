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
import type { Operation, OperationType } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as operationsService from "@/services/operations.service";
import type { DailySummary, MonthlyLimit } from "@/services/operations.service";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";
}

const OP_META: Record<
  OperationType,
  { label: string; icon: string; color: string; bg: string; sign: string }
> = {
  VENTE: { label: "VENTE", icon: "arrow.up.right", color: COLORS.sale, bg: COLORS.green100, sign: "+" },
  ACHAT: { label: "ACHAT", icon: "arrow.down.left", color: COLORS.purchase, bg: COLORS.blue100, sign: "-" },
  DEPENSE: { label: "DÉPENSE", icon: "minus.circle", color: COLORS.expense, bg: COLORS.red100, sign: "-" },
  RECETTE: { label: "RECETTE", icon: "plus.circle", color: COLORS.sale, bg: COLORS.green100, sign: "+" },
};

function OpRow({ item, surface, text, muted }: { item: Operation; surface: string; text: string; muted: string }) {
  const meta = OP_META[item.type];
  return (
    <View style={[st.opRow, { backgroundColor: surface }]}>
      <View style={[st.opIcon, { backgroundColor: meta.bg }]}>
        <IconSymbol name={meta.icon} size={19} color={meta.color} />
      </View>
      <View style={st.opBody}>
        <Text style={[st.opName, { color: text }]} numberOfLines={1}>
          {item.itemName}
        </Text>
        <Text style={[st.opMeta, { color: muted }]}>
          {meta.label} · {item.paymentMode === "DETTE" ? "Dette" : "Cash"}
        </Text>
      </View>
      <Text style={[st.opAmt, { color: meta.color }]}>
        {meta.sign}{fmt(item.amount)}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const {
    user,
    operations,
    getDayBalance,
    getDayRevenue,
    getDayExpenses,
    setOperations,
  } = useApp();
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [latestOperations, setLatestOperations] = useState<Operation[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState<MonthlyLimit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rev = dailySummary?.revenue ?? getDayRevenue();
  const exp = dailySummary?.expenses ?? getDayExpenses();
  const bal = dailySummary?.balance ?? getDayBalance();
  const salesTotal = operations.filter((o) => o.type === "VENTE").reduce((s, o) => s + o.amount, 0);
  const purchasesTotal = operations.filter((o) => o.type === "ACHAT").reduce((s, o) => s + o.amount, 0);
  const expensesTotal = operations.filter((o) => o.type === "DEPENSE").reduce((s, o) => s + o.amount, 0);
  const debtsTotal = operations.filter((o) => o.paymentMode === "DETTE").reduce((s, o) => s + o.amount, 0);
  const recentOps = latestOperations.length > 0 ? latestOperations : operations.slice(0, 5);

  const loadDashboard = useCallback(async () => {
    try {
      const [summary, latestOps, limit] = await Promise.all([
        operationsService.getDailySummary(),
        operationsService.listOperations({ limit: 5, sortBy: "op_date", sortDir: "DESC" }),
        operationsService.getMonthlyLimit(),
      ]);
      setDailySummary(summary);
      setLatestOperations(latestOps.items);
      setOperations(latestOps.items);
      setMonthlyLimit(limit);
    } catch {
      // Les données mock/locales gardent l'accueil utile hors ligne.
    } finally {
      setIsLoading(false);
    }
  }, [setOperations]);

  const loadedOnceRef = useRef(false);
  useEffect(() => {
    if (loadedOnceRef.current) return;
    loadedOnceRef.current = true;
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  }, [loadDashboard]);

  if (isLoading && !dailySummary && recentOps.length === 0) {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  const kpis = [
    { label: "Ventes", value: salesTotal || rev, color: COLORS.sale, icon: "arrow.up.right" },
    { label: "Achats", value: purchasesTotal, color: COLORS.purchase, icon: "arrow.down.left" },
    { label: "Dépenses", value: expensesTotal || exp, color: COLORS.expense, icon: "minus.circle" },
    { label: "Dettes", value: debtsTotal, color: COLORS.debt, icon: "calendar" },
  ];

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        <View style={st.topBar}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{user?.boutiqueName?.[0] ?? "L"}</Text>
          </View>
          <View style={st.topBody}>
            <Text style={[st.greeting, { color: theme.muted }]}>Bonjour</Text>
            <Text style={[st.boutique, { color: theme.text }]} numberOfLines={1}>
              {user?.boutiqueName ?? "Ma Boutique"}
            </Text>
          </View>
          <TouchableOpacity style={[st.topIcon, { backgroundColor: theme.surface2 }]} onPress={() => router.push("/(tabs)/parametres" as never)}>
            <IconSymbol name="person" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={st.hero}>
          <View style={st.heroTop}>
            <Text style={st.heroLabel}>Bénéfice du jour</Text>
            <Text style={st.heroDate}>{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</Text>
          </View>
          <Text style={st.heroAmount}>{bal >= 0 ? "+ " : "- "}{fmt(Math.abs(bal))}</Text>
          <View style={st.heroBottom}>
            <View>
              <Text style={st.heroSmallLabel}>▲ Recettes</Text>
              <Text style={st.heroSmallAmount}>{fmt(rev)}</Text>
            </View>
            <View style={st.heroDivider} />
            <View>
              <Text style={st.heroSmallLabel}>▼ Dépenses</Text>
              <Text style={st.heroSmallAmount}>{fmt(exp)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={st.kpiGrid}>
          {kpis.map((kpi) => (
            <TouchableOpacity
              key={kpi.label}
              style={[st.kpi, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/historique" as never)}
            >
              <View style={st.kpiHead}>
                <IconSymbol name={kpi.icon} size={18} color={kpi.color} />
                <Text style={[st.kpiLbl, { color: theme.muted }]}>{kpi.label}</Text>
              </View>
              <Text style={[st.kpiAmt, { color: kpi.color }]}>{fmt(kpi.value)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {monthlyLimit && monthlyLimit.limit === 30 && monthlyLimit.used >= 25 ? (
          <TouchableOpacity style={st.limitBanner} activeOpacity={0.85} onPress={() => router.push("/pro/upgrade" as never)}>
            <IconSymbol name="calendar" size={18} color={COLORS.debt} />
            <Text style={st.limitText}>{monthlyLimit.used}/30 opérations ce mois</Text>
            <Text style={st.limitAction}>Pro</Text>
          </TouchableOpacity>
        ) : null}

        <View style={st.sectionHead}>
          <Text style={[st.sectionTitle, { color: theme.text }]}>Actions rapides</Text>
        </View>
        <View style={st.actionGrid}>
          {(Object.keys(OP_META) as OperationType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[st.action, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/operations/new", params: { type } } as never)}
            >
              <IconSymbol name={OP_META[type].icon} size={22} color={OP_META[type].color} />
              <Text style={[st.actionText, { color: theme.text }]}>{OP_META[type].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={st.sectionHead}>
          <Text style={[st.sectionTitle, { color: theme.text }]}>Dernières opérations</Text>
          <TouchableOpacity style={st.viewAll} onPress={() => router.push("/(tabs)/historique" as never)}>
            <Text style={st.viewAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {recentOps.length > 0 ? (
          recentOps.map((op) => <OpRow key={op.id} item={op} surface={theme.surface} text={theme.text} muted={theme.muted} />)
        ) : (
          <View style={[st.emptyOps, { backgroundColor: theme.surface }]}>
            <Text style={[st.emptyOpsText, { color: theme.muted }]}>Aucune opération récente</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  loadingBox: { alignItems: "center", flex: 1, justifyContent: "center" },
  topBar: { alignItems: "center", flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  avatar: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 48, justifyContent: "center", width: 48 },
  avatarTxt: { color: COLORS.white, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  topBody: { flex: 1 },
  greeting: { fontSize: FONT_SIZE.sm },
  boutique: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  topIcon: { alignItems: "center", borderRadius: RADIUS.lg, height: 48, justifyContent: "center", width: 48 },
  hero: { borderRadius: RADIUS.hero, padding: SPACING.xl, ...SHADOW.hero },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heroLabel: { color: "rgba(255,255,255,0.82)", fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold },
  heroDate: { color: "rgba(255,255,255,0.74)", fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  heroAmount: { color: COLORS.white, fontSize: FONT_SIZE.hero, fontWeight: FONT_WEIGHT.bold, marginVertical: SPACING.xl, textAlign: "center" },
  heroBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-around" },
  heroDivider: { backgroundColor: "rgba(255,255,255,0.25)", height: 34, width: 1 },
  heroSmallLabel: { color: "rgba(255,255,255,0.72)", fontSize: FONT_SIZE.xs },
  heroSmallAmount: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md, marginTop: SPACING.lg },
  kpi: { borderRadius: RADIUS.lg, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 96, padding: SPACING.md },
  kpiHead: { alignItems: "center", flexDirection: "row", gap: SPACING.sm },
  kpiLbl: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  kpiAmt: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.sm },
  limitBanner: { alignItems: "center", backgroundColor: COLORS.amber100, borderColor: COLORS.debt, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg, minHeight: 48, paddingHorizontal: SPACING.md },
  limitText: { color: COLORS.gray800, flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  limitAction: { color: COLORS.primaryDark, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  sectionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.xl, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold },
  viewAll: { alignItems: "center", justifyContent: "center", minHeight: 48, paddingHorizontal: SPACING.sm },
  viewAllText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  action: { alignItems: "center", borderRadius: RADIUS.lg, borderWidth: 1, flexBasis: "47%", flexDirection: "row", flexGrow: 1, gap: SPACING.sm, minHeight: 56, paddingHorizontal: SPACING.md },
  actionText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  opRow: { alignItems: "center", borderRadius: RADIUS.lg, flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.sm, minHeight: 64, padding: SPACING.md },
  opIcon: { alignItems: "center", borderRadius: RADIUS.md, height: 40, justifyContent: "center", width: 40 },
  opBody: { flex: 1 },
  opName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  opMeta: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  opAmt: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  emptyOps: { alignItems: "center", borderRadius: RADIUS.lg, padding: SPACING.xl },
  emptyOpsText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});
