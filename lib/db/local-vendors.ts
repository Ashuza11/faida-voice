import { localDb, type LocalCustomer, type LocalProduct, type LocalVendor } from "@/lib/db/local"

export async function getVendor(id: string): Promise<LocalVendor | undefined> {
  return localDb.vendors.get(id)
}

export async function listVendors(): Promise<LocalVendor[]> {
  return localDb.vendors.toArray()
}

export async function getProductsForVendor(vendorId: string): Promise<LocalProduct[]> {
  return localDb.products.where("vendorId").equals(vendorId).toArray()
}

export async function getCustomersForVendor(vendorId: string): Promise<LocalCustomer[]> {
  return localDb.customers.where("vendorId").equals(vendorId).toArray()
}

export async function upsertVendor(vendor: LocalVendor): Promise<void> {
  await localDb.vendors.put(vendor)
}

export async function upsertProduct(product: LocalProduct): Promise<void> {
  await localDb.products.put(product)
}

export async function upsertCustomer(customer: LocalCustomer): Promise<void> {
  await localDb.customers.put(customer)
}
