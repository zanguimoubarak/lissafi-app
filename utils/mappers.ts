import type {
  ActivityType,
  Client,
  FixedCharge,
  Operation,
  OperationType,
  Product,
  User,
  Visit,
} from "@/context/AppContext";

export interface ApiUser {
  id: string;
  phone: string | null;
  email: string | null;
  activity_type:
    | "COMMERCE_GENERAL"
    | "MECANIQUE"
    | "COUTURE"
    | "COIFFURE"
    | "ALIMENTATION"
    | "AGRICULTURE"
    | "SERVICES"
    | "AUTRE";
  boutique_name: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  plan: "FREE" | "PRO";
  is_verified: boolean;
  is_active: boolean;
  work_hours_start: string | null;
  work_hours_end: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface ApiOperation {
  id: string;
  type: OperationType;
  amount: number;
  article_name: string;
  quantity: number;
  description: string | null;
  op_date: string;
  supplier_name: string | null;
  product_id: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  stock_qty: number;
  alert_threshold: number;
  is_active: boolean;
  margin_rate: number | null;
  created_at: string;
}

export interface ApiStockMovement {
  id: string;
  product_id: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string | null;
  created_at: string;
}

/**
 * Maps a backend activity enum into the local activity value used by screens.
 */
export function mapActivityTypeFromApi(apiValue: string | null | undefined): ActivityType {
  switch (apiValue) {
    case "COMMERCE_GENERAL":
      return "commerce";
    case "MECANIQUE":
      return "mecanique";
    case "ALIMENTATION":
      return "restauration";
    case "COIFFURE":
      return "beaute";
    default:
      return "autre";
  }
}

/**
 * Maps a local activity value to the backend enum expected by the API.
 */
export function mapActivityTypeToApi(
  localValue: ActivityType | null | undefined,
): ApiUser["activity_type"] {
  switch (localValue) {
    case "commerce":
      return "COMMERCE_GENERAL";
    case "mecanique":
      return "MECANIQUE";
    case "restauration":
      return "ALIMENTATION";
    case "beaute":
      return "COIFFURE";
    case "autre":
    default:
      return "AUTRE";
  }
}

/**
 * Converts a backend user payload to the app user shape.
 */
export function mapUserFromApi(raw: ApiUser): User {
  return {
    id: raw.id,
    phone: raw.phone ?? "",
    email: raw.email,
    boutiqueName: raw.boutique_name ?? "",
    address: raw.address,
    description: raw.description,
    logoUrl: raw.logo_url,
    activityType: mapActivityTypeFromApi(raw.activity_type),
    plan: raw.plan.toLowerCase() as User["plan"],
    isVerified: raw.is_verified,
    isActive: raw.is_active,
    workHoursStart: raw.work_hours_start,
    workHoursEnd: raw.work_hours_end,
    lastLoginAt: raw.last_login_at,
    createdAt: raw.created_at,
  };
}

/**
 * Converts a backend operation payload to the app operation shape.
 */
export function mapOperationFromApi(raw: ApiOperation): Operation {
  const unitPrice = raw.quantity > 0 ? raw.amount / raw.quantity : raw.amount;

  return {
    id: raw.id,
    type: raw.type,
    itemName: raw.article_name,
    unitPrice,
    quantity: raw.quantity,
    amount: raw.amount,
    paymentMode: "CASH",
    comment: raw.description ?? undefined,
    description: raw.description,
    date: raw.op_date,
    supplierName: raw.supplier_name,
    productId: raw.product_id,
    receiptUrl: raw.receipt_url,
    createdAt: raw.created_at,
  };
}

/**
 * Converts a local operation payload to the backend operation shape.
 */
export function mapOperationToApi(
  local: Partial<Omit<Operation, "id">>,
): Partial<ApiOperation> {
  return {
    type: local.type,
    amount: local.amount,
    article_name: local.itemName,
    quantity: local.quantity,
    description: local.description ?? local.comment ?? null,
    op_date: local.date,
    supplier_name: local.supplierName ?? null,
    product_id: local.productId ?? null,
  };
}

/**
 * Converts a backend product payload to the app product shape.
 */
export function mapProductFromApi(raw: ApiProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    unit: raw.unit,
    purchasePrice: raw.purchase_price,
    salePrice: raw.sale_price,
    stockQty: raw.stock_qty,
    alertThreshold: raw.alert_threshold,
    isActive: raw.is_active,
    marginRate: raw.margin_rate,
    createdAt: raw.created_at,
  };
}

/**
 * Converts a local product payload to the backend product shape.
 */
export function mapProductToApi(
  local: Partial<Omit<Product, "id">>,
): Partial<ApiProduct> {
  return {
    name: local.name,
    description: local.description ?? null,
    unit: local.unit,
    purchase_price: local.purchasePrice,
    sale_price: local.salePrice,
    stock_qty: local.stockQty,
    alert_threshold: local.alertThreshold,
    is_active: local.isActive,
    margin_rate: local.marginRate ?? null,
  };
}

export interface ApiClient {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  total_purchases: number;
  outstanding_balance: number;
  visit_count: number;
  recent_visits?: ApiVisit[];
}

export interface ApiVisit {
  id: string;
  client_id: string;
  visit_date: string;
  amount: number;
  amount_paid?: number;
  status: string;
  debt_status?: string;
  due_date: string | null;
  notes: string | null;
}

export type ChargeCategory =
  | "LOYER"
  | "SALAIRES"
  | "EAU_ELECTRICITE"
  | "ABONNEMENT"
  | "TAXES"
  | "AUTRE";

export interface ApiCharge {
  id: string;
  label: string;
  category: ChargeCategory;
  amount: number;
  frequency: FixedCharge["frequency"];
  next_due_date: string;
  notes: string | null;
  days_until_due?: number;
}

const CHARGE_CATEGORY_ICONS: Record<ChargeCategory, string> = {
  LOYER: "house",
  SALAIRES: "person.2",
  EAU_ELECTRICITE: "lightbulb",
  ABONNEMENT: "tag",
  TAXES: "building.2",
  AUTRE: "tag",
};

const ICON_TO_CHARGE_CATEGORY: Record<string, ChargeCategory> = {
  house: "LOYER",
  "person.2": "SALAIRES",
  lightbulb: "EAU_ELECTRICITE",
  tag: "ABONNEMENT",
  vehicle: "AUTRE",
  phone: "ABONNEMENT",
  "building.2": "TAXES",
  bag: "AUTRE",
};

function toDateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function mapVisitStatusFromApi(
  status: string,
  dueDate?: string | null,
): Visit["status"] {
  if (status === "PAID") return "PAID";
  const due = toDateOnly(dueDate);
  if (due) {
    const today = new Date().toISOString().slice(0, 10);
    if (due < today) return "LATE";
  }
  return "CREDIT";
}

export function mapVisitFromApi(raw: ApiVisit): Visit {
  return {
    id: raw.id,
    clientId: raw.client_id,
    visitDate: toDateOnly(raw.visit_date) ?? raw.visit_date,
    amount: Number(raw.amount),
    status: mapVisitStatusFromApi(raw.status, raw.due_date),
    dueDate: toDateOnly(raw.due_date),
    notes: raw.notes ?? undefined,
  };
}

export function mapClientFromApi(raw: ApiClient): Client {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone ?? "",
    address: raw.address ?? undefined,
    notes: raw.notes ?? undefined,
    totalPurchases: Number(raw.total_purchases ?? 0),
    outstandingBalance: Number(raw.outstanding_balance ?? 0),
    visits: (raw.recent_visits ?? []).map(mapVisitFromApi),
  };
}

export function mapChargeFromApi(raw: ApiCharge): FixedCharge {
  return {
    id: raw.id,
    label: raw.label,
    amount: Number(raw.amount),
    frequency: raw.frequency,
    nextDueDate: toDateOnly(raw.next_due_date) ?? raw.next_due_date,
    icon: CHARGE_CATEGORY_ICONS[raw.category] ?? "tag",
  };
}

export function iconToChargeCategory(icon: string): ChargeCategory {
  return ICON_TO_CHARGE_CATEGORY[icon] ?? "AUTRE";
}

export function withCameroonPhonePrefix(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("237")) return `+${digits}`;
  return `+237${digits}`;
}
