import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { events } from "@/lib/db/schema"

export type NewEvent = typeof events.$inferInsert
export type Event = typeof events.$inferSelect

/**
 * Appends an event to the ledger. Idempotent on `clientEventId` per
 * CLAUDE.md §3.5: posting the same event twice returns the existing row
 * instead of creating a second one. The events table is append-only —
 * this module never issues an UPDATE or DELETE against it.
 */
export async function insertEvent(event: NewEvent): Promise<Event> {
  const [inserted] = await db.insert(events).values(event).onConflictDoNothing({ target: events.clientEventId }).returning()

  if (inserted) {
    return inserted
  }

  const [existing] = await db.select().from(events).where(eq(events.clientEventId, event.clientEventId))
  return existing
}
