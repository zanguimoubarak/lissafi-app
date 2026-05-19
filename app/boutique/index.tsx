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
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
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

export default function BoutiqueScreen() {
  const router = useRouter();
  const { user, products } = useApp();
  const isPro = user?.plan === "free";

  const [welcome, setWelcome] = useState(
    "Bienvenue dans ma boutique ! Qualité et service garantis.",
  );
  const [editing, setEditing] = useState(false);

  const boutiqueUrl = `https://lissafi.cm/boutique/${(user?.boutiqueName ?? "ma-boutique").toLowerCase().replace(/\s+/g, "-")}`;
  const statsViews = 142;
  const statsClicks = 38;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ma boutique sur LISSAFI-P !\n${boutiqueUrl}`,
        url: boutiqueUrl,
        title: user?.boutiqueName,
      });
    } catch {
      Alert.alert("Erreur", "Impossible de partager le lien.");
    }
  };

  const handleQR = () => {
    Alert.alert(
      "QR Code",
      "Votre QR Code a été généré et peut être téléchargé pour impression.",
      [
        {
          text: "Télécharger",
          onPress: () => Alert.alert("Succès", "QR Code téléchargé !"),
        },
        { text: "Fermer", style: "cancel" },
      ],
    );
  };

  if (!isPro) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity style={st.back} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={COLORS.gray700} />
          </TouchableOpacity>
          <Text style={st.title}>Boutique en Ligne</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={st.proGate}>
          <View style={st.proGateIcon}>
            <IconSymbol name="store" size={40} color={COLORS.green600} />
          </View>
          <Text style={st.proGateTitle}>Boutique en Ligne Pro</Text>
          <Text style={st.proGateSub}>
            Créez votre vitrine publique accessible par lien ou QR Code.{"\n"}
            Vos clients peuvent voir votre catalogue et vous contacter
            directement.
          </Text>
          <View style={st.featureList}>
            {[
              { icon: "share", label: "URL unique lissafi.cm/boutique/..." },
              { icon: "phone", label: "QR Code téléchargeable & imprimable" },
              { icon: "bag", label: "Catalogue produits avec photos & prix" },
              { icon: "chart.bar", label: "Statistiques de visites" },
              { icon: "message", label: "Contact WhatsApp direct" },
            ].map((f) => (
              <View key={f.label} style={st.featureItem}>
                <IconSymbol name={f.icon} size={16} color={COLORS.green600} />
                <Text style={st.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={st.proBtn}
            onPress={() => router.push("/pro/upgrade")}
          >
            <IconSymbol name="star.fill" size={18} color={COLORS.white} />
            <Text style={st.proBtnTxt}>Activer Pro — 2 500 FCFA/mois</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity style={st.back} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={st.title}>Ma Boutique en Ligne</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Live preview banner */}
        <View style={st.previewBanner}>
          <View style={st.previewHeader}>
            <View style={st.previewAvatar}>
              <Text style={st.previewAvatarTxt}>
                {user?.boutiqueName?.[0] ?? "B"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.previewName}>{user?.boutiqueName}</Text>
              <View style={st.previewTypeRow}>
                <IconSymbol name="bag" size={14} color="rgba(255,255,255,0.55)" />
                <Text style={st.previewType}>Commerce · Maroua, Cameroun</Text>
              </View>
            </View>
            <View style={st.liveIndicator}>
              <View style={st.liveDot} />
              <Text style={st.liveTxt}>EN LIGNE</Text>
            </View>
          </View>
          <Text style={st.welcomeMsg}>{welcome}</Text>
        </View>

        {/* URL & Actions */}
        <View style={st.urlCard}>
          <View style={st.urlLabelRow}>
            <IconSymbol name="share" size={16} color={COLORS.gray500} />
            <Text style={st.urlLabel}>Lien de votre boutique</Text>
          </View>
          <View style={st.urlRow}>
            <Text style={st.urlText} numberOfLines={1}>
              {boutiqueUrl}
            </Text>
          </View>
          <View style={st.actionRow}>
            <TouchableOpacity style={st.actionBtn} onPress={handleShare}>
              <IconSymbol name="share" size={18} color={COLORS.gray700} />
              <Text style={st.actionBtnTxt}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleQR}>
              <IconSymbol name="phone" size={18} color={COLORS.gray700} />
              <Text style={st.actionBtnTxt}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.actionBtn, { backgroundColor: "#25D366" }]}
              onPress={() =>
                Alert.alert("WhatsApp", "Lien copié pour WhatsApp !")
              }
            >
              <IconSymbol name="message" size={18} color={COLORS.white} />
              <Text style={[st.actionBtnTxt, { color: COLORS.white }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={st.statsRow}>
          <View style={st.statCard}>
            <IconSymbol name="visibility" size={24} color={COLORS.green600} />
            <Text style={st.statVal}>{statsViews}</Text>
            <Text style={st.statLbl}>Vues ce mois</Text>
          </View>
          <View style={st.statCard}>
            <IconSymbol name="phone" size={24} color={COLORS.green600} />
            <Text style={st.statVal}>{statsClicks}</Text>
            <Text style={st.statLbl}>Clics contact</Text>
          </View>
          <View style={st.statCard}>
            <IconSymbol name="package" size={24} color={COLORS.green600} />
            <Text style={st.statVal}>{products.length}</Text>
            <Text style={st.statLbl}>Produits visibles</Text>
          </View>
        </View>

        {/* Welcome message editor */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <View style={st.sectionTitleRow}>
              <IconSymbol name="message" size={18} color={COLORS.gray800} />
              <Text style={st.sectionTitle}>Message de bienvenue</Text>
            </View>
            <TouchableOpacity onPress={() => setEditing((e) => !e)}>
              <Text
                style={{
                  color: COLORS.green600,
                  fontWeight: FONT_WEIGHT.semibold,
                  fontSize: FONT_SIZE.sm,
                }}
              >
                {editing ? "Sauvegarder" : "Modifier"}
              </Text>
            </TouchableOpacity>
          </View>
          {editing ? (
            <TextInput
              style={st.welcomeInput}
              value={welcome}
              onChangeText={setWelcome}
              multiline
              maxLength={200}
            />
          ) : (
            <View style={st.welcomeBox}>
              <Text style={st.welcomeBoxTxt}>{welcome}</Text>
            </View>
          )}
        </View>

        {/* Products in boutique */}
        <View style={st.section}>
          <View style={st.sectionTitleRow}>
            <IconSymbol name="bag" size={18} color={COLORS.gray800} />
            <Text style={st.sectionTitle}>Produits dans votre vitrine</Text>
          </View>
          {products
            .filter((p) => p.stockQty > 0)
            .slice(0, 6)
            .map((p) => (
              <View key={p.id} style={st.productRow}>
                <View style={st.productThumb}>
                  <IconSymbol name="package" size={22} color={COLORS.gray500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.productName}>{p.name}</Text>
                  <Text style={st.productUnit}>Vendu par {p.unit}</Text>
                </View>
                <Text style={st.productPrice}>{fmt(p.salePrice)}</Text>
              </View>
            ))}
          {products.filter((p) => p.stockQty === 0).length > 0 && (
            <Text style={st.hiddenNote}>
              * {products.filter((p) => p.stockQty === 0).length} article(s)
              épuisé(s) masqué(s)
            </Text>
          )}
        </View>

        {/* Contact options */}
        <View style={st.section}>
          <View style={st.sectionTitleRow}>
            <IconSymbol name="phone" size={18} color={COLORS.gray800} />
            <Text style={st.sectionTitle}>Options de contact client</Text>
          </View>
          <View style={st.contactCard}>
            <View style={st.contactRow}>
              <IconSymbol name="message" size={20} color={COLORS.green600} />
              <Text style={st.contactTxt}>Message WhatsApp direct</Text>
              <Text
                style={{ color: COLORS.green500, fontWeight: FONT_WEIGHT.bold }}
              >
                Actif
              </Text>
            </View>
            <View style={st.contactDivider} />
            <View style={st.contactRow}>
              <IconSymbol name="phone" size={20} color={COLORS.green600} />
              <Text style={st.contactTxt}>Appel téléphonique</Text>
              <Text
                style={{ color: COLORS.green500, fontWeight: FONT_WEIGHT.bold }}
              >
                Actif
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
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
  },

  proGate: { flex: 1, alignItems: "center", padding: SPACING.xxl, gap: 14 },
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
  featureList: {
    alignSelf: "stretch",
    gap: 8,
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  featureItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.medium,
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
    marginTop: SPACING.sm,
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
    height: 84,
    justifyContent: "center",
    width: 84,
  },

  previewBanner: { backgroundColor: COLORS.navy800, padding: SPACING.xl },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: SPACING.md,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.green600,
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarTxt: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
  },
  previewName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
  },
  previewType: { fontSize: FONT_SIZE.xs, color: "rgba(255,255,255,0.5)" },
  previewTypeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green400,
  },
  liveTxt: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.green400,
    letterSpacing: 1,
  },
  welcomeMsg: {
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.7)",
    fontStyle: "italic",
    lineHeight: 20,
  },

  urlCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  urlLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  urlLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray500,
    textTransform: "uppercase",
  },
  urlRow: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  urlText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
  },
  actionRow: { flexDirection: "row", gap: SPACING.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  actionBtnTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray700,
  },

  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    gap: 4,
    ...SHADOW.sm,
  },
  statVal: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.navy800,
  },
  statLbl: { fontSize: 10, color: COLORS.gray500, textAlign: "center" },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray800,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
  },

  welcomeInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.green400,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray900,
    minHeight: 80,
    textAlignVertical: "top",
  },
  welcomeBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  welcomeBoxTxt: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray700,
    lineHeight: 20,
    fontStyle: "italic",
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray900,
  },
  productUnit: { fontSize: FONT_SIZE.xs, color: COLORS.gray400, marginTop: 1 },
  productPrice: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.green600,
  },
  hiddenNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray400,
    fontStyle: "italic",
    marginTop: 4,
  },

  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
  },
  contactTxt: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray700,
    fontWeight: FONT_WEIGHT.medium,
  },
  contactDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 56,
  },
});
