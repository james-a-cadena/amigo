"use server";

import { revalidatePath } from "next/cache";
import { db, eq, and, isNull } from "@amigo/db";
import { assets, households, type CurrencyCode } from "@amigo/db/schema";
import { getSession } from "@/lib/session";
import { getExchangeRateForRecord } from "@/lib/exchange-rates";
import { z } from "zod";

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["BANK", "INVESTMENT", "CASH", "PROPERTY"]),
  balance: z.number(),
  currency: z.enum(["CAD", "USD", "EUR", "GBP", "MXN"]).optional(),
});

export type AssetInput = z.infer<typeof assetSchema>;

async function getHomeCurrency(householdId: string): Promise<CurrencyCode> {
  const household = await db.query.households.findFirst({
    where: eq(households.id, householdId),
  });
  return household?.homeCurrency ?? "CAD";
}

export async function getAssets() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userAssets = await db.query.assets.findMany({
    where: and(
      eq(assets.householdId, session.householdId),
      eq(assets.userId, session.userId),
      isNull(assets.deletedAt)
    ),
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
  });

  return userAssets;
}

export async function createAsset(input: AssetInput) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const validated = assetSchema.parse(input);
  const currency = validated.currency ?? "CAD";
  const homeCurrency = await getHomeCurrency(session.householdId);
  const exchangeRateToHome = await getExchangeRateForRecord(currency, homeCurrency);

  const [asset] = await db
    .insert(assets)
    .values({
      householdId: session.householdId,
      userId: session.userId,
      name: validated.name.trim(),
      type: validated.type,
      balance: validated.balance.toFixed(2),
      currency,
      exchangeRateToHome,
    })
    .returning();

  revalidatePath("/assets");

  return asset;
}

export async function updateAsset(id: string, input: AssetInput) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const validated = assetSchema.parse(input);
  const currency = validated.currency ?? "CAD";
  const homeCurrency = await getHomeCurrency(session.householdId);
  const exchangeRateToHome = await getExchangeRateForRecord(currency, homeCurrency);

  const [updated] = await db
    .update(assets)
    .set({
      name: validated.name.trim(),
      type: validated.type,
      balance: validated.balance.toFixed(2),
      currency,
      exchangeRateToHome,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assets.id, id),
        eq(assets.userId, session.userId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Asset not found");
  }

  revalidatePath("/assets");

  return updated;
}

export async function deleteAsset(id: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const [deleted] = await db
    .update(assets)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(assets.id, id),
        eq(assets.userId, session.userId)
      )
    )
    .returning();

  if (!deleted) {
    throw new Error("Asset not found");
  }

  revalidatePath("/assets");

  return deleted;
}
