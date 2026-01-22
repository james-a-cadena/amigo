"use client";

import type { CurrencyCode } from "@amigo/db/schema";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  id,
  className,
  disabled,
}: CurrencySelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      disabled={disabled}
      className={
        className ??
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
      }
    >
      {SUPPORTED_CURRENCIES.map((curr) => (
        <option key={curr.code} value={curr.code}>
          {curr.code}
        </option>
      ))}
    </select>
  );
}
