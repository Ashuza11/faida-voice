import { describe, expect, it } from "vitest"
import type { LocalEvent } from "@/lib/db/local"
import { computeConsistencySignal, computeDailyTotals, computeOutstandingBalances } from "@/lib/credit"

function event(overrides: Partial<LocalEvent> & Pick<LocalEvent, "clientEventId" | "kind" | "payload" | "occurredAt">): LocalEvent {
  return {
    vendorId: "vendor-jane",
    source: "tap",
    syncedAt: null,
    ...overrides,
  }
}

describe("computeDailyTotals", () => {
  it("sums SALE totals per UTC day", () => {
    const events = [
      event({
        clientEventId: "a",
        kind: "SALE",
        payload: { items: [{ productName: "amandazi", qty: 4, unitPrice: 100 }], total: 400, confidence: 1 },
        occurredAt: new Date("2026-08-01T08:00:00Z"),
      }),
      event({
        clientEventId: "b",
        kind: "SALE",
        payload: { items: [{ productName: "umugati", qty: 1, unitPrice: 300 }], total: 300, confidence: 1 },
        occurredAt: new Date("2026-08-01T18:00:00Z"),
      }),
      event({
        clientEventId: "c",
        kind: "SALE",
        payload: { items: [{ productName: "umugati", qty: 2, unitPrice: 300 }], total: 600, confidence: 1 },
        occurredAt: new Date("2026-08-02T09:00:00Z"),
      }),
    ]

    expect(computeDailyTotals(events)).toEqual([
      { date: "2026-08-01", total: 700 },
      { date: "2026-08-02", total: 600 },
    ])
  })

  it("ignores non-SALE events and events with no parseable payload", () => {
    const events = [
      event({ clientEventId: "d", kind: "SAVING", payload: { amount: 500 }, occurredAt: new Date("2026-08-01T08:00:00Z") }),
      event({ clientEventId: "e", kind: "SALE", payload: { garbage: true }, occurredAt: new Date("2026-08-01T08:00:00Z") }),
    ]

    expect(computeDailyTotals(events)).toEqual([])
  })
})

describe("computeOutstandingBalances", () => {
  it("nets DEBT against PAYMENT per customer", () => {
    const events = [
      event({
        clientEventId: "a",
        kind: "DEBT",
        payload: { customer: "Eric", items: [], amount: 2000 },
        occurredAt: new Date("2026-08-01T08:00:00Z"),
      }),
      event({
        clientEventId: "b",
        kind: "PAYMENT",
        payload: { customer: "Eric", amount: 500 },
        occurredAt: new Date("2026-08-02T08:00:00Z"),
      }),
      event({
        clientEventId: "c",
        kind: "DEBT",
        payload: { customer: "Aline", items: [], amount: 1000 },
        occurredAt: new Date("2026-08-03T08:00:00Z"),
      }),
    ]

    expect(computeOutstandingBalances(events)).toEqual([
      { customer: "Eric", outstanding: 1500 },
      { customer: "Aline", outstanding: 1000 },
    ])
  })

  it("omits a customer once their balance is fully paid off", () => {
    const events = [
      event({ clientEventId: "a", kind: "DEBT", payload: { customer: "Eric", items: [], amount: 1000 }, occurredAt: new Date("2026-08-01T08:00:00Z") }),
      event({ clientEventId: "b", kind: "PAYMENT", payload: { customer: "Eric", amount: 1000 }, occurredAt: new Date("2026-08-02T08:00:00Z") }),
    ]

    expect(computeOutstandingBalances(events)).toEqual([])
  })
})

describe("computeConsistencySignal", () => {
  it("counts days recorded vs. days elapsed, and the current streak", () => {
    const today = new Date("2026-08-05T12:00:00Z")
    const events = [
      event({ clientEventId: "a", kind: "SAVING", payload: { amount: 100 }, occurredAt: new Date("2026-08-01T08:00:00Z") }),
      // 2026-08-02 is a gap day — no event
      event({ clientEventId: "b", kind: "SAVING", payload: { amount: 100 }, occurredAt: new Date("2026-08-03T08:00:00Z") }),
      event({ clientEventId: "c", kind: "SAVING", payload: { amount: 100 }, occurredAt: new Date("2026-08-04T08:00:00Z") }),
    ]

    const signal = computeConsistencySignal(events, today)

    expect(signal.daysElapsed).toBe(5) // Aug 1 through Aug 5, inclusive
    expect(signal.daysRecorded).toBe(3) // Aug 1, 3, 4
    expect(signal.currentStreak).toBe(2) // Aug 3-4, back from the most recent recorded day
  })

  it("returns all zeros for no events", () => {
    expect(computeConsistencySignal([], new Date("2026-08-05T12:00:00Z"))).toEqual({
      daysElapsed: 0,
      daysRecorded: 0,
      currentStreak: 0,
    })
  })

  it("never scores by revenue size — a single tiny saving counts the same as a big sale day", () => {
    const today = new Date("2026-08-01T12:00:00Z")
    const tinyDay = computeConsistencySignal(
      [event({ clientEventId: "a", kind: "SAVING", payload: { amount: 1 }, occurredAt: new Date("2026-08-01T08:00:00Z") })],
      today,
    )
    const bigDay = computeConsistencySignal(
      [
        event({
          clientEventId: "a",
          kind: "SALE",
          payload: { items: [{ productName: "umugati", qty: 1, unitPrice: 999999 }], total: 999999, confidence: 1 },
          occurredAt: new Date("2026-08-01T08:00:00Z"),
        }),
      ],
      today,
    )

    expect(tinyDay).toEqual(bigDay)
  })
})
