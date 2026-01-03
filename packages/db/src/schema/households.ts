import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { currencyEnum } from "./currencies";

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  homeCurrency: currencyEnum("home_currency").notNull().default("CAD"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
