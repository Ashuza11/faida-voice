import { z } from "zod"
import { rwf, type Money } from "@/lib/money"

const MoneySchema = z
  .number()
  .int()
  .nonnegative()
  .transform((value): Money => rwf(value))

/**
 * Validates a request to POST /api/extract. A Zod boundary per CLAUDE.md §2
 * — malformed input here is a client bug (400), distinct from an ambiguous
 * voice transcript, which lib/nlu/extract-llm.ts handles by degrading to
 * nulls rather than rejecting.
 */
export const extractRequestSchema = z.object({
  transcript: z.string().min(1),
  products: z.array(z.object({ nameRw: z.string().min(1), unitPrice: MoneySchema })),
  customers: z.array(z.object({ name: z.string().min(1) })),
})

export type ExtractRequestInput = z.infer<typeof extractRequestSchema>
