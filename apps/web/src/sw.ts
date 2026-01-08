/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, disableDevLogs, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

disableDevLogs();

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    // Static assets - Cache first, 30 days
    {
      matcher: /\.(js|css|woff2?)$/,
      handler: new CacheFirst({
        cacheName: "static-assets",
      }),
    },
    // Images - Stale while revalidate, 7 days
    {
      matcher: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: new StaleWhileRevalidate({
        cacheName: "images",
      }),
    },
    // API routes - Network first with timeout
    {
      matcher: /\/api\/(groceries|health)/,
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
      }),
    },
    // HTML pages - Network first
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 5,
      }),
    },
  ],
});

// Background sync for grocery mutations
self.addEventListener("sync", (event) => {
  const syncEvent = event as ExtendableEvent & { tag?: string };
  if (syncEvent.tag === "sync-groceries") {
    syncEvent.waitUntil(syncPendingMutations());
  }
});

// Handle online event to trigger sync
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SYNC_NOW") {
    syncPendingMutations();
  }
});

async function syncPendingMutations(): Promise<void> {
  // Post message to all clients to trigger sync
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "TRIGGER_SYNC" });
  }
}

// Push notification payload type
interface PushPayload {
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

// Push notification handler
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json() as PushPayload;

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon ?? "/amigo-PWA-192x192.png",
      badge: payload.badge ?? "/amigo-PWA-192x192.png",
      tag: payload.tag,
      data: payload.data,
      // Prevent notification from staying until user interacts
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

// Notification click handler - open the app
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string })?.url ?? "/groceries";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if ("focus" in client) {
            return (client as WindowClient).focus().then((focusedClient) => {
              if (focusedClient && "navigate" in focusedClient) {
                return focusedClient.navigate(url);
              }
            });
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      })
  );
});

serwist.addEventListeners();
