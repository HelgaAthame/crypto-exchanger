"use client";

import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";

type Passkey = {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Add and remove passkeys for the signed-in account.
 *
 * Renders nothing at all when there is no session or no database: this sits on
 * a page that anonymous visitors can still reach in a deployment without
 * accounts, and an empty security panel there would just be confusing.
 */
export function PasskeyManager() {
  const t = useT();
  const [keys, setKeys] = useState<Passkey[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/passkeys/list");
    if (!res.ok) {
      setSignedIn(false);
      return;
    }
    const data = (await res.json()) as { passkeys: Passkey[] };
    setSignedIn(true);
    setKeys(data.passkeys);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!signedIn || !keys) return null;

  async function add() {
    setBusy(true);
    setErrorKey(null);
    try {
      const optionsRes = await fetch("/api/auth/passkeys/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) {
        setErrorKey("auth.unavailable");
        return;
      }

      const attestation = await startRegistration({
        optionsJSON: await optionsRes.json(),
      });

      const verifyRes = await fetch("/api/auth/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      if (!verifyRes.ok) {
        const data = (await verifyRes.json()) as { error?: string };
        setErrorKey(data.error ?? "auth.passkeyRejected");
        return;
      }
      await load();
    } catch (error) {
      // A cancelled prompt is a decision, not an error.
      const name = (error as { name?: string })?.name;
      if (name !== "NotAllowedError" && name !== "AbortError") {
        setErrorKey("auth.passkeyRejected");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/auth/passkeys/list?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
    setBusy(false);
  }

  return (
    <section className="mb-7 rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Fingerprint className="size-5 text-accent" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold">{t("auth.passkeysTitle")}</h2>
            <p className="text-xs text-muted">{t("auth.passkeysSubtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-45"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("auth.passkeyAdd")}
        </button>
      </div>

      {errorKey && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {t(errorKey)}
        </p>
      )}

      {keys.length === 0 ? (
        <p className="mt-4 text-xs text-muted">{t("auth.passkeysEmpty")}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5"
            >
              <span className="text-xs font-medium">{key.label ?? "Passkey"}</span>
              <span className="text-xs text-muted">
                {t("auth.passkeyAdded")} {formatDate(key.createdAt)}
                {key.lastUsedAt
                  ? ` · ${t("auth.passkeyUsed")} ${formatDate(key.lastUsedAt)}`
                  : ""}
              </span>
              <button
                type="button"
                onClick={() => remove(key.id)}
                disabled={busy}
                aria-label={`${t("auth.passkeyRemove")}: ${key.label ?? "Passkey"}`}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-45"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
