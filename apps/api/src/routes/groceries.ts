import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, desc, isNull, eq, and } from "@amigo/db";
import { groceryItems } from "@amigo/db/schema";
import { getSessionFromCookie } from "../lib/session";

const querySchema = z.object({
  lastSync: z.coerce.number().optional(),
});

export const groceriesRouter = new Hono().get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const cookieHeader = c.req.header("cookie");
    const session = await getSessionFromCookie(cookieHeader ?? null);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { lastSync: _lastSync } = c.req.valid("query");

    // Delta sync: fetch items updated after lastSync timestamp
    // Only return items belonging to the user's household
    const data = await db
      .select()
      .from(groceryItems)
      .where(
        and(
          eq(groceryItems.householdId, session.householdId),
          isNull(groceryItems.deletedAt)
        )
      )
      .orderBy(desc(groceryItems.updatedAt));

    return c.json({
      data,
      syncTimestamp: Date.now(),
    });
  }
);
