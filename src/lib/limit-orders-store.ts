import type { AlertDirection } from "@/lib/alerts";
import type { LimitOrder } from "@/lib/limit-orders";
import { deleteRecord, pushRecord } from "@/lib/sync";

const STORAGE_KEY = "crypto-exchanger:limit-orders";
const API_PATH = "/api/limit-orders";

const listeners = new Set<() => void>();

export function subscribeToOrders(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getOrdersSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function readAll(): LimitOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LimitOrder[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: LimitOrder[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  for (const listener of listeners) listener();
}

export function createOrder(input: {
  giveCurrency: string;
  receiveCurrency: string;
  giveAmount: number;
  targetRate: number;
  direction: AlertDirection;
  rateAtCreation: number;
}): LimitOrder {
  const order: LimitOrder = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "open",
    filledAt: null,
    filledRate: null,
  };
  writeAll([...readAll(), order]);
  pushRecord(API_PATH, order);
  return order;
}

export function cancelOrder(id: string): void {
  const next = readAll().map((o) =>
    o.id === id && o.status === "open" ? { ...o, status: "cancelled" as const } : o
  );
  writeAll(next);
  const updated = next.find((o) => o.id === id);
  if (updated) pushRecord(API_PATH, updated);
}

export function deleteOrder(id: string): void {
  writeAll(readAll().filter((o) => o.id !== id));
  deleteRecord(API_PATH, id);
}

/** Records a fill at the rate the market was actually at when it triggered. */
export function fillOrders(fills: { id: string; rate: number }[]): void {
  if (fills.length === 0) return;
  const now = new Date().toISOString();
  const byId = new Map(fills.map((f) => [f.id, f.rate]));

  const next = readAll().map((order) =>
    byId.has(order.id) && order.status === "open"
      ? {
          ...order,
          status: "filled" as const,
          filledAt: now,
          filledRate: byId.get(order.id) ?? order.targetRate,
        }
      : order
  );
  writeAll(next);
  for (const order of next.filter((o) => byId.has(o.id))) pushRecord(API_PATH, order);
}
