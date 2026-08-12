"use client"

import { useEffect, useState } from "react"
import { getEventsForVendor } from "@/lib/db/local"
import {
  computeConsistencySignal,
  computeDailyTotals,
  computeOutstandingBalances,
  type ConsistencySignal,
  type CustomerBalance,
  type DailyTotal,
} from "@/lib/credit"
import { formatMoney } from "@/lib/money"

export interface ReportViewProps {
  vendorId: string
}

const CHART_HEIGHT = 120
const CHART_BAR_WIDTH = 18
const CHART_BAR_GAP = 6

/**
 * The "weeks later... prints a financial record" payoff (CLAUDE.md §1).
 * Everything here is derived from the append-only event log (§3.3) — no
 * stored totals, no chart library (§8: hand-rolled SVG), and the
 * consistency numbers score recording behavior, not revenue size (§4).
 */
export default function ReportView({ vendorId }: ReportViewProps) {
  const [loaded, setLoaded] = useState(false)
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([])
  const [balances, setBalances] = useState<CustomerBalance[]>([])
  const [consistency, setConsistency] = useState<ConsistencySignal | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const events = await getEventsForVendor(vendorId)
      if (cancelled) return
      setDailyTotals(computeDailyTotals(events))
      setBalances(computeOutstandingBalances(events))
      setConsistency(computeConsistencySignal(events, new Date()))
      setLoaded(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  if (!loaded) {
    return <p className="text-body">Loading…</p>
  }

  const maxTotal = Math.max(1, ...dailyTotals.map((day) => day.total))
  const chartWidth = Math.max(1, dailyTotals.length) * (CHART_BAR_WIDTH + CHART_BAR_GAP)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-heading">Daily sales</h2>
        {dailyTotals.length === 0 ? (
          <p className="text-body">No sales recorded yet.</p>
        ) : (
          <svg
            viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
            width={chartWidth}
            height={CHART_HEIGHT}
            role="img"
            aria-label="Daily sales totals"
          >
            {dailyTotals.map((day, index) => {
              const barHeight = (day.total / maxTotal) * (CHART_HEIGHT - 4)
              return (
                <rect
                  key={day.date}
                  className="fill-primary"
                  x={index * (CHART_BAR_WIDTH + CHART_BAR_GAP)}
                  y={CHART_HEIGHT - barHeight}
                  width={CHART_BAR_WIDTH}
                  height={barHeight}
                >
                  <title>{`${day.date}: ${formatMoney(day.total)}`}</title>
                </rect>
              )
            })}
          </svg>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-heading">Outstanding balances</h2>
        {balances.length === 0 ? (
          <p className="text-body">No outstanding balances.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {balances.map((balance) => (
              <li key={balance.customer} className="flex justify-between text-body">
                <span>{balance.customer}</span>
                <span className="font-semibold tabular-nums text-heading">{formatMoney(balance.outstanding)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {consistency && (
        <section className="rounded-lg bg-lighter p-4">
          <h2 className="mb-3 text-lg font-semibold text-heading">Consistency</h2>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-sm text-body">Days recorded</dt>
              <dd className="text-2xl font-bold tabular-nums text-heading">{consistency.daysRecorded}</dd>
            </div>
            <div>
              <dt className="text-sm text-body">Days elapsed</dt>
              <dd className="text-2xl font-bold tabular-nums text-heading">{consistency.daysElapsed}</dd>
            </div>
            <div>
              <dt className="text-sm text-body">Current streak</dt>
              <dd className="text-2xl font-bold tabular-nums text-heading">{consistency.currentStreak}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  )
}
