import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, Colors, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOW } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ApiError } from '@/services/api';
import * as authService from '@/services/auth.service';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const { userId = "" } = useLocalSearchParams<{ userId: string }>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submitPin = async (nextPin: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      if (!userId) {
        router.replace('/auth/register');
        return;
      }
      await authService.setPassword(userId, nextPin);
      router.push('/auth/activity');
    } catch (err) {
      setPin('');
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          router.replace('/auth/login');
        } else if (err.statusCode === 403) {
          router.replace('/auth/otp');
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (k: string) => {
    if (isLoading) return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (k === '') return;
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => {
        void submitPin(newPin);
      }, 400);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.heading, { color: theme.text }]}>Sécurisez vos{'\n'}données financières</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>Créer un PIN de 4 chiffres</Text>

        <View style={styles.dotsRow}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[styles.dot, pin.length > i ? styles.dotFilled : null]} />
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.keypad}>
          {KEYS.map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.key, k === '' ? styles.keyEmpty : null, k === '⌫' ? styles.keyDel : null]}
              onPress={() => handleKey(k)}
              activeOpacity={0.7}
              disabled={k === '' || isLoading}
            >
              <Text style={[styles.keyText, k === '⌫' ? styles.keyDelText : null]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, pin.length < 4 || isLoading ? styles.btnDisabled : null]}
          onPress={() => {
            if (pin.length === 4) void submitPin(pin);
          }}
          disabled={pin.length < 4 || isLoading}
        >
          {isLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.btnText}>Sécuriser mon compte</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  back: { padding: SPACING.lg },
  backText: { color: COLORS.green600, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.xxl },
  heading: { fontWeight: FONT_WEIGHT.extrabold, fontSize: FONT_SIZE.xxl, textAlign: 'center', lineHeight: 32, marginBottom: SPACING.sm },
  sub: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xxl },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: SPACING.xxl },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.gray300, backgroundColor: COLORS.gray100 },
  dotFilled: { borderColor: COLORS.green500, backgroundColor: COLORS.green500 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12, marginBottom: SPACING.xl },
  key: { width: 80, height: 64, borderRadius: RADIUS.lg, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  keyEmpty: { backgroundColor: COLORS.transparent, shadowOpacity: 0 },
  keyDel: { backgroundColor: COLORS.red100 },
  keyText: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.gray800 },
  keyDelText: { color: COLORS.red500 },
  btnPrimary: { width: '100%', backgroundColor: COLORS.green600, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', ...SHADOW.green },
  btnDisabled: { backgroundColor: COLORS.gray300, shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  errorText: {
    color: COLORS.red500,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
});
