import Dexie, { type EntityTable } from "dexie"
import type { EventKind } from "@/lib/events"
import type { Money } from "@/lib/money"

export interface LocalEvent {
  clientEventId: string
  vendorId: string
  kind: EventKind
  payload: unknown
  occurredAt: Date
  source: string
  syncedAt: Date | null
}

// Local ids are fixed/human-readable ("vendor-jane"), not random UUIDs, since
// these rows are demo-seeded and not synced to Postgres in this pass — see
// ASSUMPTIONS.md. The sync boundary (lib/sync/schema.ts) still requires a
// real UUID, so these must not be posted to /api/sync as-is.
export interface LocalVendor {
  id: string
  name: string
  businessType: string
  createdAt: Date
}

export interface LocalProduct {
  id: string
  vendorId: string
  nameRw: string
  unitPrice: Money
  tracksStock: boolean
  stockQty: number
}

export interface LocalCustomer {
  id: string
  vendorId: string
  name: string
  phone: string | null
}

class FaidaLocalDb extends Dexie {
  events!: EntityTable<LocalEvent, "clientEventId">
  vendors!: EntityTable<LocalVendor, "id">
  products!: EntityTable<LocalProduct, "id">
  customers!: EntityTable<LocalCustomer, "id">

  constructor() {
    super("faida")
    this.version(1).stores({
      events: "clientEventId",
    })
    this.version(2).stores({
      events: "clientEventId, vendorId",
      vendors: "id",
      products: "id, vendorId",
      customers: "id, vendorId",
    })
  }
}

// CLAUDE.md §2/§3.8: Dexie is the only client-side store — no localStorage/sessionStorage.
export const localDb = new FaidaLocalDb()

/**
 * Queues an event locally. Writes go here first so the UI can render
 * optimistically without waiting on the network (§3.7). `put` keyed on
 * clientEventId keeps this idempotent — queueing the same event twice
 * overwrites rather than duplicates it.
 */
export async function queueEvent(event: Omit<LocalEvent, "syncedAt">): Promise<LocalEvent> {
  const record: LocalEvent = { ...event, syncedAt: null }
  await localDb.events.put(record)
  return record
}

export async function getUnsyncedEvents(): Promise<LocalEvent[]> {
  return localDb.events.filter((event) => event.syncedAt === null).toArray()
}

export async function markSynced(clientEventId: string): Promise<void> {
  await localDb.events.update(clientEventId, { syncedAt: new Date() })
}

export async function getEventsForVendor(vendorId: string): Promise<LocalEvent[]> {
  return localDb.events.where("vendorId").equals(vendorId).toArray()
}
