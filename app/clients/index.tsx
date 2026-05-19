import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import type { Client } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import * as clientsService from "@/services/clients.service";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function ClientAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = [
    COLORS.green600,
    COLORS.navy700,
    "#7c3aed",
    "#ea580c",
    "#0891b2",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: COLORS.white,
          fontWeight: FONT_WEIGHT.bold,
          fontSize: size * 0.38,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const { user, clients: localClients, setClients } = useApp();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const isPro = user?.plan === "pro";
  const setClientsRef = useRef(setClients);
  const localClientsRef = useRef<Client[]>([]);
  const debouncedSearchRef = useRef(debouncedSearch);
  const fetchRequestIdRef = useRef(0);

  setClientsRef.current = setClients;
  localClientsRef.current = localClients;
  debouncedSearchRef.current = debouncedSearch;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClients = useCallback(async (opts?: { silent?: boolean }) => {
    const requestId = ++fetchRequestIdRef.current;
    if (!opts?.silent) setIsLoading(true);

    try {
      const result = await clientsService.listClients({
        search: debouncedSearchRef.current || undefined,
        limit: 100,
        sortBy: "outstanding_balance",
        sortDir: "DESC",
      });
      if (requestId !== fetchRequestIdRef.current) return;
      setUsingFallback(false);
      setItems(result.items);
      setClientsRef.current(result.items);
    } catch {
      if (requestId === fetchRequestIdRef.current) {
        const q = debouncedSearchRef.current.toLowerCase();
        const fallback = localClientsRef.current.filter(
          (c) =>
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(debouncedSearchRef.current),
        );
        setItems(fallback);
        setUsingFallback(true);
      }
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const fetchClientsRef = useRef(fetchClients);
  fetchClientsRef.current = fetchClients;

  const skipFocusRefreshRef = useRef(true);

  useEffect(() => {
    void fetchClientsRef.current();
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void fetchClientsRef.current({ silent: true });
    }, []),
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchClientsRef.current({ silent: true });
  }, []);

  if (!isPro) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <Text style={st.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={st.title}>Dettes Clients</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={st.proGate}>
          <View style={st.proGateIcon}>
            <IconSymbol name="person.2" size={38} color={COLORS.green600} />
          </View>
          <Text style={st.proGateTitle}>Fonctionnalité Pro</Text>
          <Text style={st.proGateSub}>
            La gestion des clients et des dettes est disponible uniquement avec
            le plan Pro.
          </Text>
          <TouchableOpacity
            style={st.proBtn}
            onPress={() => router.push("/pro/upgrade")}
          >
            <IconSymbol name="star.fill" size={18} color={COLORS.white} />
            <Text style={st.proBtnTxt}>Passer à Pro — 2 500 FCFA/mois</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalDebt = items.reduce((s, c) => s + c.outstandingBalance, 0);
  const withDebt = items.filter((c) => c.outstandingBalance > 0).length;
  const totalPurchases = items.reduce((s, c) => s + c.totalPurchases, 0);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity style={st.back} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={st.title}>Dettes Clients</Text>
        <TouchableOpacity
          style={st.addBtn}
          onPress={() => router.push("/clients/new-client")}
        >
          <IconSymbol name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={st.debtBanner}>
        <View style={{ flex: 1 }}>
          <Text style={st.debtLabel}>Total dû</Text>
          <Text style={st.debtAmount}>{fmt(totalDebt)}</Text>
        </View>
        <View style={[st.badge, { backgroundColor: COLORS.red100 }]}>
          <IconSymbol name="alert" size={14} color={COLORS.red500} />
          <Text style={[st.badgeTxt, { color: COLORS.red500 }]}>
            {withDebt} client{withDebt > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {usingFallback ? (
        <Text style={st.fallbackHint}>Mode hors ligne — données locales</Text>
      ) : null}

      <View style={st.searchBox}>
        <IconSymbol name="magnifyingglass" size={20} color={COLORS.gray400} />
        <TextInput
          style={st.searchInput}
          placeholder="Rechercher client / téléphone..."
          placeholderTextColor={COLORS.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading && items.length === 0 ? (
        <View style={st.loadingBox}>
          <ActivityIndicator color={COLORS.green600} size="small" />
        </View>
      ) : (
        <ScrollView
          style={st.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.green600]}
              tintColor={COLORS.green600}
            />
          }
        >
          {items.length === 0 && (
            <View style={st.empty}>
              <IconSymbol name="person" size={40} color={COLORS.gray300} />
              <Text style={st.emptyTxt}>Aucun client trouvé</Text>
            </View>
          )}
          {items.map((c) => {
            const isLate = c.visits.some((v) => v.status === "LATE");
            return (
              <TouchableOpacity
                key={c.id}
                style={st.clientRow}
                onPress={() =>
                  router.push({
                    pathname: "/clients/detail",
                    params: { id: c.id },
                  })
                }
                activeOpacity={0.8}
              >
                <ClientAvatar name={c.name} />
                <View style={st.clientBody}>
                  <Text style={st.clientName}>{c.name}</Text>
                  <Text style={st.clientMeta}>
                    {c.phone} · {c.visits.length || 0} visite
                    {(c.visits.length || 0) > 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={st.clientRight}>
                  <Text
                    style={[
                      st.clientBalance,
                      c.outstandingBalance > 0
                        ? { color: COLORS.red500 }
                        : { color: COLORS.green600 },
                    ]}
                  >
                    {c.outstandingBalance > 0
                      ? fmt(c.outstandingBalance)
                      : "Soldé"}
                  </Text>
                  {isLate && (
                    <View style={st.lateTag}>
                      <IconSymbol name="alert" size={12} color={COLORS.red500} />
                      <Text style={st.lateTagTxt}>En retard</Text>
                    </View>
                  )}
                  {!isLate && c.outstandingBalance > 0 && (
                    <Text style={st.creditTag}>Dette active</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={st.totalRow}>
            <Text style={st.totalLbl}>Total achats — tous clients</Text>
            <Text style={st.totalAmt}>{fmt(totalPurchases)}</Text>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
  loadingBox: { alignItems: "center", paddingTop: 48 },
  fallbackHint: {
    color: COLORS.amber500,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginHorizontal: SPACING.md,
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
  addBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
  },
  debtBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.red100,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#fca5a5",
  },
  debtLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.red500,
    fontWeight: FONT_WEIGHT.semibold,
  },
  debtAmount: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.red500,
    marginTop: 2,
  },
  badge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeTxt: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
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
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray900,
  },
  list: { flex: 1, paddingHorizontal: SPACING.md },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHT.semibold,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  clientBody: { flex: 1 },
  clientName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  clientMeta: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 2 },
  clientRight: { alignItems: "flex-end" },
  clientBalance: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  lateTag: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  lateTagTxt: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.red500,
    fontWeight: FONT_WEIGHT.semibold,
  },
  creditTag: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.navy800,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  totalLbl: { fontSize: FONT_SIZE.xs, color: "rgba(255,255,255,0.6)" },
  totalAmt: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.green400,
  },
  proGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxxl,
    gap: 16,
  },
  proGateTitle: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
    textAlign: "center",
  },
  proGateSub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 24,
  },
  proBtn: {
    alignItems: "center",
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    minHeight: 56,
    paddingVertical: 15,
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.md,
    ...SHADOW.green,
  },
  proBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  proGateIcon: {
    alignItems: "center",
    backgroundColor: COLORS.green100,
    borderRadius: RADIUS.xl,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
});
