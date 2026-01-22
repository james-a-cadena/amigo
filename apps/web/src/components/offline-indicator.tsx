"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-yellow-500 px-3 py-1.5 text-sm font-medium text-yellow-950 shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3.707 2.293a1 1 0 00-1.414 1.414l6.921 6.922c.05.062.105.118.168.167l6.91 6.911a1 1 0 001.415-1.414l-.675-.675a9.001 9.001 0 00-.668-11.982A1 1 0 1014.95 5.05a7.002 7.002 0 01.657 9.143l-1.435-1.435a5.002 5.002 0 00-.636-6.294 1 1 0 00-1.414 1.414 3 3 0 01.587 3.415l-1.992-1.992a.922.922 0 00-.018-.018l-6.99-6.991zM8.287 6.01l1.422 1.422a3 3 0 00-1.422-1.422zM5.293 7.536L6.707 8.95a5.002 5.002 0 001.594 6.293 1 1 0 01-1.412 1.414 7.002 7.002 0 01-1.596-9.12z"
          clipRule="evenodd"
        />
      </svg>
      Offline
    </div>
  );
}

interface SyncStatusProps {
  pendingCount: number;
  onSync?: () => void;
}

export function SyncStatus({ pendingCount, onSync }: SyncStatusProps) {
  const isOnline = useOnlineStatus();

  if (pendingCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onSync}
      disabled={!isOnline}
      className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
      title={isOnline ? "Click to sync now" : "Waiting for connection..."}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-3.5 w-3.5 ${isOnline ? "animate-spin" : ""}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clipRule="evenodd"
        />
      </svg>
      {pendingCount} pending
    </button>
  );
}
