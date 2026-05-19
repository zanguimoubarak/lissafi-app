// Products service: CRUD, listing and product usage limits.
import type { Product } from "@/context/AppContext";
import { apiFetch, type ApiError } from "@/services/api";
import { type ApiProduct, mapProductFromApi } from "@/utils/mappers";
import type { PaginatedResult, PaginationInfo } from "@/services/operations.service";

export interface CreateProductPayload {
  name: string;
  description?: string;
  unit?: string;
  purchasePrice: number;
  salePrice: number;
  stockQty?: number;
  alertThreshold?: number;
}

export interface ProductFilters {
  search?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductsLimit {
  used: number;
  limit: number;
  canCreate: boolean;
}

interface ApiPaginatedProducts {
  items: ApiProduct[];
  pagination: PaginationInfo;
}

function productPayloadToApi(
  payload: Partial<CreateProductPayload>,
): Record<string, string | number | boolean | undefined> {
  return {
    name: payload.name?.trim(),
    description: payload.description,
    unit: payload.unit,
    purchase_price: payload.purchasePrice,
    sale_price: payload.salePrice,
    stock_qty: payload.stockQty,
    alert_threshold: payload.alertThreshold,
  };
}

function filtersToQuery(filters: ProductFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.lowStock !== undefined) params.set("low_stock", String(filters.lowStock));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Creates a product.
 * @param payload Product form payload.
 * @returns Created product.
 * @throws ApiError
 */
export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const data = await apiFetch<ApiProduct>("/products", {
    method: "POST",
    body: JSON.stringify(productPayloadToApi(payload)),
  });
  return mapProductFromApi(data);
}

/**
 * Lists products with optional filters.
 * @param filters Optional filters and pagination.
 * @returns Paginated products.
 * @throws ApiError
 */
export async function listProducts(
  filters?: ProductFilters,
): Promise<PaginatedResult<Product>> {
  const data = await apiFetch<ApiPaginatedProducts>(
    `/products${filtersToQuery(filters)}`,
  );
  return {
    items: data.items.map(mapProductFromApi),
    pagination: data.pagination,
  };
}

/**
 * Loads a product by id.
 * @param id Product id.
 * @returns Product detail.
 * @throws ApiError
 */
export async function getProduct(id: string): Promise<Product> {
  const data = await apiFetch<ApiProduct>(`/products/${id}`);
  return mapProductFromApi(data);
}

/**
 * Updates a product.
 * @param id Product id.
 * @param payload Partial product payload.
 * @returns Updated product.
 * @throws ApiError
 */
export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>,
): Promise<Product> {
  const data = await apiFetch<ApiProduct>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productPayloadToApi(payload)),
  });
  return mapProductFromApi(data);
}

/**
 * Deletes a product.
 * @param id Product id.
 * @returns Nothing.
 * @throws ApiError
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}

/**
 * Loads the product usage limit.
 * @returns Product limit information.
 * @throws ApiError
 */
interface ApiProductsLimit {
  count?: number;
  used?: number;
  limit: number;
  canCreate: boolean;
}

export async function getProductsLimit(): Promise<ProductsLimit> {
  const data = await apiFetch<ApiProductsLimit>("/products/limits");
  return {
    used: data.used ?? data.count ?? 0,
    limit: data.limit,
    canCreate: data.canCreate,
  };
}

export type { ApiError };
