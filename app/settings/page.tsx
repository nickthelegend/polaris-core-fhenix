"use client"

import { ConnectGate } from "@/components/connect-gate"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <ConnectGate>
      <div className="rounded-3xl p-5 bg-card/40 border border-border/40 backdrop-blur-xl space-y-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark">Dark Mode</Label>
          <Switch id="dark" checked />
        </div>
        <div className="text-xs text-foreground/70">Theme follows the neon-lime on dark Obolus design.</div>
      </div>
    </ConnectGate>
  )
}
