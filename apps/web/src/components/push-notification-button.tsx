"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPermissionStatus,
  isSubscribed,
} from "@/lib/push/client";

type Status = "loading" | "subscribed" | "unsubscribed" | "denied" | "unsupported";

export function PushNotificationButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const permission = getNotificationPermissionStatus();

    if (permission === "unsupported") {
      setStatus("unsupported");
      return;
    }

    if (permission === "denied") {
      setStatus("denied");
      return;
    }

    const subscribed = await isSubscribed();
    setStatus(subscribed ? "subscribed" : "unsubscribed");
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("unsubscribed");
      } else {
        await subscribeToPush();
        setStatus("subscribed");
      }
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
      // Re-check status in case of error
      await checkStatus();
    } finally {
      setIsToggling(false);
    }
  };

  if (status === "loading") {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm opacity-50"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  if (status === "unsupported") {
    return null; // Hide on unsupported browsers
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span className="hidden sm:inline">Blocked</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        status === "subscribed"
          ? "border border-primary bg-primary/10 text-primary hover:bg-primary/20"
          : "border border-input hover:bg-accent"
      }`}
      title={status === "subscribed" ? "Notifications enabled" : "Enable notifications"}
    >
      {status === "subscribed" ? (
        <>
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isToggling ? "Disabling..." : "Notifications on"}
          </span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isToggling ? "Enabling..." : "Notify me"}
          </span>
        </>
      )}
    </button>
  );
}
