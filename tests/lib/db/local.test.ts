import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { getEventsForVendor, getUnsyncedEvents, localDb, markSynced, queueEvent } from "@/lib/db/local"

beforeEach(async () => {
  await localDb.events.clear()
})

describe("queueEvent", () => {
  it("stores an event with syncedAt unset", async () => {
    const event = await queueEvent({
      clientEventId: "evt-1",
      vendorId: "vendor-1",
      kind: "SALE",
      payload: { total: 400 },
      occurredAt: new Date("2026-08-12T10:00:00Z"),
      source: "voice",
    })

    expect(event.syncedAt).toBeNull()
    await expect(localDb.events.get("evt-1")).resolves.toMatchObject({
      clientEventId: "evt-1",
      syncedAt: null,
    })
  })

  it("is idempotent on clientEventId — queueing the same id twice does not duplicate it", async () => {
    const base = {
      clientEventId: "evt-2",
      vendorId: "vendor-1",
      kind: "SALE" as const,
      payload: { total: 200 },
      occurredAt: new Date(),
      source: "voice",
    }

    await queueEvent(base)
    await queueEvent(base)

    await expect(localDb.events.count()).resolves.toBe(1)
  })
})

describe("getUnsyncedEvents", () => {
  it("returns only events that have not been synced yet", async () => {
    await queueEvent({ clientEventId: "a", vendorId: "v", kind: "SALE", payload: {}, occurredAt: new Date(), source: "voice" })
    await queueEvent({ clientEventId: "b", vendorId: "v", kind: "SALE", payload: {}, occurredAt: new Date(), source: "voice" })
    await markSynced("a")

    const unsynced = await getUnsyncedEvents()

    expect(unsynced.map((event) => event.clientEventId)).toEqual(["b"])
  })
})

describe("markSynced", () => {
  it("sets syncedAt to a timestamp", async () => {
    await queueEvent({ clientEventId: "c", vendorId: "v", kind: "PAYMENT", payload: {}, occurredAt: new Date(), source: "voice" })

    await markSynced("c")

    const stored = await localDb.events.get("c")
    expect(stored?.syncedAt).toBeInstanceOf(Date)
  })
})

describe("getEventsForVendor", () => {
  it("returns only events belonging to the given vendor", async () => {
    await queueEvent({ clientEventId: "v1-a", vendorId: "vendor-1", kind: "SALE", payload: {}, occurredAt: new Date(), source: "voice" })
    await queueEvent({ clientEventId: "v1-b", vendorId: "vendor-1", kind: "SAVING", payload: {}, occurredAt: new Date(), source: "tap" })
    await queueEvent({ clientEventId: "v2-a", vendorId: "vendor-2", kind: "SALE", payload: {}, occurredAt: new Date(), source: "voice" })

    const events = await getEventsForVendor("vendor-1")

    expect(events.map((event) => event.clientEventId).sort()).toEqual(["v1-a", "v1-b"])
  })
})
