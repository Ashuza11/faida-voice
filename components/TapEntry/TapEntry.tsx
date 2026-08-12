"use client"

import { useState } from "react"
import type { RecordableKind } from "@/components/KindSelector"
import { multiplyMoney, rwf, type Money } from "@/lib/money"

interface ProductRef {
  nameRw: string
  unitPrice: Money
}

interface CustomerRef {
  name: string
}

export interface TapEntryProps {
  kind: RecordableKind
  products: ProductRef[]
  customers: CustomerRef[]
  onSubmit: (candidate: unknown) => void
}

/**
 * The tap path — CLAUDE.md §6 calls this primary, voice the accelerator.
 * It's also the demo safety net: whatever voice input does, this always
 * works, with no network and no browser API dependency. Amount entry uses
 * a plain number input (real mobile browsers show a numeric keypad for it)
 * rather than a hand-built on-screen keypad — that's a visual-polish
 * upgrade CLAUDE.md explicitly exempts from TDD, not core to this pass.
 */
export default function TapEntry({ kind, products, customers, onSubmit }: TapEntryProps) {
  const [customer, setCustomer] = useState<string | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [amount, setAmount] = useState("")

  const needsCustomer = kind === "DEBT" || kind === "PAYMENT"
  const needsProduct = kind === "SALE" || kind === "DEBT"
  const selectedProduct = products.find((p) => p.nameRw === product) ?? null
  const needsAmountField = kind === "PAYMENT" || kind === "SAVING" || (kind === "DEBT" && !selectedProduct)

  function parsedAmount(): Money | null {
    const value = Number(amount)
    if (!Number.isInteger(value) || value <= 0) {
      return null
    }
    return rwf(value)
  }

  function handleSubmit() {
    if (needsCustomer && !customer) return

    if (kind === "SALE") {
      if (!selectedProduct) return
      onSubmit({
        kind: "SALE",
        items: [{ productName: selectedProduct.nameRw, qty, unitPrice: selectedProduct.unitPrice }],
        total: multiplyMoney(selectedProduct.unitPrice, qty),
        confidence: 1,
      })
      return
    }

    if (kind === "DEBT") {
      if (selectedProduct) {
        onSubmit({
          kind: "DEBT",
          customer,
          items: [{ productName: selectedProduct.nameRw, qty, unitPrice: selectedProduct.unitPrice }],
          amount: multiplyMoney(selectedProduct.unitPrice, qty),
        })
        return
      }
      const value = parsedAmount()
      if (!value) return
      onSubmit({ kind: "DEBT", customer, items: [], amount: value })
      return
    }

    if (kind === "PAYMENT") {
      const value = parsedAmount()
      if (!value) return
      onSubmit({ kind: "PAYMENT", customer, amount: value })
      return
    }

    if (kind === "SAVING") {
      const value = parsedAmount()
      if (!value) return
      onSubmit({ kind: "SAVING", amount: value })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {needsCustomer && (
        <div className="flex flex-wrap gap-2">
          {customers.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCustomer(c.name)}
              aria-pressed={customer === c.name}
              className="min-h-12 rounded-full bg-lighter px-4 py-2 text-heading aria-pressed:bg-primary aria-pressed:text-dark"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {needsProduct && (
        <>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.nameRw}
                type="button"
                onClick={() => setProduct(p.nameRw)}
                aria-pressed={product === p.nameRw}
                className="min-h-12 rounded-full bg-lighter px-4 py-2 text-heading aria-pressed:bg-primary aria-pressed:text-dark"
              >
                {p.nameRw}
              </button>
            ))}
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="min-h-12 min-w-12 rounded-lg bg-lighter text-heading">
                −
              </button>
              <span className="text-2xl font-bold tabular-nums text-heading">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="min-h-12 min-w-12 rounded-lg bg-lighter text-heading">
                +
              </button>
            </div>
          )}
        </>
      )}

      {needsAmountField && (
        <label className="flex flex-col gap-1 text-body">
          Amount (RWF)
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="min-h-12 rounded-lg bg-lighter p-3 text-2xl tabular-nums text-heading"
          />
        </label>
      )}

      <button type="button" onClick={handleSubmit} className="min-h-12 rounded-lg bg-primary px-4 py-3 font-semibold text-dark">
        Add
      </button>
    </div>
  )
}
