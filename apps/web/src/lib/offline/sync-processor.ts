import { getOfflineDB } from "./db";
import {
  getPendingMutations,
  removeMutation,
  markMutationFailed,
  setLastSyncTimestamp,
} from "./sync-queue";
import {
  addItem as serverAddItem,
  toggleItem as serverToggleItem,
  deleteItem as serverDeleteItem,
} from "@/actions/groceries";

const MAX_RETRIES = 5;

export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const mutations = await getPendingMutations();
  let processed = 0;
  let failed = 0;

  for (const mutation of mutations) {
    if (mutation.retryCount >= MAX_RETRIES) {
      // Too many retries - remove from queue
      await removeMutation(mutation.id);
      failed++;
      continue;
    }

    try {
      await processMutation(mutation);
      await removeMutation(mutation.id);
      processed++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await markMutationFailed(mutation.id, errorMessage);
      failed++;
    }
  }

  if (processed > 0) {
    await setLastSyncTimestamp(Date.now());
  }

  return { processed, failed };
}

async function processMutation(mutation: {
  operation: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const db = getOfflineDB();

  switch (mutation.operation) {
    case "add": {
      const { name, category, tagIds } = mutation.payload as {
        name: string;
        category?: string;
        tagIds?: string[];
      };

      const serverItem = await serverAddItem(name, category, tagIds);

      // Update local item with server-assigned data
      const localItem = await db.groceryItems.get(mutation.entityId);
      if (localItem) {
        // Replace temp item with server item
        await db.groceryItems.delete(mutation.entityId);
        await db.groceryItems.add({
          ...serverItem,
          _localVersion: 0,
          _serverVersion: new Date(serverItem.updatedAt).getTime(),
          _syncStatus: "synced",
        });
      }
      break;
    }

    case "toggle": {
      await serverToggleItem(mutation.entityId);

      // Mark as synced
      await db.groceryItems.update(mutation.entityId, {
        _syncStatus: "synced",
      });
      break;
    }

    case "delete": {
      await serverDeleteItem(mutation.entityId);

      // Remove from local DB
      await db.groceryItems.delete(mutation.entityId);
      break;
    }

    default:
      throw new Error(`Unknown operation: ${mutation.operation}`);
  }
}

// Sync with server and fetch latest data
export async function syncWithServer(): Promise<void> {
  // Process any pending mutations first
  await processSyncQueue();

  // Then fetch latest from server
  // This will be triggered by the component via router.refresh()
}

// Check if there are pending mutations
export async function hasPendingMutations(): Promise<boolean> {
  const mutations = await getPendingMutations();
  return mutations.length > 0;
}
