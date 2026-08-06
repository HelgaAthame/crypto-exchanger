"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LogIn, ShieldAlert, UserPlus } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { OAuthButtons } from "@/components/oauth-buttons";
import { useT } from "@/lib/i18n/context";

type Mode = "sign-in" | "sign-up";

function LoginForm() {
  const t = useT();
  const searchParams = useSearchParams();
  // Where the visitor was heading when they were asked to sign in.
  const next = searchParams.get("next") ?? "/history";
  // The OAuth callback cannot render a message, so it reports failures via the URL.
  const callbackError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(callbackError);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrorKey(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mode }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErrorKey(data.error ?? "auth.failed");
        return;
      }
      // Full reload: the header and the protected pages are server-rendered
      // against the session cookie, so a client transition would show stale
      // signed-out markup.
      window.location.assign(next);
    } catch {
      setErrorKey("auth.failed");
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = mode === "sign-up";

  return (
    <PageContainer className="pb-20 pt-16">
      <div className="mx-auto max-w-md">
        <div className="surface-card rise-in rounded-3xl p-6 sm:p-8">
          <Image
            src="/logo/logo-mark.png"
            alt=""
            width={44}
            height={44}
            className="mx-auto"
          />
          <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight">
            {t(isSignUp ? "auth.signUpTitle" : "auth.signInTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted">
            {t(isSignUp ? "auth.signUpSubtitle" : "auth.signInSubtitle")}
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {t("auth.email")}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorKey(null);
                }}
                placeholder="you@example.com"
                aria-invalid={errorKey ? true : undefined}
                className="w-full rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {t("auth.password")}
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorKey(null);
                }}
                aria-invalid={errorKey ? true : undefined}
                aria-describedby={errorKey ? "auth-error" : "auth-hint"}
                className="w-full rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>

            {errorKey ? (
              <p id="auth-error" role="alert" className="text-xs text-danger">
                {t(errorKey)}
              </p>
            ) : (
              <p id="auth-hint" className="text-xs text-muted">
                {t("auth.passwordHint")}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="gold-surface sheen mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
            >
              {isSignUp ? (
                <UserPlus className="size-4" aria-hidden />
              ) : (
                <LogIn className="size-4" aria-hidden />
              )}
              {t(isSignUp ? "auth.signUp" : "auth.signIn")}
            </button>
          </form>

          <OAuthButtons />

          <p className="mt-5 text-center text-sm text-muted">
            {t(isSignUp ? "auth.haveAccount" : "auth.noAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setErrorKey(null);
              }}
              className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {t(isSignUp ? "auth.signIn" : "auth.signUp")}
            </button>
          </p>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("auth.demoNotice")}
        </p>
      </div>
    </PageContainer>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
