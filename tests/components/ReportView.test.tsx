import "fake-indexeddb/auto"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import ReportView from "@/components/ReportView"
import { localDb, queueEvent } from "@/lib/db/local"
import { rwf } from "@/lib/money"

const VENDOR_ID = "vendor-test"

function daysAgo(offset: number): Date {
  const date = new Date()
  date.setUTCHours(10, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - offset)
  return date
}

beforeEach(async () => {
  await localDb.events.clear()
})

describe("ReportView — with recorded history", () => {
  beforeEach(async () => {
    await queueEvent({
      clientEventId: "evt-sale-1",
      vendorId: VENDOR_ID,
      kind: "SALE",
      payload: { items: [{ productName: "umugati", qty: 2, unitPrice: rwf(300) }], total: rwf(600), confidence: 1 },
      occurredAt: daysAgo(1),
      source: "tap",
    })
    await queueEvent({
      clientEventId: "evt-sale-2",
      vendorId: VENDOR_ID,
      kind: "SALE",
      payload: { items: [{ productName: "umugati", qty: 1, unitPrice: rwf(300) }], total: rwf(300), confidence: 1 },
      occurredAt: daysAgo(0),
      source: "tap",
    })
    await queueEvent({
      clientEventId: "evt-debt-1",
      vendorId: VENDOR_ID,
      kind: "DEBT",
      payload: { customer: "Eric", items: [], amount: rwf(2000) },
      occurredAt: daysAgo(1),
      source: "tap",
    })
    await queueEvent({
      clientEventId: "evt-payment-1",
      vendorId: VENDOR_ID,
      kind: "PAYMENT",
      payload: { customer: "Eric", amount: rwf(500) },
      occurredAt: daysAgo(0),
      source: "tap",
    })
    // A gap day (offset 2 skipped) so daysRecorded/daysElapsed/currentStreak
    // land on three distinct numbers, instead of everything coincidentally
    // being 2 and making a single getByText("2") ambiguous.
    await queueEvent({
      clientEventId: "evt-sale-3",
      vendorId: VENDOR_ID,
      kind: "SALE",
      payload: { items: [{ productName: "umugati", qty: 1, unitPrice: rwf(300) }], total: rwf(300), confidence: 1 },
      occurredAt: daysAgo(3),
      source: "tap",
    })
    // A different vendor's data must never leak into this vendor's report.
    await queueEvent({
      clientEventId: "evt-other-vendor",
      vendorId: "vendor-other",
      kind: "SALE",
      payload: { items: [], total: rwf(99_999), confidence: 1 },
      occurredAt: daysAgo(0),
      source: "tap",
    })
  })

  it("renders a bar per recorded day and the outstanding balance", async () => {
    render(<ReportView vendorId={VENDOR_ID} />)

    const chart = await screen.findByRole("img", { name: /daily sales totals/i })
    expect(chart.querySelectorAll("rect")).toHaveLength(3)

    expect(screen.getByText("Eric")).toBeInTheDocument()
    expect(screen.getByText("1,500 RWF")).toBeInTheDocument()
    expect(screen.queryByText(/99,999/)).not.toBeInTheDocument()
  })

  it("shows days recorded, days elapsed, and the current streak from the consistency signal", async () => {
    render(<ReportView vendorId={VENDOR_ID} />)

    await screen.findByText("Consistency")
    // A gap at offset 2 makes these three deliberately distinct: 3 days
    // recorded (0, 1, 3) over 4 elapsed days, with a 2-day current streak.
    expect(screen.getByText("Days recorded").nextElementSibling).toHaveTextContent("3")
    expect(screen.getByText("Days elapsed").nextElementSibling).toHaveTextContent("4")
    expect(screen.getByText("Current streak").nextElementSibling).toHaveTextContent("2")
  })
})

describe("ReportView — no history yet", () => {
  it("shows empty states instead of an empty chart or crashing", async () => {
    render(<ReportView vendorId={VENDOR_ID} />)

    expect(await screen.findByText(/no sales recorded yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no outstanding balances/i)).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: /daily sales totals/i })).not.toBeInTheDocument()
  })
})
