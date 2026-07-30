# Crypto Exchanger

A portfolio demo project: a fiat/crypto exchange rate calculator with live rates
and simulated exchange requests.

> **Demo project — no real funds are transferred.** Rates are live (public APIs),
> but there is no integration with real payment providers or crypto wallets.
> Exchange requests are simulated for demonstration purposes only.

## What this is

Crypto Exchanger lets a user pick a currency to give and a currency to receive
(fiat → crypto, crypto → fiat, or crypto → crypto), enter an amount, and see the
live exchange rate together with the exchanger's fee and the resulting amount.
The user can then create a demo exchange request, which is stored locally in the
browser and automatically moves from "pending" to "completed" after a short delay
to simulate a real exchange flow.

**Problem:** rates are scattered across many sites/exchanges; there's no single
convenient calculator with request history.

**Solution:** one screen — pick currencies, see the live rate and resulting
amount, create a request, track it.

**My role:** solo — product, design, full stack.

This is **not** a real, working crypto exchange business. It intentionally has no
KYC/AML, no real payment integration, and no custody of funds — building that
would require regulatory licensing in the real world. It's a technical
demonstration of a converter/exchange UX and domain logic.

## Features

- Currency pair selector: fiat ↔ crypto, crypto ↔ crypto (4 fiat, 6 crypto)
- Live exchange rate, fetched from public APIs (CoinGecko for crypto, Frankfurter
  for fiat), cross-computed through a USD bridge
- Transparent fee breakdown (exchanger fee shown separately from market rate)
- Live rates ticker under the header: continuously scrolling pills with per-coin
  icons, USD price and 24h change, fed by the same real rate providers and
  refreshed every 60s
- Multi-step simulated checkout: payment method → details → confirmation →
  method-specific authorisation (3-D Secure style OTP for cards, deposit screen
  for crypto) → animated status tracker
- Demo exchange requests, stored in `localStorage` (no backend/database)
- Request history page

## Checkout flow

After the calculator creates a request, the user walks through real checkout
steps. Which steps appear depends on the chosen payment method:

| Method | Steps |
|---|---|
| Card | method → details → confirm → OTP → status |
| Bank transfer | method → details → confirm → status |
| Crypto deposit | method → details → confirm → deposit → status |
| Demo balance | method → confirm → status |

**Step order is enforced by the request itself, not the URL.** Each request
carries a `step` field; `resolveStepAccess` in `src/lib/checkout-flow.ts`
compares the requested step against it and redirects if the user tries to skip
ahead, while still allowing them to go back and change an earlier answer. That
field is also what a future database schema would persist.

The status page then walks a simulated pipeline — `awaiting payment → payment
received → exchanging → sending → completed` — with a randomly generated
transaction hash.

### Why nothing can actually be paid

The flow is designed to look real while making a real transfer impossible:

- No payment provider is contacted; nothing entered leaves the browser.
- The card number is fixed to the public `4242…` test number and cannot be
  edited; only the last four digits are stored, never a CVC.
- Crypto deposit addresses are deliberately malformed (`DEMO-…` prefix), so no
  wallet will accept them as a destination.
- The deposit QR is a decorative placeholder, not an encoded payment URI — it is
  not scannable by design.
- The IBAN shown for bank transfers belongs to no real account.
- Every checkout step carries its own "no real payment is processed" notice on
  top of the site-wide demo banner.
- Light/dark theme, gold-on-black brand styling
- Demo banner communicating the non-real nature of the project

## Brand and design

The visual identity is built around the project's gold "E-in-a-loop" mark:

- `public/logo/logo-mark.png|svg` — icon-only mark, transparent background,
  derived from the original render by using per-pixel brightness as an alpha
  channel (keeps the metallic gradient instead of flattening it to vector paths).
- `public/logo/logo-full.png|svg` — full lockup with the "CRYPTO EXCHANGER"
  wordmark.
- `src/app/favicon.ico` — generated from the mark, tightly cropped with no empty
  padding, at 16/32/48/64px with a saturation lift so it stays legible when small.

Design tokens live in `src/app/globals.css`: a gold accent scale
(`--gold-dark/mid/light`) applied over a near-black dark theme and a warm light
theme, plus `.gold-text` / `.gold-surface` helpers for gradient text and the
primary CTA. The landing page uses a two-column hero (copy and highlights on the
left, calculator card on the right) so wide screens don't leave empty gutters.
Interactive elements share one animation language: lift on hover, press down on
active, gold focus ring for keyboard users, and everything decorative disabled
under `prefers-reduced-motion`.

See `PLAN.md` sections 12–13 for the full brand/design specification.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Theme | next-themes |
| Icons | lucide-react |
| Validation | zod-ready domain layer (see below) |
| Data storage | `localStorage` only — no database or auth on this MVP |
| Rate sources | CoinGecko (crypto→USD), Frankfurter (fiat→USD) |
| Tests | Vitest, 100% coverage on domain logic |
| Deploy target | Vercel |

No database, ORM, or authentication in this iteration — deliberately, to keep the
MVP small. See `PLAN.md` for the possible next iteration (persistent history via
Postgres/Supabase).

## Architecture

- `src/lib/exchange-calc.ts` — pure domain functions: `computeExchangeAmount`,
  `computeCrossRate`, `validateExchangeRequest`. No side effects, 100% test
  coverage (`src/lib/__tests__`).
- `src/lib/currencies.ts` — supported currency list (4 fiat, 6 crypto). Fiat codes
  are limited to ones Frankfurter still publishes.
- `src/lib/rates/providers.ts` + `src/lib/rates/cache.ts` — server-side rate
  fetching with a 60s in-memory cache, to avoid hitting provider rate limits and
  to keep the client decoupled from the rate provider.
- `src/app/api/rates/route.ts` — Route Handler that exposes
  `GET /api/rates?from=X&to=Y` → `{ rate, updatedAt }`.
- `src/app/api/ticker/route.ts` — `GET /api/ticker` → every supported currency
  with its USD price and 24h change, for the header ticker.
- `src/components/rates-ticker.tsx`, `src/components/currency-icon.tsx` — the
  scrolling ticker and its inline (no external assets) coin icons.
- `src/lib/checkout-flow.ts` — pure step-machine logic (`stepsForMethod`,
  `nextStep`, `resolveStepAccess`), fully unit-tested.
- `src/lib/history-store.ts` — `localStorage`-backed CRUD for exchange requests,
  exposed to components through `src/lib/use-requests.ts` (`useSyncExternalStore`,
  so screens update on change instead of polling).
- `src/components/checkout/` — shared checkout chrome: step guard/shell, progress
  indicator, and the deliberately non-scannable demo QR.
- `src/components/exchange-calculator.tsx` — the main calculator UI.
- `src/app/exchange/[id]/page.tsx`, `src/app/history/page.tsx` — request detail
  and history screens.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build          # production build
npm run start           # run production build
npm run lint             # eslint
npm test                  # vitest (watch mode)
npm run test:run          # vitest, single run
npm run test:coverage     # vitest with coverage (100% required on src/lib)
```

## Testing approach

The domain logic (rate/fee/cross-rate calculation, request validation and the
checkout step machine) is covered at 100% with Vitest — this is the core of the app and the part worth
guaranteeing correctness for. UI components and API routes are a thin layer on
top and are intentionally left out of the coverage requirement.

## Deployment

Deploy target is Vercel (free tier). No environment variables are required — the
rate providers (CoinGecko, Frankfurter) are used without API keys.
