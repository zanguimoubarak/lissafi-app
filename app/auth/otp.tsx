import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOW,
  SPACING,
} from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/services/api";
import * as authService from "@/services/auth.service";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function OtpScreen() {
  const router = useRouter();
  const { phone = "" } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<TextInput[]>([]);
  const identifier = phone.startsWith("+237") ? phone : `+237${phone}`;

  useEffect(() => {
    if (!phone) {
      router.replace("/auth/register");
    }
  }, [phone, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleBack(): void {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/auth/register");
  }

  const submitOtp = async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");
      const result = await authService.verifyOtp(identifier, token);
      if (result.requiresPassword) {
        router.push({ pathname: "/auth/pin", params: { userId: result.userId } });
      } else {
        router.replace("/auth/login");
      }
    } catch (err) {
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setError("Code incorrect ou expiré");
        } else if (err.statusCode === 429) {
          setError("Trop de tentatives. Réessayez dans 15 minutes");
        } else {
          setError(err.message);
        }
      } else {
        setError("Une erreur inattendue est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      setTimeout(() => {
        void submitOtp(newOtp.join(""));
      }, 300);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    idx: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");
      await authService.resendOtp(identifier);
      setCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const maskedPhone = phone
    ? `+237 6XX XXX X${phone.replace("+237", "").slice(-2)}`
    : "+237 6XX XXX XXX";

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={handleBack}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <IconSymbol name="phone" size={34} color={COLORS.green600} />
        </View>
        <Text style={styles.heading}>Vérification OTP</Text>
        <Text style={styles.sub}>
          Entrez le code à 6 chiffres{"\n"}envoyé par SMS au {maskedPhone}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                if (r) inputs.current[i] = r;
              }}
              style={[styles.otpInput, digit ? styles.otpFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v.slice(-1), i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!isLoading}
            />
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => {
            void submitOtp(otp.join(""));
          }}
          disabled={isLoading || otp.some((digit) => !digit)}
          activeOpacity={0.85}
        >
          {isLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.btnText}>Confirmer</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resend}
          onPress={() => {
            void handleResend();
          }}
          disabled={isLoading || countdown > 0}
        >
          <Text style={styles.resendText}>
            {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer le code"}
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xl,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.green50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  icon: { fontSize: 36 },
  heading: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.navy800,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray500,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xxxl,
  },
  otpRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.xxl },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gray900,
    textAlign: "center",
  },
  otpFilled: {
    borderColor: COLORS.green500,
    backgroundColor: COLORS.green50,
    color: COLORS.green600,
  },
  btnPrimary: {
    width: "100%",
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
  resend: { marginTop: SPACING.lg },
  resendText: {
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.sm,
  },
  errorText: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
});
