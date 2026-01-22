import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    keys: jsonb("keys")
      .$type<{
        p256dh: string;
        auth: string;
      }>()
      .notNull(),
    userAgent: text("user_agent"),
    lastPushAt: timestamp("last_push_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("push_subscriptions_user_id_idx").on(table.userId)]
);

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  })
);

// Relations for users (one-to-many with push_subscriptions)
// Defined here to avoid circular imports between users.ts and push-subscriptions.ts
export const usersRelations = relations(users, ({ many }) => ({
  pushSubscriptions: many(pushSubscriptions),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
