// Operations service: creation, listing, summaries and monthly limits.
import type { Operation, OperationType } from "@/context/AppContext";
import { apiFetch, type ApiError } from "@/services/api";
import { mapOperationFromApi, type ApiOperation } from "@/utils/mappers";

export interface CreateOperationPayload {
  type: OperationType;
  itemName: string;
  unitPrice: number;
  quantity: number;
  description?: string;
  date?: string;
  supplierName?: string;
  productId?: string;
}

export interface OperationFilters {
  type?: OperationType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "op_date" | "amount" | "created_at";
  sortDir?: "ASC" | "DESC";
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface DailySummary {
  date: string;
  revenue: number;
  expenses: number;
  balance: number;
  byType: Record<OperationType, number>;
}

export interface MonthlySummary {
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  balance: number;
  byType: Record<OperationType, number>;
}

export interface MonthlyLimit {
  used: number;
  limit: number;
  canCreate: boolean;
}

interface ApiPaginatedOperations {
  items: ApiOperation[];
  pagination: PaginationInfo;
}

interface ApiDailySummary {
  date: string;
  VENTE: number;
  ACHAT: number;
  DEPENSE: number;
  RECETTE: number;
  balance: number;
  total_income: number;
  total_expense: number;
}

interface ApiMonthlyLimit {
  count?: number;
  used?: number;
  limit: number;
  canCreate: boolean;
  plan?: "FREE" | "PRO";
}

function operationPayloadToApi(
  payload: Partial<CreateOperationPayload>,
): Record<string, string | number | undefined> {
  return {
    type: payload.type,
    article_name: payload.itemName?.trim(),
    amount:
      payload.unitPrice !== undefined && payload.quantity !== undefined
        ? payload.unitPrice * payload.quantity
        : undefined,
    quantity: payload.quantity,
    description: payload.description,
    op_date: payload.date ?? new Date().toISOString().split("T")[0],
    supplier_name: payload.supplierName,
    product_id: payload.productId,
  };
}

function filtersToQuery(filters: OperationFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortDir) params.set("sort_dir", filters.sortDir);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Creates a commercial operation.
 * @param payload Operation form payload.
 * @returns Created operation.
 * @throws ApiError
 */
export async function createOperation(
  payload: CreateOperationPayload,
): Promise<Operation> {
  const data = await apiFetch<ApiOperation>("/operations", {
    method: "POST",
    body: JSON.stringify(operationPayloadToApi(payload)),
  });
  return mapOperationFromApi(data);
}

/**
 * Lists operations with optional filters and pagination.
 * @param filters Optional list filters.
 * @returns Paginated operations.
 * @throws ApiError
 */
export async function listOperations(
  filters?: OperationFilters,
): Promise<PaginatedResult<Operation>> {
  const data = await apiFetch<ApiPaginatedOperations>(
    `/operations${filtersToQuery(filters)}`,
  );
  return {
    items: data.items.map(mapOperationFromApi),
    pagination: data.pagination,
  };
}

/**
 * Loads one operation by id.
 * @param id Operation id.
 * @returns Operation detail.
 * @throws ApiError
 */
export async function getOperation(id: string): Promise<Operation> {
  const data = await apiFetch<ApiOperation>(`/operations/${id}`);
  return mapOperationFromApi(data);
}

/**
 * Updates an existing operation.
 * @param id Operation id.
 * @param payload Partial operation payload.
 * @returns Updated operation.
 * @throws ApiError
 */
export async function updateOperation(
  id: string,
  payload: Partial<CreateOperationPayload>,
): Promise<Operation> {
  const data = await apiFetch<ApiOperation>(`/operations/${id}`, {
    method: "PUT",
    body: JSON.stringify(operationPayloadToApi(payload)),
  });
  return mapOperationFromApi(data);
}

/**
 * Deletes an operation.
 * @param id Operation id.
 * @returns Nothing.
 * @throws ApiError
 */
export async function deleteOperation(id: string): Promise<void> {
  await apiFetch<void>(`/operations/${id}`, { method: "DELETE" });
}

/**
 * Loads the daily operations summary.
 * @param date Optional ISO date.
 * @returns Daily financial summary.
 * @throws ApiError
 */
export async function getDailySummary(date?: string): Promise<DailySummary> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await apiFetch<ApiDailySummary>(
    `/operations/summary/daily${query}`,
  );
  return {
    date: data.date,
    revenue: data.total_income,
    expenses: data.total_expense,
    balance: data.balance,
    byType: {
      VENTE: data.VENTE,
      ACHAT: data.ACHAT,
      DEPENSE: data.DEPENSE,
      RECETTE: data.RECETTE,
    },
  };
}

interface ApiMonthlySummary {
  year: number;
  month: number;
  totals: Record<string, number>;
  net_balance: number;
  operation_count: number;
}

/**
 * Loads the monthly operations summary.
 * @param year Calendar year.
 * @param month Calendar month (1–12).
 * @returns Monthly financial summary.
 * @throws ApiError
 */
export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const data = await apiFetch<ApiMonthlySummary>(
    `/operations/summary/monthly?year=${year}&month=${month}`,
  );
  return {
    year: data.year,
    month: data.month,
    revenue: (data.totals["VENTE"] ?? 0) + (data.totals["RECETTE"] ?? 0),
    expenses: (data.totals["ACHAT"] ?? 0) + (data.totals["DEPENSE"] ?? 0),
    balance: data.net_balance,
    byType: {
      VENTE: data.totals["VENTE"] ?? 0,
      ACHAT: data.totals["ACHAT"] ?? 0,
      DEPENSE: data.totals["DEPENSE"] ?? 0,
      RECETTE: data.totals["RECETTE"] ?? 0,
    },
  };
}

/**
 * Loads the monthly operation usage limit.
 * @returns Monthly limit information.
 * @throws ApiError
 */
export async function getMonthlyLimit(): Promise<MonthlyLimit> {
  const data = await apiFetch<ApiMonthlyLimit>("/operations/limits");
  return {
    used: data.used ?? data.count ?? 0,
    limit: data.limit,
    canCreate: data.canCreate,
  };
}

export type { ApiError };
