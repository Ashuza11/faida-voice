import { multiplyMoney, rwf, type Money } from "@/lib/money"
import { findKinyarwandaNumber } from "@/lib/nlu/numbers"

export interface ProductRef {
  nameRw: string
  unitPrice: Money
}

export interface CustomerRef {
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
 * Assembles a candidate from already-resolved entities. This is the one
 * place money arithmetic happens, and it's deliberately shared by every
 * extraction path (deterministic keyword matching in this file, and the LLM
 * fallback in lib/nlu/extract-llm.ts) — however a product/customer/number
 * was resolved, the qty × unitPrice math is always this same deterministic
 * code, never computed by an LLM. A rejected/incomplete resolution returns
 * a bare `{ kind }` object, which fails Intent validation by design.
 */
export function assembleSale(product: ProductRef | null, qty: number | null): unknown {
  if (!product || qty === null) {
    return { kind: "SALE" }
  }
  return {
    kind: "SALE",
    items: [{ productName: product.nameRw, qty, unitPrice: product.unitPrice }],
    total: multiplyMoney(product.unitPrice, qty),
    confidence: 1,
  }
}

export function assembleDebt(customer: CustomerRef | null, product: ProductRef | null, qty: number | null, bareAmount: number | null): unknown {
  if (!customer) {
    return { kind: "DEBT" }
  }
  if (product && qty !== null) {
    return {
      kind: "DEBT",
      customer: customer.name,
      items: [{ productName: product.nameRw, qty, unitPrice: product.unitPrice }],
      amount: multiplyMoney(product.unitPrice, qty),
    }
  }
  if (!product && bareAmount !== null) {
    return { kind: "DEBT", customer: customer.name, items: [], amount: rwf(bareAmount) }
  }
  return { kind: "DEBT" }
}

export function assemblePayment(customer: CustomerRef | null, amount: number | null): unknown {
  if (!customer || amount === null) {
    return { kind: "PAYMENT" }
  }
  return { kind: "PAYMENT", customer: customer.name, amount: rwf(amount) }
}

export function assembleSaving(amount: number | null): unknown {
  if (amount === null) {
    return { kind: "SAVING" }
  }
  return { kind: "SAVING", amount: rwf(amount) }
}

/**
 * Deterministic entity-extraction classifiers. The event kind is already
 * known (chosen by tap in the UI — see components/KindSelector) — these
 * only pull a product/customer/number out of a transcript, never decide
 * *what kind* of event it is, and never attempt to parse Kinyarwanda
 * sentence grammar (unverified — see ASSUMPTIONS.md). Matching is
 * presence-based and order-independent: whichever known names/numbers
 * appear in the transcript, regardless of position, since word order isn't
 * verified either. An ambiguous match (more than one product or customer
 * name found) rejects rather than guessing which one was meant — a wrong
 * silent guess on money is worse than falling back to tap.
 *
 * Every function returns a loose, possibly-incomplete candidate — always
 * pipe the result through lib/nlu/intent.ts's validateIntent, never trust
 * it directly.
 */
export function classifySale(transcript: string, products: ProductRef[]): unknown {
  const matched = findMatches(transcript, products, (product) => product.nameRw)
  const product = matched.length === 1 ? matched[0] : null
  const qty = product ? findKinyarwandaNumber(transcript) : null
  return assembleSale(product, qty)
}

export function classifyDebt(transcript: string, products: ProductRef[], customers: CustomerRef[]): unknown {
  const matchedCustomers = findMatches(transcript, customers, (customer) => customer.name)
  const customer = matchedCustomers.length === 1 ? matchedCustomers[0] : null
  if (!customer) {
    return assembleDebt(null, null, null, null)
  }

  const matchedProducts = findMatches(transcript, products, (product) => product.nameRw)
  const number = findKinyarwandaNumber(transcript)
  const product = matchedProducts.length === 1 ? matchedProducts[0] : null
  const qty = product ? number : null
  const bareAmount = matchedProducts.length === 0 ? number : null

  return assembleDebt(customer, product, qty, bareAmount)
}

export function classifyPayment(transcript: string, customers: CustomerRef[]): unknown {
  const matchedCustomers = findMatches(transcript, customers, (customer) => customer.name)
  const customer = matchedCustomers.length === 1 ? matchedCustomers[0] : null
  const amount = findKinyarwandaNumber(transcript)
  return assemblePayment(customer, amount)
}

export function classifySaving(transcript: string): unknown {
  const amount = findKinyarwandaNumber(transcript)
  return assembleSaving(amount)
}
