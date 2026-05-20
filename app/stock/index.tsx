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
import type { Product } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as productsService from "@/services/products.service";
import type { ProductsLimit } from "@/services/products.service";
import type { PaginationInfo } from "@/services/operations.service";
import * as stockService from "@/services/stock.service";
import type { StockAlert, StockValuation } from "@/services/stock.service";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";
}

function filterLocalProducts(products: Product[], search: string): Product[] {
  const q = search.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => p.name.toLowerCase().includes(q));
}

function localValuation(products: Product[]): StockValuation {
  return {
    totalValue: products.reduce(
      (sum, p) => sum + p.stockQty * p.purchasePrice,
      0,
    ),
    totalProducts: products.length,
    alertCount: products.filter((p) => p.stockQty <= p.alertThreshold).length,
    currency: "FCFA",
  };
}

function countAlertBuckets(alerts: StockAlert[]) {
  const outCount = alerts.filter((a) => a.stockQty === 0).length;
  const lowCount = alerts.filter(
    (a) => a.stockQty > 0 && a.stockQty <= a.alertThreshold,
  ).length;
  return { outCount, lowCount };
}

function stockLevel(qty: number, threshold: number) {
  if (qty === 0 || qty <= threshold) {
    return { label: qty === 0 ? "Rupture" : "Critique", icon: "exclamationmark.triangle.fill", color: COLORS.expense, bg: COLORS.red100 };
  }
  if (qty <= threshold * 2) {
    return { label: "Faible", icon: "exclamationmark.triangle.fill", color: COLORS.debt, bg: COLORS.amber100 };
  }
  return { label: "OK", icon: "checkmark.circle.fill", color: COLORS.sale, bg: COLORS.green100 };
}

function ProductCard({
  product,
  onPress,
  colors,
}: {
  product: Product;
  onPress: (product: Product) => void;
  colors: typeof Colors.light;
}) {
  const level = stockLevel(product.stockQty, product.alertThreshold);
  const margin =
    product.salePrice > 0
      ? Math.round(
          ((product.salePrice - product.purchasePrice) / product.salePrice) *
            100,
        )
      : 0;

  return (
    <TouchableOpacity
      style={[st.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={st.productTop}>
        <Text style={[st.itemName, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
        <View style={[st.stockBadge, { backgroundColor: level.bg }]}>
          <IconSymbol name={level.icon} size={13} color={level.color} />
          <Text style={[st.stockBadgeText, { color: level.color }]}>{level.label}</Text>
        </View>
      </View>
      <View style={st.priceBlock}>
        <Text style={[st.itemPrices, { color: colors.muted }]}>Vente</Text>
        <Text style={[st.priceAmount, { color: colors.text }]}>{fmt(product.salePrice)}</Text>
        <Text style={[st.itemPrices, { color: colors.muted }]}>Achat {fmt(product.purchasePrice)} · Marge {margin}%</Text>
      </View>
      <View style={st.stockLineWrap}>
        <View style={[st.stockTrack, { backgroundColor: colors.surface2 }]}>
          <View
            style={[
              st.stockFill,
              {
                backgroundColor: level.color,
                width: `${Math.min(100, Math.max(8, (product.stockQty / Math.max(product.alertThreshold * 3, 1)) * 100))}%`,
              },
            ]}
          />
        </View>
        <Text style={[st.itemQty, { color: level.color }]}>
          {product.stockQty} {product.unit}
        </Text>
        <Text style={[st.threshold, { color: colors.muted }]}>Seuil: {product.alertThreshold}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StockScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  const { products: localProducts, user, setProducts } = useApp();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [valuation, setValuation] = useState<StockValuation | null>(null);
  const [productsLimit, setProductsLimit] = useState<ProductsLimit | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const isPro = user?.plan === "pro";
  const localProductsRef = useRef(localProducts);
  const setProductsRef = useRef(setProducts);
  const debouncedSearchRef = useRef(debouncedSearch);
  const fetchRequestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const endReachedGuardRef = useRef(false);
  const paginationRef = useRef(pagination);
  const usingFallbackRef = useRef(usingFallback);

  localProductsRef.current = localProducts;
  setProductsRef.current = setProducts;
  debouncedSearchRef.current = debouncedSearch;
  paginationRef.current = pagination;
  usingFallbackRef.current = usingFallback;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStock = useCallback(
    async (opts?: { reset?: boolean; page?: number; silent?: boolean }) => {
      const reset = opts?.reset ?? true;
      const page = opts?.page ?? 1;
      const searchQuery = debouncedSearchRef.current;
      const requestId = ++fetchRequestIdRef.current;

      isFetchingRef.current = true;
      if (reset) {
        if (!opts?.silent) setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const [productsResult, alertsResult, valuationResult, limitResult] =
          await Promise.all([
            productsService.listProducts({
              search: searchQuery || undefined,
              page,
              limit: PAGE_SIZE,
            }),
            stockService.getAlerts(),
            stockService.getValuation(),
            productsService.getProductsLimit(),
          ]);

        if (requestId !== fetchRequestIdRef.current) return;

        setUsingFallback(false);
        setAlerts(alertsResult);
        setValuation(valuationResult);
        setProductsLimit(limitResult);
        setPagination(productsResult.pagination);
        setItems((prev) =>
          reset ? productsResult.items : [...prev, ...productsResult.items],
        );
        if (reset) {
          setProductsRef.current(productsResult.items);
        }
      } catch {
        if (reset && requestId === fetchRequestIdRef.current) {
          const cached = localProductsRef.current;
          const fallback = filterLocalProducts(cached, searchQuery);
          setItems(fallback);
          setAlerts(
            filterLocalProducts(cached, "")
              .filter((p) => p.stockQty <= p.alertThreshold)
              .map((p) => ({
                id: p.id,
                name: p.name,
                stockQty: p.stockQty,
                alertThreshold: p.alertThreshold,
                unit: p.unit,
              })),
          );
          setValuation(localValuation(cached));
          setPagination(null);
          setUsingFallback(true);
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

  const fetchStockRef = useRef(fetchStock);
  fetchStockRef.current = fetchStock;

  const skipFocusRefreshRef = useRef(true);

  useEffect(() => {
    void fetchStockRef.current({ reset: true });
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void fetchStockRef.current({ reset: true, silent: true });
    }, []),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStockRef.current({ reset: true, silent: true });
  }, []);

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
    void fetchStockRef.current({ reset: false, page: pageInfo.page + 1 });
  }, [isLoadingMore]);

  const handleMovement = useCallback(
    (product: Product) => {
      Alert.alert(`Mouvement — ${product.name}`, "Choisissez le type de mouvement", [
        {
          text: "Entrée (+ Stock)",
          onPress: () =>
            router.push({
              pathname: "/stock/movement",
              params: {
                productId: product.id,
                productName: product.name,
                movementType: "IN",
              },
            } as never),
        },
        {
          text: "Sortie (− Stock)",
          onPress: () =>
            router.push({
              pathname: "/stock/movement",
              params: {
                productId: product.id,
                productName: product.name,
                movementType: "OUT",
              },
            } as never),
        },
        { text: "Annuler", style: "cancel" },
      ]);
    },
    [router],
  );

  const displayValuation =
    valuation ?? (usingFallback ? localValuation(localProducts) : null);
  const totalValue = displayValuation?.totalValue ?? 0;
  const productCount =
    productsLimit?.used ??
    displayValuation?.totalProducts ??
    items.length;
  const productLimit = isPro ? null : (productsLimit?.limit ?? 20);
  const canAdd =
    isPro || productsLimit?.canCreate === true || productCount < 20;
  const { outCount, lowCount } = countAlertBuckets(
    alerts.length > 0
      ? alerts
      : items.filter((p) => p.stockQty <= p.alertThreshold).map((p) => ({
          id: p.id,
          name: p.name,
          stockQty: p.stockQty,
          alertThreshold: p.alertThreshold,
          unit: p.unit,
        })),
  );

  const listHeader = (
    <>
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[st.back, { backgroundColor: colors.surface2 }]} onPress={() => router.back()}>
          <IconSymbol
            name="chevron.left"
            style={{ width: 20, height: 20 }}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Mon Stock</Text>
        <TouchableOpacity
          style={[st.addBtn, !canAdd ? st.addBtnDisabled : null]}
          onPress={() => {
            if (!canAdd) {
              Alert.alert(
                "Limite atteinte",
                "Passez à Pro pour ajouter plus de 20 articles.",
              );
              return;
            }
            router.push("/stock/new-product");
          }}
        >
          <Text style={st.addBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={st.summaryBanner}>
        <View style={{ flex: 1 }}>
          <Text style={st.summaryLabel}>Valeur totale du stock</Text>
          <Text style={st.summaryValue}>{fmt(totalValue)}</Text>
        </View>
        <View style={st.summaryRight}>
          <View style={st.summaryBadge}>
            <Text style={st.summaryBadgeTxt}>
              {productCount} / {isPro ? "∞" : productLimit} articles
            </Text>
          </View>
          {lowCount > 0 && (
            <View style={[st.summaryBadge, st.badgeAmber]}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                style={{ width: 12, height: 12, marginRight: 4 }}
                color="#78350f"
              />
              <Text style={[st.summaryBadgeTxt, { color: "#78350f" }]}>
                {lowCount} faible
              </Text>
            </View>
          )}
          {outCount > 0 && (
            <View style={[st.summaryBadge, st.badgeRed]}>
              <IconSymbol
                name="circle.fill"
                style={{ width: 12, height: 12, marginRight: 4 }}
                color={COLORS.red500}
              />
              <Text style={[st.summaryBadgeTxt, { color: COLORS.red500 }]}>
                {outCount} épuisé
              </Text>
            </View>
          )}
        </View>
      </View>

      {(outCount > 0 || lowCount > 0) && (
        <View style={[st.alertsSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[st.alertsTitle, { color: colors.text }]}>Alertes stock</Text>
          {outCount > 0 && (
            <View style={st.alertRow}>
              <IconSymbol
                name="circle.fill"
                style={{ width: 12, height: 12 }}
                color={COLORS.red500}
              />
              <Text style={[st.alertRowTxt, { color: colors.text }]}>
                {outCount} article{outCount > 1 ? "s" : ""} en rupture
              </Text>
            </View>
          )}
          {lowCount > 0 && (
            <View style={st.alertRow}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                style={{ width: 12, height: 12 }}
                color={COLORS.amber500}
              />
              <Text style={[st.alertRowTxt, { color: colors.text }]}>
                {lowCount} article{lowCount > 1 ? "s" : ""} en stock faible
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[st.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol
          name="magnifyingglass"
          style={{ width: 16, height: 16, marginRight: 8 }}
          color={colors.muted}
        />
        <TextInput
          style={[st.searchInput, { color: colors.text }]}
          placeholder="Rechercher un article..."
          placeholderTextColor={COLORS.gray400}
          cursorColor={COLORS.primary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <IconSymbol
              name="xmark"
              style={{ width: 16, height: 16 }}
              color={colors.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {usingFallback ? (
        <Text style={st.fallbackHint}>
          Mode hors ligne — données locales affichées
        </Text>
      ) : null}
    </>
  );

  const listFooter = (
    <>
      {isLoadingMore ? (
        <ActivityIndicator
          color={COLORS.green600}
          style={{ marginVertical: SPACING.md }}
        />
      ) : null}
      <View style={{ height: 24 }} />
    </>
  );

  if (isLoading && items.length === 0) {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
        {listHeader}
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        numColumns={2}
        columnWrapperStyle={st.gridRow}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={handleMovement} colors={colors} />
        )}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <View style={st.empty}>
            <IconSymbol
              name="shippingbox"
              style={{ width: 40, height: 40 }}
              color={COLORS.gray300}
            />
            <Text style={[st.emptyTxt, { color: colors.muted }]}>
              {debouncedSearch
                ? "Aucun article trouvé"
                : "Aucun article dans votre catalogue"}
            </Text>
          </View>
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
            onRefresh={() => {
              void handleRefresh();
            }}
            colors={[COLORS.green600]}
            tintColor={COLORS.green600}
          />
        }
      />

      <TouchableOpacity
        style={[st.fab, !canAdd ? st.fabDisabled : null]}
        activeOpacity={0.88}
        onPress={() => {
          if (!canAdd) {
            Alert.alert("Limite atteinte", "Passez à Pro pour ajouter plus de 20 articles.");
            return;
          }
          router.push("/stock/new-product");
        }}
      >
        <IconSymbol name="plus" size={22} color={COLORS.white} />
        <Text style={st.fabText}>Ajouter</Text>
      </TouchableOpacity>

      {!isPro && productLimit !== null && productCount >= productLimit && (
        <TouchableOpacity
          style={st.proBanner}
          onPress={() => router.push("/pro/upgrade" as never)}
        >
          <IconSymbol
            name="star.fill"
            style={{ width: 20, height: 20 }}
            color={COLORS.amber500}
          />
          <Text style={st.proBannerTxt}>
            Passez à Pro pour un catalogue illimité
          </Text>
          <Text
            style={{ color: COLORS.green400, fontWeight: FONT_WEIGHT.bold }}
          >
            →
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  loadingBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingTop: SPACING.xl,
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
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.navy800,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.green,
  },
  addBtnDisabled: { backgroundColor: COLORS.gray300 },
  addBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy800,
    padding: SPACING.lg,
    gap: 12,
  },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: "rgba(255,255,255,0.55)" },
  summaryValue: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.green400,
    marginTop: 2,
  },
  summaryRight: { gap: 6, alignItems: "flex-end" },
  summaryBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryBadgeTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  badgeAmber: { backgroundColor: COLORS.amber100 },
  badgeRed: { backgroundColor: COLORS.red100 },
  alertsSection: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.gray100,
    borderBottomWidth: 1,
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  alertsTitle: {
    color: COLORS.navy800,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 2,
  },
  alertRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  alertRowTxt: {
    color: COLORS.gray700,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    margin: SPACING.md,
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
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 112,
  },
  gridRow: { gap: SPACING.md },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHT.semibold,
  },
  productCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flex: 1,
    marginBottom: SPACING.sm,
    minHeight: 190,
    padding: SPACING.md,
  },
  productTop: { gap: SPACING.sm },
  itemBody: { flex: 1 },
  itemName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  itemPrices: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 2 },
  stockBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.full,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  priceBlock: { marginTop: SPACING.md },
  priceAmount: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  stockLineWrap: { gap: 6, marginTop: "auto" },
  stockTrack: { borderRadius: RADIUS.full, height: 8, overflow: "hidden" },
  stockFill: { borderRadius: RADIUS.full, height: 8 },
  itemQty: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg },
  threshold: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.navy800,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  proBannerTxt: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
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
  fabDisabled: { backgroundColor: COLORS.gray300 },
  fabText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});
