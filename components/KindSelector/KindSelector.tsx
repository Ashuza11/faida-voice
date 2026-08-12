"use client"

import type { RecordableKind } from "@/lib/events"

export type { RecordableKind } from "@/lib/events"

// Kinyarwanda labels use only already source-verified action verbs
// (ASSUMPTIONS.md). "Debt" has no single confident word — umwenda/ideni are
// unresolved near-synonyms — so it stays English-with-TODO rather than
// picking one arbitrarily.
const KINDS: { kind: RecordableKind; label: string }[] = [
  { kind: "SALE", label: "Kugurisha" },
  { kind: "DEBT", label: "Debt" },
  { kind: "PAYMENT", label: "Kwishyura" },
  { kind: "SAVING", label: "Kuzigama" },
]

export interface KindSelectorProps {
  onSelect: (kind: RecordableKind) => void
}

export default function KindSelector({ onSelect }: KindSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {KINDS.map(({ kind, label }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onSelect(kind)}
          className="min-h-12 rounded-lg bg-lighter px-4 py-3 text-lg font-semibold text-heading"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
