"use client"

import { useEffect, useState } from "react"
import ConfirmationCard from "@/components/ConfirmationCard"
import KindSelector from "@/components/KindSelector"
import TapEntry from "@/components/TapEntry"
import VoiceInput from "@/components/VoiceInput"
import { queueEvent, type LocalCustomer, type LocalProduct } from "@/lib/db/local"
import { getCustomersForVendor, getProductsForVendor } from "@/lib/db/local-vendors"
import type { RecordableKind } from "@/lib/events"
import { validateIntent, type Intent } from "@/lib/nlu/intent"
import { resolveVoiceIntent } from "@/lib/nlu/resolve-voice-intent"

export interface RecordFlowProps {
  vendorId: string
}

type Step = "select-kind" | "capture" | "confirm"

/**
 * The state machine CLAUDE.md §3.6 exists to enforce: SELECT_KIND → CAPTURE
 * (tap and voice both produce the same untyped candidate shape) → CONFIRM
 * → queueEvent → reset. Nothing reaches queueEvent without passing through
 * ConfirmationCard — there is no other path to a write in this component.
 */
export default function RecordFlow({ vendorId }: RecordFlowProps) {
  const [products, setProducts] = useState<LocalProduct[]>([])
  const [customers, setCustomers] = useState<LocalCustomer[]>([])
  const [loaded, setLoaded] = useState(false)
  const [step, setStep] = useState<Step>("select-kind")
  const [kind, setKind] = useState<RecordableKind | null>(null)
  const [pendingIntent, setPendingIntent] = useState<Intent | null>(null)
  const [source, setSource] = useState<"tap" | "voice">("tap")

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [productList, customerList] = await Promise.all([
        getProductsForVendor(vendorId),
        getCustomersForVendor(vendorId),
      ])
      if (!cancelled) {
        setProducts(productList)
        setCustomers(customerList)
        setLoaded(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  function reset() {
    setStep("select-kind")
    setKind(null)
    setPendingIntent(null)
  }

  function handleKindSelect(selected: RecordableKind) {
    setKind(selected)
    setStep("capture")
  }

  function handleTapSubmit(candidate: unknown) {
    setPendingIntent(validateIntent(candidate, "tap entry"))
    setSource("tap")
    setStep("confirm")
  }

  async function handleVoiceTranscript(transcript: string) {
    if (!kind) return
    const intent = await resolveVoiceIntent(kind, transcript, products, customers)
    setPendingIntent(intent)
    setSource("voice")
    setStep("confirm")
  }

  async function handleConfirm(intent: Intent) {
    if (intent.kind === "UNKNOWN") return
    const { kind: intentKind, ...payload } = intent
    await queueEvent({
      clientEventId: crypto.randomUUID(),
      vendorId,
      kind: intentKind,
      payload,
      occurredAt: new Date(),
      source,
    })
    reset()
  }

  if (!loaded) {
    return <p className="text-body">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {step === "select-kind" && <KindSelector onSelect={handleKindSelect} />}

      {step === "capture" && kind && (
        <div className="flex flex-col gap-6">
          <TapEntry kind={kind} products={products} customers={customers} onSubmit={handleTapSubmit} />
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>
      )}

      {step === "confirm" && pendingIntent && (
        <ConfirmationCard intent={pendingIntent} onConfirm={handleConfirm} onDiscard={reset} />
      )}
    </div>
  )
}
