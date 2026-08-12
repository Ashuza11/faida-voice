import { describe, expect, it } from "vitest"
import { findKinyarwandaNumber, parseKinyarwandaNumber } from "@/lib/nlu/numbers"

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

describe("findKinyarwandaNumber", () => {
  it("finds a number word embedded in a longer transcript", () => {
    expect(findKinyarwandaNumber("nagurishije amandazi kabiri")).toBe(2)
  })

  it("finds a number word regardless of whether it comes before or after other words", () => {
    expect(findKinyarwandaNumber("kabiri amandazi")).toBe(2)
    expect(findKinyarwandaNumber("amandazi kabiri")).toBe(2)
  })

  it("prefers the longest matching phrase over a shorter one it contains", () => {
    // "ibihumbi bibiri" (2000) — "bibiri" alone isn't a verified word, but
    // this proves multi-word phrases are matched as a whole, not just their
    // first token.
    expect(findKinyarwandaNumber("nagurishije ibihumbi bibiri")).toBe(2000)
  })

  it("matches on word boundaries, not as a substring inside an unrelated word", () => {
    // "kane" (4) must not match inside "kanenshuro" or similar look-alikes.
    expect(findKinyarwandaNumber("kanenshuro")).toBeNull()
  })

  it("is case-insensitive", () => {
    expect(findKinyarwandaNumber("Amandazi KABIRI")).toBe(2)
  })

  it("returns null when no verified number word is present", () => {
    expect(findKinyarwandaNumber("murakoze cyane")).toBeNull()
  })
})
