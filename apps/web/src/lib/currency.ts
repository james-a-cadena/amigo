import type { CurrencyCode } from "@amigo/db/schema";

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; symbol: string }> =
  {
    CAD: { locale: "en-CA", symbol: "CA$" },
    USD: { locale: "en-US", symbol: "$" },
    EUR: { locale: "de-DE", symbol: "€" },
    GBP: { locale: "en-GB", symbol: "£" },
    MXN: { locale: "es-MX", symbol: "MX$" },
  };

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "MXN", label: "Mexican Peso (MXN)" },
];

/**
 * Format a monetary value in the specified currency
 */
export function formatCurrency(
  value: number | string,
  currency: CurrencyCode | null | undefined,
  options?: { compact?: boolean }
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  // Default to CAD if currency is null/undefined (for legacy records before migration)
  const safeCurrency: CurrencyCode = currency ?? "CAD";
  const config = CURRENCY_CONFIG[safeCurrency];

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: options?.compact ? 0 : 2,
    maximumFractionDigits: options?.compact ? 0 : 2,
  }).format(num);
}

/**
 * Format with original and converted amounts
 * Returns both the original currency amount and the home currency equivalent
 */
export function formatWithConversion(
  originalAmount: number | string,
  originalCurrency: CurrencyCode,
  homeAmount: number | string,
  homeCurrency: CurrencyCode
): { original: string; converted: string | null } {
  const original = formatCurrency(originalAmount, originalCurrency);

  if (originalCurrency === homeCurrency) {
    return { original, converted: null };
  }

  return {
    original,
    converted: formatCurrency(homeAmount, homeCurrency),
  };
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: CurrencyCode | null | undefined): string {
  const safeCurrency: CurrencyCode = currency ?? "CAD";
  return CURRENCY_CONFIG[safeCurrency].symbol;
}

/**
 * Calculate home currency amount from original amount and exchange rate
 */
export function calculateHomeAmount(
  originalAmount: number | string,
  exchangeRateToHome: number | string | null
): number {
  const amount =
    typeof originalAmount === "string"
      ? parseFloat(originalAmount)
      : originalAmount;

  if (exchangeRateToHome === null) {
    return amount; // Same currency, no conversion
  }

  const rate =
    typeof exchangeRateToHome === "string"
      ? parseFloat(exchangeRateToHome)
      : exchangeRateToHome;

  return amount * rate;
}
