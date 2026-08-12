// @vitest-environment node
import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { POST } from "@/app/api/sync/route"
import { insertVendor } from "@/lib/db/repositories/vendors"

function postRequest(body: unknown) {
  return new Request("http://localhost/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/sync — validation", () => {
  it("returns 400 for a malformed body", async () => {
    const response = await POST(postRequest({ kind: "SALE" }))
    expect(response.status).toBe(400)
  })

  it("returns 400 for an unparseable JSON body", async () => {
    const request = new Request("http://localhost/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe.skipIf(!process.env.DATABASE_URL)("POST /api/sync — persistence", () => {
  it("is idempotent on client_event_id", async () => {
    const vendor = await insertVendor({ name: "Jane", businessType: "bakery" })
    const body = {
      vendorId: vendor.id,
      kind: "SALE",
      payload: { total: 400 },
      occurredAt: new Date().toISOString(),
      source: "voice",
      clientEventId: randomUUID(),
    }

    const first = await POST(postRequest(body))
    const second = await POST(postRequest(body))
    const firstJson = await first.json()
    const secondJson = await second.json()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(secondJson.id).toBe(firstJson.id)
  })
})
