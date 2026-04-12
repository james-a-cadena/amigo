import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertValues: vi.fn(),
}));

vi.mock("@amigo/db", () => ({
  auditLogs: { table: "audit_logs" },
  eq: (...args: unknown[]) => ({ type: "eq", args }),
  and: (...args: unknown[]) => ({ type: "and", args }),
}));

import { withAudit } from "./audit";

describe("withAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs structured context when writing the audit log fails", async () => {
    const auditError = new Error("D1 unavailable");
    mocks.insertValues.mockRejectedValueOnce(auditError);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const db = {
      insert: vi.fn(() => ({
        values: mocks.insertValues,
      })),
    };

    await expect(
      withAudit(
        db as never,
        {
          householdId: "house-1",
          tableName: "transactions",
          recordId: "txn-1",
          operation: "DELETE",
          changedBy: "user-1",
        },
        async () => ({ id: "txn-1" })
      )
    ).rejects.toThrow("D1 unavailable");

    expect(consoleError).toHaveBeenCalledWith("Audit log write failed", {
      error: auditError,
      householdId: "house-1",
      tableName: "transactions",
      recordId: "txn-1",
      operation: "DELETE",
      changedBy: "user-1",
    });
  });
});
