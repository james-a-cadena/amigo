import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock("./middleware/auth", () => ({
  resolveAppSession: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  resolveAppSessionSoft: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock("./lib/security", () => ({
  buildSecurityHeaders: () => ({
    "content-security-policy": "default-src 'self'",
    "x-frame-options": "DENY",
  }),
  createCspNonce: () => "nonce-123",
}));

vi.mock("./api/health", () => {
  const route = new Hono();
  route.get("/boom", () => {
    throw new Error("boom");
  });
  return { healthRoute: route };
});

vi.mock("./api/groceries", () => ({ groceriesRoute: new Hono() }));
vi.mock("./api/tags", () => ({ tagsRoute: new Hono() }));
vi.mock("./api/transactions", () => ({ transactionsRoute: new Hono() }));
vi.mock("./api/budgets", () => ({ budgetsRoute: new Hono() }));
vi.mock("./api/recurring", () => ({ recurringRoute: new Hono() }));
vi.mock("./api/assets", () => ({ assetsRoute: new Hono() }));
vi.mock("./api/debts", () => ({ debtsRoute: new Hono() }));
vi.mock("./api/members", () => ({ membersRoute: new Hono() }));
vi.mock("./api/settings", () => ({ settingsRoute: new Hono() }));
vi.mock("./api/sync", () => ({ syncRoute: new Hono() }));
vi.mock("./api/calendar", () => ({ calendarRoute: new Hono() }));
vi.mock("./api/restore", () => ({ restoreRoute: new Hono() }));
vi.mock("./api/audit", () => ({ auditRoute: new Hono() }));
vi.mock("./api/setup", () => ({ setupRoute: new Hono() }));

import app from "./index";

describe("app security headers", () => {
  it("applies security headers to error responses", async () => {
    const response = await app.request("/api/boom", {}, { APP_ENV: "production" } as never);

    expect(response.status).toBe(500);
    expect(response.headers.get("content-security-policy")).toBe("default-src 'self'");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });
});
