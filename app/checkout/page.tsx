"use client"

import type React from "react"

import { ConnectGate } from "@/components/connect-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function CheckoutPage() {
  return (
    <ConnectGate>
      <CheckoutForm />
    </ConnectGate>
  )
}

function CheckoutForm() {
  const [amount, setAmount] = useState("12.50")
  const [note, setNote] = useState("Test purchase")
  const [res, setRes] = useState<{ txId: string; explorerUrl: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function onPay(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const r = await fetch("/api/pay", { method: "POST", body: JSON.stringify({ amount, note }) })
    const j = await r.json()
    setRes(j)
    setLoading(false)
  }

  return (
    <form onSubmit={onPay} className="rounded-3xl p-5 bg-card/40 border border-border/40 backdrop-blur-xl space-y-4">
      <h1 className="text-lg font-semibold">Pay with Obolus</h1>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USDC)</Label>
        <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading ? "Processing…" : "Pay"}
      </Button>

      {res && (
        <div className="text-sm bg-background/60 border border-border/40 rounded-xl p-3">
          <div>
            Mock Tx: <span className="font-medium">{res.txId}</span>
          </div>
          <a className="underline" href={res.explorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </div>
      )}
    </form>
  )
}
