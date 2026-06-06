"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function LimitCard() {
  const [data, setData] = useState<{ currentLimit: number; used: number } | null>(null)

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const r = await fetch("/api/limits")
        const json = await r.json()
        setData(json)
      } catch (err) {
        console.error("Failed to fetch limits", err)
      }
    }
    fetchLimits()
    const interval = setInterval(fetchLimits, 15_000)
    return () => clearInterval(interval)
  }, [])

  const total = data?.currentLimit ?? 200
  const used = data?.used ?? 32
  const available = Math.max(0, total - used)
  const pct = Math.min(100, Math.round((used / total) * 100))

  return (
    <Card className="bg-card/40 border border-border/40 backdrop-blur-xl rounded-3xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-foreground/40 font-black uppercase tracking-[0.2em]">Spending_Limit</div>
          <Link href="/limits">
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(166,242,74,0.2)] px-4">
              UPGRADE
            </Button>
          </Link>
        </div>

        <div className="mt-3 text-4xl font-light tracking-tighter text-white">
          ${available.toFixed(2)} <span className="text-xs uppercase font-black tracking-widest text-foreground/30 align-middle">Available_Pool</span>
        </div>
        <div className="text-[10px] text-foreground/30 font-black uppercase tracking-widest">Total_Quota: ${total.toFixed(2)}</div>

        <div className="mt-4">
          <div className="h-3 rounded-full bg-primary/10 border border-primary/20 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} aria-label="Used percentage" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-foreground/30 font-black uppercase tracking-widest font-mono">
            <span>USED_${used.toFixed(2)}</span>
            <span>{pct}%_UTIL</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
