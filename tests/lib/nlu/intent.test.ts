import { describe, expect, it } from "vitest"
import { rwf } from "@/lib/money"
import { validateIntent } from "@/lib/nlu/intent"

describe("validateIntent — SALE", () => {
  it("accepts a well-formed sale candidate", () => {
    const candidate = {
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 4, unitPrice: 100 }],
      total: 400,
      confidence: 0.92,
    }
    expect(validateIntent(candidate, "naguze amandazi ane")).toEqual({
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 4, unitPrice: rwf(100) }],
      total: rwf(400),
      confidence: 0.92,
    })
  })

  it("accepts a sale with no items priced individually, only a total", () => {
    const candidate = {
      kind: "SALE",
      items: [{ productName: "umugati", qty: 1 }],
      total: 500,
      confidence: 0.8,
    }
    expect(validateIntent(candidate, "raw")).toMatchObject({ kind: "SALE" })
  })

  it("falls back to UNKNOWN when items is empty", () => {
    const candidate = { kind: "SALE", items: [], confidence: 0.9 }
    expect(validateIntent(candidate, "raw transcript")).toEqual({
      kind: "UNKNOWN",
      raw: "raw transcript",
    })
  })

  it("falls back to UNKNOWN when confidence is out of range", () => {
    const candidate = {
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 1 }],
      confidence: 1.5,
    }
    expect(validateIntent(candidate, "raw transcript").kind).toBe("UNKNOWN")
  })
})

describe("validateIntent — DEBT", () => {
  it("accepts a well-formed debt candidate", () => {
    const candidate = {
      kind: "DEBT",
      customer: "Claudine",
      items: [{ productName: "amandazi", qty: 2, unitPrice: 100 }],
      amount: 200,
    }
    expect(validateIntent(candidate, "raw")).toEqual({
      kind: "DEBT",
      customer: "Claudine",
      items: [{ productName: "amandazi", qty: 2, unitPrice: rwf(100) }],
      amount: rwf(200),
    })
  })

  it("falls back to UNKNOWN when customer is missing", () => {
    const candidate = { kind: "DEBT", items: [], amount: 200 }
    expect(validateIntent(candidate, "raw").kind).toBe("UNKNOWN")
  })
})

describe("validateIntent — PAYMENT", () => {
  it("accepts a well-formed payment candidate", () => {
    const candidate = { kind: "PAYMENT", customer: "Jane", amount: 1000 }
    expect(validateIntent(candidate, "raw")).toEqual({
      kind: "PAYMENT",
      customer: "Jane",
      amount: rwf(1000),
    })
  })

  it("falls back to UNKNOWN when amount is negative", () => {
    const candidate = { kind: "PAYMENT", customer: "Jane", amount: -50 }
    expect(validateIntent(candidate, "raw").kind).toBe("UNKNOWN")
  })
})

describe("validateIntent — STOCK_IN", () => {
  it("accepts a well-formed stock-in candidate", () => {
    const candidate = { kind: "STOCK_IN", item: "amandazi", qty: 50, unitCost: 80 }
    expect(validateIntent(candidate, "raw")).toEqual({
      kind: "STOCK_IN",
      item: "amandazi",
      qty: 50,
      unitCost: rwf(80),
    })
  })

  it("falls back to UNKNOWN when qty is not a whole number", () => {
    const candidate = { kind: "STOCK_IN", item: "amandazi", qty: 2.5 }
    expect(validateIntent(candidate, "raw").kind).toBe("UNKNOWN")
  })
})

describe("validateIntent — SAVING", () => {
  it("accepts a well-formed saving candidate", () => {
    const candidate = { kind: "SAVING", amount: 2000 }
    expect(validateIntent(candidate, "raw")).toEqual({
      kind: "SAVING",
      amount: rwf(2000),
    })
  })
})

describe("validateIntent — fallback behaviour", () => {
  it("returns UNKNOWN with the raw transcript for an unrecognised kind", () => {
    expect(validateIntent({ kind: "GREETING" }, "muraho")).toEqual({
      kind: "UNKNOWN",
      raw: "muraho",
    })
  })

  it("returns UNKNOWN for null/garbage input without throwing", () => {
    expect(validateIntent(null, "raw")).toEqual({ kind: "UNKNOWN", raw: "raw" })
    expect(validateIntent(undefined, "raw")).toEqual({ kind: "UNKNOWN", raw: "raw" })
    expect(validateIntent("just a string", "raw")).toEqual({ kind: "UNKNOWN", raw: "raw" })
  })

  it("never writes on a partial candidate — a money field as a float is rejected, not rounded", () => {
    const candidate = { kind: "SAVING", amount: 2000.5 }
    expect(validateIntent(candidate, "raw")).toEqual({ kind: "UNKNOWN", raw: "raw" })
  })
})
