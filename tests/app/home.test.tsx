import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Home from "@/app/(public)/page"

describe("Home", () => {
  it("links to /record and /report", () => {
    render(<Home />)

    expect(screen.getByRole("link", { name: /start recording/i })).toHaveAttribute("href", "/record")
    expect(screen.getByRole("link", { name: /view report/i })).toHaveAttribute("href", "/report")
  })
})
