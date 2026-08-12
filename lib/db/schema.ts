import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { eventKinds } from "@/lib/events"

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  businessType: text("business_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  nameRw: text("name_rw").notNull(),
  unitPrice: integer("unit_price").notNull(),
  tracksStock: boolean("tracks_stock").notNull().default(false),
  stockQty: integer("stock_qty").notNull().default(0),
})

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  phone: text("phone"),
})

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
    kind: text("kind", { enum: eventKinds }).notNull(),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    source: text("source").notNull(),
    clientEventId: uuid("client_event_id").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("events_client_event_id_key").on(table.clientEventId)],
)
