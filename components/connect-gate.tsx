"use client"

import type React from "react"
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button"
import { useObolusWallet } from "@/lib/hooks/useObolusWallet"

export function ConnectGate({ children }: { children: React.ReactNode }) {
  const { connected: authenticated, connecting } = useObolusWallet()

  if (connecting) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-t-2 border-primary animate-spin" />
          <span className="text-[10px] text-primary uppercase font-bold tracking-[0.3em] animate-pulse">Establishing_Secure_Link...</span>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center font-mono">
        <div className="glass-card rounded-lg border border-primary/20 p-8 w-full max-w-sm flex flex-col items-center shadow-[0_0_30px_rgba(166,242,74,0.1)]">
          <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 mb-6 group cursor-pointer active:scale-95 transition-all">
            <ConnectWalletButton />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-white mb-2 underline decoration-primary/20">AUTH_REQUIRED</h1>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.1em] leading-relaxed max-w-[200px]">
            Please establish a link with Polaris to access the confidential lending terminals.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
