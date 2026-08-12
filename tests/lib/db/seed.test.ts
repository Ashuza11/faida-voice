import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { localDb } from "@/lib/db/local"
import { getCustomersForVendor, getProductsForVendor, listVendors } from "@/lib/db/local-vendors"
import { seedDemoData } from "@/lib/db/seed"

beforeEach(async () => {
  await Promise.all([localDb.vendors.clear(), localDb.products.clear(), localDb.customers.clear(), localDb.events.clear()])
})

describe("seedDemoData", () => {
  it("creates the Jane and Claudine vendors with their real product names", async () => {
    await seedDemoData()

    const vendors = await listVendors()
    expect(vendors.map((v) => v.name).sort()).toEqual(["Claudine", "Jane"])

    const janeProducts = await getProductsForVendor("vendor-jane")
    expect(janeProducts.map((p) => p.nameRw).sort()).toEqual(["amandazi", "umugati"])
  })

  it("creates at least one customer per vendor", async () => {
    await seedDemoData()

    await expect(getCustomersForVendor("vendor-jane")).resolves.not.toHaveLength(0)
    await expect(getCustomersForVendor("vendor-claudine")).resolves.not.toHaveLength(0)
  })

  it("backdates every event and seeds nothing for today", async () => {
    await seedDemoData()
    const events = await localDb.events.toArray()
    expect(events.length).toBeGreaterThan(0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const hasToday = events.some((event) => {
      const day = new Date(event.occurredAt)
      day.setHours(0, 0, 0, 0)
      return day.getTime() === today.getTime()
    })
    expect(hasToday).toBe(false)
  })

  it("leaves at least one gap day unrecorded for Jane", async () => {
    await seedDemoData()
    const events = await localDb.events.where("vendorId").equals("vendor-jane").toArray()
    const recordedDays = new Set(events.map((event) => new Date(event.occurredAt).toDateString()))

    expect(recordedDays.size).toBeLessThan(35)
  })

  it("is idempotent — calling it twice does not duplicate vendors or events", async () => {
    await seedDemoData()
    const firstEventCount = await localDb.events.count()

    await seedDemoData()

    await expect(listVendors()).resolves.toHaveLength(2)
    await expect(localDb.events.count()).resolves.toBe(firstEventCount)
  })
})
