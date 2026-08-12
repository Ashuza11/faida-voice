import { describe, expect, it, vi } from "vitest"
import { resolveVoiceIntent } from "@/lib/nlu/resolve-voice-intent"
import { rwf } from "@/lib/money"

const products = [
  { nameRw: "amandazi", unitPrice: rwf(100) },
  { nameRw: "umugati", unitPrice: rwf(300) },
]
const customers = [{ name: "Eric" }, { name: "Divine" }]

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response
}

describe("resolveVoiceIntent — deterministic path", () => {
  it("resolves a SALE without calling the API when the deterministic matcher succeeds", async () => {
    const fetchImpl = vi.fn()

    const intent = await resolveVoiceIntent("SALE", "umugati kabiri", products, [], fetchImpl)

    expect(intent).toEqual({
      kind: "SALE",
      items: [{ productName: "umugati", qty: 2, unitPrice: rwf(300) }],
      total: rwf(600),
      confidence: 1,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe("resolveVoiceIntent — LLM fallback", () => {
  it("falls back to /api/extract when the deterministic matcher can't resolve a product", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ productName: "umugati", customerName: null }))

    const intent = await resolveVoiceIntent("SALE", "umugaati kabiri", products, [], fetchImpl)

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/extract",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ transcript: "umugaati kabiri", products, customers: [] }),
      }),
    )
    expect(intent).toEqual({
      kind: "SALE",
      items: [{ productName: "umugati", qty: 2, unitPrice: rwf(300) }],
      total: rwf(600),
      confidence: 1,
    })
  })

  it("resolves a DEBT via the fallback, routing the number to qty when a product is resolved", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ productName: "umugati", customerName: "Eric" }))

    const intent = await resolveVoiceIntent("DEBT", "umugaati kabiri kuri Eriki", products, customers, fetchImpl)

    expect(intent).toEqual({
      kind: "DEBT",
      customer: "Eric",
      items: [{ productName: "umugati", qty: 2, unitPrice: rwf(300) }],
      amount: rwf(600),
    })
  })

  it("resolves a DEBT via the fallback, routing the number to a bare amount when no product resolves", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ productName: null, customerName: "Eric" }))

    const intent = await resolveVoiceIntent("DEBT", "ibihumbi bibiri kuri Eriki", products, customers, fetchImpl)

    expect(intent).toEqual({ kind: "DEBT", customer: "Eric", items: [], amount: rwf(2000) })
  })

  it("stays UNKNOWN when the fallback also can't resolve anything", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ productName: null, customerName: null }))

    const intent = await resolveVoiceIntent("SALE", "completely unrelated noise", products, [], fetchImpl)

    expect(intent).toEqual({ kind: "UNKNOWN", raw: "completely unrelated noise" })
  })

  it("stays UNKNOWN, without throwing, when the fetch call fails outright", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network error"))

    const intent = await resolveVoiceIntent("SALE", "umugaati kabiri", products, [], fetchImpl)

    expect(intent).toEqual({ kind: "UNKNOWN", raw: "umugaati kabiri" })
  })

  it("stays UNKNOWN, without throwing, when the API responds with a non-OK status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false))

    const intent = await resolveVoiceIntent("SALE", "umugaati kabiri", products, [], fetchImpl)

    expect(intent).toEqual({ kind: "UNKNOWN", raw: "umugaati kabiri" })
  })

  it("does not call the API when there is no catalog to resolve against", async () => {
    const fetchImpl = vi.fn()

    const intent = await resolveVoiceIntent("SAVING", "completely unrelated noise", [], [], fetchImpl)

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(intent).toEqual({ kind: "UNKNOWN", raw: "completely unrelated noise" })
  })
})
