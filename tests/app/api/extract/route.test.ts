// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { POST } from "@/app/api/extract/route"

function postRequest(body: unknown) {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/extract — validation", () => {
  it("returns 400 for a malformed body", async () => {
    const response = await POST(postRequest({ transcript: "" }))
    expect(response.status).toBe(400)
  })

  it("returns 400 for an unparseable JSON body", async () => {
    const request = new Request("http://localhost/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe("POST /api/extract — happy path", () => {
  // Force the "no key configured" branch regardless of the developer's real
  // .env.local, so this never makes a real (paid, nondeterministic) API
  // call in the test suite — it only proves the route's wiring degrades
  // gracefully rather than 500ing, mirroring extractEntities's own
  // graceful-degradation unit tests in tests/lib/nlu/extract-llm.test.ts.
  const originalKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalKey
    }
  })

  it("resolves entities without throwing when no API key is configured", async () => {
    const body = {
      transcript: "umugati kuri Eric",
      products: [{ nameRw: "umugati", unitPrice: 300 }],
      customers: [{ name: "Eric" }],
    }

    const response = await POST(postRequest(body))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ productName: null, customerName: null })
  })
})
