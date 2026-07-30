"use client";

import { OPERATION_MODES, type OperationMode } from "@/lib/operations";

type Props = {
  value: OperationMode;
  onChange: (mode: OperationMode) => void;
};

const COLS_WIDE = 4;
const COLS_NARROW = 2;

export function OperationTabs({ value, onChange }: Props) {
  const activeIndex = Math.max(
    OPERATION_MODES.findIndex((m) => m.id === value),
    0
  );
  const active = OPERATION_MODES[activeIndex];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Operation"
        className="relative grid grid-cols-2 rounded-2xl border border-border bg-background/60 p-1 xs:grid-cols-4"
      >
        {/* The indicator layer matches the track's padding box exactly, and the
            cells have no gaps, so percentage offsets land on cell boundaries.
            Each layout gets its own indicator: below xs the tabs sit in a 2×2
            grid, which a single horizontal slider cannot follow. */}
        <span aria-hidden className="pointer-events-none absolute inset-1 xs:hidden">
          <span
            className="gold-surface block size-full rounded-xl shadow-sm transition-transform duration-300 ease-out"
            style={{
              width: `${100 / COLS_NARROW}%`,
              height: "50%",
              transform: `translate(${(activeIndex % COLS_NARROW) * 100}%, ${
                Math.floor(activeIndex / COLS_NARROW) * 100
              }%)`,
            }}
          />
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-1 hidden xs:block">
          <span
            className="gold-surface block h-full rounded-xl shadow-sm transition-transform duration-300 ease-out"
            style={{
              width: `${100 / COLS_WIDE}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </span>

        {OPERATION_MODES.map((mode) => {
          const isActive = mode.id === value;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(mode.id)}
              className={`relative z-10 rounded-xl py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                isActive ? "text-black" : "text-muted hover:text-foreground"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs text-muted">{active.description}</p>
    </div>
  );
}
