import { hc } from "hono/client";
import type { AppType } from "@amigo/api";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative URL (Caddy proxies to API)
    return "";
  }
  // Server-side: API_URL not needed since we use relative URLs via Caddy
  // This is only used for direct server-to-server calls if needed
  return process.env["API_URL"] ?? "";
};

export const client = hc<AppType>(getBaseUrl());
