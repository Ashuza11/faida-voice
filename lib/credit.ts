import type { LocalEvent } from "@/lib/db/local"
import { IntentSchema, type Intent } from "@/lib/nlu/intent"
import { rwf, type Money } from "@/lib/money"

export interface DailyTotal {
  date: string // YYYY-MM-DD, UTC
  total: Money
}

export interface CustomerBalance {
  customer: string
  outstanding: Money
}

export interface ConsistencySignal {
  daysElapsed: number
  daysRecorded: number
  currentStreak: number
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parsedIntent(event: LocalEvent): Intent | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? event.payload : {}
  const result = IntentSchema.safeParse({ kind: event.kind, ...payload })
  return result.success ? result.data : null
}

/** Sums SALE totals per UTC day. Events with no `total` or an invalid payload are skipped — never guessed. */
export function computeDailyTotals(events: LocalEvent[]): DailyTotal[] {
  const totals = new Map<string, number>()

  for (const event of events) {
    const intent = parsedIntent(event)
    if (!intent || intent.kind !== "SALE" || intent.total === undefined) {
      continue
    }
    const key = dayKey(event.occurredAt)
    totals.set(key, (totals.get(key) ?? 0) + intent.total)
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total: rwf(total) }))
}

/**
 * Nets DEBT against PAYMENT per customer. Per CLAUDE.md §3.3 balances are
 * always derived from the event log, never stored/mutated directly.
 * An overpayment clamps to zero rather than going negative — Money can't
 * represent a negative amount, and "customer has credit" isn't modeled yet.
 */
export function computeOutstandingBalances(events: LocalEvent[]): CustomerBalance[] {
  const balances = new Map<string, number>()

  for (const event of events) {
    const intent = parsedIntent(event)
    if (!intent) continue

    if (intent.kind === "DEBT") {
      balances.set(intent.customer, (balances.get(intent.customer) ?? 0) + intent.amount)
    } else if (intent.kind === "PAYMENT") {
      balances.set(intent.customer, (balances.get(intent.customer) ?? 0) - intent.amount)
    }
  }

  return Array.from(balances.entries())
    .filter(([, balance]) => balance > 0)
    .map(([customer, balance]) => ({ customer, outstanding: rwf(Math.max(0, balance)) }))
}

/**
 * Scores consistency, not revenue, per CLAUDE.md §4: days recorded vs. days
 * elapsed, and the current streak counted back from the most recent
 * recorded day. Deliberately ignores payload validity/amounts entirely —
 * any event on a day counts as "recorded," a tiny saving and a huge sale
 * count the same.
 */
export function computeConsistencySignal(events: LocalEvent[], today: Date): ConsistencySignal {
  const recordedDays = new Set(events.map((event) => dayKey(event.occurredAt)))

  if (recordedDays.size === 0) {
    return { daysElapsed: 0, daysRecorded: 0, currentStreak: 0 }
  }

  const sortedDays = Array.from(recordedDays).sort()
  const firstDay = new Date(sortedDays[0])
  const todayUtc = new Date(dayKey(today))
  const daysElapsed = Math.floor((todayUtc.getTime() - firstDay.getTime()) / 86_400_000) + 1

  let currentStreak = 0
  const cursor = new Date(sortedDays[sortedDays.length - 1])
  while (recordedDays.has(dayKey(cursor))) {
    currentStreak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return { daysElapsed, daysRecorded: recordedDays.size, currentStreak }
}
