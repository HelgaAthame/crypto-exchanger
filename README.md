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

- Operation switcher — **Buy** (fiat → crypto), **Sell** (crypto → fiat),
  **Swap** (crypto → crypto) and **Exchange** (fiat → fiat) — as a segmented
  control that narrows both currency lists to the pair the mode allows
- Currency pair selector: fiat ↔ crypto, crypto ↔ crypto (4 fiat, 6 crypto)
- Live exchange rate, fetched from public APIs (CoinGecko for crypto, Frankfurter
  for fiat), cross-computed through a USD bridge
- Transparent fee breakdown (exchanger fee shown separately from market rate)
- Rate history chart for the selected pair (7 / 30 / 90 days) with a crosshair
  tooltip and a table view of the same data
- `/rates` page listing every supported currency with its USD price and 24h change
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
  with its USD price and 24h change, for the header ticker and `/rates`.
- `src/app/api/history/route.ts` + `src/lib/rate-history.ts` —
  `GET /api/history?from=X&to=Y&days=7|30|90`. `buildCrossSeries` is a pure
  function (unit-tested) that divides two "USD per unit" series, treats USD as a
  constant 1, and keeps only days present on both sides — fiat has no weekend
  quotes, so an unmatched day has no defensible rate.
- `src/components/rates-ticker.tsx`, `src/components/currency-icon.tsx` — the
  scrolling ticker and its inline (no external assets) coin icons.
- `src/lib/operations.ts` — pure operation-mode rules (`kindsForMode`,
  `defaultPairForMode`, `invertMode`), unit-tested. Swapping the sides of a Buy
  flips the mode to Sell, so the control always matches the pair.
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

## Accessibility

Built to **WCAG 2.2 level AA** (which includes all level A criteria). The parts
that needed deliberate work:

- **2.2.2 Pause, Stop, Hide** — the rates ticker auto-scrolls for longer than
  five seconds, so it has a real pause button. Hover-to-pause alone fails this,
  since it is unreachable by keyboard and touch.
- **2.2.1 Timing Adjustable** — the rate-lock and deposit countdowns can be
  extended or restarted, so an expired timer never strands the user.
- **1.4.3 / 1.4.11 Contrast** — token values were picked by measuring ratios,
  not by eye. The light-theme gold was darkened to `#8a6413` to clear 4.5:1 as
  body text, gradient headings use dark-only stops in light mode, form controls
  use a dedicated `--control-border` that meets 3:1, and success/danger colours
  differ per theme.
- **2.4.1 Bypass Blocks** — a "Skip to main content" link, visible on focus.
- **2.4.7 Focus Visible** — every interactive element has a gold focus ring.
- **2.4.2 Page Titled** — per-route titles via the metadata template.
- **3.3.1 Error Identification** — form errors are announced with `role="alert"`
  and wired to their field via `aria-invalid` / `aria-describedby`.
- **1.4.1 Use of Color** — 24h movement, statuses and steps all carry an icon or
  text label alongside colour.
- **4.1.2 Name, Role, Value** — the operation switcher is a real `tablist`, the
  payment methods a `radiogroup`, and the active nav item carries `aria-current`.
- `prefers-reduced-motion` disables the ticker scroll, entrance animations and
  hover lifts.

### The chart

The rate history chart is hand-rolled SVG rather than a charting library, which
keeps the bundle small and the marks exactly to spec: a single series (so no
legend — the heading names it), a 2px line over a 10%-opacity wash, solid
hairline gridlines one step off the surface, one direct label at the end point,
and a crosshair that snaps to the nearest day. Range presets sit in one row above
the plot, refetches hold the previous render at reduced opacity instead of
flashing a skeleton, and a table view exposes every value without hovering. Line
colours were checked with the dataviz palette validator against each theme's
surface, and dark mode uses its own step rather than a flipped light one.

### Custom select

Native `<select>` is drawn by the OS and cannot be styled to match the rest of
the form, so `src/components/ui/select-menu.tsx` implements the listbox pattern
instead: the trigger reuses the input styling and shows the currency icon, and
the popup is a styled card. It keeps the native keyboard contract — arrows,
Home/End, Enter/Space, Escape, and character type-ahead — with focus staying on
the trigger and the active option announced via `aria-activedescendant`.

### Breadcrumbs

`src/components/breadcrumbs.tsx` renders both a visible
`<nav aria-label="Breadcrumb">` trail (current page marked `aria-current="page"`
and not linked) and a schema.org **`BreadcrumbList` in JSON-LD**, the format
Google recommends for breadcrumb rich results. Absolute URLs come from
`NEXT_PUBLIC_SITE_URL` when set.

## Error and loading states

- `src/app/not-found.tsx` — branded 404 with routes back into the app.
- `src/app/error.tsx` — route-level error boundary with a retry action; it names
  third-party rate limits as the likely cause, since that is the realistic
  failure here.
- `src/app/global-error.tsx` — fallback for failures in the root layout itself,
  with inline styles because the normal shell is unavailable at that point.
- `src/app/loading.tsx` — shared route loading state.

Requests saved before the checkout flow existed are migrated on read
(`normalizeRequest`) — without that, their missing `step` produced
`/exchange/<id>/undefined` links.

## Deployment

Deploy target is Vercel (free tier). No environment variables are required — the
rate providers (CoinGecko, Frankfurter) are used without API keys.
