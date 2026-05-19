// Charges service: fixed charges listing, summary and CRUD.
import type { FixedCharge } from "@/context/AppContext";
import { apiFetch, type ApiError } from "@/services/api";
import {
  type ApiCharge,
  type ChargeCategory,
  iconToChargeCategory,
  mapChargeFromApi,
} from "@/utils/mappers";

export interface CreateChargePayload {
  label: string;
  category: ChargeCategory;
  amount: number;
  frequency: FixedCharge["frequency"];
  nextDueDate: string;
  notes?: string;
}

export interface ChargesSummary {
  totalMonthly: number;
  totalQuarterly: number;
  totalYearly: number;
  monthlyEquivalent: number;
}

export interface ChargesListResult {
  items: FixedCharge[];
  summary: ChargesSummary;
}

interface ApiChargesList {
  items: ApiCharge[];
  summary: {
    total_monthly: number;
    total_quarterly: number;
    total_yearly: number;
    monthly_equivalent: number;
  };
}

interface ApiChargesSummary {
  total_monthly: number;
  total_quarterly: number;
  total_yearly: number;
  monthly_equivalent: number;
}

function mapSummary(raw: ApiChargesSummary): ChargesSummary {
  return {
    totalMonthly: raw.total_monthly,
    totalQuarterly: raw.total_quarterly,
    totalYearly: raw.total_yearly,
    monthlyEquivalent: raw.monthly_equivalent,
  };
}

function chargePayloadToApi(payload: CreateChargePayload) {
  return {
    label: payload.label.trim(),
    category: payload.category,
    amount: payload.amount,
    frequency: payload.frequency,
    next_due_date: payload.nextDueDate,
    notes: payload.notes?.trim() || undefined,
  };
}

export async function listCharges(): Promise<ChargesListResult> {
  const data = await apiFetch<ApiChargesList>("/charges");
  return {
    items: data.items.map(mapChargeFromApi),
    summary: mapSummary(data.summary),
  };
}

export async function getChargesSummary(): Promise<ChargesSummary> {
  const data = await apiFetch<ApiChargesSummary>("/charges/summary");
  return mapSummary(data);
}

export async function createCharge(
  payload: CreateChargePayload,
): Promise<FixedCharge> {
  const data = await apiFetch<ApiCharge>("/charges", {
    method: "POST",
    body: JSON.stringify(chargePayloadToApi(payload)),
  });
  return mapChargeFromApi(data);
}

export async function updateCharge(
  id: string,
  payload: Partial<CreateChargePayload>,
): Promise<FixedCharge> {
  const data = await apiFetch<ApiCharge>(`/charges/${id}`, {
    method: "PUT",
    body: JSON.stringify(chargePayloadToApi(payload as CreateChargePayload)),
  });
  return mapChargeFromApi(data);
}

export async function deleteCharge(id: string): Promise<void> {
  await apiFetch<void>(`/charges/${id}`, { method: "DELETE" });
}

export { iconToChargeCategory };
export type { ApiError };
