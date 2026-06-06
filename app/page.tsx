"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import {
  Zap, History, ShieldCheck, TrendingUp, CreditCard, Target,
  ChevronDown, Info, ArrowLeftRight, Check, Loader2,
} from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { useGlobalStats } from "@/hooks/use-global-stats"
import { AMMSwapWidget } from "@/components/amm-swap-widget"
import { useFhePrivateLending } from "@/hooks/use-fhe-private-lending"
import { CONTRACTS } from "@/lib/contracts"
import { formatUnits, parseUnits } from "viem"
import { toast } from "sonner"
import { Shield, Eye, Lock } from "lucide-react"

const BORROW_ASSETS = [
  { symbol: "USDC", color: "bg-blue-500" },
  { symbol: "USDT", color: "bg-green-600" },
  { symbol: "BNB",  color: "bg-yellow-500" },
]
const COLLATERAL_ASSETS = [
  { symbol: "WETH", color: "bg-blue-400" },
  { symbol: "WBTC", color: "bg-orange-500" },
  { symbol: "BNB",  color: "bg-yellow-500" },
]
const TABS = ["Borrow", "Lend", "Swap"] as const
type Tab = typeof TABS[number]

function TokenDropdown({ options, value, onChange }: {
  options: { symbol: string; color: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.symbol === value) ?? options[0]
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 hover:border-primary/40 rounded-xl px-3 py-2.5 transition-colors min-w-[110px]">
        <TokenIcon symbol={selected.symbol} size={20} className="flex-shrink-0" />
        <span className="text-sm font-semibold text-white">{selected.symbol}</span>
        <ChevronDown size={13} className={`text-foreground/40 transition-transform ml-auto ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#0d0f14] border border-border/40 rounded-xl overflow-hidden shadow-2xl min-w-[130px]">
          {options.map(opt => (
            <button key={opt.symbol} type="button" onClick={() => { onChange(opt.symbol); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left">
              <TokenIcon symbol={opt.symbol} size={20} className="flex-shrink-0" />
              <span className="text-sm text-white">{opt.symbol}</span>
              {opt.symbol === value && <Check size={12} className="text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PrivateActionWidget() {
  const [tab, setTab] = useState<Tab>("Borrow")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [borrowAsset, setBorrowAsset] = useState("USDC")
  const [collateralAsset, setCollateralAsset] = useState("WETH")
  const [lendAmount, setLendAmount] = useState("")
  const [lendAsset, setLendAsset] = useState("USDC")

  const { supply, borrow, loading } = useFhePrivateLending()

    const handleBorrow = async () => {
        if (!borrowAmount) return
        const { TOKENS } = await import("@/config/tokens")
        try {
            const token = TOKENS[borrowAsset]
            const decimals = token?.decimals || 18
            const amount = parseUnits(borrowAmount, decimals)
            const tokenAddr = (CONTRACTS.MASTER as any)[borrowAsset] || borrowAsset
            await borrow(amount, tokenAddr)
            toast.success(`Confidential borrow of ${borrowAmount} ${borrowAsset} initiated`)
        } catch (err: any) {
            toast.error(err.message || "Borrow failed")
        }
    }

    const handleLend = async () => {
        if (!lendAmount) return
        const { TOKENS } = await import("@/config/tokens")
        try {
            const token = TOKENS[lendAsset]
            const decimals = token?.decimals || 18
            const amount = parseUnits(lendAmount, decimals)
            // Use the token address from CONTRACTS.MASTER or SPOKES
            const tokenAddr = (CONTRACTS.MASTER as any)[lendAsset] || lendAsset
            await supply(amount, tokenAddr)
            toast.success(`Confidential supply of ${lendAmount} ${lendAsset} initiated`)
        } catch (err: any) {
            toast.error(err.message || "Supply failed")
        }
    }

  return (
    <div className="bg-[#0d0f14] border border-border/30 rounded-3xl overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-[#05080f]/60 border-b border-border/20">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition-all ${tab === t ? "bg-[#1a1d24] text-white shadow border border-border/30" : "text-foreground/40 hover:text-foreground/70"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="p-6 space-y-4">
        {tab === "Borrow" && (
          <>
            <div>
              <h3 className="text-lg font-bold text-white">Borrow with Privacy</h3>
              <p className="text-xs text-foreground/40 mt-1 leading-relaxed">Submit a private borrow intent. Your request is encrypted with fully homomorphic encryption (fhenix fheVM).</p>
            </div>
            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-foreground/40">{"You're borrowing"}</label>
              <div className="flex items-center gap-3">
                <input type="number" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} placeholder="0" className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={BORROW_ASSETS} value={borrowAsset} onChange={setBorrowAsset} />
              </div>
            </div>
            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-foreground/40">Collateral ({collateralAsset})</label>
              <div className="flex items-center gap-3">
                <input type="number" value={collateralAmount} onChange={e => setCollateralAmount(e.target.value)} placeholder="0" className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={COLLATERAL_ASSETS} value={collateralAsset} onChange={setCollateralAsset} />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
              <Info size={14} className="text-foreground/30 flex-shrink-0" />
              <span className="text-xs text-foreground/40">Your collateral data is encrypted and hidden from the server</span>
            </div>
            <button 
              onClick={handleBorrow}
              disabled={loading || !borrowAmount}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Submit Borrow Intent
            </button>
          </>
        )}
        {tab === "Lend" && (
          <>
            <div>
              <h3 className="text-lg font-bold text-white">Lend with Privacy</h3>
              <p className="text-xs text-foreground/40 mt-1 leading-relaxed">Supply liquidity privately. Your supply intent is matched securely via fhenix fheVM.</p>
            </div>
            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-foreground/40">{"You're lending"}</label>
              <div className="flex items-center gap-3">
                <input type="number" value={lendAmount} onChange={e => setLendAmount(e.target.value)} placeholder="0" className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={BORROW_ASSETS} value={lendAsset} onChange={setLendAsset} />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
              <Info size={14} className="text-foreground/30 flex-shrink-0" />
              <span className="text-xs text-foreground/40">Your lending signals are encrypted and hidden from the server</span>
            </div>
            <button 
              onClick={handleLend}
              disabled={loading || !lendAmount}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Submit Lend Intent
            </button>
          </>
        )}
        {tab === "Swap" && <AMMSwapWidget />}
      </div>
    </div>
  )
}

export default function Page() {
  const { stats: globalStats, loading: statsLoading, error: statsError } = useGlobalStats()

  const fmt = (val: number | undefined, suffix = "") =>
    statsLoading || statsError || val === undefined ? "—" : `${val}${suffix}`

  const { 
    decryptAllPositions, 
    suppliedBalance, 
    debtBalance, 
    creditScore,
    creditLimit,
    loading: fheLoading 
  } = useFhePrivateLending()

  const [hasDecrypted, setHasDecrypted] = useState(false)

    const handleDecrypt = async () => {
        try {
            toast.info("Requesting secure decryption via EIP-712...")
            // Default to USDC for home page overview
            const { TOKENS } = await import("@/config/tokens")
            const tokenAddr = TOKENS["USDC"]?.address || ""
            await decryptAllPositions(tokenAddr)
            setHasDecrypted(true)
            toast.success("Confidential positions revealed")
        } catch (err) {
            console.error("Decryption failed:", err)
            toast.error("Decryption failed - please try again")
        }
    }

  const statCards = [
    {
      tag: "SUPPLY",
      asset: "USDC",
      sub: fmt(globalStats?.avgSupplyApy !== undefined ? +globalStats.avgSupplyApy.toFixed(1) : undefined, "% Avg APY"),
      icon: TrendingUp,
    },
    {
      tag: "BORROW",
      asset: "WETH",
      sub: "2.1% Avg APY",
      icon: Zap,
    },
    {
      tag: "ASSETS",
      asset: "TOTAL",
      sub: statsLoading || statsError || globalStats?.activePools === undefined
        ? "— Configured"
        : `${globalStats.activePools} Configured`,
      icon: Target,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Confidential Asset Overview</h2>
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Secured by Fhenix FHEVM // Sepolia Network</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] text-primary font-bold tracking-wider uppercase backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Shield_Active
          </div>
        </div>
        <div className="relative group overflow-hidden bg-[#05080f]/50 border border-primary/20 rounded-3xl p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={120} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <CreditCard size={12} className="text-primary" />Total_Supplied_(Encrypted)
                </div>
                <div className="text-5xl font-black tracking-tighter text-foreground font-mono">
                  {hasDecrypted && suppliedBalance !== null ? `$${formatUnits(suppliedBalance, 6)}` : "••••••••"}
                </div>
                <p className="text-[10px] text-foreground/20 italic mt-2">*Only you can decrypt your position data.</p>
              </div>
              <div>
                <div className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <History size={12} className="text-primary" />Total_Borrowed_(Encrypted)
                </div>
                <div className="text-3xl font-bold tracking-tight text-white/50">
                  {hasDecrypted && debtBalance !== null ? `$${formatUnits(debtBalance, 6)}` : "••••••••"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Target size={12} className="text-primary" />Credit_Score_(Private)
                </div>
                <div className="text-3xl font-bold tracking-tighter text-purple-400">
                  {hasDecrypted && creditScore !== null ? creditScore : "•••"}
                  <span className="text-[10px] text-foreground/20 ml-2">/ 850</span>
                </div>
                {hasDecrypted && creditLimit !== null && (
                  <p className="text-[10px] text-purple-400/60 uppercase tracking-widest mt-1">Limit: ${(Number(creditLimit)/1e6).toFixed(0)} USDC</p>
                )}
              </div>

              {!hasDecrypted && (
                <button 
                  onClick={handleDecrypt}
                  disabled={fheLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-[10px] font-bold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {fheLoading ? <Loader2 className="animate-spin" size={12} /> : <Eye size={12} />}
                  DECRYPT_POSITIONS
                </button>
              )}
            </div>
            <div className="flex flex-col justify-between space-y-8">
              <div className="bg-secondary/20 border border-border/40 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground/50 uppercase tracking-widest">Health_Factor</span>
                  <span className="text-sm font-black text-primary px-2 py-0.5 rounded border border-primary/30">
                    {hasDecrypted ? "Safe (1.85)" : "Safe"}
                  </span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-border/10">
                  <div className="h-full w-[85%] bg-primary" />
                </div>
                <div className="flex justify-between text-[10px] text-foreground/30 uppercase">
                  <span>Threshold: 150%</span><span>Current: 185%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/40 border border-border/30 rounded-xl">
                  <div className="text-[9px] text-foreground/40 uppercase mb-1">Net APR</div>
                  <div className="text-sm font-bold text-green-400">+5.24%</div>
                </div>
                <div className="p-4 bg-background/40 border border-border/30 rounded-xl">
                  <div className="text-[9px] text-foreground/40 uppercase mb-1">Borrow Power</div>
                  <div className="text-sm font-bold text-primary">High</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((item, i) => (
            <div key={i} className="bg-card/30 border border-border/50 rounded-2xl p-6 hover:bg-card/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary"><item.icon size={18} /></div>
                <div className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">{item.tag}</div>
              </div>
              <div className="text-lg font-bold">{item.asset}</div>
              <div className="text-xs text-foreground/50 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-5 space-y-6">
        <PrivateActionWidget />
        <div className="bg-[#05080f]/40 border border-border/40 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 italic">Recent_Chain_Logs</h3>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-foreground/30 uppercase">LIVE</span>
              <div className="w-1 h-1 rounded-full bg-primary" />
            </div>
          </div>
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 border-l-2 border-primary/20 pl-4 py-1 hover:border-primary transition-colors cursor-default">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-primary/80 tracking-tighter">TX_REDACTED_HASH_{i}4FC9</div>
                  <div className="text-xs font-medium text-foreground/80 leading-snug">Decrypted call to <span className="text-primary/70">supply()</span></div>
                  <div className="text-[9px] text-foreground/30 uppercase mt-1">Confirmed // 2.4s ago</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/transactions" className="mt-10 block text-center text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40 hover:text-primary transition-colors">
            View All Confidential Logs
          </Link>
        </div>
      </div>
    </div>
  )
}