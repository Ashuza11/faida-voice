export const eventKinds = ["SALE", "DEBT", "PAYMENT", "STOCK_IN", "SAVING", "CORRECTION"] as const

export type EventKind = (typeof eventKinds)[number]

// The four kinds selectable via tap (CLAUDE.md §6/§9) — STOCK_IN and
// CORRECTION are out of scope for the record flow.
export type RecordableKind = Extract<EventKind, "SALE" | "DEBT" | "PAYMENT" | "SAVING">
