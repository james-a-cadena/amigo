import webpush from "web-push";
import { db, eq } from "@amigo/db";
import { pushSubscriptions, users } from "@amigo/db/schema";
import { getBatchAndClear, type GroceryPushEvent } from "./batching";

// Configure web-push with VAPID keys
const vapidSubject = process.env["VAPID_SUBJECT"];
const vapidPublicKey = process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"];
const vapidPrivateKey = process.env["VAPID_PRIVATE_KEY"];

if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  // Log warning at startup so operators know push notifications are disabled
  const missing: string[] = [];
  if (!vapidSubject) missing.push("VAPID_SUBJECT");
  if (!vapidPublicKey) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!vapidPrivateKey) missing.push("VAPID_PRIVATE_KEY");

  console.warn(
    `WARNING: Push notifications disabled - missing VAPID keys: ${missing.join(", ")}`
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
  };
}

/**
 * Process a batch of grocery events and send notifications to all
 * household members except the actors who made the changes.
 */
export async function processBatch(householdId: string): Promise<void> {
  const events = getBatchAndClear(householdId);
  if (events.length === 0) return;

  // Get unique actor user IDs (people who made changes)
  const actorUserIds = [...new Set(events.map((e) => e.actorUserId))];

  // Get all users in this household with their push subscriptions
  const householdUsers = await db
    .select({
      userId: users.id,
      subscription: pushSubscriptions,
    })
    .from(users)
    .leftJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
    .where(eq(users.householdId, householdId));

  // Group subscriptions by user
  const subscriptionsByUser = new Map<
    string,
    Array<typeof pushSubscriptions.$inferSelect>
  >();

  for (const row of householdUsers) {
    if (!row.subscription) continue;

    const existing = subscriptionsByUser.get(row.userId) ?? [];
    existing.push(row.subscription);
    subscriptionsByUser.set(row.userId, existing);
  }

  // Build the notification payload
  const payload = buildNotificationPayload(events);

  // Send to all users who are NOT actors
  for (const [userId, subs] of subscriptionsByUser) {
    // Skip if this user made the changes
    if (actorUserIds.includes(userId)) continue;

    // Send to all of this user's devices
    await sendToSubscriptions(subs, payload);
  }
}

function buildNotificationPayload(
  events: GroceryPushEvent[]
): NotificationPayload {
  const addEvents = events.filter((e) => e.type === "add");
  const purchaseEvents = events.filter((e) => e.type === "purchase");

  // Get unique actor names
  const actorNames = [...new Set(events.map((e) => e.actorName))].filter(
    Boolean
  );
  const actorDisplay =
    actorNames.length === 0
      ? "Someone"
      : actorNames.length === 1
        ? actorNames[0]
        : actorNames.slice(0, -1).join(", ") + " and " + actorNames.at(-1);

  let body: string;

  if (addEvents.length > 0 && purchaseEvents.length === 0) {
    // Only additions
    const firstAddEvent = addEvents[0];
    if (addEvents.length === 1 && firstAddEvent) {
      body = `${actorDisplay} added ${firstAddEvent.itemName} to the list`;
    } else {
      body = `${actorDisplay} added ${addEvents.length} items to the list`;
    }
  } else if (purchaseEvents.length > 0 && addEvents.length === 0) {
    // Only purchases
    const firstPurchaseEvent = purchaseEvents[0];
    if (purchaseEvents.length === 1 && firstPurchaseEvent) {
      body = `${actorDisplay} marked ${firstPurchaseEvent.itemName} as purchased`;
    } else {
      body = `${actorDisplay} marked ${purchaseEvents.length} items as purchased`;
    }
  } else {
    // Mixed actions
    body = `${actorDisplay} updated the grocery list`;
  }

  return {
    title: "Grocery List",
    body,
    icon: "/amigo-PWA-192x192.png",
    badge: "/amigo-PWA-192x192.png",
    tag: "grocery-update",
    data: {
      url: "/groceries",
      type: "grocery-update",
    },
  };
}

async function sendToSubscriptions(
  subscriptions: Array<typeof pushSubscriptions.$inferSelect>,
  payload: NotificationPayload
): Promise<void> {
  const payloadString = JSON.stringify(payload);

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        payloadString
      );

      // Update lastPushAt
      await db
        .update(pushSubscriptions)
        .set({ lastPushAt: new Date() })
        .where(eq(pushSubscriptions.id, subscription.id));
    } catch (error) {
      // Handle subscription errors
      if (isPushSubscriptionGone(error)) {
        // Remove invalid subscription
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, subscription.id));
      } else {
        console.error("Push notification failed:", error);
      }
    }
  }
}

function isPushSubscriptionGone(error: unknown): boolean {
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    // 404 = Not Found, 410 = Gone (subscription expired)
    return statusCode === 404 || statusCode === 410;
  }
  return false;
}

// Track active batch timers per household
const activeBatches = new Map<string, NodeJS.Timeout>();

/**
 * Schedule batch processing after a delay.
 * If called multiple times for the same household, the timer is NOT reset
 * (allowing batching to work - the timer starts with the first event).
 */
export function scheduleBatchProcessing(
  householdId: string,
  delayMs: number = 7000
): void {
  // Only schedule if no timer exists
  if (activeBatches.has(householdId)) {
    return;
  }

  const timer = setTimeout(async () => {
    activeBatches.delete(householdId);
    try {
      await processBatch(householdId);
    } catch (error) {
      console.error("Failed to process push batch:", error);
    }
  }, delayMs);

  activeBatches.set(householdId, timer);
}
