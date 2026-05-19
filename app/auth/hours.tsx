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
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TimeBlock = { debut: string; fin: string };

export default function HoursScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  const [matin, setMatin] = useState<TimeBlock>({
    debut: "07:00",
    fin: "12:00",
  });
  const [soir, setSoir] = useState<TimeBlock>({ debut: "15:00", fin: "20:00" });

  const handleValidate = () => {
    router.replace("/");
  };

  const timeOptions = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`,
  );

  const TimeRow = ({
    label,
    value,
    onChange,
    style,
  }: {
    label: string;
    value: TimeBlock;
    onChange: (v: TimeBlock) => void;
    style: any;
  }) => (
    <View style={[styles.block, style]}>
      <Text style={styles.blockTitle}>{label}</Text>
      <View style={styles.timeRow}>
        <View style={styles.timePicker}>
          <Text style={styles.timeLabel}>Début</Text>
          <View style={styles.timeBox}>
            <TouchableOpacity
              onPress={() => {
                const idx = timeOptions.indexOf(value.debut);
                onChange({
                  ...value,
                  debut: timeOptions[Math.max(0, idx - 1)],
                });
              }}
            >
              <Text style={styles.timeArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{value.debut}</Text>
            <TouchableOpacity
              onPress={() => {
                const idx = timeOptions.indexOf(value.debut);
                onChange({
                  ...value,
                  debut: timeOptions[Math.min(23, idx + 1)],
                });
              }}
            >
              <Text style={styles.timeArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.timePicker}>
          <Text style={styles.timeLabel}>Fin</Text>
          <View style={styles.timeBox}>
            <TouchableOpacity
              onPress={() => {
                const idx = timeOptions.indexOf(value.fin);
                onChange({ ...value, fin: timeOptions[Math.max(0, idx - 1)] });
              }}
            >
              <Text style={styles.timeArrow}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeValue}>{value.fin}</Text>
            <TouchableOpacity
              onPress={() => {
                const idx = timeOptions.indexOf(value.fin);
                onChange({ ...value, fin: timeOptions[Math.min(23, idx + 1)] });
              }}
            >
              <Text style={styles.timeArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoRow}>
          <View style={styles.miniIcon}>
            <Text style={styles.miniIconText}>L</Text>
          </View>
          <Text style={[styles.brandName, { color: theme.text }]}>LISSAFI-P</Text>
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>Vos heures de gestion</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>
          D&eacute;finissez vos plages d&apos;ouverture
        </Text>

        <TimeRow
          label="OUVERTURE (Matin)"
          value={matin}
          onChange={setMatin}
          style={styles.blockGreen}
        />
        <TimeRow
          label="FERMETURE (Soir)"
          value={soir}
          onChange={setSoir}
          style={styles.blockRed}
        />

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleValidate}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Valider mes heures</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  back: { padding: SPACING.lg },
  backText: {
    color: COLORS.green600,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md,
  },
  scroll: { flexGrow: 1, padding: SPACING.xxl, paddingTop: 0 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: SPACING.xl,
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
  },
  heading: {
    fontWeight: FONT_WEIGHT.extrabold,
    fontSize: FONT_SIZE.xxl,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xl,
  },
  block: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
  },
  blockGreen: { backgroundColor: COLORS.green50, borderColor: COLORS.green400 },
  blockRed: { backgroundColor: COLORS.red100, borderColor: "#fca5a5" },
  blockTitle: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.navy800,
    marginBottom: SPACING.md,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timePicker: { flex: 1, alignItems: "center" },
  timeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray500,
    marginBottom: 4,
    fontWeight: FONT_WEIGHT.semibold,
  },
  timeBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  timeValue: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.gray900,
    marginVertical: 4,
  },
  timeArrow: { fontSize: 12, color: COLORS.gray400 },
  arrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHT.bold,
  },
  btnPrimary: {
    backgroundColor: COLORS.green600,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    ...SHADOW.green,
    marginTop: SPACING.sm,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
});
