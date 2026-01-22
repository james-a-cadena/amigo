"use server";

import { revalidatePath } from "next/cache";
import { db, eq, and, lte } from "@amigo/db";
import { recurringTransactions, transactions, households, type CurrencyCode } from "@amigo/db/schema";
import type { RecurringTransaction } from "@amigo/db/schema";
import { getSession } from "@/lib/session";
import { publishHouseholdUpdate } from "@/lib/redis";
import { getExchangeRateForRecord } from "@/lib/exchange-rates";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

interface CreateRecurringRuleInput {
  amount: number;
  category: string;
  description?: string;
  type: "income" | "expense";
  frequency: Frequency;
  interval?: number;
  dayOfMonth?: number;
  startDate: Date;
  endDate?: Date;
  budgetId?: string | null;
  currency?: CurrencyCode;
}

interface UpdateRecurringRuleInput {
  id: string;
  amount?: number;
  category?: string;
  description?: string | null;
  type?: "income" | "expense";
  frequency?: Frequency;
  interval?: number;
  dayOfMonth?: number | null;
  startDate?: Date;
  endDate?: Date | null;
  budgetId?: string | null;
  currency?: CurrencyCode;
}

async function getHomeCurrency(householdId: string): Promise<CurrencyCode> {
  const household = await db.query.households.findFirst({
    where: eq(households.id, householdId),
  });
  return household?.homeCurrency ?? "CAD";
}

function calculateNextRunDate(
  frequency: Frequency,
  interval: number,
  fromDate: Date,
  dayOfMonth?: number | null
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + interval);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + interval);
      if (dayOfMonth) {
        const year = next.getFullYear();
        const month = next.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}

function getInitialNextRunDate(
  startDate: Date,
  frequency: Frequency,
  interval: number,
  dayOfMonth?: number | null,
  endDate?: Date | null
): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);

  if (start > today) {
    if (end && start > end) return null;
    return start;
  }

  let nextRun = new Date(start);
  while (nextRun < today) {
    nextRun = calculateNextRunDate(frequency, interval, nextRun, dayOfMonth);
  }

  if (end && nextRun > end) {
    return null;
  }

  return nextRun;
}

export async function getRecurringRules(): Promise<RecurringTransaction[]> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return db.query.recurringTransactions.findMany({
    where: and(
      eq(recurringTransactions.householdId, session.householdId),
      eq(recurringTransactions.userId, session.userId)
    ),
    orderBy: (rt, { desc }) => [desc(rt.createdAt)],
  });
}

export async function createRecurringRule(input: CreateRecurringRuleInput) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const nextRunDate = getInitialNextRunDate(
    input.startDate,
    input.frequency,
    input.interval ?? 1,
    input.dayOfMonth,
    input.endDate
  );

  if (!nextRunDate) {
    throw new Error("End date must be on or after the first occurrence date");
  }

  const [rule] = await db
    .insert(recurringTransactions)
    .values({
      householdId: session.householdId,
      userId: session.userId,
      amount: input.amount.toFixed(2),
      currency: input.currency ?? "CAD",
      category: input.category.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      frequency: input.frequency,
      interval: input.interval ?? 1,
      dayOfMonth: input.dayOfMonth ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      nextRunDate,
      budgetId: input.budgetId || null,
    })
    .returning();

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "RECURRING_UPDATE",
  });

  revalidatePath("/budget");

  return rule;
}

export async function updateRecurringRule(input: UpdateRecurringRuleInput) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.recurringTransactions.findFirst({
    where: and(
      eq(recurringTransactions.id, input.id),
      eq(recurringTransactions.householdId, session.householdId),
      eq(recurringTransactions.userId, session.userId)
    ),
  });

  if (!existing) {
    throw new Error("Recurring rule not found");
  }

  const updateData: Partial<typeof recurringTransactions.$inferInsert> = {};

  if (input.amount !== undefined) {
    updateData.amount = input.amount.toFixed(2);
  }
  if (input.category !== undefined) {
    updateData.category = input.category.trim();
  }
  if (input.description !== undefined) {
    updateData.description = input.description?.trim() || null;
  }
  if (input.type !== undefined) {
    updateData.type = input.type;
  }
  if (input.frequency !== undefined) {
    updateData.frequency = input.frequency;
  }
  if (input.interval !== undefined) {
    updateData.interval = input.interval;
  }
  if (input.dayOfMonth !== undefined) {
    updateData.dayOfMonth = input.dayOfMonth;
  }
  if (input.endDate !== undefined) {
    updateData.endDate = input.endDate;
  }
  if (input.budgetId !== undefined) {
    updateData.budgetId = input.budgetId || null;
  }
  if (input.currency !== undefined) {
    updateData.currency = input.currency;
  }

  if (
    input.startDate !== undefined ||
    input.frequency !== undefined ||
    input.interval !== undefined ||
    input.dayOfMonth !== undefined ||
    input.endDate !== undefined
  ) {
    const startDate = input.startDate ?? existing.startDate;
    const frequency = input.frequency ?? existing.frequency;
    const interval = input.interval ?? existing.interval;
    const dayOfMonth = input.dayOfMonth !== undefined ? input.dayOfMonth : existing.dayOfMonth;
    const endDate = input.endDate !== undefined ? input.endDate : existing.endDate;
    updateData.startDate = startDate;

    const newNextRunDate = getInitialNextRunDate(startDate, frequency, interval, dayOfMonth, endDate);

    if (newNextRunDate) {
      updateData.nextRunDate = newNextRunDate;
    } else {
      updateData.active = false;
      updateData.nextRunDate = startDate;
    }
  }

  const [rule] = await db
    .update(recurringTransactions)
    .set(updateData)
    .where(
      and(
        eq(recurringTransactions.id, input.id),
        eq(recurringTransactions.householdId, session.householdId),
        eq(recurringTransactions.userId, session.userId)
      )
    )
    .returning();

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "RECURRING_UPDATE",
  });

  revalidatePath("/budget");

  return rule;
}

export async function deleteRecurringRule(id: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const [rule] = await db
    .delete(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.householdId, session.householdId),
        eq(recurringTransactions.userId, session.userId)
      )
    )
    .returning();

  if (!rule) {
    throw new Error("Recurring rule not found");
  }

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "RECURRING_UPDATE",
  });

  revalidatePath("/budget");

  return rule;
}

export async function toggleRecurringRule(id: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.recurringTransactions.findFirst({
    where: and(
      eq(recurringTransactions.id, id),
      eq(recurringTransactions.householdId, session.householdId),
      eq(recurringTransactions.userId, session.userId)
    ),
  });

  if (!existing) {
    throw new Error("Recurring rule not found");
  }

  const [rule] = await db
    .update(recurringTransactions)
    .set({ active: !existing.active })
    .where(
      and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.householdId, session.householdId),
        eq(recurringTransactions.userId, session.userId)
      )
    )
    .returning();

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "RECURRING_UPDATE",
  });

  revalidatePath("/budget");

  return rule;
}

export async function processDueRecurringTransactions() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueRules = await db.query.recurringTransactions.findMany({
    where: and(
      eq(recurringTransactions.householdId, session.householdId),
      eq(recurringTransactions.userId, session.userId),
      eq(recurringTransactions.active, true),
      lte(recurringTransactions.nextRunDate, today)
    ),
  });

  if (dueRules.length === 0) {
    return { processed: 0 };
  }

  let processedCount = 0;

  await db.transaction(async (tx) => {
    for (const rule of dueRules) {
      if (rule.endDate && rule.endDate < today) {
        await tx
          .update(recurringTransactions)
          .set({ active: false })
          .where(eq(recurringTransactions.id, rule.id));
        continue;
      }

      const homeCurrency = await getHomeCurrency(rule.householdId);
      const exchangeRateToHome = await getExchangeRateForRecord(rule.currency, homeCurrency);

      await tx.insert(transactions).values({
        householdId: rule.householdId,
        userId: rule.userId,
        amount: rule.amount,
        currency: rule.currency,
        exchangeRateToHome,
        category: rule.category,
        description: rule.description,
        type: rule.type,
        date: rule.nextRunDate,
        budgetId: rule.budgetId,
      });

      const newNextRunDate = calculateNextRunDate(
        rule.frequency,
        rule.interval,
        rule.nextRunDate,
        rule.dayOfMonth
      );

      const endDate = rule.endDate ? new Date(rule.endDate) : null;
      if (endDate) endDate.setHours(0, 0, 0, 0);

      if (endDate && newNextRunDate > endDate) {
        await tx
          .update(recurringTransactions)
          .set({
            lastRunDate: rule.nextRunDate,
            active: false,
          })
          .where(eq(recurringTransactions.id, rule.id));
      } else {
        await tx
          .update(recurringTransactions)
          .set({
            lastRunDate: rule.nextRunDate,
            nextRunDate: newNextRunDate,
          })
          .where(eq(recurringTransactions.id, rule.id));
      }

      processedCount++;
    }
  });

  if (processedCount > 0) {
    await publishHouseholdUpdate({
      householdId: session.householdId,
      type: "TRANSACTION_UPDATE",
    });
  }

  return { processed: processedCount };
}
