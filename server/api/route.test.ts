import { describe, expect, it } from "vitest";
import { handleApiRoute } from "./route";

describe("handleApiRoute", () => {
  it("maps SyntaxError failures to a 400 validation response", async () => {
    const response = await handleApiRoute(
      {
        request: new Request("http://localhost/api/restore/restore", {
          method: "POST",
          body: "{",
        }),
        params: {},
        context: {
          cloudflare: { env: {} },
          app: { sessionStatus: "authenticated", session: undefined },
        },
      } as never,
      {
        auth: "none",
        handler: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON",
      code: "VALIDATION_ERROR",
    });
  });
});
