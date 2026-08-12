export const eventKinds = ["SALE", "DEBT", "PAYMENT", "STOCK_IN", "SAVING", "CORRECTION"] as const

export type EventKind = (typeof eventKinds)[number]
