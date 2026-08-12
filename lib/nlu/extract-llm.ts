import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
// zod/v4, not the project-wide "zod" (v3 classic) import — required because
// the Anthropic SDK's zodOutputFormat helper is typed against zod/v4's
// ZodType. Every other module in this codebase should keep using "zod".
import { z } from "zod/v4"
import type { CustomerRef, ProductRef } from "@/lib/nlu/classify"

export interface ExtractedEntities {
  productName: string | null
  customerName: string | null
}

const EMPTY_RESULT: ExtractedEntities = { productName: null, customerName: null }

const EXTRACTION_SYSTEM_PROMPT =
  "You resolve noisy speech-to-text transcripts (Kinyarwanda, roughly 20% word error rate) " +
  "to entries in a known catalog. Pick the single best-matching product and/or customer name " +
  "strictly from the lists provided — never invent a name or return one that isn't in a list. " +
  "If nothing in a list plausibly matches the transcript, return null for that field."

export interface ExtractionClient {
  messages: { parse: Anthropic["messages"]["parse"] }
}

let cachedClient: Anthropic | null = null

function defaultClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set")
    }
    cachedClient = new Anthropic({ apiKey })
  }
  return cachedClient
}

function buildSchema(productNames: string[], customerNames: string[]) {
  return z.object({
    productName: productNames.length > 0 ? z.enum(productNames as [string, ...string[]]).nullable() : z.null(),
    customerName: customerNames.length > 0 ? z.enum(customerNames as [string, ...string[]]).nullable() : z.null(),
  })
}

function buildPrompt(transcript: string, productNames: string[], customerNames: string[]): string {
  return [
    `Transcript: "${transcript}"`,
    productNames.length > 0 ? `Known products: ${productNames.join(", ")}` : null,
    customerNames.length > 0 ? `Known customers: ${customerNames.join(", ")}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

/**
 * LLM-assisted entity resolution — a fallback used only when the
 * deterministic substring matcher in classify.ts finds zero or ambiguous
 * (multiple) product/customer matches, which is usually an ASR transcript
 * error. This resolves WHICH known product/customer was meant; it never
 * invents a name (both fields are JSON-schema-constrained to an enum of the
 * vendor's real catalog, or null, and the result is re-checked against that
 * same list before being returned) and it never touches quantities or money
 * amounts — those stay on the deterministic findKinyarwandaNumber path in
 * classify.ts, per CLAUDE.md §5. Any failure (missing API key, network
 * error, model refusal, schema mismatch) degrades to EMPTY_RESULT rather
 * than throwing, so callers can always fall back to tap entry.
 *
 * Callers must feed the resolved refs into the same assemble* functions
 * classify.ts uses, so arithmetic is identical regardless of which path
 * resolved the entities.
 */
export async function extractEntities(
  transcript: string,
  products: ProductRef[],
  customers: CustomerRef[],
  clientOverride?: ExtractionClient,
): Promise<ExtractedEntities> {
  const productNames = products.map((product) => product.nameRw)
  const customerNames = customers.map((customer) => customer.name)

  if (productNames.length === 0 && customerNames.length === 0) {
    return EMPTY_RESULT
  }

  try {
    const client = clientOverride ?? defaultClient()
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 256,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(transcript, productNames, customerNames) }],
      output_config: { format: zodOutputFormat(buildSchema(productNames, customerNames)) },
    })

    const parsed = message.parsed_output
    if (!parsed) {
      return EMPTY_RESULT
    }

    return {
      productName: productNames.includes(parsed.productName ?? "") ? parsed.productName : null,
      customerName: customerNames.includes(parsed.customerName ?? "") ? parsed.customerName : null,
    }
  } catch {
    return EMPTY_RESULT
  }
}
