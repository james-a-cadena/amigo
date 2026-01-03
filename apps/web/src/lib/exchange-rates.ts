import { db, eq, and, exchangeRates, type CurrencyCode } from "@amigo/db";
import { redis } from "./redis";

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest";
const CACHE_KEY_PREFIX = "exchange_rate:";
const CACHE_TTL_SECONDS = 86400; // 24 hours

export interface ExchangeRateResult {
  rate: number;
  date: Date;
  cached: boolean;
}

/**
 * Fetch exchange rates from external API
 */
async function fetchFromApi(
  baseCurrency: CurrencyCode
): Promise<Record<string, number>> {
  const response = await fetch(`${EXCHANGE_RATE_API}/${baseCurrency}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }
  const data = (await response.json()) as { rates: Record<string, number> };
  return data.rates;
}

/**
 * Get today's date normalized to midnight UTC
 */
function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Get the current exchange rate, using cache hierarchy:
 * 1. Redis/Valkey cache (hot cache, 24h TTL)
 * 2. Database (historical storage)
 * 3. External API (fallback)
 */
export async function getExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<ExchangeRateResult> {
  // Same currency = no conversion
  if (fromCurrency === toCurrency) {
    return { rate: 1, date: new Date(), cached: true };
  }

  const today = getTodayDate();
  const dateStr = today.toISOString().split("T")[0];
  const cacheKey = `${CACHE_KEY_PREFIX}${fromCurrency}:${toCurrency}:${dateStr}`;

  // 1. Check Redis cache
  const cachedRate = await redis.get(cacheKey);
  if (cachedRate) {
    return { rate: parseFloat(cachedRate), date: today, cached: true };
  }

  // 2. Check database for today's rate
  const [dbRate] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, fromCurrency),
        eq(exchangeRates.targetCurrency, toCurrency),
        eq(exchangeRates.date, today)
      )
    )
    .limit(1);

  if (dbRate) {
    // Cache in Redis
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, dbRate.rate);
    return { rate: parseFloat(dbRate.rate), date: today, cached: true };
  }

  // 3. Fetch from API
  const rates = await fetchFromApi(fromCurrency);
  const rate = rates[toCurrency];

  if (!rate) {
    throw new Error(
      `Exchange rate not found for ${fromCurrency} to ${toCurrency}`
    );
  }

  // Store in database for historical accuracy
  await db
    .insert(exchangeRates)
    .values({
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      date: today,
      rate: rate.toFixed(8),
    })
    .onConflictDoNothing();

  // Cache in Redis
  await redis.setex(cacheKey, CACHE_TTL_SECONDS, rate.toString());

  return { rate, date: today, cached: false };
}

/**
 * Get historical exchange rate for a specific date
 * Used for accurate historical reporting
 */
export async function getHistoricalExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  date: Date
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;

  const [dbRate] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, fromCurrency),
        eq(exchangeRates.targetCurrency, toCurrency),
        eq(exchangeRates.date, date)
      )
    )
    .limit(1);

  return dbRate ? parseFloat(dbRate.rate) : null;
}

/**
 * Convert amount between currencies using current rate
 * Returns the converted amount and the rate used
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<{ convertedAmount: number; rate: number }> {
  const { rate } = await getExchangeRate(fromCurrency, toCurrency);
  return {
    convertedAmount: amount * rate,
    rate,
  };
}

/**
 * Get exchange rate for storing with a record
 * Returns the rate to home currency, or null if same currency
 */
export async function getExchangeRateForRecord(
  recordCurrency: CurrencyCode,
  homeCurrency: CurrencyCode
): Promise<string | null> {
  if (recordCurrency === homeCurrency) {
    return null;
  }

  const { rate } = await getExchangeRate(recordCurrency, homeCurrency);
  return rate.toFixed(8);
}
