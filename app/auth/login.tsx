import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/services/api";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "pin">("phone");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneNext = () => {
    if (phone.length < 9) return;
    setStep("pin");
  };

  const submitLogin = useCallback(
    async (nextPin: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError("");
        await login("+237" + phone, nextPin);
      } catch (err) {
        setPin("");
        if (err instanceof ApiError) {
          if (err.statusCode === 401) {
            setError("Identifiant ou mot de passe incorrect");
          } else if (
            err.statusCode === 403 &&
            err.message.toLowerCase().includes("non vérifié")
          ) {
            router.push({ pathname: "/auth/otp", params: { phone } });
          } else if (
            err.statusCode === 403 &&
            err.message.toLowerCase().includes("désactivé")
          ) {
            setError("Ce compte est désactivé. Contactez le support.");
          } else if (err.statusCode === 429) {
            setError("Trop de tentatives. Réessayez dans 15 minutes.");
          } else {
            setError(err.message);
          }
        } else {
          setError("Une erreur inattendue est survenue");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [login, phone, router],
  );

  const handleKey = (k: string) => {
    if (isLoading) return;
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (k === "") return;
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => {
        void submitLogin(newPin);
      }, 300);
    }
  };

  if (step === "pin")
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.back} onPress={() => setStep("phone")}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.heading}>Entrez votre PIN</Text>
          <Text style={styles.sub}>+237 {phone}</Text>
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, pin.length > i ? styles.dotFilled : null]}
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.keypad}>
            {KEYS.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.key,
                  k === "" ? styles.keyEmpty : null,
                  k === "⌫" ? styles.keyDel : null,
                ]}
                onPress={() => handleKey(k)}
                disabled={k === "" || isLoading}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.keyText, k === "⌫" ? styles.keyDelText : null]}
                >
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <View style={styles.miniIcon}>
            <Text style={styles.miniIconText}>L</Text>
          </View>
          <Text style={styles.brandName}>LISSAFI-P</Text>
        </View>
        <Text style={styles.heading}>Connexion</Text>
        <Text style={styles.sub}>Entrez votre numéro de téléphone</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>🇨🇲 +237</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="6XX XXX XXX"
            placeholderTextColor={COLORS.gray400}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={9}
          />
        </View>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handlePhoneNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continuer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.register}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.registerText}>
            Pas encore de compte ? S&apos;inscrire
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  back: { padding: SPACING.lg },
  backText: {
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
  content: { flex: 1, paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xl },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SPACING.xxl,
    justifyContent: "center",
  },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.navy700,
    alignItems: "center",
    justifyContent: "center",
  },
  miniIconText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.md,
  },
  brandName: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.navy700,
  },
  heading: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray400,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  phoneRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    justifyContent: "center",
  },
  prefixText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.gray700,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    fontSize: FONT_SIZE.md,
    color: COLORS.gray900,
  },
  btnPrimary: {
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    ...SHADOW.green,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  register: { marginTop: SPACING.xl, alignItems: "center" },
  registerText: {
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: SPACING.xxl,
    alignSelf: "center",
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.gray100,
  },
  dotFilled: { borderColor: COLORS.green500, backgroundColor: COLORS.green500 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    gap: 12,
    alignSelf: "center",
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.sm,
  },
  keyEmpty: {
    backgroundColor: COLORS.transparent,
    shadowOpacity: 0,
    elevation: 0,
  },
  keyDel: { backgroundColor: COLORS.red100 },
  keyText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray800,
  },
  keyDelText: { color: COLORS.red500 },
  errorText: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
});
