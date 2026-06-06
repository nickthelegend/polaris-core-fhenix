"use client"

import {
  TrendingDown,
  ArrowUpRight,
  Database,
  ShieldCheck,
  Clock,
  Zap,
  ArrowDown,
  ExternalLink,
  ShieldAlert
} from "lucide-react"
import Link from "next/link"
import { useTransactions } from "@/hooks/use-transactions"
import { useAccount } from "wagmi"

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'borrow': return <Zap className="w-5 h-5 text-red-400" />
    case 'deposit': return <Database className="w-5 h-5 text-green-400" />
    case 'repay': return <ArrowDown className="w-5 h-5 text-blue-400" />
    case 'supply': return <PlusIcon className="w-5 h-5 text-primary" />
    case 'liquidation': return <ShieldAlert className="w-5 h-5 text-yellow-500" />
    case 'swap': return <ArrowUpRight className="w-5 h-5 text-purple-400" />
    default: return <Database className="w-5 h-5 text-foreground/40" />
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function TransactionsPage() {
  const { address, isConnected } = useAccount()
  const { transactions, loading, error } = useTransactions()

  return (
    <div className="flex flex-col gap-8 py-8 font-mono text-white">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">
          Confidential_Ledger // access_granted
        </span>
        <h1 className="text-white text-3xl tracking-tighter font-black uppercase">
          Transaction History
        </h1>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#05080f]/40 border border-primary/20 rounded-2xl p-8 relative overflow-hidden group backdrop-blur-md">
          <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Supplied</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-white text-4xl font-black tracking-tighter tabular-nums">••••••••</h1>
          </div>
          <Database className="absolute -bottom-2 -right-2 w-16 h-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
        </div>

        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-8 relative overflow-hidden group backdrop-blur-md">
          <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Borrowed</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-white text-4xl font-black tracking-tighter tabular-nums">••••••••</h1>
          </div>
          <Zap className="absolute -bottom-2 -right-2 w-16 h-16 text-red-500/5 group-hover:text-red-500/10 transition-colors" />
        </div>

        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-8 relative overflow-hidden group backdrop-blur-md">
          <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Health Factor</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-primary text-4xl font-black tracking-tighter tabular-nums">Safe</h1>
          </div>
          <ShieldCheck className="absolute -bottom-2 -right-2 w-16 h-16 text-primary/5 group-hover:text-primary/10 transition-colors" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-white text-xs font-bold uppercase tracking-[0.3em] text-foreground/40">Recent Confidential Activity</h2>
          </div>
          
          <div className="space-y-4">
            {!isConnected && (
              <div className="bg-card/20 border border-border/40 rounded-2xl p-12 text-center">
                <Database size={48} className="mx-auto text-foreground/20 mb-4" />
                <p className="text-sm text-foreground/40">Connect your wallet to view transaction history</p>
              </div>
            )}
            
            {isConnected && loading && (
              <div className="bg-card/20 border border-border/40 rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-foreground/40">Loading transactions...</p>
              </div>
            )}
            
            {isConnected && error && (
              <div className="bg-card/20 border border-border/40 rounded-2xl p-12 text-center">
                <p className="text-sm text-red-400">Error: {error}</p>
              </div>
            )}
            
            {isConnected && !loading && !error && transactions.length === 0 && (
              <div className="bg-card/20 border border-border/40 rounded-2xl p-12 text-center">
                <History size={48} className="mx-auto text-foreground/20 mb-4" />
                <p className="text-sm text-foreground/40">No transactions found</p>
                <p className="text-xs text-foreground/30 mt-2">Your transaction history will appear here</p>
              </div>
            )}
            
            {isConnected && !loading && !error && transactions.map((t, i) => (
              <div key={i} className="bg-card/20 border border-border/40 rounded-2xl p-6 flex items-center justify-between hover:bg-white/[0.04] transition-all group backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-2xl bg-white/5 border border-border/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                    {getIcon(t.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg tracking-tight">{t.title}</span>
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-black tracking-widest uppercase italic">
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 font-mono">
                      <span className="text-[10px] text-foreground/40 uppercase font-black">{formatTimeAgo(t.timestamp)}</span>
                      {t.txHash && (
                        <>
                          <span className="text-[10px] text-foreground/20">|</span>
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${t.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-1 font-bold underline"
                          >
                            TX_{t.txHash.slice(0, 6)} <ExternalLink size={10} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-white font-black text-2xl tabular-nums tracking-tighter">
                      {t.type === 'borrow' || t.type === 'repay' ? '-' : '+'}
                      {t.amount}
                    </span>
                    <span className="text-white/30 text-[10px] font-black uppercase mt-1">{t.asset}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/20 italic">
                    {t.type}_protocol_call
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-6">
           <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldCheck size={16} /> Audit_Report
              </h3>
              <p className="text-[10px] text-foreground/60 leading-relaxed font-mono">
                The Polaris Protocol undergoes continuous health audits on the Sepolia FHEVM. Your positions are individually monitored for risk while maintaining 100% encryption on the public ledger.
              </p>
              <div className="pt-4 border-t border-primary/10 space-y-3">
                 <div className="flex justify-between text-[10px]">
                    <span className="text-foreground/40">LAST_SYSTEM_AUDIT</span>
                    <span className="text-white font-bold">14m ago</span>
                 </div>
                 <div className="flex justify-between text-[10px]">
                    <span className="text-foreground/40">NETWORK_LOAD</span>
                    <span className="text-green-400 font-bold">OPTIMAL</span>
                 </div>
              </div>
           </div>

           <div className="bg-[#05080f]/40 border border-border/40 rounded-3xl p-8 space-y-6 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/40">Protocol Nodes</h3>
              <div className="space-y-4 font-mono">
                {["KMS_NODE_01", "KMS_NODE_02", "RELAYER_SEP_01"].map(node => (
                  <div key={node} className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground/60">{node}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-primary tracking-tighter font-bold">ACTIVE</span>
                      <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  )
}
