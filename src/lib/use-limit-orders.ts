"use client";

import { useSyncExternalStore } from "react";
import { getOrdersSnapshot, subscribeToOrders } from "@/lib/limit-orders-store";
import type { LimitOrder } from "@/lib/limit-orders";

function parse(raw: string): LimitOrder[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LimitOrder[];
  } catch {
    return [];
  }
}

/** `null` until the store has been read on the client. */
export function useLimitOrders(): LimitOrder[] | null {
  const raw = useSyncExternalStore(subscribeToOrders, getOrdersSnapshot, () => null);
  if (raw === null) return null;
  return parse(raw).sort((a, b) => {
    // Open orders first — they are the ones still waiting on the market.
    if ((a.status === "open") !== (b.status === "open")) {
      return a.status === "open" ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
