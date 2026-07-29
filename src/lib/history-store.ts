import type { ExchangeRequest } from "@/types/exchange-request";

const STORAGE_KEY = "crypto-exchanger:requests";
const AUTO_COMPLETE_DELAY_MS = 15_000;

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

function writeAll(requests: ExchangeRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
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
  input: Omit<ExchangeRequest, "id" | "createdAt" | "status">
): ExchangeRequest {
  const request: ExchangeRequest = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const all = readAll();
  all.push(request);
  writeAll(all);

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      updateRequestStatus(request.id, "completed");
    }, AUTO_COMPLETE_DELAY_MS);
  }

  return request;
}

export function updateRequestStatus(id: string, status: ExchangeRequest["status"]): void {
  const all = readAll();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], status };
  writeAll(all);
}
