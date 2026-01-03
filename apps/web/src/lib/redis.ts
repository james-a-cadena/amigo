import Redis from "ioredis";

const redisUrl = process.env["VALKEY_URL"];
if (!redisUrl) {
  throw new Error("VALKEY_URL environment variable is required");
}

export const redis = new Redis(redisUrl);

export const CHANNELS = {
  HOUSEHOLD_UPDATES: "household:updates",
} as const;

export interface HouseholdUpdatePayload {
  householdId: string;
  type: "GROCERY_UPDATE" | "TRANSACTION_UPDATE" | "RECURRING_UPDATE";
  data?: unknown;
}

export async function publishHouseholdUpdate(
  payload: HouseholdUpdatePayload
): Promise<void> {
  await redis.publish(CHANNELS.HOUSEHOLD_UPDATES, JSON.stringify(payload));
}
