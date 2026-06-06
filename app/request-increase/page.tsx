"use client"

import type React from "react"

import { ConnectGate } from "@/components/connect-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function RequestIncreasePage() {
  return (
    <ConnectGate>
      <RequestForm />
    </ConnectGate>
  )
}

function RequestForm() {
  const [target, setTarget] = useState("500")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const r = await fetch("/api/request-increase", { method: "POST", body: JSON.stringify({ target: Number(target) }) })
    const j = await r.json()
    setStatus(j.status || "submitted")
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl p-5 bg-card/40 border border-border/40 backdrop-blur-xl space-y-4">
      <h1 className="text-lg font-semibold">Request Increase</h1>
      <div className="space-y-2">
        <Label htmlFor="target">Desired Limit (USDC)</Label>
        <Input id="target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit"}
      </Button>
      {status && (
        <div className="text-sm">
          Status: <span className="font-medium">{status}</span>
        </div>
      )}
    </form>
  )
}
