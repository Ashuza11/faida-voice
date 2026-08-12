import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import TapEntry from "@/components/TapEntry"
import { rwf } from "@/lib/money"

const products = [
  { nameRw: "amandazi", unitPrice: rwf(100) },
  { nameRw: "umugati", unitPrice: rwf(300) },
]
const customers = [{ name: "Eric" }, { name: "Divine" }]

describe("TapEntry — SALE", () => {
  it("submits a candidate for the selected product and quantity", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="SALE" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "amandazi" }))
    await user.click(screen.getByRole("button", { name: "+" }))
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "SALE",
      items: [{ productName: "amandazi", qty: 2, unitPrice: rwf(100) }],
      total: rwf(200),
      confidence: 1,
    })
  })

  it("does not submit until a product is selected", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="SALE" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe("TapEntry — DEBT", () => {
  it("submits an item-based candidate when a product is selected", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="DEBT" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Eric" }))
    await user.click(screen.getByRole("button", { name: "umugati" }))
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "DEBT",
      customer: "Eric",
      items: [{ productName: "umugati", qty: 1, unitPrice: rwf(300) }],
      amount: rwf(300),
    })
  })

  it("submits a bare-amount candidate when no product is selected", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="DEBT" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Eric" }))
    await user.type(screen.getByLabelText(/amount/i), "2000")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledWith({ kind: "DEBT", customer: "Eric", items: [], amount: rwf(2000) })
  })

  it("does not submit until a customer is selected", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="DEBT" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/amount/i), "2000")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe("TapEntry — PAYMENT", () => {
  it("submits customer and amount", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="PAYMENT" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.click(screen.getByRole("button", { name: "Eric" }))
    await user.type(screen.getByLabelText(/amount/i), "500")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledWith({ kind: "PAYMENT", customer: "Eric", amount: rwf(500) })
  })
})

describe("TapEntry — SAVING", () => {
  it("submits the amount with no customer or product needed", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TapEntry kind="SAVING" products={products} customers={customers} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/amount/i), "1000")
    await user.click(screen.getByRole("button", { name: /add/i }))

    expect(onSubmit).toHaveBeenCalledWith({ kind: "SAVING", amount: rwf(1000) })
  })
})
