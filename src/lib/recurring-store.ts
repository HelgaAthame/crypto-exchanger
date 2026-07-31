import type { Cadence, RecurringPlan } from "@/lib/recurring";

import { deleteRecord, pushRecord } from "@/lib/sync";

const STORAGE_KEY = "crypto-exchanger:recurring";
const API_PATH = "/api/recurring";

const listeners = new Set<() => void>();

export function subscribeToPlans(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getPlansSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function readAll(): RecurringPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecurringPlan[]) : [];
  } catch {
    return [];
  }
}

function writeAll(plans: RecurringPlan[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  for (const listener of listeners) listener();
}

export function createPlan(input: {
  giveCurrency: string;
  receiveCurrency: string;
  amount: number;
  cadence: Cadence;
  startsAt: string;
}): RecurringPlan {
  const plan: RecurringPlan = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    paused: false,
  };
  writeAll([...readAll(), plan]);
  pushRecord(API_PATH, plan);
  return plan;
}

export function deletePlan(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
  deleteRecord(API_PATH, id);
}

export function togglePlan(id: string): void {
  const next = readAll().map((p) => (p.id === id ? { ...p, paused: !p.paused } : p));
  writeAll(next);
  const updated = next.find((p) => p.id === id);
  if (updated) pushRecord(API_PATH, updated);
}
