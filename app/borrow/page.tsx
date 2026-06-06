"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Info, ShieldAlert, ChevronRight, Lock, Loader2 } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { useAccount } from "wagmi"
import { useFhePrivateLending } from "@/hooks/use-fhe-private-lending"
import { usePolaris } from "@/hooks/use-polaris"
import { CONTRACTS, NETWORKS } from "@/lib/contracts"
import { parseUnits } from "viem"
import { syncTransaction, syncPosition } from "@/lib/sync-utils"

const BORROW_ASSETS = [
  { symbol: "USDC", color: "bg-blue-500" },
  { symbol: "USDT", color: "bg-green-600" },
  { symbol: "BNB", color: "bg-yellow-500" },
]
const COLLATERAL_ASSETS = [
  { symbol: "WETH", color: "bg-blue-400" },
  { symbol: "WBTC", color: "bg-orange-500" },
  { symbol: "USDC", color: "bg-blue-500" },
]

function TokenDropdown({ options, value, onChange }: {
  options: { symbol: string; color: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.symbol === value) ?? options[0]
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

export default function BorrowPage() {
  const [borrowAmount, setBorrowAmount] = useState("")
  const [collateralAmount, setCollateralAmount] = useState("")
  const [maxRate, setMaxRate] = useState("10")
  const [duration, setDuration] = useState("30")
  const [borrowAsset, setBorrowAsset] = useState("USDC")
  const [collateralAsset, setCollateralAsset] = useState("WETH")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [decryptingBalances, setDecryptingBalances] = useState(false)

  const { borrow, depositCollateral, loading, error, debtBalance, collateralBalance, decryptAllPositions } = useFhePrivateLending()
  const { address } = useAccount()
  const { chainId } = usePolaris()

  // Resolve contract addresses for the connected network — Requirements 8.1
  const getAddresses = () => {
    if (!chainId) return CONTRACTS.PRIVATE_LENDING
    const part = chainId.includes(':') ? chainId.split(':')[1] : chainId
    const networkId = parseInt(part, 10) || NETWORKS.SEPOLIA.id
    return networkId === NETWORKS.LOCAL_HARDHAT.id ? CONTRACTS.LOCAL_HARDHAT : CONTRACTS.PRIVATE_LENDING
  }

  // Decrypt collateral and debt on mount when wallet is connected — Requirements 8.1, 8.2, 8.3
  useEffect(() => {
    if (!address) return
    const addresses = getAddresses()
    setDecryptingBalances(true)
    Promise.all([
      decryptAllPositions(
        addresses.PRIVATE_LENDING_POOL,
        addresses.PRIVATE_BORROW_MANAGER,
        addresses.PRIVATE_COLLATERAL_VAULT
      ),
    ]).finally(() => setDecryptingBalances(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const handleSubmit = async () => {
    setTxError(null)
    setTxHash(null)
    const { TOKENS } = await import("@/config/tokens")
    
    try {
      // First deposit collateral if provided
      if (collateralAmount && parseFloat(collateralAmount) > 0) {
        const token = TOKENS[collateralAsset]
        const decimals = token?.decimals || 18
        const collateralWei = parseUnits(collateralAmount, decimals)
        const hash = await depositCollateral(collateralWei)
        setTxHash(hash)

        if (address) {
          await syncTransaction({
            userAddress: address,
            type: "deposit",
            title: `Deposited ${collateralAmount} ${collateralAsset}`,
            amount: collateralAmount,
            asset: collateralAsset,
            txHash: hash,
            status: "VERIFIED"
          });
          await syncPosition({
            walletAddress: address,
            type: "SUPPLY",
            symbol: collateralAsset,
            entryAmount: parseFloat(collateralAmount),
            txHash: hash
          });
        }
      }
      // Then borrow
      if (borrowAmount && parseFloat(borrowAmount) > 0) {
        const token = TOKENS[borrowAsset]
        const decimals = token?.decimals || 18
        const borrowWei = parseUnits(borrowAmount, decimals)
        const hash = await borrow(borrowWei, borrowAsset)
        setTxHash(hash)

        if (address) {
          await syncTransaction({
            userAddress: address,
            type: "borrow",
            title: `Borrowed ${borrowAmount} ${borrowAsset}`,
            amount: borrowAmount,
            asset: borrowAsset,
            txHash: hash,
            status: "VERIFIED"
          });
          await syncPosition({
            walletAddress: address,
            type: "BORROW",
            symbol: borrowAsset,
            entryAmount: parseFloat(borrowAmount),
            txHash: hash
          });
        }
      }
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Confidential_Debt // terminal_access</span>
        <h1 className="text-white text-3xl tracking-tighter font-black uppercase">Execute Borrow</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#0d0f14] border border-border/30 rounded-3xl overflow-hidden">
          <div className="p-8 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-white">Borrow with Privacy</h3>
              <p className="text-xs text-foreground/40 mt-1 leading-relaxed">Submit a private borrow intent. Your amount is encrypted via Fhenix FHEVM before hitting the chain.</p>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-2">
              <label className="text-xs text-foreground/40">{"You're borrowing"}</label>
              <div className="flex items-center gap-3">
                <input type="number" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-4xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={BORROW_ASSETS} value={borrowAsset} onChange={setBorrowAsset} />
              </div>
            </div>

            <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-2">
              <label className="text-xs text-foreground/40">Collateral ({collateralAsset})</label>
              <div className="flex items-center gap-3">
                <input type="number" value={collateralAmount} onChange={e => setCollateralAmount(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-4xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0" />
                <TokenDropdown options={COLLATERAL_ASSETS} value={collateralAsset} onChange={setCollateralAsset} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-1">
                <label className="text-xs text-foreground/40">Max Rate (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={maxRate} onChange={e => setMaxRate(e.target.value)} className="flex-1 bg-transparent text-2xl font-light text-foreground/60 focus:outline-none min-w-0" />
                  <span className="text-foreground/30 text-sm">%</span>
                </div>
              </div>
              <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-5 space-y-1">
                <label className="text-xs text-foreground/40">Duration (days)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="flex-1 bg-transparent text-2xl font-bold text-foreground focus:outline-none min-w-0" />
                  <span className="text-foreground/30 text-sm">d</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
              <Info size={14} className="text-foreground/30 flex-shrink-0" />
              <span className="text-xs text-foreground/40">Your amount is encrypted via Fhenix FHEVM — never visible on-chain</span>
            </div>

            {(txError || error) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400">
                {txError || error}
              </div>
            )}

            {txHash && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-xs text-green-400 font-mono truncate">
                TX: {txHash}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || (!borrowAmount && !collateralAmount)}
              className="w-full py-4 rounded-2xl bg-purple-500/70 hover:bg-purple-500/90 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Encrypting & Submitting...</> : "Submit Borrow Intent"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#05080f]/40 border border-border/40 rounded-3xl p-8 backdrop-blur-md space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-2">
              <ShieldAlert size={16} className="text-yellow-400" />Position_Risk_Audit
            </h3>
            <div className="space-y-4">
              {[
                { label: "Collateral (Encrypted)", value: decryptingBalances ? "••••••••" : collateralBalance !== null ? collateralBalance.toString() : "••••••••", muted: decryptingBalances || collateralBalance === null },
                { label: "Projected Loan Value", value: borrowAmount ? `${Number(borrowAmount).toLocaleString()}` : "—" },
                { label: "Debt Balance (Encrypted)", value: decryptingBalances ? "••••••••" : debtBalance !== null ? debtBalance.toString() : "••••••••", muted: decryptingBalances || debtBalance === null },
                { label: "Liquidation Price", value: "Hidden", muted: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-[11px] border-b border-border/10 pb-4 last:border-0 last:pb-0">
                  <span className="text-foreground/40">{row.label}</span>
                  <span className={`font-bold flex items-center gap-1.5 ${row.muted ? "text-foreground/30 tracking-widest" : "text-primary"}`}>
                    {row.muted && <Lock size={10} />}{row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-4 group cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Learn_How_It_Works</h3>
              <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-foreground/60 leading-relaxed italic">
              Fhenix FHEVM allows you to borrow tokens against your collateral without ever revealing your debt amount to the blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
