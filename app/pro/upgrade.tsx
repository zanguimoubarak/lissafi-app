import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

const FEATURES = [
  {
    icon: "person.2",
    title: "Dettes Clients illimitées",
    desc: "Suivez toutes vos créances sans limite",
  },
  {
    icon: "chart.pie",
    title: "Rapports PDF & Excel",
    desc: "Exportez vos données financières",
  },
  {
    icon: "bag",
    title: "Boutique en ligne",
    desc: "Vitrine publique + QR Code",
  },
  {
    icon: "shippingbox",
    title: "Stock illimité",
    desc: "Plus de 20 articles dans votre catalogue",
  },
  {
    icon: "message",
    title: "Relances SMS clients",
    desc: "20 SMS de relance par mois inclus",
  },
  {
    icon: "bell",
    title: "Support prioritaire",
    desc: "WhatsApp + Email sous 4h",
  },
];

const FREE_FEATURES = [
  { feat: "Opérations", free: "30 / mois", pro: "Illimitées" },
  { feat: "Articles stock", free: "20 max", pro: "Illimité" },
  { feat: "Clients", free: "10 max", pro: "Illimité" },
  { feat: "Rapports PDF", free: "Non inclus", pro: "Inclus" },
  { feat: "Boutique en ligne", free: "Non inclus", pro: "Inclus" },
  { feat: "Graphiques avancés", free: "Non inclus", pro: "Inclus" },
  { feat: "SMS relances", free: "Non inclus", pro: "20/mois" },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { upgradeToPro, user } = useApp();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [paying, setPaying] = useState(false);

  const isPro = user?.plan === "pro";

  const handlePay = (method: "MTN" | "ORANGE") => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      Alert.alert(
        "Paiement réussi",
        `Votre abonnement LISSAFI-P Pro a été activé via ${method === "MTN" ? "MTN MoMo" : "Orange Money"}.\n\n2 mois offerts pour les 300 premiers abonnés.`,
        [
          {
            text: "Commencer avec Pro",
            onPress: () => {
              upgradeToPro();
              router.replace("/(tabs)");
            },
          },
        ],
      );
    }, 2000);
  };

  // ── SKIP BUTTON handler ──────────────────────────────────────────────────────
  const handleSkip = () => {
    router.back();
  };

  if (isPro) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <IconSymbol
              name="chevron.left"
              style={{ width: 20, height: 20 }}
              color={COLORS.gray800}
            />
          </TouchableOpacity>
          <Text style={st.title}>Mon Abonnement</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={st.alreadyPro}>
          <IconSymbol
            name="star.fill"
            style={{ width: 64, height: 64 }}
            color={COLORS.amber500}
          />
          <Text style={st.proTitle}>Vous êtes déjà Pro !</Text>
          <Text style={st.proSub}>
            Profitez de toutes les fonctionnalités premium de LISSAFI-P.
          </Text>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Text style={st.backBtnTxt}>Retour au tableau de bord</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      {/* Header with SKIP button */}
      <View style={st.header}>
        <TouchableOpacity style={st.back} onPress={() => router.back()}>
          <IconSymbol
            name="chevron.left"
            style={{ width: 20, height: 20 }}
            color={COLORS.gray800}
          />
        </TouchableOpacity>
        <Text style={st.title}>Passer à Pro</Text>
        {/* Bouton pour sauter le paiement temporairement */}
        <TouchableOpacity style={st.skipBtn} onPress={handleSkip}>
          <Text style={st.skipTxt}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={st.hero}>
          <IconSymbol
            name="star.fill"
            style={{ width: 48, height: 48, marginBottom: 8 }}
            color={COLORS.amber500}
          />
          <Text style={st.heroTitle}>LISSAFI-P Pro</Text>
          <Text style={st.heroSub}>Gérez votre commerce comme un pro</Text>
          <View style={st.offerBadge}>
            <Text style={st.offerTxt}>
              2 MOIS OFFERTS pour les 300 premiers abonnés
            </Text>
          </View>
        </View>

        {/* Plan selector */}
        <View style={st.planRow}>
          <TouchableOpacity
            style={[st.planCard, plan === "monthly" ? st.planActive : null]}
            onPress={() => setPlan("monthly")}
          >
            <Text
              style={[
                st.planLabel,
                plan === "monthly" ? { color: COLORS.white } : null,
              ]}
            >
              MENSUEL
            </Text>
            <Text
              style={[
                st.planPrice,
                plan === "monthly" ? { color: COLORS.white } : null,
              ]}
            >
              2 500
            </Text>
            <Text
              style={[
                st.planUnit,
                plan === "monthly" ? { color: "rgba(255,255,255,0.7)" } : null,
              ]}
            >
              FCFA / mois
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              st.planCard,
              plan === "yearly" ? st.planActive : null,
              { position: "relative" },
            ]}
            onPress={() => setPlan("yearly")}
          >
            <View style={st.bestBadge}>
              <Text style={st.bestBadgeTxt}>-17%</Text>
            </View>
            <Text
              style={[
                st.planLabel,
                plan === "yearly" ? { color: COLORS.white } : null,
              ]}
            >
              ANNUEL
            </Text>
            <Text
              style={[
                st.planPrice,
                plan === "yearly" ? { color: COLORS.white } : null,
              ]}
            >
              25 000
            </Text>
            <Text
              style={[
                st.planUnit,
                plan === "yearly" ? { color: "rgba(255,255,255,0.7)" } : null,
              ]}
            >
              FCFA / an
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Ce que vous obtenez</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={st.featureRow}>
              <IconSymbol
                name={f.icon as any}
                style={{ width: 22, height: 22 }}
                color={COLORS.gray700}
              />
              <View style={{ flex: 1 }}>
                <Text style={st.featureName}>{f.title}</Text>
                <Text style={st.featureDesc}>{f.desc}</Text>
              </View>
              <IconSymbol
                name="checkmark"
                style={{ width: 18, height: 18 }}
                color={COLORS.green500}
              />
            </View>
          ))}
        </View>

        {/* Comparison table */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Comparaison des plans</Text>
          <View style={st.table}>
            <View style={st.tableHeader}>
              <Text style={[st.tableCell, { flex: 2, color: COLORS.gray500 }]}>
                Fonctionnalité
              </Text>
              <Text
                style={[
                  st.tableCell,
                  { color: COLORS.gray500, textAlign: "center" },
                ]}
              >
                Gratuit
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol
                  name="star.fill"
                  style={{ width: 16, height: 16, marginRight: 4 }}
                  color={COLORS.amber500}
                />
                <Text
                  style={[
                    st.tableCell,
                    { color: COLORS.green600, textAlign: "center" },
                  ]}
                >
                  Pro
                </Text>
              </View>
            </View>
            {FREE_FEATURES.map((r, i) => (
              <View
                key={i}
                style={[
                  st.tableRow,
                  i % 2 === 0 ? { backgroundColor: COLORS.gray50 } : null,
                ]}
              >
                <Text
                  style={[st.tableCell, { flex: 2, color: COLORS.gray700 }]}
                >
                  {r.feat}
                </Text>
                <Text
                  style={[
                    st.tableCell,
                    { color: COLORS.gray500, textAlign: "center" },
                  ]}
                >
                  {r.free}
                </Text>
                <Text
                  style={[
                    st.tableCell,
                    {
                      color: COLORS.green600,
                      textAlign: "center",
                      fontWeight: FONT_WEIGHT.bold,
                    },
                  ]}
                >
                  {r.pro}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment buttons */}
        <View style={st.paySection}>
          <Text style={st.paySectionTitle}>
            Choisissez votre mode de paiement
          </Text>
          <Text style={st.paySectionSub}>
            {plan === "monthly"
              ? fmt(2500) + " / mois"
              : fmt(25000) + " / an (économisez " + fmt(5000) + ")"}
          </Text>

          <TouchableOpacity
            style={[st.payBtn, st.payBtnMtn, paying ? st.payBtnDisabled : null]}
            onPress={() => !paying && handlePay("MTN")}
            activeOpacity={0.85}
          >
            <View style={[st.payMark, { backgroundColor: "#facc15" }]} />
            <Text style={st.payBtnTxt}>
              {paying ? "Traitement en cours..." : "Payer avec MTN MoMo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              st.payBtn,
              st.payBtnOrange,
              paying ? st.payBtnDisabled : null,
            ]}
            onPress={() => !paying && handlePay("ORANGE")}
            activeOpacity={0.85}
          >
            <View style={[st.payMark, { backgroundColor: "#f97316" }]} />
            <Text style={st.payBtnTxt}>
              {paying ? "Traitement en cours..." : "Payer avec Orange Money"}
            </Text>
          </TouchableOpacity>

          {/* ── BOUTON PASSER (Skip) — fonctionnel, navigation vers écran suivant ── */}
          <TouchableOpacity
            style={st.skipLargeBtn}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <IconSymbol name="chevron.right" size={18} color={COLORS.green600} />
            <Text style={st.skipLargeTxt}>Passer — Continuer sans Pro</Text>
          </TouchableOpacity>

          <Text style={st.disclaimer}>
            Paiement sécurisé · Annulation possible à tout moment · Données
            protégées
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray50 },
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
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy800,
  },
  // ── Skip button (header) ──
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
  },
  skipTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  hero: {
    backgroundColor: COLORS.navy800,
    padding: SPACING.xxl,
    alignItems: "center",
  },
  heroTitle: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: FONT_SIZE.md,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  offerBadge: {
    backgroundColor: COLORS.amber500,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: SPACING.lg,
  },
  offerTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    textAlign: "center",
  },
  planRow: { flexDirection: "row", gap: SPACING.md, padding: SPACING.lg },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    gap: 4,
    ...SHADOW.md,
    borderWidth: 2,
    borderColor: COLORS.transparent,
  },
  planActive: {
    backgroundColor: COLORS.green600,
    borderColor: COLORS.green400,
  },
  planLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray500,
    letterSpacing: 1,
  },
  planPrice: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: 28,
    color: COLORS.navy800,
  },
  planUnit: { fontSize: FONT_SIZE.xs, color: COLORS.gray400 },
  bestBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: COLORS.amber500,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestBadgeTxt: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
  },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  featureName: {
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray900,
  },
  featureDesc: { fontSize: FONT_SIZE.xs, color: COLORS.gray500, marginTop: 1 },
  table: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.gray100,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  tableRow: {
    flexDirection: "row",
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  tableCell: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray700,
  },
  paySection: { padding: SPACING.lg, gap: SPACING.md },
  paySectionTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy800,
    textAlign: "center",
  },
  paySectionSub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: "center",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 56,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    ...SHADOW.md,
  },
  payBtnMtn: { backgroundColor: "#1a1a1a" },
  payBtnOrange: { backgroundColor: "#ff6600" },
  payBtnDisabled: { opacity: 0.6 },
  payMark: {
    borderColor: "rgba(255,255,255,0.65)",
    borderRadius: RADIUS.full,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  payBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.md,
  },
  // ── Skip large button (prominent, at bottom of payment section) ──
  skipLargeBtn: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    minHeight: 56,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  skipLargeTxt: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray600,
  },
  disclaimer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    textAlign: "center",
    lineHeight: 18,
  },
  alreadyPro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxxl,
    gap: 16,
  },
  proTitle: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
  },
  proSub: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gray500,
    textAlign: "center",
  },
  backBtn: {
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.md,
    ...SHADOW.green,
  },
  backBtnTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
});
