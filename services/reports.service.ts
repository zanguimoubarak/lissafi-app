// Reports service: monthly report, performance indicators and dashboard.
import { apiFetch, type ApiError } from "@/services/api";

export interface MonthlyReportTotals {
  revenue: number;
  expenses: number;
  netBalance: number;
  marginRate: number;
}

export interface MonthlyReportByType {
  count: number;
  total: number;
}

export interface MonthlyReport {
  period: string;
  totals: MonthlyReportTotals;
  byType: {
    VENTE: MonthlyReportByType;
    ACHAT: MonthlyReportByType;
    DEPENSE: MonthlyReportByType;
    RECETTE: MonthlyReportByType;
  };
  dailyBreakdown: {
    date: string;
    revenue: number;
    expenses: number;
    net: number;
  }[];
  topProducts: {
    articleName: string;
    totalAmount: number;
    count: number;
  }[];
  chargesImpact: {
    totalCharges: number;
    netAfterCharges: number;
  };
}

export interface ReportIndicators {
  marginRate: number;
  grossMargin: number;
  revenueVentes: number;
  costAchats: number;
  recoveryRate: number;
  outstandingDebt: number;
}

interface ApiMonthlyReport {
  period: string;
  totals: {
    revenue: number;
    expenses: number;
    net_balance: number;
    margin_rate: number;
  };
  by_type: Record<
    "VENTE" | "ACHAT" | "DEPENSE" | "RECETTE",
    { count: number; total: number }
  >;
  daily_breakdown: {
    date: string;
    revenue: number;
    expenses: number;
    net: number;
  }[];
  top_products: {
    article_name: string;
    total_amount: number;
    count: number;
  }[];
  charges_impact: {
    total_charges: number;
    net_after_charges: number;
  };
}

interface ApiIndicatorsResponse {
  margin: {
    revenue_ventes: number;
    cost_achats: number;
    gross_margin: number;
    margin_rate: number;
  };
  recovery: {
    total_credit: number;
    total_recovered: number;
    recovery_rate: number;
    outstanding: number;
  };
}

function mapMonthlyReport(data: ApiMonthlyReport): MonthlyReport {
  return {
    period: data.period,
    totals: {
      revenue: data.totals.revenue,
      expenses: data.totals.expenses,
      netBalance: data.totals.net_balance,
      marginRate: data.totals.margin_rate,
    },
    byType: {
      VENTE: data.by_type.VENTE,
      ACHAT: data.by_type.ACHAT,
      DEPENSE: data.by_type.DEPENSE,
      RECETTE: data.by_type.RECETTE,
    },
    dailyBreakdown: data.daily_breakdown.map((day) => ({
      date: day.date,
      revenue: day.revenue,
      expenses: day.expenses,
      net: day.net,
    })),
    topProducts: data.top_products.map((row) => ({
      articleName: row.article_name,
      totalAmount: row.total_amount,
      count: row.count,
    })),
    chargesImpact: {
      totalCharges: data.charges_impact.total_charges,
      netAfterCharges: data.charges_impact.net_after_charges,
    },
  };
}

export async function getMonthlyReport(
  year?: number,
  month?: number,
): Promise<MonthlyReport> {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const data = await apiFetch<ApiMonthlyReport>(
    `/reports/monthly?year=${y}&month=${m}`,
  );
  return mapMonthlyReport(data);
}

export async function getIndicators(
  year?: number,
  month?: number,
): Promise<ReportIndicators> {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const data = await apiFetch<ApiIndicatorsResponse>(
    `/reports/indicators?year=${y}&month=${m}`,
  );
  return {
    marginRate: data.margin.margin_rate,
    grossMargin: data.margin.gross_margin,
    revenueVentes: data.margin.revenue_ventes,
    costAchats: data.margin.cost_achats,
    recoveryRate: data.recovery.recovery_rate,
    outstandingDebt: data.recovery.outstanding,
  };
}

export type { ApiError };
