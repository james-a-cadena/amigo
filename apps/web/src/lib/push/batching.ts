export interface GroceryPushEvent {
  type: "add" | "purchase";
  itemName: string;
  actorUserId: string;
  actorName: string;
  householdId: string;
  timestamp: number;
}

// In-memory batching (simpler than Valkey TTL which has race conditions)
const pendingBatches = new Map<string, GroceryPushEvent[]>();

/**
 * Add a grocery event to the batch queue for a household.
 */
export function addToBatch(
  householdId: string,
  event: Omit<GroceryPushEvent, "householdId" | "timestamp">
): void {
  const fullEvent: GroceryPushEvent = {
    ...event,
    householdId,
    timestamp: Date.now(),
  };

  const existing = pendingBatches.get(householdId) ?? [];
  existing.push(fullEvent);
  pendingBatches.set(householdId, existing);
}

/**
 * Get all events in a batch and clear it.
 */
export function getBatchAndClear(householdId: string): GroceryPushEvent[] {
  const events = pendingBatches.get(householdId) ?? [];
  pendingBatches.delete(householdId);
  return events;
}
