import { describe, expect, it } from "vitest";
import { getRequestHandlerMode } from "./request-handler-mode";

describe("getRequestHandlerMode", () => {
  it("returns the provided mode when present", () => {
    expect(getRequestHandlerMode({ env: { MODE: "development" } })).toBe(
      "development"
    );
  });

  it("falls back to production when import metadata has no env object", () => {
    expect(getRequestHandlerMode({})).toBe("production");
  });
});
