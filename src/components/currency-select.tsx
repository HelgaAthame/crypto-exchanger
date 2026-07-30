import { ChevronDown } from "lucide-react";
import { ALL_CURRENCIES, type Currency } from "@/lib/currencies";

type CurrencySelectProps = {
  value: string;
  onChange: (code: string) => void;
  label: string;
  /** Defaults to every supported currency; modes narrow this down. */
  options?: Currency[];
};

export function CurrencySelect({
  value,
  onChange,
  label,
  options = ALL_CURRENCIES,
}: CurrencySelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-control-border bg-background px-4 py-3 pr-10 text-sm font-medium transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          {options.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — {currency.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
      </span>
    </label>
  );
}
