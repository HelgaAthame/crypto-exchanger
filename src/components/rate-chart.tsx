"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Table2, TrendingDown, TrendingUp } from "lucide-react";
import type { RatePoint } from "@/lib/rate-history";
import { useT } from "@/lib/i18n/context";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

type HistoryResponse = {
  points: RatePoint[];
  changePercent: number | null;
};

const AXIS_BAND = 22;
const PAD_X = 6;
/** The plot keeps a sane height at any width instead of scaling with it. */
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 260;

function formatRate(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toPrecision(4);
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function RateChart({ from, to }: { from: string; to: string }) {
  const t = useT();
  const gradientId = useId();
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  // A flag rather than a message, so the text follows the active language.
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // The chart now spans the page, so a fixed viewBox would stretch it into a
  // very tall band on wide screens. Measuring the container keeps the SVG
  // coordinate system in step with the pixels it is drawn into.
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const node = plotRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(320, Math.round(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const WIDTH = width;
  const PLOT_HEIGHT = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(width * 0.22)));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/history?from=${from}&to=${to}&days=${range}`);
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as HistoryResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [from, to, range]);

  const points = data?.points ?? [];
  const hasPlot = points.length > 1;

  const rates = points.map((p) => p.rate);
  const min = hasPlot ? Math.min(...rates) : 0;
  const max = hasPlot ? Math.max(...rates) : 0;
  // A flat series would divide by zero; give it a nominal band so it draws mid-height.
  const span = max - min || max || 1;

  const x = (i: number) =>
    PAD_X + (i / Math.max(points.length - 1, 1)) * (WIDTH - PAD_X * 2);
  const y = (rate: number) => PLOT_HEIGHT - 8 - ((rate - min) / span) * (PLOT_HEIGHT - 24);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.rate)}`).join(" ");
  const areaPath = hasPlot
    ? `${linePath} L ${x(points.length - 1)} ${PLOT_HEIGHT} L ${x(0)} ${PLOT_HEIGHT} Z`
    : "";

  const change = data?.changePercent ?? null;
  const up = change !== null && change >= 0;
  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const last = points[points.length - 1];

  return (
    <section
      aria-labelledby="rate-history-heading"
      className="surface-card mt-6 rounded-3xl p-5 sm:p-6"
    >
      {/* Controls sit in one row above the plot they scope. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="rate-history-heading" className="text-sm font-semibold">
            {t("chart.title", { from, to, days: range })}
          </h2>
          {change !== null && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                up ? "text-success" : "text-danger"
              }`}
            >
              {up ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {t("chart.change", {
                sign: up ? "+" : "−",
                value: Math.abs(change).toFixed(2),
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div role="group" aria-label={t("chart.range")} className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  range === r
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={showTable}
            onClick={() => setShowTable((s) => !s)}
            className="grid size-7 place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Table2 className="size-3.5" aria-hidden />
            <span className="sr-only">
              {showTable ? t("chart.hideTable") : t("chart.showTable")}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4" ref={plotRef}>
        {failed ? (
          <p className="py-10 text-center text-sm text-muted">{t("chart.unavailable")}</p>
        ) : !hasPlot && loading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("chart.loading")}
          </p>
        ) : !hasPlot ? (
          <p className="py-10 text-center text-sm text-muted">
            {t("chart.notEnough")}
          </p>
        ) : (
          // Refetches hold the previous render instead of flashing a skeleton.
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <svg
              viewBox={`0 0 ${WIDTH} ${PLOT_HEIGHT + AXIS_BAND}`}
              className="w-full"
              role="img"
              aria-label={t("chart.imageLabel", { from, to, days: range })}
              onPointerLeave={() => setHoverIndex(null)}
              onPointerMove={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - box.left) / box.width;
                const i = Math.round(ratio * (points.length - 1));
                setHoverIndex(Math.min(Math.max(i, 0), points.length - 1));
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* The two figures that give the plot a scale. Without them the
                  only way to read a value is to hover, which leaves the shape
                  meaningless on a touch screen or in a screenshot. */}
              <text
                x={0}
                y={y(max) - 5}
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {formatRate(max)}
              </text>
              <text
                x={0}
                y={y(min) + 12}
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {formatRate(min)}
              </text>

              {/* Hairline solid gridlines, one step off the surface. */}
              {[0, 0.5, 1].map((fraction) => (
                <line
                  key={fraction}
                  x1={0}
                  x2={WIDTH}
                  y1={y(min + fraction * span)}
                  y2={y(min + fraction * span)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              ))}

              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path
                d={linePath}
                fill="none"
                stroke="var(--chart-line)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hoverIndex !== null && active && (
                <>
                  <line
                    x1={x(hoverIndex)}
                    x2={x(hoverIndex)}
                    y1={0}
                    y2={PLOT_HEIGHT}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={x(hoverIndex)}
                    cy={y(active.rate)}
                    r={5}
                    fill="var(--chart-line)"
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                </>
              )}

              {/* End marker with a surface ring, plus the one direct label. */}
              <circle
                cx={x(points.length - 1)}
                cy={y(last.rate)}
                r={4}
                fill="var(--chart-line)"
                stroke="var(--card)"
                strokeWidth={2}
              />

              <text
                x={0}
                y={PLOT_HEIGHT + 15}
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {formatDay(points[0].date)}
              </text>
              <text
                x={WIDTH}
                y={PLOT_HEIGHT + 15}
                textAnchor="end"
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {formatDay(last.date)}
              </text>
            </svg>

            <p className="mt-1 text-center text-xs text-muted" aria-live="polite">
              {active ? (
                <>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatRate(active.rate)} {to}
                  </span>{" "}
                  {t("chart.on")} {formatDay(active.date)}
                </>
              ) : (
                <>
                  {t("chart.latest")}{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatRate(last.rate)} {to}
                  </span>{" "}
                  {t("chart.per")} {from}
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {showTable && hasPlot && (
        <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              {t("chart.caption", { from, to, days: range })}
            </caption>
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 font-medium text-muted">
                  {t("chart.date")}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-muted">
                  {t("chart.rateColumn", { code: to })}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-1.5">{formatDay(p.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatRate(p.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
