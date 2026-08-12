import { z } from "zod"
import { eventKinds } from "@/lib/events"

/**
 * Validates an event posted to the sync endpoint. This is a Zod boundary
 * per CLAUDE.md §2 — malformed input is rejected outright (400), not
 * coerced or guessed at, since it represents a client bug rather than an
 * ambiguous voice transcript (contrast with lib/nlu/intent.ts's UNKNOWN
 * fallback, which is for uncertain NLU output).
 */
export const syncEventSchema = z.object({
  vendorId: z.string().uuid(),
  kind: z.enum(eventKinds),
  payload: z.record(z.string(), z.unknown()),
  occurredAt: z.coerce.date(),
  source: z.string().min(1),
  clientEventId: z.string().uuid(),
})

export type SyncEventInput = z.infer<typeof syncEventSchema>
