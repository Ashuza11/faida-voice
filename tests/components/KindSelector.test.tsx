import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import KindSelector from "@/components/KindSelector"

describe("KindSelector", () => {
  it("renders a button for each recordable kind", () => {
    render(<KindSelector onSelect={() => {}} />)

    expect(screen.getByRole("button", { name: /kugurisha/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /debt/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /kwishyura/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /kuzigama/i })).toBeInTheDocument()
  })

  it("calls onSelect with the SALE kind when the sale button is tapped", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<KindSelector onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: /kugurisha/i }))

    expect(onSelect).toHaveBeenCalledWith("SALE")
  })

  it("calls onSelect with the DEBT kind when the debt button is tapped", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<KindSelector onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: /debt/i }))

    expect(onSelect).toHaveBeenCalledWith("DEBT")
  })
})
