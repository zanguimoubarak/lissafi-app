import type { ActivityType } from "@/context/AppContext";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  commerce: "Boutique / Commerce général",
  mecanique: "Garage mécanique",
  restauration: "Restauration",
  beaute: "Salon de beauté",
  autre: "Autre activité",
};

export function getActivityLabel(type?: ActivityType | null): string {
  if (!type) return "Non renseigné";
  return ACTIVITY_LABELS[type] ?? type;
}

export function formatWorkHours(
  start?: string | null,
  end?: string | null,
): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return `À partir de ${start}`;
  if (end) return `Jusqu'à ${end}`;
  return "Non configurées";
}
