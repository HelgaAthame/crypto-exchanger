"use client";

/**
 * Mirrors local records into the database, when there is one.
 *
 * The design keeps `localStorage` as the source of truth the UI reads, and
 * treats the server as a copy that outlives the browser cache. That choice is
 * deliberate: it means every screen still renders instantly and offline, the
 * app behaves identically with an empty environment, and a failed request can
 * never leave the user staring at a spinner over data they already have.
 *
 * The trade is that two devices can diverge. With anonymous sessions there is
 * no identity to merge them under, so on load the server's rows are pulled in
 * and merged by id, newest write winning — enough to survive a cleared cache,
 * honest about not being real multi-device sync.
 */

/** Set once the first call sees a 501, so we stop asking on every write. */
let persistenceDisabled = false;

async function send(path: string, init: RequestInit): Promise<boolean> {
  if (persistenceDisabled) return false;
  try {
    const res = await fetch(path, init);
    if (res.status === 501) {
      persistenceDisabled = true;
      return false;
    }
    return res.ok;
  } catch {
    // Offline or a transient failure: the local copy is already correct.
    return false;
  }
}

export function pushRecord(path: string, record: unknown): void {
  // Fire and forget: the UI has already updated from localStorage.
  void send(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}

export function deleteRecord(path: string, id: string): void {
  void send(`${path}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function pullRecords<T>(path: string, key: string): Promise<T[] | null> {
  if (persistenceDisabled) return null;
  try {
    const res = await fetch(path);
    if (res.status === 501) {
      persistenceDisabled = true;
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, T[]>;
    return data[key] ?? null;
  } catch {
    return null;
  }
}

/**
 * Merges server rows into local ones by id. Local wins on conflict, because
 * the local copy is what the user has been interacting with in this tab.
 */
export function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map(remote.map((item) => [item.id, item]));
  for (const item of local) byId.set(item.id, item);
  return [...byId.values()];
}

type StoreSpec = { path: string; key: string; storageKey: string };

const STORES: StoreSpec[] = [
  { path: "/api/requests", key: "requests", storageKey: "crypto-exchanger:requests" },
  { path: "/api/alerts", key: "alerts", storageKey: "crypto-exchanger:alerts" },
  { path: "/api/recurring", key: "plans", storageKey: "crypto-exchanger:recurring" },
  {
    path: "/api/limit-orders",
    key: "orders",
    storageKey: "crypto-exchanger:limit-orders",
  },
];

function readLocal<T>(storageKey: string): T[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Pulls each store's server rows in and merges them into local storage.
 *
 * Writing a merged value back fires a `storage` event in other tabs, and the
 * screens already subscribe to that, so nothing else has to be notified.
 */
export async function hydrateFromServer(): Promise<void> {
  if (typeof window === "undefined") return;

  for (const { path, key, storageKey } of STORES) {
    const remote = await pullRecords<{ id: string }>(path, key);
    // A null answer means no database, or a failure — either way, leave local
    // storage alone rather than clearing what the user can see.
    if (!remote) continue;

    const local = readLocal<{ id: string }>(storageKey);
    const merged = mergeById(local, remote);
    if (merged.length === local.length && remote.length === 0) continue;

    window.localStorage.setItem(storageKey, JSON.stringify(merged));
    window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
  }
}
