import { z } from "zod"
import { rwf, type Money } from "@/lib/money"

const MoneySchema = z
  .number()
  .int()
  .nonnegative()
  .transform((value): Money => rwf(value))

const LineItemSchema = z.object({
  productName: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: MoneySchema.optional(),
})

export type LineItem = z.infer<typeof LineItemSchema>

const SaleIntentSchema = z.object({
  kind: z.literal("SALE"),
  items: z.array(LineItemSchema).min(1),
  total: MoneySchema.optional(),
  confidence: z.number().min(0).max(1),
})

const DebtIntentSchema = z.object({
  kind: z.literal("DEBT"),
  customer: z.string().min(1),
  items: z.array(LineItemSchema),
  amount: MoneySchema,
  dueDate: z.date().optional(),
})

const PaymentIntentSchema = z.object({
  kind: z.literal("PAYMENT"),
  customer: z.string().min(1),
  amount: MoneySchema,
})

const StockInIntentSchema = z.object({
  kind: z.literal("STOCK_IN"),
  item: z.string().min(1),
  qty: z.number().int().positive(),
  unitCost: MoneySchema.optional(),
})

const SavingIntentSchema = z.object({
  kind: z.literal("SAVING"),
  amount: MoneySchema,
})

const UnknownIntentSchema = z.object({
  kind: z.literal("UNKNOWN"),
  raw: z.string(),
})

const IntentSchema = z.discriminatedUnion("kind", [
  SaleIntentSchema,
  DebtIntentSchema,
  PaymentIntentSchema,
  StockInIntentSchema,
  SavingIntentSchema,
  UnknownIntentSchema,
])

export type Intent = z.infer<typeof IntentSchema>

/**
 * Validates a candidate intent produced by the NLU pipeline. Per CLAUDE.md
 * §5: validation failure always produces UNKNOWN — never a guess, never a
 * partial write. `raw` is the original transcript, carried through so the
 * confirmation queue can show the vendor what was actually said.
 */
export function validateIntent(candidate: unknown, raw: string): Intent {
  const result = IntentSchema.safeParse(candidate)
  if (!result.success) {
    return { kind: "UNKNOWN", raw }
  }
  return result.data
}
