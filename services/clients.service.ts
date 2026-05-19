// Clients service: listing, CRUD and client detail with recent visits.
import type { Client } from "@/context/AppContext";
import { apiFetch, type ApiError } from "@/services/api";
import type { PaginatedResult, PaginationInfo } from "@/services/operations.service";
import {
  type ApiClient,
  mapClientFromApi,
  withCameroonPhonePrefix,
} from "@/utils/mappers";

export interface CreateClientPayload {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "outstanding_balance" | "total_purchases" | "created_at";
  sortDir?: "ASC" | "DESC";
}

interface ApiPaginatedClients {
  items: ApiClient[];
  pagination: PaginationInfo;
}

function filtersToQuery(filters: ClientFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.sortDir) params.set("sort_dir", filters.sortDir);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function clientPayloadToApi(payload: CreateClientPayload) {
  return {
    name: payload.name.trim(),
    phone: payload.phone ? withCameroonPhonePrefix(payload.phone) : undefined,
    address: payload.address?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
  };
}

export async function listClients(
  filters?: ClientFilters,
): Promise<PaginatedResult<Client>> {
  const data = await apiFetch<ApiPaginatedClients>(
    `/clients${filtersToQuery(filters)}`,
  );
  return {
    items: data.items.map(mapClientFromApi),
    pagination: data.pagination,
  };
}

export async function getClient(id: string): Promise<Client> {
  const data = await apiFetch<ApiClient>(`/clients/${id}`);
  return mapClientFromApi(data);
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const data = await apiFetch<ApiClient>("/clients", {
    method: "POST",
    body: JSON.stringify(clientPayloadToApi(payload)),
  });
  return mapClientFromApi(data);
}

export async function updateClient(
  id: string,
  payload: Partial<CreateClientPayload>,
): Promise<Client> {
  const data = await apiFetch<ApiClient>(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(clientPayloadToApi(payload as CreateClientPayload)),
  });
  return mapClientFromApi(data);
}

export async function deleteClient(id: string): Promise<void> {
  await apiFetch<void>(`/clients/${id}`, { method: "DELETE" });
}

export type { ApiError };
