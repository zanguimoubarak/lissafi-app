// Stock service: manual movements, low-stock alerts and stock valuation.
import { apiFetch, type ApiError } from "@/services/api";
import type { ApiStockMovement } from "@/utils/mappers";

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface CreateMovementPayload {
  productId: string;
  movementType: MovementType;
  quantity: number;
  reason?: string;
}

export interface StockAlert {
  id: string;
  name: string;
  stockQty: number;
  alertThreshold: number;
  unit: string;
}

export interface StockValuation {
  totalValue: number;
  totalProducts: number;
  alertCount: number;
  currency: "FCFA";
}

interface ApiStockAlert {
  id: string;
  name: string;
  stock_qty: number;
  alert_threshold: number;
  unit: string;
}

interface ApiAlertsResponse {
  alerts: ApiStockAlert[];
  count: number;
}

interface ApiStockValuation {
  product_count: number;
  total_purchase_value: number;
  total_sale_value?: number;
  alert_count?: number;
}

interface MovementFilters {
  page?: number;
  limit?: number;
}

function filtersToQuery(filters: MovementFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function mapAlertFromApi(raw: ApiStockAlert): StockAlert {
  return {
    id: raw.id,
    name: raw.name,
    stockQty: raw.stock_qty,
    alertThreshold: raw.alert_threshold,
    unit: raw.unit,
  };
}

/**
 * Creates a manual stock movement.
 * @param payload Movement payload.
 * @returns Created movement.
 * @throws ApiError
 */
export async function createMovement(
  payload: CreateMovementPayload,
): Promise<ApiStockMovement> {
  return apiFetch<ApiStockMovement>("/stock/movement", {
    method: "POST",
    body: JSON.stringify({
      product_id: payload.productId,
      movement_type: payload.movementType,
      quantity: payload.quantity,
      reason: payload.reason,
    }),
  });
}

/**
 * Lists movements for a product.
 * @param productId Product id.
 * @param filters Optional pagination filters.
 * @returns Product stock movements.
 * @throws ApiError
 */
export async function getMovements(
  productId: string,
  filters?: MovementFilters,
): Promise<ApiStockMovement[]> {
  return apiFetch<ApiStockMovement[]>(
    `/stock/movements/${productId}${filtersToQuery(filters)}`,
  );
}

/**
 * Loads low-stock alerts.
 * @returns Stock alerts.
 * @throws ApiError
 */
export async function getAlerts(): Promise<StockAlert[]> {
  const data = await apiFetch<ApiAlertsResponse | ApiStockAlert[]>(
    "/stock/alerts",
  );
  const alerts = Array.isArray(data) ? data : data.alerts;
  return alerts.map(mapAlertFromApi);
}

/**
 * Loads the current stock valuation.
 * @returns Stock valuation.
 * @throws ApiError
 */
export async function getValuation(): Promise<StockValuation> {
  const data = await apiFetch<ApiStockValuation>("/stock/valuation");
  return {
    totalValue: Number(data.total_purchase_value ?? 0),
    totalProducts: data.product_count ?? 0,
    alertCount: data.alert_count ?? 0,
    currency: "FCFA",
  };
}

export type { ApiError };
