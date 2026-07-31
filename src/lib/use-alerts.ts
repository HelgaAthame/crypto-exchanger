"use client";

import { useSyncExternalStore } from "react";
import { getAlertsSnapshot, subscribeToAlerts } from "@/lib/alerts-store";
import type { RateAlert } from "@/lib/alerts";

function parse(raw: string): RateAlert[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RateAlert[];
  } catch {
    return [];
  }
}

/** `null` until the store has been read on the client. */
export function useAlerts(): RateAlert[] | null {
  const raw = useSyncExternalStore(
    subscribeToAlerts,
    getAlertsSnapshot,
    () => null // No localStorage during the server render.
  );
  if (raw === null) return null;
  return parse(raw).sort((a, b) => {
    // Waiting alerts first, newest within each group.
    if ((a.triggeredAt === null) !== (b.triggeredAt === null)) {
      return a.triggeredAt === null ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
