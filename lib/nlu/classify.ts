import { multiplyMoney, rwf, type Money } from "@/lib/money"
import { findKinyarwandaNumber } from "@/lib/nlu/numbers"

interface ProductRef {
  nameRw: string
  unitPrice: Money
}

interface CustomerRef {
  name: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function findMatches<T>(transcript: string, items: T[], nameOf: (item: T) => string): T[] {
  const normalized = transcript.toLowerCase()
  return items.filter((item) => {
    const pattern = new RegExp(`\\b${escapeRegExp(nameOf(item).toLowerCase())}\\b`)
    return pattern.test(normalized)
  })
}

/**
 * Entity-extraction classifiers. The event kind is already known (chosen by
 * tap in the UI — see components/KindSelector) — these only pull a
 * product/customer/number out of a transcript, never decide *what kind* of
 * event it is, and never attempt to parse Kinyarwanda sentence grammar
 * (unverified — see ASSUMPTIONS.md). Matching is presence-based and
 * order-independent: whichever known names/numbers appear in the
 * transcript, regardless of position, since word order isn't verified
 * either. An ambiguous match (more than one product or customer name found)
 * rejects rather than guessing which one was meant — a wrong silent guess
 * on money is worse than falling back to tap.
 *
 * Every function returns a loose, possibly-incomplete candidate — always
 * pipe the result through lib/nlu/intent.ts's validateIntent, never trust
 * it directly. A rejected/ambiguous match returns a bare `{ kind }` object,
 * which fails Intent validation by design (required fields missing).
 */
export function classifySale(transcript: string, products: ProductRef[]): unknown {
  const matched = findMatches(transcript, products, (product) => product.nameRw)
  if (matched.length !== 1) {
    return { kind: "SALE" }
  }

  const qty = findKinyarwandaNumber(transcript)
  if (qty === null) {
    return { kind: "SALE" }
  }

  const product = matched[0]
  return {
    kind: "SALE",
    items: [{ productName: product.nameRw, qty, unitPrice: product.unitPrice }],
    total: multiplyMoney(product.unitPrice, qty),
    confidence: 1,
  }
}

export function classifyDebt(transcript: string, products: ProductRef[], customers: CustomerRef[]): unknown {
  const matchedCustomers = findMatches(transcript, customers, (customer) => customer.name)
  if (matchedCustomers.length !== 1) {
    return { kind: "DEBT" }
  }

  const customer = matchedCustomers[0]
  const matchedProducts = findMatches(transcript, products, (product) => product.nameRw)
  const number = findKinyarwandaNumber(transcript)

  if (matchedProducts.length === 1 && number !== null) {
    const product = matchedProducts[0]
    return {
      kind: "DEBT",
      customer: customer.name,
      items: [{ productName: product.nameRw, qty: number, unitPrice: product.unitPrice }],
      amount: multiplyMoney(product.unitPrice, number),
    }
  }

  if (matchedProducts.length === 0 && number !== null) {
    return { kind: "DEBT", customer: customer.name, items: [], amount: rwf(number) }
  }

  return { kind: "DEBT" }
}

export function classifyPayment(transcript: string, customers: CustomerRef[]): unknown {
  const matchedCustomers = findMatches(transcript, customers, (customer) => customer.name)
  if (matchedCustomers.length !== 1) {
    return { kind: "PAYMENT" }
  }

  const amount = findKinyarwandaNumber(transcript)
  if (amount === null) {
    return { kind: "PAYMENT" }
  }

  return { kind: "PAYMENT", customer: matchedCustomers[0].name, amount: rwf(amount) }
}

export function classifySaving(transcript: string): unknown {
  const amount = findKinyarwandaNumber(transcript)
  if (amount === null) {
    return { kind: "SAVING" }
  }

  return { kind: "SAVING", amount: rwf(amount) }
}
