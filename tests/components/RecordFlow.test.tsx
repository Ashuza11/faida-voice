import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import RecordFlow from "@/components/RecordFlow"
import { localDb } from "@/lib/db/local"
import { upsertCustomer, upsertProduct, upsertVendor } from "@/lib/db/local-vendors"
import { rwf } from "@/lib/money"

const VENDOR_ID = "vendor-test"

beforeEach(async () => {
  await localDb.events.clear()
  await localDb.vendors.clear()
  await localDb.products.clear()
  await localDb.customers.clear()

  await upsertVendor({ id: VENDOR_ID, name: "Jane", businessType: "bakery", createdAt: new Date() })
  await upsertProduct({
    id: "product-umugati",
    vendorId: VENDOR_ID,
    nameRw: "umugati",
    unitPrice: rwf(300),
    tracksStock: true,
    stockQty: 10,
  })
  await upsertCustomer({ id: "customer-eric", vendorId: VENDOR_ID, name: "Eric", phone: null })
})

async function selectKind(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole("button", { name: label }))
}

describe("RecordFlow — tap path", () => {
  it("queues a SALE event after tap entry and confirmation", async () => {
    const user = userEvent.setup()
    render(<RecordFlow vendorId={VENDOR_ID} />)

    await selectKind(user, "Kugurisha")
    await user.click(await screen.findByRole("button", { name: "umugati" }))
    await user.click(screen.getByRole("button", { name: "+" }))
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(await screen.findByText("600 RWF")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /confirm/i }))

    await waitFor(async () => {
      const events = await localDb.events.where("vendorId").equals(VENDOR_ID).toArray()
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        kind: "SALE",
        vendorId: VENDOR_ID,
        source: "tap",
        payload: { total: rwf(600) },
      })
    })

    // back at the start of the flow, ready to record the next event
    expect(await screen.findByRole("button", { name: "Kugurisha" })).toBeInTheDocument()
  })

  it("queues nothing when the confirmation card is discarded", async () => {
    const user = userEvent.setup()
    render(<RecordFlow vendorId={VENDOR_ID} />)

    await selectKind(user, "Kuzigama")
    await user.type(screen.getByLabelText(/amount/i), "500")
    await user.click(screen.getByRole("button", { name: /add/i }))

    await user.click(await screen.findByRole("button", { name: /discard/i }))

    const events = await localDb.events.where("vendorId").equals(VENDOR_ID).toArray()
    expect(events).toHaveLength(0)
    expect(await screen.findByRole("button", { name: "Kuzigama" })).toBeInTheDocument()
  })
})

describe("RecordFlow — voice path (typed fallback)", () => {
  it("resolves a transcript deterministically and queues it with source voice", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    render(<RecordFlow vendorId={VENDOR_ID} />)

    await selectKind(user, "Kugurisha")
    await user.type(screen.getByPlaceholderText(/type instead/i), "umugati kabiri")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(await screen.findByText("600 RWF")).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /confirm/i }))

    await waitFor(async () => {
      const events = await localDb.events.where("vendorId").equals(VENDOR_ID).toArray()
      expect(events).toHaveLength(1)
      expect(events[0].source).toBe("voice")
    })

    fetchSpy.mockRestore()
  })

  it("shows the discard-only UNKNOWN card when nothing can be resolved", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ productName: null, customerName: null }),
    } as Response)
    const user = userEvent.setup()
    render(<RecordFlow vendorId={VENDOR_ID} />)

    await selectKind(user, "Kugurisha")
    await user.type(screen.getByPlaceholderText(/type instead/i), "completely unrelated noise")
    await user.click(screen.getByRole("button", { name: /send/i }))

    expect(await screen.findByText(/didn't catch that/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
