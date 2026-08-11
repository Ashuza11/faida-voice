import { describe, expect, it } from "vitest"
import { parseKinyarwandaNumber } from "@/lib/nlu/numbers"

describe("parseKinyarwandaNumber", () => {
  it.each([
    ["zeru", 0],
    ["rimwe", 1],
    ["kabiri", 2],
    ["gatatu", 3],
    ["kane", 4],
    ["gatanu", 5],
    ["gatandatu", 6],
    ["karindwi", 7],
    ["umunani", 8],
    ["icyenda", 9],
    ["icumi", 10],
    ["ijana", 100],
    ["igihumbi", 1000],
    ["magana atanu", 500],
    ["ibihumbi bibiri", 2000],
    ["ibihumbi bitanu", 5000],
  ])("parses %s as %i", (phrase, expected) => {
    expect(parseKinyarwandaNumber(phrase)).toBe(expected)
  })

  it("is case-insensitive and trims whitespace", () => {
    expect(parseKinyarwandaNumber("  Ibihumbi Bibiri  ")).toBe(2000)
  })

  it("collapses repeated internal whitespace", () => {
    expect(parseKinyarwandaNumber("magana   atanu")).toBe(500)
  })

  it("returns null for a phrase outside the verified word list", () => {
    expect(parseKinyarwandaNumber("mirongo itandatu")).toBeNull()
  })

  it("returns null for unrelated speech", () => {
    expect(parseKinyarwandaNumber("murakoze cyane")).toBeNull()
  })
})
