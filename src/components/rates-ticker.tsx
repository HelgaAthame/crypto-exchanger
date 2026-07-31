"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, TrendingDown, TrendingUp } from "lucide-react";
import { CurrencyIcon } from "@/components/currency-icon";
import { useT } from "@/lib/i18n/context";

type TickerItem = {
  code: string;
  name: string;
  kind: "fiat" | "crypto";
  usdPrice: number;
  change24h: number | null;
};

const REFRESH_MS = 60_000;

/** Must match --ticker-duration in globals.css. */
const SCROLL_SECONDS = 45;
/** Below this the pointer was pressing a link, not dragging the strip. */
const DRAG_THRESHOLD_PX = 5;

function currentTranslateX(el: HTMLElement): number {
  const { transform } = getComputedStyle(el);
  if (!transform || transform === "none") return 0;
  return new DOMMatrixReadOnly(transform).m41;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

export function RatesTicker() {
  const t = useT();
  const [items, setItems] = useState<TickerItem[]>([]);
  // WCAG 2.2.2: auto-scrolling content that runs longer than five seconds
  // needs a control that does not depend on hover.
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    /** Set once the pointer passes the threshold; suppresses the click. */
    moved: false,
    reduced: false,
    startClientX: 0,
    startOffset: 0,
    lastX: 0,
  });

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Only the primary button, and never on the pause control.
    if (event.button !== 0) return;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const reduced = prefersReducedMotion();
    drag.current = {
      active: true,
      moved: false,
      reduced,
      startClientX: event.clientX,
      // With the animation running the position lives in the transform matrix;
      // under reduced motion the strip is a normal scroll container instead.
      startOffset: reduced ? viewport.scrollLeft : currentTranslateX(track),
      lastX: 0,
    };

    if (!reduced) {
      // Hand the transform over to JS: the keyframes and the drag cannot both
      // own it, so the animation stops and resumes from wherever we let go.
      track.style.animation = "none";
      track.style.transform = `translateX(${drag.current.startOffset}px)`;
    }

    viewport.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const dx = event.clientX - drag.current.startClientX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) drag.current.moved = true;

    if (drag.current.reduced) {
      viewport.scrollLeft = drag.current.startOffset - dx;
      return;
    }

    // The track holds two identical copies, so wrapping at half its width
    // makes dragging endless in both directions.
    const half = track.scrollWidth / 2;
    const raw = drag.current.startOffset + dx;
    const wrapped = half > 0 ? (((raw % half) + half) % half) - half : raw;
    drag.current.lastX = wrapped;
    track.style.transform = `translateX(${wrapped}px)`;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);

    const track = trackRef.current;
    const viewport = viewportRef.current;
    viewport?.releasePointerCapture?.(event.pointerId);
    if (!track || drag.current.reduced) return;

    // Resume the keyframes at the dragged position by rewinding the animation
    // to the matching point, instead of letting it snap back to where it was.
    const half = track.scrollWidth / 2;
    const progress = half > 0 ? Math.min(Math.max(-drag.current.lastX / half, 0), 1) : 0;
    track.style.transform = "";
    track.style.animation = "";
    track.style.animationDelay = `${-progress * SCROLL_SECONDS}s`;
  }

  function onClickCapture(event: React.MouseEvent) {
    // A drag that finishes over a pill must not open that currency.
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data = (await res.json()) as { items: TickerItem[] };
        if (!cancelled) setItems(data.items);
      } catch {
        // A ticker is decorative — a failed refresh keeps the last good values.
      }
    }
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="relative flex items-center border-b border-border/60 bg-linear-to-r from-transparent via-accent/6 to-transparent py-2.5">
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="ml-2 grid size-7 shrink-0 place-items-center rounded-full border border-border/70 bg-card/70 text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {paused ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
        <span className="sr-only">
          {paused ? t("ticker.resume") : t("ticker.pause")}
        </span>
      </button>

      <div
        ref={viewportRef}
        className="ticker flex-1"
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div ref={trackRef} className="ticker-track" data-paused={paused || undefined}>
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="ticker-list"
            aria-hidden={copy === 1}
            aria-label={copy === 0 ? t("ticker.label") : undefined}
          >
            {items.map((item) => {
              const up = item.change24h !== null && item.change24h >= 0;
              const change =
                item.change24h === null
                  ? ""
                  : `, ${up ? "+" : "-"}${Math.abs(item.change24h).toFixed(2)}%`;
              return (
                <li key={item.code}>
                  <Link
                    href={`/rates/${item.code}`}
                    // The mirrored copy exists only to close the loop visually.
                    tabIndex={copy === 1 ? -1 : undefined}
                    aria-label={t("ticker.details", {
                      name: item.name,
                      price: formatPrice(item.usdPrice),
                      change,
                    })}
                    className="ticker-pill group flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/70 px-3 py-1.5 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    <CurrencyIcon
                      code={item.code}
                      className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]"
                    />
                    <span className="text-xs font-semibold tracking-wide">{item.code}</span>
                    <span className="text-xs tabular-nums text-muted transition-colors group-hover:text-foreground">
                      ${formatPrice(item.usdPrice)}
                    </span>
                    {item.change24h !== null && (
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                          up ? "text-success" : "text-danger"
                        }`}
                      >
                        {up ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3" aria-hidden />
                        )}
                        {Math.abs(item.change24h).toFixed(2)}%
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
        </div>
      </div>
    </div>
  );
}
