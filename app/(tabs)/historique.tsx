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
import type { Operation, OperationType } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as operationsService from "@/services/operations.service";
import type {
  DailySummary,
  MonthlySummary,
  PaginationInfo,
} from "@/services/operations.service";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ApiError } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

const FILTERS: { label: string; value: OperationType | "ALL"; icon: string }[] =
  [
    { label: "Tout", value: "ALL", icon: "list.bullet" },
    { label: "Ventes", value: "VENTE", icon: "arrow.up.right" },
    { label: "Achats", value: "ACHAT", icon: "arrow.down.left" },
    { label: "Dépenses", value: "DEPENSE", icon: "banknote.fill" },
    { label: "Recettes", value: "RECETTE", icon: "banknote" },
  ];

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: "Tout", value: "ALL" },
  { label: "Aujourd'hui", value: "TODAY" },
  { label: "7 jours", value: "WEEK" },
  { label: "Ce mois", value: "MONTH" },
];

type PeriodFilter = "ALL" | "TODAY" | "WEEK" | "MONTH";

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.split("T")[0];
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sectionTitle(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sans date";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = date.toISOString().slice(0, 10);
  if (key === today.toISOString().slice(0, 10)) return "Aujourd'hui";
  if (key === yesterday.toISOString().slice(0, 10)) return "Hier";
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

const TYPE_META: Record<
  OperationType,
  { label: string; icon: string; color: string; bg: string; sign: string }
> = {
  VENTE: { label: "VENTE", icon: "arrow.up.right", color: COLORS.sale, bg: COLORS.green100, sign: "+" },
  ACHAT: { label: "ACHAT", icon: "arrow.down.left", color: COLORS.purchase, bg: COLORS.blue100, sign: "-" },
  DEPENSE: { label: "DÉPENSE", icon: "minus.circle", color: COLORS.expense, bg: COLORS.red100, sign: "-" },
  RECETTE: { label: "RECETTE", icon: "plus.circle", color: COLORS.sale, bg: COLORS.green100, sign: "+" },
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPeriodDates(period: PeriodFilter): {
  dateFrom?: string;
  dateTo?: string;
} {
  const today = new Date();
  switch (period) {
    case "TODAY":
      return { dateFrom: toDateStr(today), dateTo: toDateStr(today) };
    case "WEEK": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { dateFrom: toDateStr(start), dateTo: toDateStr(today) };
    }
    case "MONTH": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: toDateStr(start), dateTo: toDateStr(today) };
    }
    default:
      return {};
  }
}

function matchesPeriod(op: Operation, period: PeriodFilter): boolean {
  if (period === "ALL") return true;
  const { dateFrom, dateTo } = getPeriodDates(period);
  const day = op.date.slice(0, 10);
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}

interface PeriodSummary {
  revenue: number;
  expenses: number;
  balance: number;
}

function summaryFromApiTotals(
  byType: Record<OperationType, number>,
  filter: OperationType | "ALL",
): PeriodSummary {
  if (filter === "ALL") {
    const revenue = byType.VENTE + byType.RECETTE;
    const expenses = byType.ACHAT + byType.DEPENSE;
    return { revenue, expenses, balance: revenue - expenses };
  }
  const amount = byType[filter];
  const isIncome = filter === "VENTE" || filter === "RECETTE";
  return {
    revenue: isIncome ? amount : 0,
    expenses: isIncome ? 0 : amount,
    balance: isIncome ? amount : -amount,
  };
}

function summaryFromDaily(
  daily: DailySummary,
  filter: OperationType | "ALL",
): PeriodSummary {
  return summaryFromApiTotals(daily.byType, filter);
}

function summaryFromMonthly(
  monthly: MonthlySummary,
  filter: OperationType | "ALL",
): PeriodSummary {
  return summaryFromApiTotals(monthly.byType, filter);
}

function summaryFromItems(
  ops: Operation[],
  filter: OperationType | "ALL",
): PeriodSummary {
  const scoped = filter === "ALL" ? ops : ops.filter((o) => o.type === filter);
  let revenue = 0;
  let expenses = 0;
  for (const op of scoped) {
    if (op.type === "VENTE" || op.type === "RECETTE") revenue += op.amount;
    else expenses += op.amount;
  }
  return { revenue, expenses, balance: revenue - expenses };
}

async function loadPeriodSummary(
  period: PeriodFilter,
  filter: OperationType | "ALL",
): Promise<PeriodSummary | null> {
  if (period === "TODAY") {
    const daily = await operationsService.getDailySummary();
    return summaryFromDaily(daily, filter);
  }
  if (period === "MONTH") {
    const now = new Date();
    const monthly = await operationsService.getMonthlySummary(
      now.getFullYear(),
      now.getMonth() + 1,
    );
    return summaryFromMonthly(monthly, filter);
  }
  return null;
}

function filterLocalOperations(
  ops: Operation[],
  filter: OperationType | "ALL",
  period: PeriodFilter,
  search: string,
): Operation[] {
  const q = search.trim().toLowerCase();
  return ops.filter((op) => {
    const matchType = filter === "ALL" || op.type === filter;
    const matchSearch =
      !q ||
      op.itemName.toLowerCase().includes(q) ||
      (op.supplierName?.toLowerCase().includes(q) ?? false);
    return matchType && matchSearch && matchesPeriod(op, period);
  });
}

function AnimatedTouchable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function OpRow({
  item,
  onEdit,
  onDelete,
  isDeleting,
  colors,
}: {
  item: Operation;
  onEdit: (op: Operation) => void;
  onDelete: (op: Operation) => void;
  isDeleting: boolean;
  colors: typeof Colors.light;
}) {
  const meta = TYPE_META[item.type];
  return (
    <View style={[st.opRowWrap, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={st.opRow}
        onPress={() => onEdit(item)}
        activeOpacity={0.85}
        disabled={isDeleting}
      >
        <View style={[st.opIcon, { backgroundColor: meta.bg }]}>
          <IconSymbol
            name={meta.icon}
            size={18}
            color={meta.color}
          />
        </View>
        <View style={st.opBody}>
          <Text style={[st.opName, { color: colors.text }]} numberOfLines={1}>
            {item.itemName}
          </Text>
          <Text style={[st.opMeta, { color: colors.muted }]}>
            {fmtDate(item.date)} · {item.type} · x{item.quantity}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[st.opAmt, { color: meta.color }]}>
            {meta.sign}{fmt(item.amount)}
          </Text>
          <View
            style={[
              st.badge,
              { backgroundColor: meta.bg },
            ]}
          >
            <IconSymbol name={meta.icon} size={12} color={meta.color} />
            <Text
              style={[
                st.badgeTxt,
                { color: meta.color },
              ]}
            >
              {meta.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={st.opDeleteBtn}
        onPress={() => onDelete(item)}
        disabled={isDeleting}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isDeleting ? (
          <ActivityIndicator color={COLORS.red500} size="small" />
        ) : (
          <IconSymbol
            name="trash"
            style={{ width: 18, height: 18 }}
            color={COLORS.red500}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function HistoriqueScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const {
    operations: localOperations,
    setOperations,
    removeOperation,
  } = useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OperationType | "ALL">("ALL");
  const [period, setPeriod] = useState<PeriodFilter>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Operation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [summary, setSummary] = useState<PeriodSummary>({
    revenue: 0,
    expenses: 0,
    balance: 0,
  });
  const [summaryFromApi, setSummaryFromApi] = useState(false);

  const localOperationsRef = useRef(localOperations);
  const setOperationsRef = useRef(setOperations);
  const filterRef = useRef(filter);
  const periodRef = useRef(period);
  const debouncedSearchRef = useRef(debouncedSearch);
  const fetchRequestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const endReachedGuardRef = useRef(false);
  const paginationRef = useRef(pagination);
  const usingFallbackRef = useRef(usingFallback);

  localOperationsRef.current = localOperations;
  setOperationsRef.current = setOperations;
  filterRef.current = filter;
  periodRef.current = period;
  debouncedSearchRef.current = debouncedSearch;
  paginationRef.current = pagination;
  usingFallbackRef.current = usingFallback;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOperations = useCallback(
    async (opts?: { reset?: boolean; page?: number; silent?: boolean }) => {
      const reset = opts?.reset ?? true;
      const page = opts?.page ?? 1;
      const activeFilter = filterRef.current;
      const activePeriod = periodRef.current;
      const activeSearch = debouncedSearchRef.current;
      const { dateFrom, dateTo } = getPeriodDates(activePeriod);
      const requestId = ++fetchRequestIdRef.current;

      isFetchingRef.current = true;
      if (reset) {
        if (!opts?.silent) setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const summaryPromise =
          reset && !activeSearch
            ? loadPeriodSummary(activePeriod, activeFilter).catch(() => null)
            : Promise.resolve(null);

        const [result, periodSummary] = await Promise.all([
          operationsService.listOperations({
            type: activeFilter === "ALL" ? undefined : activeFilter,
            dateFrom,
            dateTo,
            search: activeSearch || undefined,
            page,
            limit: PAGE_SIZE,
            sortBy: "op_date",
            sortDir: "DESC",
          }),
          summaryPromise,
        ]);

        if (requestId !== fetchRequestIdRef.current) return;

        setUsingFallback(false);
        setPagination(result.pagination);
        setItems((prev) => {
          const next = reset ? result.items : [...prev, ...result.items];
          if (reset && !periodSummary) {
            setSummary(summaryFromItems(next, activeFilter));
            setSummaryFromApi(false);
          }
          return next;
        });
        if (reset) {
          setOperationsRef.current(result.items);
        }

        if (periodSummary) {
          setSummary(periodSummary);
          setSummaryFromApi(true);
        }
      } catch {
        if (reset && requestId === fetchRequestIdRef.current) {
          const fallback = filterLocalOperations(
            localOperationsRef.current,
            activeFilter,
            activePeriod,
            activeSearch,
          );
          setItems(fallback);
          setPagination(null);
          setUsingFallback(true);
          setSummary(summaryFromItems(fallback, activeFilter));
          setSummaryFromApi(false);
        }
      } finally {
        if (requestId === fetchRequestIdRef.current) {
          isFetchingRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  const fetchOperationsRef = useRef(fetchOperations);
  fetchOperationsRef.current = fetchOperations;

  const skipFocusRefreshRef = useRef(true);

  useEffect(() => {
    void fetchOperationsRef.current({ reset: true });
  }, [debouncedSearch, filter, period]);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void fetchOperationsRef.current({ reset: true, silent: true });
    }, []),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOperationsRef.current({ reset: true, silent: true });
  }, []);

  const handleEdit = useCallback(
    (op: Operation) => {
      router.push({
        pathname: "/operations/edit",
        params: { id: op.id },
      } as never);
    },
    [router],
  );

  const handleDelete = useCallback(
    (op: Operation) => {
      Alert.alert(
        "Supprimer l'opération",
        `Supprimer « ${op.itemName} » (${fmt(op.amount)}) ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  setDeletingId(op.id);
                  if (!usingFallback) {
                    await operationsService.deleteOperation(op.id);
                  }
                  removeOperation(op.id);
                  setItems((prev) => prev.filter((item) => item.id !== op.id));
                  await fetchOperationsRef.current({ reset: true });
                } catch (err) {
                  const message =
                    err instanceof ApiError
                      ? err.message
                      : "Impossible de supprimer l'opération";
                  Alert.alert("Erreur", message);
                } finally {
                  setDeletingId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [removeOperation, usingFallback],
  );

  const handleLoadMore = useCallback(() => {
    const pageInfo = paginationRef.current;
    if (
      usingFallbackRef.current ||
      isFetchingRef.current ||
      isLoadingMore ||
      !pageInfo?.hasNext
    ) {
      return;
    }
    void fetchOperationsRef.current({
      reset: false,
      page: pageInfo.page + 1,
    });
  }, [isLoadingMore]);

  const displaySummary =
    summaryFromApi || usingFallback
      ? summary
      : summaryFromItems(items, filter);
  const { revenue: totalRevenue, expenses: totalExpenses, balance } =
    displaySummary;
  const sections = React.useMemo(() => {
    const grouped = new Map<string, Operation[]>();
    for (const item of items) {
      const title = sectionTitle(item.date);
      grouped.set(title, [...(grouped.get(title) ?? []), item]);
    }
    return Array.from(grouped, ([title, data]) => ({ title, data }));
  }, [items]);

  const listHeader = (
    <>
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <Text style={[st.title, { color: colors.text }]}>Opérations</Text>
        <View style={st.searchBox}>
          <IconSymbol
            name="magnifyingglass"
            style={{ width: 16, height: 16, marginRight: 8 }}
            color={COLORS.gray400}
          />
          <TextInput
            style={st.searchInput}
            placeholder="Rechercher un article, fournisseur..."
            placeholderTextColor={COLORS.gray400}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        {usingFallback ? (
          <Text style={st.fallbackHint}>
            Mode hors ligne — données locales affichées
          </Text>
        ) : null}
        {!summaryFromApi && !usingFallback && (period === "WEEK" || period === "ALL") ? (
          <Text style={st.fallbackHint}>
            Totaux calculés sur les opérations affichées
          </Text>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.filterScroll}
        contentContainerStyle={st.filterRow}
      >
        {FILTERS.map((f) => (
          <AnimatedTouchable
            key={f.value}
            style={[st.filterBtn, filter === f.value ? st.filterActive : null]}
            onPress={() => setFilter(f.value)}
          >
            <IconSymbol
              name={f.icon as "list.bullet"}
              style={{ width: 20, height: 25, marginRight: 16 }}
              color={filter === f.value ? COLORS.white : COLORS.gray600}
            />
            <Text
              style={[
                st.filterTxt,
                filter === f.value ? st.filterTxtActive : null,
              ]}
            >
              {f.label}
            </Text>
          </AnimatedTouchable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.periodScroll}
        contentContainerStyle={st.periodRow}
      >
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[st.periodBtn, period === p.value ? st.periodActive : null]}
            onPress={() => setPeriod(p.value)}
          >
            <Text
              style={[
                st.periodTxt,
                period === p.value ? st.periodTxtActive : null,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={st.summary}>
        <View style={st.summaryItem}>
          <Text style={st.summaryLbl}>Entrées</Text>
          <Text style={[st.summaryAmt, { color: COLORS.green600 }]}>
            +{fmt(totalRevenue)}
          </Text>
        </View>
        <View style={st.summaryDivider} />
        <View style={st.summaryItem}>
          <Text style={st.summaryLbl}>Sorties</Text>
          <Text style={[st.summaryAmt, { color: COLORS.red500 }]}>
            −{fmt(totalExpenses)}
          </Text>
        </View>
        <View style={st.summaryDivider} />
        <View style={st.summaryItem}>
          <Text style={st.summaryLbl}>Solde</Text>
          <Text
            style={[
              st.summaryAmt,
              {
                color: balance >= 0 ? COLORS.green600 : COLORS.red500,
              },
            ]}
          >
            {fmt(balance)}
          </Text>
        </View>
      </View>
    </>
  );

  if (isLoading && items.length === 0) {
    return (
      <SafeAreaView style={st.safe}>
        {listHeader}
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OpRow
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingId === item.id}
            colors={colors}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={[st.sectionHeader, { color: colors.muted, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={st.empty}>
            <IconSymbol
              name="tray"
              style={{ width: 40, height: 40 }}
              color={COLORS.gray300}
            />
            <Text style={st.emptyTxt}>Aucune opération trouvée</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={st.footerLoader}>
              <ActivityIndicator color={COLORS.green600} size="small" />
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        onMomentumScrollBegin={() => {
          endReachedGuardRef.current = false;
        }}
        onEndReached={() => {
          if (endReachedGuardRef.current) return;
          endReachedGuardRef.current = true;
          handleLoadMore();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.green600]}
            tintColor={COLORS.green600}
          />
        }
      />
      <TouchableOpacity
        style={st.fab}
        activeOpacity={0.88}
        onPress={() => router.push("/operations/new" as never)}
      >
        <IconSymbol name="plus" size={22} color={COLORS.white} />
        <Text style={st.fabText}>Ajouter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    ...SHADOW.sm,
  },
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.navy800,
    marginBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray900,
  },
  fallbackHint: {
    color: COLORS.amber500,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.sm,
  },
  filterScroll: { backgroundColor: COLORS.white, maxHeight: 60, ...SHADOW.sm },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingVertical: 5,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  filterActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green600,
  },
  filterTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  filterTxtActive: { color: COLORS.white },
  periodScroll: {
    backgroundColor: COLORS.white,
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  periodRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  periodActive: {
    backgroundColor: COLORS.navy800,
  },
  periodTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  periodTxtActive: { color: COLORS.white },
  summary: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLbl: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: "uppercase",
  },
  summaryAmt: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  summaryDivider: { width: 1, backgroundColor: COLORS.gray200 },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  loadingBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  footerLoader: {
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHT.semibold,
  },
  opRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  opRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.transparent,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  opDeleteBtn: {
    alignItems: "center",
    backgroundColor: COLORS.red100,
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  opIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  opGreen: { backgroundColor: COLORS.green100 },
  opRed: { backgroundColor: COLORS.red100 },
  opBody: { flex: 1 },
  opName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray800,
  },
  opMeta: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 1 },
  opAmt: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  badge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeGreen: { backgroundColor: COLORS.green100 },
  badgeRed: { backgroundColor: COLORS.red100 },
  badgeTxt: { fontSize: 10, fontWeight: FONT_WEIGHT.bold },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.md,
    textTransform: "uppercase",
  },
  fab: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    bottom: 24,
    flexDirection: "row",
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    position: "absolute",
    right: 20,
    ...SHADOW.green,
  },
  fabText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});
