import { describe, expect, it } from "vitest"
import { addMoney, formatMoney, multiplyMoney, rwf, subtractMoney, sumMoney, zeroMoney } from "@/lib/money"

describe("rwf", () => {
  it("accepts a non-negative integer", () => {
    expect(rwf(2000)).toBe(2000)
  })

  it("rejects a fractional amount", () => {
    expect(() => rwf(2000.5)).toThrow()
  })

  it("rejects a negative amount", () => {
    expect(() => rwf(-100)).toThrow()
  })
})

describe("addMoney / subtractMoney", () => {
  it("adds two amounts", () => {
    expect(addMoney(rwf(2000), rwf(500))).toBe(2500)
  })

  it("subtracts two amounts", () => {
    expect(subtractMoney(rwf(2000), rwf(500))).toBe(1500)
  })

  it("throws rather than going negative", () => {
    expect(() => subtractMoney(rwf(500), rwf(2000))).toThrow()
  })
})

describe("multiplyMoney", () => {
  it("multiplies a unit price by a quantity", () => {
    expect(multiplyMoney(rwf(500), 4)).toBe(2000)
  })

  it("rejects a fractional quantity", () => {
    expect(() => multiplyMoney(rwf(500), 1.5)).toThrow()
  })
})

describe("sumMoney", () => {
  it("sums a list of amounts", () => {
    expect(sumMoney([rwf(2000), rwf(500), rwf(100)])).toBe(2600)
  })

  it("returns zero for an empty list", () => {
    expect(sumMoney([])).toBe(zeroMoney)
  })
})

describe("formatMoney", () => {
  it("formats with thousands separators and an RWF suffix", () => {
    expect(formatMoney(rwf(2500))).toBe("2,500 RWF")
  })

  it("formats zero", () => {
    expect(formatMoney(zeroMoney)).toBe("0 RWF")
  })
})
