import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import ConfirmationCard from "@/components/ConfirmationCard"
import { rwf } from "@/lib/money"
import type { Intent } from "@/lib/nlu/intent"

describe("ConfirmationCard", () => {
  it("renders a SALE intent with items and total", () => {
    const intent: Intent = {
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 2, unitPrice: rwf(100) }],
      total: rwf(200),
      confidence: 1,
    }
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={() => {}} />)

    expect(screen.getByText(/amandazi/i)).toBeInTheDocument()
    expect(screen.getByText("200 RWF")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled()
  })

  it("renders a DEBT intent with customer and amount", () => {
    const intent: Intent = { kind: "DEBT", customer: "Eric", items: [], amount: rwf(2000) }
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={() => {}} />)

    expect(screen.getByText(/eric/i)).toBeInTheDocument()
    expect(screen.getByText("2,000 RWF")).toBeInTheDocument()
  })

  it("renders a PAYMENT intent with customer and amount", () => {
    const intent: Intent = { kind: "PAYMENT", customer: "Eric", amount: rwf(500) }
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={() => {}} />)

    expect(screen.getByText(/eric/i)).toBeInTheDocument()
    expect(screen.getByText("500 RWF")).toBeInTheDocument()
  })

  it("renders a SAVING intent with amount", () => {
    const intent: Intent = { kind: "SAVING", amount: rwf(1000) }
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={() => {}} />)

    expect(screen.getByText("1,000 RWF")).toBeInTheDocument()
  })

  it("renders an UNKNOWN intent with no enabled confirm action", () => {
    const intent: Intent = { kind: "UNKNOWN", raw: "murakoze" }
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={() => {}} />)

    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument()
  })

  it("calls onConfirm with the intent when Confirm is tapped", async () => {
    const onConfirm = vi.fn()
    const intent: Intent = { kind: "SAVING", amount: rwf(500) }
    const user = userEvent.setup()
    render(<ConfirmationCard intent={intent} onConfirm={onConfirm} onDiscard={() => {}} />)

    await user.click(screen.getByRole("button", { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledWith(intent)
  })

  it("calls onDiscard when Discard is tapped", async () => {
    const onDiscard = vi.fn()
    const intent: Intent = { kind: "SAVING", amount: rwf(500) }
    const user = userEvent.setup()
    render(<ConfirmationCard intent={intent} onConfirm={() => {}} onDiscard={onDiscard} />)

    await user.click(screen.getByRole("button", { name: /discard/i }))

    expect(onDiscard).toHaveBeenCalled()
  })
})
