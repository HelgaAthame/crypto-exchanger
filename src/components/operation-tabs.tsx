"use client";

import { OPERATION_MODES, type OperationMode } from "@/lib/operations";

type Props = {
  value: OperationMode;
  onChange: (mode: OperationMode) => void;
};

export function OperationTabs({ value, onChange }: Props) {
  const activeIndex = OPERATION_MODES.findIndex((m) => m.id === value);
  const active = OPERATION_MODES[activeIndex];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Operation"
        className="relative grid grid-cols-2 gap-1 rounded-2xl border border-border bg-background/60 p-1 xs:grid-cols-4"
      >
        {/* Sliding indicator sits behind the labels. Below xs the tabs wrap to a
            2×2 grid, where a single sliding track cannot follow them. */}
        <span
          aria-hidden
          className="gold-surface pointer-events-none absolute inset-y-1 left-1 hidden rounded-xl shadow-sm transition-transform duration-300 ease-out xs:block"
          style={{
            width: `calc((100% - 0.5rem) / ${OPERATION_MODES.length} - 0.19rem)`,
            transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
          }}
        />

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
                isActive
                  ? "text-black max-xs:gold-surface"
                  : "text-muted hover:text-foreground"
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
