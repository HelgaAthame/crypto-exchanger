import type { AlertDirection, RateAlert } from "@/lib/alerts";

import { deleteRecord, pushRecord } from "@/lib/sync";

const STORAGE_KEY = "crypto-exchanger:alerts";
const API_PATH = "/api/alerts";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeToAlerts(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getAlertsSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function readAll(): RateAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RateAlert[]) : [];
  } catch {
    return [];
  }
}

function writeAll(alerts: RateAlert[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  notify();
}

export function createAlert(input: {
  giveCurrency: string;
  receiveCurrency: string;
  direction: AlertDirection;
  targetRate: number;
  rateAtCreation: number;
}): RateAlert {
  const alert: RateAlert = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    triggeredAt: null,
  };
  writeAll([...readAll(), alert]);
  pushRecord(API_PATH, alert);
  return alert;
}

export function deleteAlert(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
  deleteRecord(API_PATH, id);
}

export function markTriggered(ids: string[]): void {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  const next = readAll().map((a) => (ids.includes(a.id) ? { ...a, triggeredAt: now } : a));
  writeAll(next);
  for (const alert of next.filter((a) => ids.includes(a.id))) {
    pushRecord(API_PATH, alert);
  }
}
