"use client"

import type { Intent } from "@/lib/nlu/intent"
import { formatMoney } from "@/lib/money"

export interface ConfirmationCardProps {
  intent: Intent
  onConfirm: (intent: Intent) => void
  onDiscard: () => void
}

function IntentDetails({ intent }: { intent: Exclude<Intent, { kind: "UNKNOWN" }> }) {
  switch (intent.kind) {
    case "SALE":
      return (
        <>
          <ul>
            {intent.items.map((item, index) => (
              <li key={index} className="text-body">
                {item.productName} × {item.qty}
                {item.unitPrice !== undefined ? ` @ ${formatMoney(item.unitPrice)}` : null}
              </li>
            ))}
          </ul>
          {intent.total !== undefined && <p className="text-3xl font-bold tabular-nums text-heading">{formatMoney(intent.total)}</p>}
        </>
      )
    case "DEBT":
      return (
        <>
          <p className="text-body">{intent.customer}</p>
          {intent.items.length > 0 && (
            <ul>
              {intent.items.map((item, index) => (
                <li key={index} className="text-body">
                  {item.productName} × {item.qty}
                </li>
              ))}
            </ul>
          )}
          <p className="text-3xl font-bold tabular-nums text-heading">{formatMoney(intent.amount)}</p>
        </>
      )
    case "PAYMENT":
      return (
        <>
          <p className="text-body">{intent.customer}</p>
          <p className="text-3xl font-bold tabular-nums text-heading">{formatMoney(intent.amount)}</p>
        </>
      )
    case "SAVING":
      return <p className="text-3xl font-bold tabular-nums text-heading">{formatMoney(intent.amount)}</p>
    case "STOCK_IN":
      return <p className="text-body">Not supported in this flow yet.</p>
  }
}

// CLAUDE.md §3.6: nothing writes to the ledger without passing through here.
export default function ConfirmationCard({ intent, onConfirm, onDiscard }: ConfirmationCardProps) {
  if (intent.kind === "UNKNOWN") {
    return (
      <div className="rounded-lg bg-lighter p-4">
        <p className="text-lg font-semibold text-heading">Didn&apos;t catch that</p>
        <p className="text-body">&ldquo;{intent.raw}&rdquo;</p>
        <button type="button" onClick={onDiscard} className="mt-3 min-h-12 rounded-lg bg-lighter px-4 py-3 text-heading">
          Discard
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-lighter p-4">
      <IntentDetails intent={intent} />

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => onConfirm(intent)}
          className="min-h-12 flex-1 rounded-lg bg-primary px-4 py-3 font-semibold text-dark"
        >
          Confirm
        </button>
        <button type="button" onClick={onDiscard} className="min-h-12 flex-1 rounded-lg bg-lighter px-4 py-3 text-heading">
          Discard
        </button>
      </div>
    </div>
  )
}
