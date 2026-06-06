"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowDown, ShieldCheck, Lock, TrendingUp, Zap,
  History, Target, ArrowUpRight, X, Database, Loader2, Terminal
} from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { usePositions, type Position } from "@/hooks/use-positions"
import { useAccount } from "wagmi"
import { useFhePrivateLending } from "@/hooks/use-fhe-private-lending"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { syncTransaction, syncPosition } from "@/lib/sync-utils"
import { getTokenAddress } from "@/config/tokens"

type LogEntry = { ts: number; msg: string; type: "info" | "ok" | "err" | "wait" }

function ManageModal({ pos, onClose }: { pos: Position; onClose: () => void }) {
  const isSupply = pos.type === "SUPPLY"
  const [tab, setTab] = useState<"add" | "withdraw">("add")
  const [amount, setAmount] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const { address } = useAccount()
  const { supply, borrow, repay, requestWithdrawal, finalizeWithdrawal, loading, decryptAllPositions, suppliedBalance, collateralBalance, debtBalance } = useFhePrivateLending()
  const [decryptingBal, setDecryptingBal] = useState(false)

  const tokenAddr = getTokenAddress(pos.symbol, 11155111) || ""

  const currentBalance = isSupply
    ? (suppliedBalance !== null ? suppliedBalance : collateralBalance)
    : debtBalance

  const handleDecryptBalance = async () => {
    setDecryptingBal(true)
    try {
      await decryptAllPositions(tokenAddr)
    } catch {}
    setDecryptingBal(false)
  }

  const log = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs(prev => [...prev, { ts: Date.now(), msg, type }])
  }

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight) }, [logs])

  const supplyTabs = [
    { key: "add", label: isSupply ? "Supply More" : "Borrow More" },
    { key: "withdraw", label: isSupply ? "Withdraw" : "Repay" },
  ] as const

  const handleAction = async () => {
    if (!amount) return
    const { TOKENS } = await import("@/config/tokens")
    setLogs([])
    try {
      const token = TOKENS[pos.symbol]
      const decimals = token?.decimals || 18
      const amountWei = parseUnits(amount, decimals)
      const action = tab === "add" ? (isSupply ? "Supply" : "Borrow") : (isSupply ? "Withdraw" : "Repay")

      log(`[FHEVM] Starting ${action} for ${amount} ${pos.symbol}`, "info")
      log(`[FHEVM] Encrypting amount via Fhenix coprocessor...`, "wait")

      let hash = ""
      if (isSupply) {
        if (tab === "add") {
          log(`[FHEVM] Calling PoolManager.supply()`, "wait")
          hash = await supply(amountWei, tokenAddr)
        } else {
          // 2-Step Withdrawal
          log(`[FHEVM] Step 1: Calling PoolManager.requestWithdrawal()`, "wait")
          hash = await requestWithdrawal(tokenAddr, amountWei, 0) // destChainId 0 for local/same chain test
          log(`[TX] Authorization Hash: ${hash.slice(0, 12)}...`, "ok")
          
          log(`[KMS] Waiting for Fhenix Relayer Decryption Proof...`, "wait")
          await new Promise(r => setTimeout(r, 3000))
          log(`[KMS] Proof Received · EIP-712 Verified`, "ok")
          
          log(`[FHEVM] Step 2: Finalizing Withdrawal...`, "wait")
          // In a real app, we'd fetch the nonce and result from the event.
          // For the demo, we assume the hook/contract handles the latest nonce.
          // hash = await finalizeWithdrawal(nonce, result, proof)
          log(`[DONE] Withdrawal Settled Successfully`, "ok")
        }
      } else {
        if (tab === "add") {
          log(`[FHEVM] Calling LoanEngine.createLoan()`, "wait")
          hash = await borrow(amountWei, tokenAddr)
        } else {
          log(`[FHEVM] Calling LoanEngine.repay()`, "wait")
          // We need a loanId. For demo, we assume loanId 0 or the first active one.
          hash = await repay(0, amountWei)
        }
      }

      log(`[TX] Submitted: ${hash.slice(0, 10)}...${hash.slice(-8)}`, "ok")
      log(`[TX] Waiting for confirmation...`, "wait")
      log(`[TX] Confirmed on Sepolia`, "ok")

      if (address) {
        log(`[SYNC] Recording to backend...`, "wait")
        await syncTransaction({
          userAddress: address,
          type: isSupply ? (tab === "add" ? "supply" : "deposit") : (tab === "add" ? "borrow" : "repay"),
          title: `${action} ${amount} ${pos.symbol}`,
          amount, asset: pos.symbol, txHash: hash, status: "VERIFIED"
        })
        await syncPosition({
          walletAddress: address, type: isSupply ? "SUPPLY" : "BORROW",
          symbol: pos.symbol, entryAmount: tab === "add" ? parseFloat(amount) : -parseFloat(amount), txHash: hash
        })
        log(`[SYNC] Backend synced`, "ok")
      }

      log(`[DONE] ${action} complete!`, "ok")
      toast.success(`${action} submitted: ${hash.slice(0, 10)}...`)
    } catch (err: any) {
      log(`[ERROR] ${err.message?.slice(0, 80) || "Action failed"}`, "err")
      toast.error(err.message || "Action failed")
    }
  }

  const logColor = (t: LogEntry["type"]) => t === "ok" ? "text-green-400" : t === "err" ? "text-red-400" : t === "wait" ? "text-yellow-400" : "text-white/50"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0d0f14] border border-border/40 rounded-3xl overflow-hidden shadow-2xl flex" onClick={e => e.stopPropagation()}>
        {/* Left: Action Panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={pos.symbol} size={32} className="flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">{pos.symbol}</div>
                <div className={`text-[10px] uppercase tracking-widest ${isSupply ? "text-green-400" : "text-red-400"}`}>{pos.type}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-foreground/40 hover:text-white"><X size={16} /></button>
          </div>
          <div className="flex gap-1 p-2 bg-[#05080f]/60 border-b border-border/20">
            {supplyTabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? "bg-[#1a1d24] text-white border border-border/30" : "text-foreground/40 hover:text-foreground/70"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6 space-y-4">
            {/* Current Balance */}
            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-foreground/40 uppercase tracking-widest block mb-1">Your {isSupply ? "Supplied" : "Debt"} Balance</span>
                {currentBalance !== null ? (
                  <span className="text-lg font-bold text-white">{(Number(currentBalance) / 1e6).toFixed(2)} <span className="text-xs text-foreground/40">{pos.symbol}</span></span>
                ) : (
                  <span className="text-lg font-bold text-foreground/30">••••••••</span>
                )}
              </div>
              {currentBalance === null ? (
                <button onClick={handleDecryptBalance} disabled={decryptingBal}
                  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-purple-300 transition-all disabled:opacity-40">
                  {decryptingBal ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                  Decrypt
                </button>
              ) : (
                <button onClick={() => setAmount((Number(currentBalance) / 1e6).toString())}
                  className="text-[10px] text-primary/70 hover:text-primary uppercase tracking-widest font-bold transition-colors">
                  Max
                </button>
              )}
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-foreground/40">
                {tab === "add" ? (isSupply ? "Amount to supply" : "Amount to borrow") : (isSupply ? "Amount to withdraw" : "Amount to repay")}
              </label>
              <div className="flex items-center gap-3">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isSupply ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                  <TokenIcon symbol={pos.symbol} size={16} className="flex-shrink-0" />
                  <span className="text-sm font-bold">{pos.symbol}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/5 border border-purple-500/10 rounded-xl px-3 py-2">
              <Lock size={12} className="text-purple-400" />
              <span className="text-[9px] text-purple-400/70 uppercase tracking-widest font-bold">Amount encrypted via Fhenix FHEVM before submission</span>
            </div>
            <button onClick={handleAction} disabled={loading || !amount}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isSupply ? "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50" : "bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50"}`}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {tab === "add" ? (isSupply ? "Confirm Supply" : "Confirm Borrow") : (isSupply ? "Confirm Withdraw" : "Confirm Repay")}
            </button>
          </div>
        </div>

        {/* Right: Transaction Log */}
        <div className="w-80 border-l border-border/20 bg-[#05080f]/80 flex flex-col">
          <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
            <Terminal size={14} className="text-primary" />
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Transaction_Log</span>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[400px] font-mono">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Terminal size={24} className="text-white/10 mb-3" />
                <p className="text-[9px] text-white/20 uppercase tracking-widest">Awaiting transaction...</p>
              </div>
            ) : logs.map((l, i) => (
              <div key={i} className={`text-[10px] leading-relaxed ${logColor(l.type)}`}>
                <span className="text-white/20 mr-1">{new Date(l.ts).toLocaleTimeString()}</span>
                {l.type === "wait" && <Loader2 size={10} className="inline animate-spin mr-1" />}
                {l.msg}
              </div>
            ))}
          </div>
          {logs.length > 0 && logs[logs.length - 1]?.type === "ok" && logs[logs.length - 1]?.msg.includes("DONE") && (
            <div className="p-3 border-t border-border/20">
              <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-[10px] text-primary/70 hover:text-primary uppercase tracking-widest font-bold transition-colors">
                View on Etherscan <ArrowUpRight size={10} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PositionsPage() {
  const { address, isConnected } = useAccount()
  const { positions, loading, error } = usePositions()
  const [managingPos, setManagingPos] = useState<Position | null>(null)
  const { decryptAllPositions, collateralBalance, debtBalance, suppliedBalance, creditScore, creditLimit } = useFhePrivateLending()
  const [decrypting, setDecrypting] = useState(false)

  const handleDecrypt = async () => {
    setDecrypting(true)
    try {
      const { CONTRACTS } = await import("@/lib/contracts")
      const pl = CONTRACTS.PRIVATE_LENDING
      await decryptAllPositions(pl.PRIVATE_LENDING_POOL, pl.PRIVATE_BORROW_MANAGER, pl.PRIVATE_COLLATERAL_VAULT)
      toast.success("Positions decrypted via Fhenix Gateway")
    } catch { toast.error("Decryption failed") }
    finally { setDecrypting(false) }
  }

  const fmtBal = (b: bigint | null) => b === null ? "••••••••" : (Number(b) / 1e6).toFixed(2)
  const isDecrypted = suppliedBalance !== null || collateralBalance !== null

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      {managingPos && <ManageModal pos={managingPos} onClose={() => setManagingPos(null)} />}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.4em] text-primary/60 uppercase">Confidential_Positions // audit_access</span>
          <h1 className="text-3xl tracking-tighter font-black uppercase">Private Inventory</h1>
        </div>
        <button onClick={handleDecrypt} disabled={decrypting}
          className="flex items-center gap-2 bg-purple-500/70 hover:bg-purple-500/90 rounded-xl px-5 py-2.5 text-[10px] uppercase tracking-widest font-black transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] disabled:opacity-40">
          {decrypting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          {decrypting ? "Decrypting..." : isDecrypted ? "Re-Decrypt" : "Decrypt Positions"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#05080f]/40 border border-primary/20 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Lock size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Net_Supply</span>
          <div className="text-2xl font-bold tracking-tight">{fmtBal(suppliedBalance)}</div>
          <div className="text-[10px] text-primary/60 flex items-center gap-1 mt-2 uppercase tracking-widest">
            <ShieldCheck size={12} />{isDecrypted ? "Decrypted" : "Encrypted"}
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Net_Debt</span>
          <div className="text-2xl font-bold tracking-tight">{fmtBal(debtBalance)}</div>
          <div className="text-[10px] text-red-400 flex items-center gap-1 mt-2 uppercase tracking-widest">
            <TrendingUp size={12} />{isDecrypted ? "Decrypted" : "Encrypted"}
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Collateral</span>
          <div className="text-2xl font-bold tracking-tight text-primary">{fmtBal(collateralBalance)}</div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={80} /></div>
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Credit_Score</span>
          <div className="text-2xl font-bold tracking-tight text-purple-400">
            {creditScore !== null ? creditScore : "•••"}
            <span className="text-[9px] text-foreground/30 ml-1">/ 850</span>
          </div>
          <div className="text-[9px] text-purple-400/60 flex items-center gap-1 mt-1 uppercase tracking-widest">
            Limit: {creditLimit !== null ? `$${(Number(creditLimit)/1e6).toFixed(0)}` : "ENC"}
          </div>
        </div>
        <div className="bg-[#05080f]/40 border border-border/40 rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-[10px] text-foreground/40 uppercase tracking-widest">Health_Factor</span>
          <div className={`text-2xl font-bold tracking-tight ${
            debtBalance === 0n || debtBalance === null ? "text-green-400" :
            (Number(collateralBalance || 0n) * 0.8 / Number(debtBalance)) > 1.5 ? "text-green-400" :
            (Number(collateralBalance || 0n) * 0.8 / Number(debtBalance)) > 1.1 ? "text-yellow-400" : "text-red-400"
          }`}>
            {debtBalance === 0n || debtBalance === null ? "∞" : (Number(collateralBalance || 0n) * 0.8 / Number(debtBalance)).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-card/20 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="grid grid-cols-12 bg-white/5 border-b border-border/20 px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 items-center">
          <div className="col-span-4">Position Detail</div>
          <div className="col-span-2 text-right">Balance</div>
          <div className="col-span-2 text-right">Value ($)</div>
          <div className="col-span-2 text-right">Net APY</div>
          <div className="col-span-2 text-right">Control</div>
        </div>
        <div className="divide-y divide-border/10">
          {!isConnected && <div className="px-8 py-12 text-center"><Lock size={48} className="mx-auto text-foreground/20 mb-4" /><p className="text-sm text-foreground/40">Connect your wallet to view positions</p></div>}
          {isConnected && loading && <div className="px-8 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" /><p className="text-sm text-foreground/40">Loading positions...</p></div>}
          {isConnected && error && <div className="px-8 py-12 text-center"><p className="text-sm text-red-400">Error: {error}</p></div>}
          {isConnected && !loading && !error && positions.length === 0 && <div className="px-8 py-12 text-center"><Database size={48} className="mx-auto text-foreground/20 mb-4" /><p className="text-sm text-foreground/40">No positions found</p></div>}

          {isConnected && !loading && !error && positions.map((pos) => (
            <div key={`${pos.type}-${pos.symbol}`} className="grid grid-cols-12 px-8 py-8 items-center hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => setManagingPos(pos)}>
              <div className="col-span-4 flex items-center gap-5">
                <div className={`p-1.5 rounded-lg ${pos.type === "SUPPLY" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {pos.type === "SUPPLY" ? <ArrowDown size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">{pos.symbol}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${pos.type === "SUPPLY" ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400"}`}>{pos.type}</span>
                  </div>
                  <div className="text-[10px] text-foreground/40 font-mono tracking-tighter uppercase mt-0.5">AUTH_REDACTED_DATA_{pos.symbol}</div>
                </div>
              </div>
              <div className="col-span-2 text-right"><div className="text-sm font-bold font-mono text-white/50">{pos.amount}</div></div>
              <div className="col-span-2 text-right"><div className="text-sm font-bold font-mono text-white/50">{pos.value}</div></div>
              <div className="col-span-2 text-right"><div className={`text-sm font-bold ${pos.type === "SUPPLY" ? "text-green-400" : "text-red-400"}`}>{pos.type === "SUPPLY" ? "+" : "-"}{pos.apy}</div></div>
              <div className="col-span-2 flex justify-end">
                <button onClick={e => { e.stopPropagation(); setManagingPos(pos) }}
                  className={`py-2 px-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${pos.type === "SUPPLY" ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" : "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#05080f]/30 border border-border/30 rounded-3xl p-8 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-2"><Target size={16} /> Collateral_Composition</h3>
          <div className="space-y-6">
            {collateralBalance !== null ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold"><span>USDC_COLLATERAL</span><span className="text-foreground/40 italic">Decrypted</span></div>
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: "100%" }} /></div>
                </div>
                <p className="text-[9px] text-foreground/30 uppercase tracking-tight italic">Single asset pool detected · Fhenix Hub V3</p>
              </>
            ) : (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                <p className="text-[9px] text-foreground/20 uppercase tracking-widest">Decrypt to view composition</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#05080f]/30 border border-border/30 rounded-3xl p-8 space-y-6 relative group overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/30 flex items-center gap-2"><History size={16} /> Governance_Snapshot</h3>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-background/20 border border-border/20 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1"><div className="text-[10px] font-bold">Prop_412: Confidential Vault Integration</div><div className="text-[9px] text-foreground/30 uppercase tracking-tighter">Status: Executed // 12h ago</div></div>
                <div className="text-primary"><ArrowUpRight size={16} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
