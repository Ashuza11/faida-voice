import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { localDb } from "@/lib/db/local"
import {
  getCustomersForVendor,
  getProductsForVendor,
  getVendor,
  listVendors,
  upsertCustomer,
  upsertProduct,
  upsertVendor,
} from "@/lib/db/local-vendors"
import { rwf } from "@/lib/money"

beforeEach(async () => {
  await Promise.all([localDb.vendors.clear(), localDb.products.clear(), localDb.customers.clear()])
})

describe("upsertVendor / getVendor / listVendors", () => {
  it("stores and retrieves a vendor by id", async () => {
    await upsertVendor({ id: "vendor-jane", name: "Jane", businessType: "bakery", createdAt: new Date("2026-01-01") })

    await expect(getVendor("vendor-jane")).resolves.toMatchObject({ id: "vendor-jane", name: "Jane" })
  })

  it("returns undefined for an unknown vendor", async () => {
    await expect(getVendor("nope")).resolves.toBeUndefined()
  })

  it("is idempotent on id — upserting twice does not duplicate", async () => {
    const vendor = { id: "vendor-jane", name: "Jane", businessType: "bakery", createdAt: new Date() }
    await upsertVendor(vendor)
    await upsertVendor(vendor)

    await expect(listVendors()).resolves.toHaveLength(1)
  })

  it("lists all vendors", async () => {
    await upsertVendor({ id: "vendor-jane", name: "Jane", businessType: "bakery", createdAt: new Date() })
    await upsertVendor({ id: "vendor-claudine", name: "Claudine", businessType: "restaurant_bar", createdAt: new Date() })

    const vendors = await listVendors()
    expect(vendors.map((v) => v.id).sort()).toEqual(["vendor-claudine", "vendor-jane"])
  })
})

describe("upsertProduct / getProductsForVendor", () => {
  it("returns only products belonging to the given vendor", async () => {
    await upsertProduct({ id: "p1", vendorId: "vendor-jane", nameRw: "umugati", unitPrice: rwf(500), tracksStock: true, stockQty: 20 })
    await upsertProduct({ id: "p2", vendorId: "vendor-claudine", nameRw: "Fanta", unitPrice: rwf(500), tracksStock: true, stockQty: 10 })

    const products = await getProductsForVendor("vendor-jane")
    expect(products.map((p) => p.nameRw)).toEqual(["umugati"])
  })
})

describe("upsertCustomer / getCustomersForVendor", () => {
  it("returns only customers belonging to the given vendor", async () => {
    await upsertCustomer({ id: "c1", vendorId: "vendor-jane", name: "Eric", phone: null })
    await upsertCustomer({ id: "c2", vendorId: "vendor-claudine", name: "Divine", phone: null })

    const customers = await getCustomersForVendor("vendor-jane")
    expect(customers.map((c) => c.name)).toEqual(["Eric"])
  })
})
