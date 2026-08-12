import { queueEvent } from "@/lib/db/local"
import { listVendors, upsertCustomer, upsertProduct, upsertVendor } from "@/lib/db/local-vendors"
import { multiplyMoney, rwf, sumMoney } from "@/lib/money"

const DAYS_OF_HISTORY = 35
const GAP_DAY_OFFSET = 20 // a realistic missed day — nobody records every single day

function daysAgo(offset: number, hour: number, minute: number): Date {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() - offset)
  return date
}

/**
 * Populates Dexie with the two fixed demo personas (CLAUDE.md §1) and several
 * weeks of backdated history, so the report view has something real to show
 * without needing Neon. Idempotent: a no-op if any vendor already exists.
 * Deliberately skips "today" so a live demo recording is the freshest event.
 */
export async function seedDemoData(): Promise<void> {
  const existing = await listVendors()
  if (existing.length > 0) {
    return
  }

  await seedJane()
  await seedClaudine()
}

async function seedJane(): Promise<void> {
  const vendorId = "vendor-jane"
  await upsertVendor({ id: vendorId, name: "Jane", businessType: "bakery", createdAt: daysAgo(DAYS_OF_HISTORY + 10, 8, 0) })

  const umugati = { id: "product-jane-umugati", vendorId, nameRw: "umugati", unitPrice: rwf(300), tracksStock: true, stockQty: 40 }
  const amandazi = { id: "product-jane-amandazi", vendorId, nameRw: "amandazi", unitPrice: rwf(100), tracksStock: true, stockQty: 60 }
  await upsertProduct(umugati)
  await upsertProduct(amandazi)

  const eric = { id: "customer-jane-eric", vendorId, name: "Eric", phone: null }
  const divine = { id: "customer-jane-divine", vendorId, name: "Divine", phone: null }
  await upsertCustomer(eric)
  await upsertCustomer(divine)

  for (let offset = DAYS_OF_HISTORY; offset >= 1; offset--) {
    if (offset === GAP_DAY_OFFSET) continue

    const qtyUmugati = 2 + (offset % 3)
    const qtyAmandazi = 4 + (offset % 5)
    await queueEvent({
      clientEventId: `seed-jane-sale-${offset}`,
      vendorId,
      kind: "SALE",
      payload: {
        items: [
          { productName: umugati.nameRw, qty: qtyUmugati, unitPrice: umugati.unitPrice },
          { productName: amandazi.nameRw, qty: qtyAmandazi, unitPrice: amandazi.unitPrice },
        ],
        total: sumMoney([multiplyMoney(umugati.unitPrice, qtyUmugati), multiplyMoney(amandazi.unitPrice, qtyAmandazi)]),
        confidence: 1,
      },
      occurredAt: daysAgo(offset, 8, 30),
      source: "tap",
    })

    if (offset % 5 === 0) {
      await queueEvent({
        clientEventId: `seed-jane-debt-${offset}`,
        vendorId,
        kind: "DEBT",
        payload: {
          customer: eric.name,
          items: [{ productName: umugati.nameRw, qty: 2, unitPrice: umugati.unitPrice }],
          amount: multiplyMoney(umugati.unitPrice, 2),
        },
        occurredAt: daysAgo(offset, 17, 0),
        source: "tap",
      })
    }

    if (offset % 7 === 0) {
      await queueEvent({
        clientEventId: `seed-jane-payment-${offset}`,
        vendorId,
        kind: "PAYMENT",
        payload: { customer: eric.name, amount: rwf(300) },
        occurredAt: daysAgo(offset, 18, 0),
        source: "tap",
      })
    }

    if (offset % 6 === 0) {
      await queueEvent({
        clientEventId: `seed-jane-saving-${offset}`,
        vendorId,
        kind: "SAVING",
        payload: { amount: rwf(500) },
        occurredAt: daysAgo(offset, 19, 0),
        source: "tap",
      })
    }
  }
}

async function seedClaudine(): Promise<void> {
  const vendorId = "vendor-claudine"
  await upsertVendor({ id: vendorId, name: "Claudine", businessType: "restaurant_bar", createdAt: daysAgo(DAYS_OF_HISTORY + 10, 8, 0) })

  const fanta = { id: "product-claudine-fanta", vendorId, nameRw: "Fanta", unitPrice: rwf(500), tracksStock: true, stockQty: 30 }
  const primus = { id: "product-claudine-primus", vendorId, nameRw: "Primus", unitPrice: rwf(1200), tracksStock: true, stockQty: 24 }
  await upsertProduct(fanta)
  await upsertProduct(primus)

  const aline = { id: "customer-claudine-aline", vendorId, name: "Aline", phone: null }
  await upsertCustomer(aline)

  for (let offset = DAYS_OF_HISTORY; offset >= 1; offset--) {
    // Claudine records less consistently than Jane — the point of the
    // consistency signal (CLAUDE.md §4) is that this shows up honestly.
    if (offset === GAP_DAY_OFFSET || offset % 3 === 0) continue

    const qtyFanta = 3 + (offset % 4)
    const qtyPrimus = 1 + (offset % 3)
    await queueEvent({
      clientEventId: `seed-claudine-sale-${offset}`,
      vendorId,
      kind: "SALE",
      payload: {
        items: [
          { productName: fanta.nameRw, qty: qtyFanta, unitPrice: fanta.unitPrice },
          { productName: primus.nameRw, qty: qtyPrimus, unitPrice: primus.unitPrice },
        ],
        total: sumMoney([multiplyMoney(fanta.unitPrice, qtyFanta), multiplyMoney(primus.unitPrice, qtyPrimus)]),
        confidence: 1,
      },
      occurredAt: daysAgo(offset, 19, 0),
      source: "tap",
    })

    if (offset % 9 === 0) {
      await queueEvent({
        clientEventId: `seed-claudine-debt-${offset}`,
        vendorId,
        kind: "DEBT",
        payload: { customer: aline.name, items: [], amount: rwf(2000) },
        occurredAt: daysAgo(offset, 20, 0),
        source: "tap",
      })
    }
  }
}
