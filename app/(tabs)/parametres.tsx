import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useApp } from "@/context/AppContext";
import {
  COLORS,
  Colors,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  RADIUS,
  SHADOW,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  APP_VERSION,
  PRIVACY_POLICY_URL,
  SUPPORT_WHATSAPP_URL,
  TERMS_URL,
} from "@/constants/appLinks";
import { clearTokens, getRefreshToken } from "@/utils/tokenStorage";
import * as authService from "@/services/auth.service";
import {
  formatWorkHours,
  getActivityLabel,
} from "@/utils/activityLabels";
import { IconSymbol } from "@/components/ui/icon-symbol";

function SettingRow({
  icon,
  label,
  sub,
  onPress,
  danger,
  right,
  textColor,
  subColor,
  arrowColor,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
  textColor: string;
  subColor: string;
  arrowColor: string;
}) {
  return (
    <TouchableOpacity
      style={st.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[st.rowIcon, danger ? st.rowIconDanger : null]}>
        <IconSymbol
          name={icon}
          size={22}
          color={danger ? COLORS.red500 : COLORS.green600}
        />
      </View>
      <View style={st.rowBody}>
        <Text style={[st.rowLabel, { color: textColor }, danger ? { color: COLORS.red500 } : null]}>
          {label}
        </Text>
        {sub ? (
          <Text style={[st.rowSub, { color: subColor }]} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Text style={[st.rowArrow, { color: arrowColor }]}>›</Text> : null)}
    </TouchableOpacity>
  );
}

export default function ParametresScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { user, setUser, logout } = useApp();
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  const refreshProfile = useCallback(async () => {
    try {
      setIsRefreshingProfile(true);
      const profile = await authService.getProfile();
      setUserRef.current(profile);
    } catch {
      // Le profil en cache reste affiché si le réseau échoue.
    } finally {
      setIsRefreshingProfile(false);
    }
  }, []);

  const skipFocusRefreshRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusRefreshRef.current) {
        skipFocusRefreshRef.current = false;
        return;
      }
      void refreshProfile();
    }, [refreshProfile]),
  );

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              const refreshToken = await getRefreshToken();
              await logout(refreshToken ?? "");
            } catch {
              await clearTokens();
              await logout("");
            }
            router.replace("/auth/splash");
          })();
        },
      },
    ]);
  };

  const openWhatsApp = () => {
    void Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {
      Alert.alert(
        "WhatsApp indisponible",
        "Impossible d'ouvrir WhatsApp sur cet appareil.",
      );
    });
  };

  const openPrivacy = () => {
    void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  const openTerms = () => {
    void WebBrowser.openBrowserAsync(TERMS_URL);
  };

  const hoursLabel = formatWorkHours(user?.workHoursStart, user?.workHoursEnd);

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[st.profileCard, { backgroundColor: COLORS.primaryDark }]}>
          <View style={st.avatar}>
            <Text style={st.avatarTxt}>{user?.boutiqueName?.[0] ?? "B"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.profileName}>
              {user?.boutiqueName ?? "Ma Boutique"}
            </Text>
            <Text style={st.profilePhone}>
              {user?.phone ?? "Numéro non renseigné"}
            </Text>
            {user?.email ? (
              <Text style={st.profileMeta}>{user.email}</Text>
            ) : null}
          </View>
          <View
            style={[
              st.planBadge,
              user?.plan === "pro" ? st.planBadgePro : null,
            ]}
          >
            <Text
              style={[
                st.planBadgeTxt,
                user?.plan === "pro" ? { color: "#f59e0b" } : null,
              ]}
            >
              {user?.plan === "pro" ? "Pro" : "Gratuit"}
            </Text>
          </View>
          {isRefreshingProfile ? (
            <ActivityIndicator
              color={COLORS.green400}
              size="small"
              style={st.profileLoader}
            />
          ) : null}
        </View>

        {user?.plan !== "pro" && (
          <TouchableOpacity
            style={st.proBanner}
            onPress={() => router.push("/pro/upgrade")}
            activeOpacity={0.85}
          >
            <View style={st.proIcon}>
              <IconSymbol name="star.fill" size={22} color={COLORS.amber500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.proTitle}>Passer à LISSAFI-P Pro</Text>
              <Text style={st.proSub}>
                Gérez vos dettes clients · Rapports PDF · Boutique en ligne
              </Text>
            </View>
            <Text style={st.proArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: theme.muted }]}>MON PROFIL</Text>
          <View style={[st.card, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon="store"
              label="Nom de la boutique"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub={user?.boutiqueName || "Non renseigné"}
              onPress={() => router.push("/settings/edit-profile")}
            />
            <View style={st.divider} />
            <SettingRow
              icon="phone"
              label="Numéro de téléphone"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub={user?.phone || "Non renseigné"}
            />
            <View style={st.divider} />
            <SettingRow
              icon="key"
              label="Modifier le PIN"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={() => router.push("/settings/change-pin")}
            />
            <View style={st.divider} />
            <SettingRow
              icon="bag"
              label="Type d'activité"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub={getActivityLabel(user?.activityType)}
              onPress={() => router.push("/settings/activity")}
            />
            <View style={st.divider} />
            <SettingRow
              icon="location"
              label="Adresse"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub={user?.address?.trim() || "Non renseignée"}
              onPress={() => router.push("/settings/edit-profile")}
            />
          </View>
        </View>

        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: theme.muted }]}>APPLICATION</Text>
          <View style={[st.card, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon="bell"
              label="Notifications Push"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              right={
                <Switch
                  value={notifs}
                  onValueChange={setNotifs}
                  trackColor={{ true: COLORS.green500 }}
                />
              }
            />
            <View style={st.divider} />
            <SettingRow
              icon="moon"
              label="Thème sombre"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              right={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ true: COLORS.green500 }}
                />
              }
            />
            <View style={st.divider} />
            <SettingRow
              icon="clock"
              label="Heures de gestion"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub={hoursLabel}
              onPress={() => router.push("/settings/work-hours")}
            />
            <View style={st.divider} />
            <SettingRow icon="globe" label="Langue" textColor={theme.text} subColor={theme.muted} arrowColor={theme.muted} sub="Français" />
          </View>
        </View>

        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: theme.muted }]}>GESTION</Text>
          <View style={[st.card, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon="package"
              label="Mon Stock"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={() => router.push("/stock")}
            />
            <View style={st.divider} />
            <SettingRow
              icon="banknote"
              label="Charges fixes"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={() => router.push("/charges")}
            />
            <View style={st.divider} />
            {user?.plan === "free" && (
              <>
                <SettingRow
                  icon="person.2"
                  label="Dettes Clients"
                  textColor={theme.text}
                  subColor={theme.muted}
                  arrowColor={theme.muted}
                  onPress={() => router.push("/clients")}
                />
                <View style={st.divider} />
                <SettingRow
                  icon="store"
                  label="Ma Boutique en ligne"
                  textColor={theme.text}
                  subColor={theme.muted}
                  arrowColor={theme.muted}
                  onPress={() => router.push("/boutique")}
                />
                <View style={st.divider} />
              </>
            )}
            <SettingRow
              icon="chart.bar"
              label="Rapports"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={() => router.push("/rapports")}
            />
          </View>
        </View>

        <View style={st.section}>
          <Text style={[st.sectionTitle, { color: theme.muted }]}>AIDE & SUPPORT</Text>
          <View style={[st.card, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon="message"
              label="Support WhatsApp"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              sub="Réponse sous 24h"
              onPress={openWhatsApp}
            />
            <View style={st.divider} />
            <SettingRow
              icon="file"
              label="Conditions d'utilisation"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={openTerms}
            />
            <View style={st.divider} />
            <SettingRow
              icon="shield"
              label="Politique de confidentialité"
              textColor={theme.text}
              subColor={theme.muted}
              arrowColor={theme.muted}
              onPress={openPrivacy}
            />
          </View>
        </View>

        <View style={st.section}>
          <View style={st.card}>
            <SettingRow icon="logout" label="Déconnexion" textColor={theme.text} subColor={theme.muted} arrowColor={theme.muted} danger onPress={handleLogout} />
          </View>
        </View>

        <Text style={st.version}>
          LISSAFI-P v{APP_VERSION} · Université de Maroua · © 2026
        </Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray100 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.navy800,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
  },
  profileName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
  },
  profilePhone: {
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  profileMeta: {
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  profileLoader: { position: "absolute", right: SPACING.lg, top: SPACING.xl },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  planBadgePro: { backgroundColor: "rgba(245,158,11,0.2)" },
  planBadgeTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: "rgba(255,255,255,0.7)",
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.navy700,
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
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
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: COLORS.red100 },
  rowBody: { flex: 1 },
  rowLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray800,
  },
  rowSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    marginTop: 1,
  },
  rowArrow: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.gray300,
    fontWeight: FONT_WEIGHT.bold,
  },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginLeft: 80 },
  version: {
    textAlign: "center",
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    paddingBottom: SPACING.lg,
  },
});
