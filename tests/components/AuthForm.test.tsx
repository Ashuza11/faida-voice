import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import LoginForm from "@/components/LoginForm"
import SignupForm from "@/components/SignupForm"

describe("LoginForm", () => {
  it("renders email field, password field, and Login button", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument()
  })

  it("contains a link to /signup", () => {
    render(<LoginForm />)
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/signup")
  })

  it("password field defaults to type password", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password")
  })

  it("toggles password visibility", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    const input = screen.getByLabelText(/^password$/i)

    await user.click(screen.getByRole("button", { name: /show password/i }))
    expect(input).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: /hide password/i }))
    expect(input).toHaveAttribute("type", "password")
  })

  it("logs email and password on submit", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "test@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "secret123")
    await user.click(screen.getByRole("button", { name: /^login$/i }))

    expect(console.log).toHaveBeenCalledWith({ email: "test@example.com", password: "secret123" })
  })
})

describe("SignupForm", () => {
  it("renders email field, password field, and Sign Up button", () => {
    render(<SignupForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument()
  })

  it("contains a link to /login", () => {
    render(<SignupForm />)
    expect(screen.getByRole("link", { name: /^login$/i })).toHaveAttribute("href", "/login")
  })

  it("password field defaults to type password", () => {
    render(<SignupForm />)
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password")
  })

  it("toggles password visibility", async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    const input = screen.getByLabelText(/^password$/i)

    await user.click(screen.getByRole("button", { name: /show password/i }))
    expect(input).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: /hide password/i }))
    expect(input).toHaveAttribute("type", "password")
  })

  it("logs email and password on submit", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<SignupForm />)

    await user.type(screen.getByLabelText(/email/i), "new@example.com")
    await user.type(screen.getByLabelText(/^password$/i), "newpass456")
    await user.click(screen.getByRole("button", { name: /sign up/i }))

    expect(console.log).toHaveBeenCalledWith({ email: "new@example.com", password: "newpass456" })
  })
})
