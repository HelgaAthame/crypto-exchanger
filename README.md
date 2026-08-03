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
- Amount can be entered on either side — type what you pay or what you want to
  receive, and the other side is derived
- Live exchange rate, fetched from public APIs (CoinGecko for crypto, Frankfurter
  for fiat), cross-computed through a USD bridge
- Transparent fee breakdown (exchanger fee shown separately from market rate)
- Rate history chart for the selected pair (7 / 30 / 90 days) with a crosshair
  tooltip and a table view of the same data
- `/rates` page listing every supported currency with its USD price and 24h change
- Rate alerts — "notify me when 1 BTC is above X" — checked in the browser and
  surfaced in-app on `/alerts`
- Live rates ticker under the header: continuously scrolling pills with per-coin
  icons, USD price and 24h change, fed by the same real rate providers and
  refreshed every 60s
- Multi-step simulated checkout: payment method → details → confirmation →
  method-specific authorisation (3-D Secure style OTP for cards, deposit screen
  for crypto) → animated status tracker
- Demo exchange requests, kept in `localStorage` and mirrored to Postgres when a
  database is configured
- Request history page
- Recurring buy plans — a standing schedule shown with its next run date and
  90-day projection, on `/recurring`
- English and Russian, with a language switch in the header
- Light/dark theme, gold-on-black brand styling
- Demo banner communicating the non-real nature of the project

## Screens

| Route | What it does |
|---|---|
| `/` | Calculator: operation switcher, currency pair, two-way amount entry, fee breakdown, rate history chart |
| `/rates` | Every supported currency with its USD price and 24h change |
| `/rates/[code]` | One currency: price, 24h change, history chart, cross-rates, alert form, deep links into the calculator |
| `/alerts` | Rate alerts, waiting ones first |
| `/recurring` | Recurring buy plans with next run dates and projected spend |
| `/history` | Demo exchange requests from this browser |
| `/exchange/[id]` | Request status, walking the simulated pipeline |
| `/exchange/[id]/{method,details,confirm,otp,deposit}` | Checkout steps, gated by the request's own `step` field |

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

Photography in `public/photos/` is desaturated and gold-tinted through the
`.hero-photo` / `.photo-band` filters rather than shown as shot — crypto stock
imagery is overwhelmingly blue, which would fight the gold identity on every
other surface. Photos always sit under a scrim, so no headline or paragraph
depends on how bright the picture behind it happens to be.

See `PLAN.md` sections 12–13 for the full brand/design specification.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Theme | next-themes |
| Icons | lucide-react |
| Validation | zod |
| Data storage | `localStorage`, mirrored to Neon Postgres when `DATABASE_URL` is set |
| ORM | Drizzle |
| Rate sources | CoinGecko (crypto→USD), Frankfurter (fiat→USD) |
| Tests | Vitest, 100% coverage on domain logic |
| Deploy target | Vercel |

## Persistence

The database is **optional by design**. With no `DATABASE_URL` the app behaves
exactly as it always did — everything lives in `localStorage`, every screen
works, and a fresh clone runs on an empty environment. The API routes answer
`501` in that case, and the client records that and stops asking.

When a connection string is present, local storage stays the source of truth the
UI reads and the database is a mirror that outlives a cleared cache. That
ordering is deliberate: screens render instantly and offline, and a failed write
can never leave someone watching a spinner over data they already have. On load,
`hydrateFromServer` pulls the server's rows back and merges them by id with the
local copy winning — enough to survive a cleared cache, and honest about not
being real multi-device sync, since anonymous sessions give nothing to merge two
devices under.

Rows are grouped by an anonymous session id in an httpOnly cookie. It is not
authentication and is not presented as such: it identifies a browser so its own
rows can be found again. Deletes match on session as well as id, so one browser
cannot remove another's row.

### Setting up the database

1. Create a project at [neon.tech](https://neon.tech) and copy the **pooled**
   connection string.
2. Put it in `.env.local` as `DATABASE_URL` (see `.env.example`), and add the
   same variable in Vercel → Settings → Environment Variables.
3. Run `npm run db:push` to create the tables. drizzle-kit is a standalone CLI
   and does not read `.env.local` the way Next.js does, so `drizzle.config.ts`
   loads it explicitly.

Neon's HTTP driver is used rather than a pooled TCP connection: each serverless
invocation makes a stateless request, so there is no connection pool for
Vercel's functions to exhaust.

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
- `src/lib/alerts.ts` — pure alert rules (`isAlertTriggered`, `suggestDirection`,
  `distanceToTargetPercent`, `validateAlert`), unit-tested. Stored and observed
  by `alerts-store.ts` / `use-alerts.ts`, the same pattern as requests, and
  evaluated by `src/components/alerts-watcher.tsx`.
- `src/components/layout/page-container.tsx` — the app's only two content widths,
  so screens line up with the header instead of each setting their own.
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

Every pure domain module — rate/fee/cross-rate maths, request validation, the
checkout step machine, operation-mode rules and rate history — is covered at 100%
with Vitest (enforced by thresholds in `vitest.config.ts`) — this is the core of the app and the part worth
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

### Rate alerts

An alert watches a pair for a target rate. There is no backend, so it is checked
in the browser on the same 60-second cadence the ticker already uses — which
means it only fires while a tab is open. The UI says exactly that instead of
implying background delivery, and no Notification API or permission prompt is
used, since a browser notification would suggest a reach the demo does not have.

The direction (`above` / `below`) is derived rather than asked for:
`suggestDirection` compares the target with the current rate, so an alert for
"above 100" when the rate is already 200 — which would fire instantly and mean
nothing — cannot be created. Triggered alerts keep their place in the list as a
result rather than disappearing, and never fire twice.

### Recurring buys

A plan says "spend this much on this pair every week". Nothing executes — there
are no funds to spend — so instead of pretending, a plan reports when it *would*
next run and what it would add up to over 90 days.

The scheduling is pure and unit-tested. Monthly plans advance by calendar month
rather than 30 days, and a plan started on the 31st clamps to the 30th (or 28th)
in shorter months instead of sliding into the following one — the behaviour a
real recurring purchase has. Daily and weekly plans skip elapsed runs
arithmetically rather than looping.

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

### Internationalisation

English and Russian, switchable in the header. There is no i18n library: a
dictionary of flat keys plus one `translate` function covers this app, and the
function is unit-tested including its fallback chain — a missing key falls back
to English and then to the key itself, so a half-translated build degrades to
readable English rather than blank labels.

The preference is read through `useSyncExternalStore`, not state seeded in an
effect, which keeps the server render from being followed by a cascading
re-render, and `<html lang>` follows the choice.

Two things had to change to make translation honest rather than cosmetic.
Validation used to return English sentences, so `validateExchangeRequest` and
`validateAlert` now also return `issues` with a machine-readable `code` and its
parameters; the UI renders from the code. And components that stored a
translated error string in state now store the reason instead, so an error
already on screen switches language with everything else.

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

Deployed on Vercel (free tier).

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Next.js is detected
   automatically, so the build command and output directory need no changes.
3. Deploy. Every later push to `main` ships a production deployment, and pull
   requests get preview URLs.

**Environment variables — none are required.** Both rate providers (CoinGecko and
Frankfurter) are public and keyless, so the app builds and runs with an empty
environment.

One variable is optional: `NEXT_PUBLIC_SITE_URL` (e.g.
`https://crypto-exchanger.vercel.app`). It is used only to build absolute URLs
inside the breadcrumb JSON-LD; without it those URLs fall back to a placeholder
host, which affects search-engine rich results but nothing a visitor sees. Set it
once the production domain is known.

### Rate limits in production

CoinGecko's keyless tier is rate-limited, and every serverless instance keeps its
own in-memory cache, so a busy deployment can hit the limit and surface the
"Could not load live rate" state. The fix — if this ever moves past a demo — is a
shared cache (Vercel KV or Redis) behind `src/lib/rates/cache.ts`, which is
already the single place every rate read goes through.
