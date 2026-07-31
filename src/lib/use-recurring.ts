"use client";

import { useSyncExternalStore } from "react";
import { getPlansSnapshot, subscribeToPlans } from "@/lib/recurring-store";
import type { RecurringPlan } from "@/lib/recurring";

function parse(raw: string): RecurringPlan[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecurringPlan[];
  } catch {
    return [];
  }
}

/** `null` until the store has been read on the client. */
export function useRecurringPlans(): RecurringPlan[] | null {
  const raw = useSyncExternalStore(subscribeToPlans, getPlansSnapshot, () => null);
  if (raw === null) return null;
  return parse(raw).sort((a, b) => {
    // Active plans first, newest within each group.
    if (a.paused !== b.paused) return a.paused ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
