"use client";

import { useSyncExternalStore } from "react";
import { getRequestsSnapshot, subscribeToRequests } from "@/lib/history-store";
import type { ExchangeRequest } from "@/types/exchange-request";

function parse(raw: string): ExchangeRequest[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ExchangeRequest[];
  } catch {
    return [];
  }
}

/** `null` while the store has not been read on the client yet. */
function useRawSnapshot(): string | null {
  return useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    () => null // Server render: localStorage does not exist yet.
  );
}

export function useAllRequests(): ExchangeRequest[] | null {
  const raw = useRawSnapshot();
  if (raw === null) return null;
  return parse(raw).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** `undefined` while loading, `null` when no such request exists. */
export function useRequest(id: string): ExchangeRequest | null | undefined {
  const raw = useRawSnapshot();
  if (raw === null) return undefined;
  return parse(raw).find((r) => r.id === id) ?? null;
}
