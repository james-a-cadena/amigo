"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { PushNotificationModal } from "./push-notification-modal";
import { getNotificationPermissionStatus, isSubscribed } from "@/lib/push/client";

interface PushPromptContextValue {
  showPrompt: () => void;
}

const PushPromptContext = createContext<PushPromptContextValue | null>(null);

export function usePushPrompt(): PushPromptContextValue {
  const context = useContext(PushPromptContext);
  if (!context) {
    throw new Error("usePushPrompt must be used within PushPromptProvider");
  }
  return context;
}

interface PushPromptProviderProps {
  children: ReactNode;
}

export function PushPromptProvider({ children }: PushPromptProviderProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkShouldPrompt = async (): Promise<boolean> => {
      if (typeof window === "undefined") return false;

      // Already prompted
      if (localStorage.getItem("push-notification-prompted") === "true") {
        return false;
      }

      // Check browser support
      const permission = getNotificationPermissionStatus();
      if (permission === "unsupported" || permission === "denied") {
        return false;
      }

      // Already granted and subscribed
      if (permission === "granted") {
        const subscribed = await isSubscribed();
        if (subscribed) {
          return false;
        }
      }

      return true;
    };

    // Check if we should show the prompt after a delay
    const timer = setTimeout(async () => {
      const shouldPrompt = await checkShouldPrompt();
      if (shouldPrompt) {
        setShowModal(true);
      }
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <PushPromptContext.Provider value={{ showPrompt: () => setShowModal(true) }}>
      {children}
      {showModal && (
        <PushNotificationModal onClose={() => setShowModal(false)} />
      )}
    </PushPromptContext.Provider>
  );
}
