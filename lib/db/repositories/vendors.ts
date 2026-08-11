import { db } from "@/lib/db/client"
import { vendors } from "@/lib/db/schema"

export type NewVendor = typeof vendors.$inferInsert
export type Vendor = typeof vendors.$inferSelect

export async function insertVendor(vendor: NewVendor): Promise<Vendor> {
  const [inserted] = await db.insert(vendors).values(vendor).returning()
  return inserted
}
