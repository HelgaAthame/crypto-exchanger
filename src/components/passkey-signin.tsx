"use client";

import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { useT } from "@/lib/i18n/context";

/**
 * Sign in with a passkey, without naming an account first.
 *
 * The button only appears where the browser can actually do it — offering a
 * passkey to a browser that has none, or that does not support WebAuthn, is a
 * dead end dressed up as an option.
 */
export function PasskeySignIn({ onError }: { onError: (key: string) => void }) {
  const t = useT();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAvailable(typeof window !== "undefined" && Boolean(window.PublicKeyCredential));
  }, []);

  if (!available) return null;

  async function signIn() {
    setBusy(true);
    try {
      const optionsRes = await fetch("/api/auth/passkeys/signin/options", {
        method: "POST",
      });
      if (!optionsRes.ok) {
        onError("auth.unavailable");
        return;
      }

      const assertion = await startAuthentication({
        optionsJSON: await optionsRes.json(),
      });

      const verifyRes = await fetch("/api/auth/passkeys/signin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const data = (await verifyRes.json()) as { error?: string };

      if (!verifyRes.ok) {
        onError(data.error ?? "auth.passkeyRejected");
        return;
      }
      // Reload rather than route: the header and guarded pages render against
      // the session cookie that has just been set.
      window.location.assign("/history");
    } catch (error) {
      // Cancelling the browser prompt lands here and is not a failure worth
      // shouting about.
      const name = (error as { name?: string })?.name;
      if (name !== "NotAllowedError" && name !== "AbortError") {
        onError("auth.passkeyRejected");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className="sheen-border inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-accent hover:shadow-md hover:shadow-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
    >
      <Fingerprint className="size-4" aria-hidden />
      {t("auth.passkeySignIn")}
    </button>
  );
}
