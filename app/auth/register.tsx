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
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";

export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!phone || phone.length < 9) {
      setError("Entrez un numéro valide (9 chiffres minimum)");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      await authService.register(phone);
      router.push({ pathname: "/auth/otp", params: { phone } });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setError("Ce numéro est déjà associé à un compte");
        } else if (err.statusCode === 0) {
          setError("Vérifiez votre connexion Internet");
        } else {
          setError(err.message);
        }
      } else {
        setError("Une erreur inattendue est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  }, [phone, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.miniIcon}>
              <Text style={styles.miniIconText}>L</Text>
            </View>
            <Text style={[styles.brandName, { color: theme.text }]}>LISSAFI-P</Text>
          </View>

          <Text style={[styles.heading, { color: theme.text }]}>
            Votre boutique{"\n"}dans votre poche
          </Text>
          <Text style={[styles.sub, { color: theme.muted }]}>Entrez votre numéro de téléphone</Text>

          {/* Phone Input */}
          <View style={styles.phoneRow}>
            <View style={[styles.prefix, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
              <Text style={[styles.prefixText, { color: theme.text }]}>🇨🇲 +237</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { borderColor: theme.border, backgroundColor: theme.surface2, color: theme.text },
                error ? styles.inputError : null,
              ]}
              placeholder="6XX XXX XXX"
              placeholderTextColor={COLORS.gray400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setError("");
              }}
              maxLength={9}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btnPrimary, (isLoading || phone.length < 9) ? styles.btnDisabled : null]}
            onPress={handleRegister}
            disabled={isLoading || phone.length < 9}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Rejoindre la communauté</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.btnGhost, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnGhostText, { color: theme.text }]}>
              J&apos;ai d&eacute;j&agrave; un compte !
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.xxl, paddingTop: 48 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SPACING.xxl,
    justifyContent: "center",
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.navy700,
    alignItems: "center",
    justifyContent: "center",
  },
  miniIconText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.lg,
  },
  brandName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.xl,
    letterSpacing: 0.5,
  },
  heading: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  phoneRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    justifyContent: "center",
  },
  prefixText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    fontSize: FONT_SIZE.md,
  },
  inputError: { borderColor: COLORS.red500 },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.red500,
    marginBottom: SPACING.sm,
  },
  btnPrimary: {
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: SPACING.sm,
    ...SHADOW.green,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  btnDisabled: { opacity: 0.6 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: FONT_SIZE.xs },
  btnGhost: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnGhostText: {
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
});
