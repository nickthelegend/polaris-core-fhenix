"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, Lock, TrendingUp, Info, ChevronRight } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { LendingActionModal, type ModalMode, type PoolInfo } from "@/components/lending-action-modal"
import { usePools } from "@/hooks/use-pools"
import { useGlobalStats } from "@/hooks/use-global-stats"

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 px-8 py-6 items-center animate-pulse">
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-12 rounded bg-white/10" />
          <div className="h-2 w-20 rounded bg-white/5" />
        </div>
      </div>
      <div className="col-span-2 flex justify-end"><div className="h-3 w-10 rounded bg-white/10" /></div>
      <div className="col-span-2 flex justify-end"><div className="h-3 w-10 rounded bg-white/10" /></div>
      <div className="col-span-2 flex justify-end"><div className="h-3 w-14 rounded bg-white/10" /></div>
      <div className="col-span-2 flex justify-end gap-2">
        <div className="h-6 w-14 rounded-lg bg-white/10" />
        <div className="h-6 w-14 rounded-lg bg-white/10" />
      </div>
    </div>
  )
}

export default function PoolsPage() {
  const [modal, setModal] = useState<{ pool: PoolInfo; mode: ModalMode } | null>(null)
  const { pools, loading: poolsLoading, error: poolsError } = usePools()
  const { stats, loading: statsLoading } = useGlobalStats()

  const totalLiquidity = stats?.totalSupplied ?? null
  const avgSupplyApy = stats?.avgSupplyApy ?? null

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      {modal && (
        <LendingActionModal
          pool={modal.pool}
          mode={modal.mode}
          onClose={() => setModal(null)}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">
          Confidential_Markets // active_pools
        </span>
        <h1 className="text-white text-3xl tracking-tighter font-black uppercase">Lending Terminals</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#05080f]/40 border border-primary/20 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Global_Liquidity</span>
          <div className="text-3xl font-bold tracking-tight">
            {statsLoading ? <span className="text-foreground/30">—</span> : totalLiquidity !== null ? formatUsd(totalLiquidity) : "—"}
          </div>
          <div className="text-[10px] text-primary/60 flex items-center gap-1 mt-2">
            <TrendingUp size={12} />+12.4% THIS MONTH
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Avg_Supply_APY</span>
          <div className="text-3xl font-bold tracking-tight text-primary">
            {statsLoading ? <span className="text-foreground/30">—</span> : avgSupplyApy !== null ? `${avgSupplyApy.toFixed(2)}%` : "—"}
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Active_Borrows</span>
          <div className="text-3xl font-bold tracking-tight">Private</div>
        </div>
      </div>

      {/* Pool Table */}
      <div className="bg-card/20 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="grid grid-cols-12 bg-white/5 border-b border-border/20 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">
          <div className="col-span-4">Asset</div>
          <div className="col-span-2 text-right">Supply APY</div>
          <div className="col-span-2 text-right">Borrow APY</div>
          <div className="col-span-2 text-right">Liquidity</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border/10">
          {poolsError && (
            <div className="px-8 py-6 text-sm text-red-400">
              Failed to load pools: {poolsError}
            </div>
          )}

          {poolsLoading && !poolsError && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!poolsLoading && !poolsError && pools.map((pool) => {
            const poolInfo: PoolInfo = {
              symbol: pool.symbol,
              name: pool.name,
              supplyApy: `${pool.supplyApy.toFixed(1)}%`,
              borrowApy: `${pool.borrowApy.toFixed(1)}%`,
            }
            return (
              <Link
                key={pool.symbol}
                href={`/pools/${pool.symbol.toLowerCase()}`}
                className="grid grid-cols-12 px-8 py-6 items-center hover:bg-primary/5 transition-colors group cursor-pointer"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <TokenIcon
                    symbol={pool.symbol}
                    size={pool.symbol === "ETH" ? 18 : 24}
                    className="flex-shrink-0"
                  />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{pool.symbol}</div>
                    <div className="text-[10px] text-foreground/40 italic">{pool.name}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm font-bold text-green-400">{poolInfo.supplyApy}</div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm font-bold text-red-400">{poolInfo.borrowApy}</div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm font-mono text-white/80 flex items-center justify-end gap-1.5 uppercase">
                    ${parseFloat(pool.liquidity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end items-center gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal({ pool: poolInfo, mode: "supply" }) }}
                    className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                  >
                    Supply
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal({ pool: poolInfo, mode: "borrow" }) }}
                    className="px-3 py-1.5 rounded-lg border border-border/30 bg-secondary/20 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-secondary/40 transition-all"
                  >
                    Borrow
                  </button>
                  <ChevronRight size={14} className="text-foreground/20 group-hover:text-primary/60 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
        <Info className="text-primary flex-shrink-0" size={20} />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Confidential Protocol Notice</p>
          <p className="text-[11px] text-foreground/50 leading-relaxed">
            All liquidity data is processed on-chain using Fully Homomorphic Encryption. Individual pool sizes are obfuscated to protect market depth and prevent front-running.
          </p>
        </div>
      </div>
    </div>
  )
}
