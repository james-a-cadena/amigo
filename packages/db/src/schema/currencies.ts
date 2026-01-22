import {
  date,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";

// Supported currencies
export const currencyEnum = pgEnum("currency_code", [
  "CAD", // Canadian Dollar (default home currency)
  "USD", // US Dollar
  "EUR", // Euro
  "GBP", // British Pound
  "MXN", // Mexican Peso
]);

// Historical exchange rates table
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    baseCurrency: currencyEnum("base_currency").notNull(),
    targetCurrency: currencyEnum("target_currency").notNull(),
    date: date("date", { mode: "date" }).notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.baseCurrency, table.targetCurrency, table.date] }),
  ]
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
export type CurrencyCode = "CAD" | "USD" | "EUR" | "GBP" | "MXN";
