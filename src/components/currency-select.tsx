import { ALL_CURRENCIES } from "@/lib/currencies";

type CurrencySelectProps = {
  value: string;
  onChange: (code: string) => void;
  label: string;
};

export function CurrencySelect({ value, onChange, label }: CurrencySelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border rounded-md px-3 py-2 bg-background"
      >
        {ALL_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.name}
          </option>
        ))}
      </select>
    </label>
  );
}
