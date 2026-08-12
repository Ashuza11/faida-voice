import Dexie, { type EntityTable } from "dexie"
import type { EventKind } from "@/lib/events"

export interface LocalEvent {
  clientEventId: string
  vendorId: string
  kind: EventKind
  payload: unknown
  occurredAt: Date
  source: string
  syncedAt: Date | null
}

class FaidaLocalDb extends Dexie {
  events!: EntityTable<LocalEvent, "clientEventId">

  constructor() {
    super("faida")
    this.version(1).stores({
      events: "clientEventId",
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
