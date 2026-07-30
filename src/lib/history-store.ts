import type {
  ExchangeRequest,
  ExchangeStage,
  ExchangeStep,
  PaymentDetails,
  PaymentMethod,
} from "@/types/exchange-request";

const STORAGE_KEY = "crypto-exchanger:requests";

function readAll(): ExchangeRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExchangeRequest[];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** Lets components subscribe via `useSyncExternalStore` instead of polling. */
export function subscribeToRequests(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other tabs in sync too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Raw serialised form — a stable string, so snapshots compare by value. */
export function getRequestsSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function writeAll(requests: ExchangeRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  notify();
}

export function getAllRequests(): ExchangeRequest[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getRequestById(id: string): ExchangeRequest | undefined {
  return readAll().find((r) => r.id === id);
}

export function createRequest(
  input: Omit<ExchangeRequest, "id" | "createdAt" | "status" | "step">
): ExchangeRequest {
  const request: ExchangeRequest = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    step: "method",
  };
  const all = readAll();
  all.push(request);
  writeAll(all);
  return request;
}

function patchRequest(id: string, patch: Partial<ExchangeRequest>): void {
  const all = readAll();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], ...patch };
  writeAll(all);
}

export function setPaymentMethod(id: string, paymentMethod: PaymentMethod): void {
  patchRequest(id, { paymentMethod });
}

export function setPaymentDetails(id: string, paymentDetails: PaymentDetails): void {
  patchRequest(id, { paymentDetails });
}

export function setStep(id: string, step: ExchangeStep): void {
  patchRequest(id, { step });
}

export function setStage(id: string, stage: ExchangeStage): void {
  patchRequest(id, {
    stage,
    status: stage === "completed" ? "completed" : "pending",
  });
}

/** Looks like an on-chain hash but is random — nothing settles on any chain. */
export function generateDemoTxHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function startProcessing(id: string): void {
  patchRequest(id, {
    step: "status",
    stage: "awaiting-payment",
    txHash: generateDemoTxHash(),
  });
}
