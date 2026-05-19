import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import * as authService from "@/services/auth.service";
import { clearTokens, getRefreshToken } from "@/utils/tokenStorage";

export type ActivityType =
  | "commerce"
  | "mecanique"
  | "restauration"
  | "beaute"
  | "autre";
export type OperationType = "VENTE" | "ACHAT" | "DEPENSE" | "RECETTE";
export type PaymentMode = "CASH" | "DETTE";
export type PlanType = "free" | "pro";

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  boutiqueName: string;
  address?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  activityType: ActivityType;
  plan: PlanType;
  isVerified?: boolean;
  isActive?: boolean;
  workHoursStart?: string | null;
  workHoursEnd?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Operation {
  id: string;
  type: OperationType;
  itemName: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  paymentMode: PaymentMode;
  dueDate?: string;
  comment?: string;
  description?: string | null;
  date: string;
  supplierName?: string | null;
  productId?: string | null;
  receiptUrl?: string | null;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stockQty: number;
  alertThreshold: number;
  isActive?: boolean;
  marginRate?: number | null;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  outstandingBalance: number;
  totalPurchases: number;
  visits: Visit[];
}

export interface Visit {
  id: string;
  clientId: string;
  visitDate: string;
  amount: number;
  status: "PAID" | "CREDIT" | "LATE";
  dueDate?: string;
  notes?: string;
}

export interface FixedCharge {
  id: string;
  label: string;
  amount: number;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  nextDueDate: string;
  icon: string;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  operations: Operation[];
  products: Product[];
  clients: Client[];
  charges: FixedCharge[];
  login: (identifier: string, password: string) => Promise<void>;
  logout: (refreshToken?: string) => Promise<void>;
  setUser: (u: User) => void;
  setOperations: (ops: Operation[]) => void;
  setProducts: (products: Product[]) => void;
  setClients: (clients: Client[]) => void;
  setCharges: (charges: FixedCharge[]) => void;
  addOperation: (op: Operation | Omit<Operation, "id">) => void;
  replaceOperation: (op: Operation) => void;
  removeOperation: (id: string) => void;
  addProduct: (p: Product | Omit<Product, "id">) => void;
  updateProductStock: (id: string, delta: number) => void;
  addClient: (
    c: Omit<Client, "id" | "outstandingBalance" | "totalPurchases" | "visits">,
  ) => void;
  addCharge: (c: Omit<FixedCharge, "id">) => void;
  upgradeToPro: () => void;
  getDayBalance: () => number;
  getDayRevenue: () => number;
  getDayExpenses: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operations, setOperationsState] = useState<Operation[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [charges, setChargesState] = useState<FixedCharge[]>([]);

  useEffect(() => {
    async function checkExistingSession(): Promise<void> {
      try {
        setIsLoading(true);
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return;

        const profile = await authService.getProfile();
        setUserState(profile);
        setIsAuthenticated(true);
      } catch {
        await clearTokens();
        setUserState(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkExistingSession();
  }, []);

  async function login(identifier: string, password: string): Promise<void> {
    const auth = await authService.login(identifier, password);
    setUserState(auth.user);
    setIsAuthenticated(true);
  }

  async function logout(refreshToken = ""): Promise<void> {
    try {
      await authService.logout(refreshToken);
    } finally {
      setUserState(null);
      setIsAuthenticated(false);
      setOperationsState([]);
      setProductsState([]);
      setClientsState([]);
      setChargesState([]);
    }
  }

  function setUser(u: User): void {
    setUserState(u);
    setIsAuthenticated(true);
  }

  const setOperations = useCallback((ops: Operation[]): void => {
    setOperationsState(ops);
  }, []);

  const setProducts = useCallback((nextProducts: Product[]): void => {
    setProductsState(nextProducts);
  }, []);

  const setClients = useCallback((nextClients: Client[]): void => {
    setClientsState(nextClients);
  }, []);

  const setCharges = useCallback((nextCharges: FixedCharge[]): void => {
    setChargesState(nextCharges);
  }, []);

  function addOperation(op: Operation | Omit<Operation, "id">): void {
    const nextOperation: Operation =
      "id" in op ? op : { ...op, id: Date.now().toString() };
    setOperationsState((prev) => [nextOperation, ...prev]);
  }

  function replaceOperation(op: Operation): void {
    setOperationsState((prev) =>
      prev.map((existing) => (existing.id === op.id ? op : existing)),
    );
  }

  function removeOperation(id: string): void {
    setOperationsState((prev) => prev.filter((op) => op.id !== id));
  }

  function addProduct(p: Product | Omit<Product, "id">): void {
    const nextProduct: Product =
      "id" in p ? p : { ...p, id: Date.now().toString() };
    setProductsState((prev) => [nextProduct, ...prev]);
  }

  function updateProductStock(id: string, delta: number): void {
    setProductsState((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stockQty: Math.max(0, p.stockQty + delta) } : p,
      ),
    );
  }

  function addClient(
    c: Omit<Client, "id" | "outstandingBalance" | "totalPurchases" | "visits">,
  ): void {
    setClientsState((prev) => [
      {
        ...c,
        id: Date.now().toString(),
        outstandingBalance: 0,
        totalPurchases: 0,
        visits: [],
      },
      ...prev,
    ]);
  }

  function addCharge(c: Omit<FixedCharge, "id">): void {
    setChargesState((prev) => [...prev, { ...c, id: Date.now().toString() }]);
  }

  function upgradeToPro(): void {
    if (user) setUserState({ ...user, plan: "pro" });
  }

  const today = new Date().toISOString().split("T")[0];
  const todayOps = operations.filter((op) => op.date.startsWith(today));

  function getDayRevenue(): number {
    return todayOps
      .filter((o) => o.type === "VENTE" || o.type === "RECETTE")
      .reduce((s, o) => s + o.amount, 0);
  }

  function getDayExpenses(): number {
    return todayOps
      .filter((o) => o.type === "ACHAT" || o.type === "DEPENSE")
      .reduce((s, o) => s + o.amount, 0);
  }

  function getDayBalance(): number {
    return getDayRevenue() - getDayExpenses();
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        operations,
        products,
        clients,
        charges,
        login,
        logout,
        setUser,
        setOperations,
        setProducts,
        setClients,
        setCharges,
        addOperation,
        replaceOperation,
        removeOperation,
        addProduct,
        updateProductStock,
        addClient,
        addCharge,
        upgradeToPro,
        getDayBalance,
        getDayRevenue,
        getDayExpenses,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
