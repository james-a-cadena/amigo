import { describe, expect, it } from "vitest";
import { ActionError } from "./errors";
import {
  DEFAULT_TRANSACTIONS_LIMIT,
  DEFAULT_TRANSACTIONS_PAGE,
  MAX_TRANSACTIONS_LIMIT,
  parseCalendarQuery,
  parseTransactionsListQuery,
} from "./request-validation";

describe("parseTransactionsListQuery", () => {
  it("rejects invalid type filters", () => {
    expect(() =>
      parseTransactionsListQuery({
        page: "0",
        limit: "999",
        type: "bogus",
      })
    ).toThrowError(
      expect.objectContaining({
        message: 'Invalid type filter; expected "income" or "expense".',
        code: "VALIDATION_ERROR",
      }) satisfies Partial<ActionError>
    );
  });

  it("clamps out-of-range pagination values", () => {
    expect(
      parseTransactionsListQuery({
        page: "0",
        limit: "999",
      })
    ).toEqual({
      page: DEFAULT_TRANSACTIONS_PAGE,
      limit: MAX_TRANSACTIONS_LIMIT,
      type: undefined,
    });
  });

  it("falls back to defaults for unparsable values", () => {
    expect(
      parseTransactionsListQuery({
        page: "wat",
        limit: "",
      })
    ).toEqual({
      page: DEFAULT_TRANSACTIONS_PAGE,
      limit: DEFAULT_TRANSACTIONS_LIMIT,
      type: undefined,
    });
  });

  it("falls back to defaults for malformed numeric strings", () => {
    expect(
      parseTransactionsListQuery({
        page: "12abc",
        limit: "25.5",
      })
    ).toEqual({
      page: DEFAULT_TRANSACTIONS_PAGE,
      limit: DEFAULT_TRANSACTIONS_LIMIT,
      type: undefined,
    });
  });

  it("preserves valid pagination and type filters", () => {
    expect(
      parseTransactionsListQuery({
        page: "4",
        limit: "25",
        type: "expense",
      })
    ).toEqual({
      page: 4,
      limit: 25,
      type: "expense",
    });
  });
});

describe("parseCalendarQuery", () => {
  it("accepts bounded year and month values", () => {
    expect(parseCalendarQuery({ year: "2026", month: "4" })).toEqual({
      year: 2026,
      month: 4,
    });
  });

  it("rejects out-of-range months", () => {
    expect(() => parseCalendarQuery({ year: "2026", month: "13" })).toThrowError(
      expect.objectContaining({
        message: "Valid year and month are required",
        code: "VALIDATION_ERROR",
      }) satisfies Partial<ActionError>
    );
  });
});
