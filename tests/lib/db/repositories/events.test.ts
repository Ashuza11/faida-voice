import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { insertEvent } from "@/lib/db/repositories/events"
import { insertVendor } from "@/lib/db/repositories/vendors"

/**
 * Layer 2 integration test (CLAUDE.md §7) — requires a real Neon branch.
 * Assumes migrations are already applied there and it's a disposable test
 * branch: per §3.3 the events table is append-only, so this test does not
 * delete its rows afterward.
 */
describe.skipIf(!process.env.DATABASE_URL)("insertEvent idempotency", () => {
  it("posting the same client_event_id twice creates exactly one row", async () => {
    const vendor = await insertVendor({ name: "Jane", businessType: "bakery" })
    const clientEventId = randomUUID()
    const event = {
      vendorId: vendor.id,
      kind: "SALE" as const,
      payload: { items: [{ productName: "amandazi", qty: 2, unitPrice: 100 }], total: 200 },
      occurredAt: new Date(),
      source: "voice",
      clientEventId,
    }

    const first = await insertEvent(event)
    const second = await insertEvent(event)

    expect(second.id).toBe(first.id)
  })
})
