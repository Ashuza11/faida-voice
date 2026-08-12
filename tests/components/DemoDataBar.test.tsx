import "fake-indexeddb/auto"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import DemoDataBar from "@/components/DemoDataBar"
import { localDb } from "@/lib/db/local"

beforeEach(async () => {
  await localDb.vendors.clear()
  await localDb.products.clear()
  await localDb.customers.clear()
  await localDb.events.clear()
})

describe("DemoDataBar", () => {
  it("seeds Dexie and updates its label when clicked", async () => {
    const user = userEvent.setup()
    render(<DemoDataBar />)

    expect(await localDb.vendors.count()).toBe(0)
    await user.click(screen.getByRole("button", { name: /load demo data/i }))

    expect(await screen.findByRole("button", { name: /demo data loaded/i })).toBeDisabled()
    expect(await localDb.vendors.count()).toBe(2)
  })
})
