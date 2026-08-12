import {
  assembleDebt,
  assemblePayment,
  assembleSale,
  assembleSaving,
  classifyDebt,
  classifyPayment,
  classifySale,
  classifySaving,
  type CustomerRef,
  type ProductRef,
} from "@/lib/nlu/classify"
import { validateIntent, type Intent } from "@/lib/nlu/intent"
import { findKinyarwandaNumber } from "@/lib/nlu/numbers"
import type { RecordableKind } from "@/lib/events"

export type FetchLike = typeof fetch

function classifyForKind(
  kind: RecordableKind,
  transcript: string,
  products: ProductRef[],
  customers: CustomerRef[],
): unknown {
  switch (kind) {
    case "SALE":
      return classifySale(transcript, products)
    case "DEBT":
      return classifyDebt(transcript, products, customers)
    case "PAYMENT":
      return classifyPayment(transcript, customers)
    case "SAVING":
      return classifySaving(transcript)
  }
}

function assembleForKind(
  kind: RecordableKind,
  product: ProductRef | null,
  customer: CustomerRef | null,
  number: number | null,
): unknown {
  switch (kind) {
    case "SALE":
      return assembleSale(product, number)
    case "DEBT":
      return assembleDebt(customer, product, product ? number : null, product ? null : number)
    case "PAYMENT":
      return assemblePayment(customer, number)
    case "SAVING":
      return assembleSaving(number)
  }
}

/**
 * Resolves a voice transcript to an Intent for a tap-selected kind (kind is
 * never inferred from speech, per CLAUDE.md §5/§6). The deterministic
 * classify.ts path always runs first; only when it can't find an
 * unambiguous product/customer match (UNKNOWN) does this fall back to
 * POST /api/extract for LLM-assisted entity resolution. Numeral parsing
 * stays on findKinyarwandaNumber either way, and money math always runs
 * through classify.ts's assemble* functions — see ASSUMPTIONS.md for the
 * full rationale on why the LLM fallback is scoped this narrowly.
 *
 * Any fallback failure (network error, non-OK response) just keeps the
 * deterministic UNKNOWN result rather than throwing, so the caller always
 * has a valid (if unhelpful) Intent to fall back to tap entry with.
 */
export async function resolveVoiceIntent(
  kind: RecordableKind,
  transcript: string,
  products: ProductRef[],
  customers: CustomerRef[],
  fetchImpl: FetchLike = fetch,
): Promise<Intent> {
  const deterministic = classifyForKind(kind, transcript, products, customers)
  const intent = validateIntent(deterministic, transcript)
  if (intent.kind !== "UNKNOWN") {
    return intent
  }
  if (products.length === 0 && customers.length === 0) {
    return intent
  }

  try {
    const response = await fetchImpl("/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript, products, customers }),
    })
    if (!response.ok) {
      return intent
    }

    const resolved = (await response.json()) as { productName: string | null; customerName: string | null }
    const product = resolved.productName ? (products.find((p) => p.nameRw === resolved.productName) ?? null) : null
    const customer = resolved.customerName
      ? (customers.find((c) => c.name === resolved.customerName) ?? null)
      : null
    const number = findKinyarwandaNumber(transcript)

    return validateIntent(assembleForKind(kind, product, customer, number), transcript)
  } catch {
    return intent
  }
}
