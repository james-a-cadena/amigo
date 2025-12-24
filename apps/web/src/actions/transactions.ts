"use server";

import { revalidatePath } from "next/cache";
import { eq, and, withAuditing } from "@amigo/db";
import { transactions } from "@amigo/db/schema";
import { getSession } from "@/lib/session";
import { publishHouseholdUpdate } from "@/lib/redis";

interface AddTransactionInput {
  amount: number;
  description?: string;
  category: string;
  type: "income" | "expense";
  date: Date;
}

export async function addTransaction(input: AddTransactionInput) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const transaction = await withAuditing(session.authId, async (tx) => {
    const [inserted] = await tx
      .insert(transactions)
      .values({
        householdId: session.householdId,
        userId: session.userId,
        amount: input.amount.toFixed(2),
        description: input.description?.trim() || null,
        category: input.category.trim(),
        type: input.type,
        date: input.date,
      })
      .returning();
    return inserted;
  });

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "TRANSACTION_UPDATE",
  });

  revalidatePath("/budget");

  return transaction;
}

export async function deleteTransaction(id: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const deleted = await withAuditing(session.authId, async (tx) => {
    const [result] = await tx
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.householdId, session.householdId)
        )
      )
      .returning();
    return result;
  });

  if (!deleted) {
    throw new Error("Transaction not found");
  }

  await publishHouseholdUpdate({
    householdId: session.householdId,
    type: "TRANSACTION_UPDATE",
  });

  revalidatePath("/budget");

  return deleted;
}
