import { describe, expect, it } from "vitest"
import { syncEventSchema } from "@/lib/sync/schema"

describe("syncEventSchema", () => {
  const valid = {
    vendorId: "11111111-1111-1111-1111-111111111111",
    kind: "SALE",
    payload: { total: 400 },
    occurredAt: "2026-08-12T10:00:00.000Z",
    source: "voice",
    clientEventId: "22222222-2222-2222-2222-222222222222",
  }

  it("accepts a well-formed event", () => {
    expect(syncEventSchema.safeParse(valid).success).toBe(true)
  })

  it("coerces occurredAt into a Date", () => {
    const result = syncEventSchema.parse(valid)
    expect(result.occurredAt).toBeInstanceOf(Date)
  })

  it("rejects an unknown event kind", () => {
    expect(syncEventSchema.safeParse({ ...valid, kind: "REFUND" }).success).toBe(false)
  })

  it("rejects a non-uuid vendorId", () => {
    expect(syncEventSchema.safeParse({ ...valid, vendorId: "not-a-uuid" }).success).toBe(false)
  })

  it("rejects a non-uuid clientEventId", () => {
    expect(syncEventSchema.safeParse({ ...valid, clientEventId: "not-a-uuid" }).success).toBe(false)
  })

  it("rejects a missing source", () => {
    const { source: _source, ...rest } = valid
    expect(syncEventSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects an unparseable occurredAt", () => {
    expect(syncEventSchema.safeParse({ ...valid, occurredAt: "not-a-date" }).success).toBe(false)
  })

  it("rejects a missing payload", () => {
    const { payload: _payload, ...rest } = valid
    expect(syncEventSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects a non-object payload", () => {
    expect(syncEventSchema.safeParse({ ...valid, payload: "not an object" }).success).toBe(false)
  })
})
