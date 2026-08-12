import { describe, expect, it } from "vitest"
import { classifyDebt, classifyPayment, classifySale, classifySaving } from "@/lib/nlu/classify"
import { validateIntent } from "@/lib/nlu/intent"
import { rwf } from "@/lib/money"

/**
 * These transcripts are synthetic keyword-concatenation strings for
 * exercising the classifier's matching LOGIC only — they are NOT verified,
 * natural Kinyarwanda sentences and must never be copied into
 * fixtures/utterances.rw.json or treated as real vendor speech. See
 * ASSUMPTIONS.md.
 */

const products = [
  { nameRw: "amandazi", unitPrice: rwf(100) },
  { nameRw: "umugati", unitPrice: rwf(300) },
]
const customers = [{ name: "Eric" }, { name: "Divine" }]

describe("classifySale", () => {
  it("extracts product and quantity when the number follows the product name", () => {
    expect(classifySale("amandazi kabiri", products)).toEqual({
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 2, unitPrice: rwf(100) }],
      total: rwf(200),
      confidence: 1,
    })
  })

  it("extracts product and quantity when the number precedes the product name (order-independent)", () => {
    expect(classifySale("kabiri amandazi", products)).toEqual({
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 2, unitPrice: rwf(100) }],
      total: rwf(200),
      confidence: 1,
    })
  })

  it("rejects when no known product is mentioned", () => {
    expect(classifySale("kabiri", products)).toEqual({ kind: "SALE" })
  })

  it("rejects when more than one known product is mentioned — never guesses which one", () => {
    expect(classifySale("amandazi umugati kabiri", products)).toEqual({ kind: "SALE" })
  })

  it("rejects when no verified number is found", () => {
    expect(classifySale("amandazi menshi", products)).toEqual({ kind: "SALE" })
  })
})

describe("classifyDebt", () => {
  it("extracts customer, product, and quantity", () => {
    expect(classifyDebt("Eric umugati kabiri", products, customers)).toEqual({
      kind: "DEBT",
      customer: "Eric",
      items: [{ productName: "umugati", qty: 2, unitPrice: rwf(300) }],
      amount: rwf(600),
    })
  })

  it("extracts a bare amount when no product is mentioned", () => {
    expect(classifyDebt("Eric ibihumbi bibiri", products, customers)).toEqual({
      kind: "DEBT",
      customer: "Eric",
      items: [],
      amount: rwf(2000),
    })
  })

  it("rejects when no known customer is mentioned", () => {
    expect(classifyDebt("umugati kabiri", products, customers)).toEqual({ kind: "DEBT" })
  })

  it("rejects when more than one known customer is mentioned", () => {
    expect(classifyDebt("Eric Divine kabiri", products, customers)).toEqual({ kind: "DEBT" })
  })

  it("rejects when more than one product is mentioned, even with a valid customer and number", () => {
    expect(classifyDebt("Eric amandazi umugati kabiri", products, customers)).toEqual({ kind: "DEBT" })
  })
})

describe("classifyPayment", () => {
  it("extracts customer and amount", () => {
    expect(classifyPayment("Eric magana atanu", customers)).toEqual({ kind: "PAYMENT", customer: "Eric", amount: rwf(500) })
  })

  it("rejects when no known customer is mentioned", () => {
    expect(classifyPayment("magana atanu", customers)).toEqual({ kind: "PAYMENT" })
  })

  it("rejects when no verified number is found", () => {
    expect(classifyPayment("Eric", customers)).toEqual({ kind: "PAYMENT" })
  })
})

describe("classifySaving", () => {
  it("extracts the amount", () => {
    expect(classifySaving("ijana")).toEqual({ kind: "SAVING", amount: rwf(100) })
  })

  it("rejects when no verified number is found", () => {
    expect(classifySaving("murakoze")).toEqual({ kind: "SAVING" })
  })
})

describe("classify* output composes with validateIntent", () => {
  it("a valid SALE candidate validates cleanly", () => {
    const candidate = classifySale("amandazi kabiri", products)
    expect(validateIntent(candidate, "amandazi kabiri").kind).toBe("SALE")
  })

  it("a rejected candidate always becomes UNKNOWN, never a partial write", () => {
    const candidate = classifySale("murakoze", products)
    expect(validateIntent(candidate, "murakoze")).toEqual({ kind: "UNKNOWN", raw: "murakoze" })
  })
})
