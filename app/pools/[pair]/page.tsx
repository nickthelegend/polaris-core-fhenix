"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, ShieldCheck, TrendingUp, TrendingDown, Zap, Loader2 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from "recharts"
import { TokenIcon } from "@/components/token-icon"
import { useFhePrivateLending } from "@/hooks/use-fhe-private-lending"

const POOL_DATA: Record<string, {
  symbol: string
  name: string
  supplyApy: string
  borrowApy: string
  tvl: string
  utilization: string
  ltv: string
  supplyData: { day: string; apy: number }[]
  borrowData: { day: string; apy: number }[]
}> = {
  eth: {
    symbol: "ETH", name: "Ether",
    supplyApy: "3.4%", borrowApy: "5.2%", tvl: "$8.1M", utilization: "62%", ltv: "80%",
    supplyData: [
      { day: "Mon", apy: 3.1 }, { day: "Tue", apy: 3.0 }, { day: "Wed", apy: 3.3 },
      { day: "Thu", apy: 3.2 }, { day: "Fri", apy: 3.5 }, { day: "Sat", apy: 3.4 }, { day: "Sun", apy: 3.4 },
    ],
    borrowData: [
      { day: "Mon", apy: 4.9 }, { day: "Tue", apy: 5.0 }, { day: "Wed", apy: 5.1 },
      { day: "Thu", apy: 5.0 }, { day: "Fri", apy: 5.3 }, { day: "Sat", apy: 5.2 }, { day: "Sun", apy: 5.2 },
    ],
  },
  usdc: {
    symbol: "USDC", name: "USD Coin",
    supplyApy: "2.1%", borrowApy: "4.8%", tvl: "$12.4M", utilization: "44%", ltv: "85%",
    supplyData: [
      { day: "Mon", apy: 1.9 }, { day: "Tue", apy: 2.0 }, { day: "Wed", apy: 2.0 },
      { day: "Thu", apy: 2.1 }, { day: "Fri", apy: 2.2 }, { day: "Sat", apy: 2.1 }, { day: "Sun", apy: 2.1 },
    ],
    borrowData: [
      { day: "Mon", apy: 4.5 }, { day: "Tue", apy: 4.6 }, { day: "Wed", apy: 4.7 },
      { day: "Thu", apy: 4.8 }, { day: "Fri", apy: 4.9 }, { day: "Sat", apy: 4.8 }, { day: "Sun", apy: 4.8 },
    ],
  },
  wbtc: {
    symbol: "WBTC", name: "Wrapped Bitcoin",
    supplyApy: "2.8%", borrowApy: "4.1%", tvl: "$15.2M", utilization: "38%", ltv: "70%",
    supplyData: [
      { day: "Mon", apy: 2.5 }, { day: "Tue", apy: 2.6 }, { day: "Wed", apy: 2.7 },
      { day: "Thu", apy: 2.8 }, { day: "Fri", apy: 2.9 }, { day: "Sat", apy: 2.8 }, { day: "Sun", apy: 2.8 },
    ],
    borrowData: [
      { day: "Mon", apy: 3.8 }, { day: "Tue", apy: 3.9 }, { day: "Wed", apy: 4.0 },
      { day: "Thu", apy: 4.1 }, { day: "Fri", apy: 4.2 }, { day: "Sat", apy: 4.1 }, { day: "Sun", apy: 4.1 },
    ],
  },
  bnb: {
    symbol: "BNB", name: "BNB",
    supplyApy: "5.1%", borrowApy: "7.5%", tvl: "$3.4M", utilization: "71%", ltv: "65%",
    supplyData: [
      { day: "Mon", apy: 4.8 }, { day: "Tue", apy: 4.9 }, { day: "Wed", apy: 5.0 },
      { day: "Thu", apy: 5.1 }, { day: "Fri", apy: 5.2 }, { day: "Sat", apy: 5.1 }, { day: "Sun", apy: 5.1 },
    ],
    borrowData: [
      { day: "Mon", apy: 7.1 }, { day: "Tue", apy: 7.2 }, { day: "Wed", apy: 7.3 },
      { day: "Thu", apy: 7.5 }, { day: "Fri", apy: 7.6 }, { day: "Sat", apy: 7.5 }, { day: "Sun", apy: 7.5 },
    ],
  },
}

function Sparkline({ data, color }: { data: { day: string; apy: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" hide />
        <Tooltip
          contentStyle={{ background: "#05080f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
          labelStyle={{ color: "rgba(255,255,255,0.4)" }}
          itemStyle={{ color }}
          formatter={(v: number) => [`${v.toFixed(2)}%`, "APY"]}
        />
        <Area type="monotone" dataKey="apy" stroke={color} strokeWidth={2} fill={`url(#grad-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function PoolDetailPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = use(params)
  const pool = POOL_DATA[pair.toLowerCase()]

  const [supplyAmount, setSupplyAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [supplyTx, setSupplyTx] = useState<string | null>(null)
  const [borrowTx, setBorrowTx] = useState<string | null>(null)
  const [supplyErr, setSupplyErr] = useState<string | null>(null)
  const [borrowErr, setBorrowErr] = useState<string | null>(null)

  const { supply, borrow, loading, error } = useFhePrivateLending()

  const handleSupply = async () => {
    if (!supplyAmount || parseFloat(supplyAmount) <= 0) return
    setSupplyErr(null); setSupplyTx(null)
    try {
      const wei = BigInt(Math.floor(parseFloat(supplyAmount) * 1e9)) * BigInt(1e9)
      const hash = await supply(wei)
      setSupplyTx(hash)
      setSupplyAmount("")
    } catch (err: unknown) {
      setSupplyErr(err instanceof Error ? err.message : String(err))
    }
  }

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) return
    setBorrowErr(null); setBorrowTx(null)
    try {
      const wei = BigInt(Math.floor(parseFloat(borrowAmount) * 1e9)) * BigInt(1e9)
      const hash = await borrow(wei)
      setBorrowTx(hash)
      setBorrowAmount("")
    } catch (err: unknown) {
      setBorrowErr(err instanceof Error ? err.message : String(err))
    }
  }

  if (!pool) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-mono text-white gap-4">
        <p className="text-foreground/40 text-sm uppercase tracking-widest">Pool not found</p>
        <Link href="/pools" className="text-primary text-xs underline">← Back to Pools</Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pools" className="p-2 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <TokenIcon symbol={pool.symbol} size={28} className="flex-shrink-0" />
        <div>
          <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Pool_Detail // {pool.symbol}</span>
          <h1 className="text-white text-3xl tracking-tighter font-black uppercase">{pool.symbol} / {pool.name}</h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TVL", value: pool.tvl, icon: <ShieldCheck size={14} className="text-primary/60" /> },
          { label: "Utilization", value: pool.utilization, icon: <Zap size={14} className="text-yellow-400/60" /> },
          { label: "Max LTV", value: pool.ltv, icon: <TrendingUp size={14} className="text-green-400/60" /> },
          { label: "Liquidity", value: "Private", icon: <Lock size={14} className="text-primary/40" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#05080f]/40 border border-border/30 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/40 uppercase tracking-widest">
              {s.icon}{s.label}
            </div>
            <div className="text-2xl font-bold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card/20 border border-border/40 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Supply APY</span>
            <span className="text-lg font-bold text-green-400">{pool.supplyApy}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-green-400/60 mb-4">
            <TrendingUp size={10} /> 7-day trend
          </div>
          <Sparkline data={pool.supplyData} color="#4ade80" />
        </div>

        <div className="bg-card/20 border border-border/40 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Borrow APY</span>
            <span className="text-lg font-bold text-red-400">{pool.borrowApy}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-red-400/60 mb-4">
            <TrendingDown size={10} /> 7-day trend
          </div>
          <Sparkline data={pool.borrowData} color="#f87171" />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supply */}
        <div className="bg-[#05080f]/40 border border-primary/20 rounded-3xl p-8 backdrop-blur-md flex flex-col gap-6">
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mb-1">Supply {pool.symbol}</p>
            <p className="text-xs text-foreground/30">Earn {pool.supplyApy} APY</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={supplyAmount}
              onChange={e => setSupplyAmount(e.target.value)}
              className="w-full bg-secondary/20 border border-border/30 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-foreground/20 focus:outline-none focus:border-primary/40"
            />
            <div className="flex items-center justify-between text-[10px] text-foreground/30 uppercase tracking-widest">
              <span>Available</span>
              <span className="flex items-center gap-1"><Lock size={10} className="text-primary/40" /> Private</span>
            </div>
          </div>
          {supplyErr && <p className="text-xs text-red-400">{supplyErr}</p>}
          {supplyTx && <p className="text-xs text-green-400 font-mono truncate">TX: {supplyTx}</p>}
          <button
            onClick={handleSupply}
            disabled={loading || !supplyAmount}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Supply {pool.symbol}
          </button>
        </div>

        {/* Borrow */}
        <div className="bg-[#05080f]/40 border border-border/30 rounded-3xl p-8 backdrop-blur-md flex flex-col gap-6">
          <div>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest mb-1">Borrow {pool.symbol}</p>
            <p className="text-xs text-foreground/30">Pay {pool.borrowApy} APY</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={borrowAmount}
              onChange={e => setBorrowAmount(e.target.value)}
              className="w-full bg-secondary/20 border border-border/30 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-foreground/20 focus:outline-none focus:border-border/60"
            />
            <div className="flex items-center justify-between text-[10px] text-foreground/30 uppercase tracking-widest">
              <span>Available to Borrow</span>
              <span className="flex items-center gap-1"><Lock size={10} className="text-primary/40" /> Private</span>
            </div>
          </div>
          {borrowErr && <p className="text-xs text-red-400">{borrowErr}</p>}
          {borrowTx && <p className="text-xs text-green-400 font-mono truncate">TX: {borrowTx}</p>}
          <button
            onClick={handleBorrow}
            disabled={loading || !borrowAmount}
            className="w-full py-3 rounded-xl border border-border/40 bg-secondary/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-secondary/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Borrow {pool.symbol}
          </button>
        </div>
      </div>
    </div>
  )
}
