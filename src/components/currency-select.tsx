"use client";

import { ALL_CURRENCIES, type Currency } from "@/lib/currencies";
import { CurrencyIcon } from "@/components/currency-icon";
import { SelectMenu } from "@/components/ui/select-menu";

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
    <div className="flex flex-col gap-1.5">
      <span
        id={`currency-label-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className="text-xs font-medium uppercase tracking-[0.12em] text-muted"
      >
        {label}
      </span>
      <SelectMenu
        ariaLabel={label}
        value={value}
        onChange={onChange}
        options={options.map((currency) => ({
          value: currency.code,
          label: currency.name,
          hint: currency.name,
          icon: <CurrencyIcon code={currency.code} />,
        }))}
      />
    </div>
  );
}
