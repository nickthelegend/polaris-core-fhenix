"use client"

import { useState, useEffect } from "react"
import { usePolaris } from "@/hooks/use-polaris"
import { ConnectGate } from "@/components/connect-gate"
import {
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Zap,
  Globe,
  Wallet,
  Scale
} from "lucide-react"
import { toast } from "react-toastify"
import { Skeleton } from "@/components/ui/skeleton"

export default function LimitsPage() {
  const {
    address,
    authenticated,
    getCreditLimit,
    getUserTotalCollateral,
    getScore,
    getExternalNetValue,
    updateCreditProfile,
    loading: polarisLoading
  } = usePolaris()

  const [creditLimit, setCreditLimit] = useState("0")
  const [nativeCollateral, setNativeCollateral] = useState("0")
  const [externalNetValue, setExternalNetValue] = useState("0")
  const [creditScore, setCreditScore] = useState("300")
  const [isSyncing, setIsSyncing] = useState(false)
  const [attestationData, setAttestationData] = useState<any>(null)

  const refreshData = async () => {
    if (!authenticated || !address) return
    try {
      const [limit, native, external, score] = await Promise.all([
        getCreditLimit(),
        getUserTotalCollateral(),
        getExternalNetValue(),
        getScore()
      ])
      setCreditLimit(limit)
      setNativeCollateral(native)
      setExternalNetValue(external)
      setCreditScore(score)
    } catch (e) {
      console.error("Data refresh failed", e)
    }
  }

  useEffect(() => {
    refreshData()
  }, [authenticated, address])

  const syncExternalData = async () => {
    setIsSyncing(true)
    toast.info("Aggregating debt/supply from 30+ chains...")
    try {
      const res = await fetch("/api/credit/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, nonce: 0 })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setAttestationData(data)
      toast.success("External data aggregated & signed!")
    } catch (e: any) {
      toast.error(`Aggregation failed: ${e.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const applyAttestation = async () => {
    if (!attestationData) return
    try {
      toast.info("Updating Credit Profile on-chain...")
      await updateCreditProfile(attestationData)
      toast.success("Profile Updated! Calculating new limits...")
      setAttestationData(null)
      refreshData()
    } catch (e: any) {
      toast.error(`On-chain update failed: ${e.message}`)
    }
  }

  return (
    <ConnectGate>
      <div className="flex-1 flex flex-col py-8 gap-8 w-full font-mono text-white max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">
            Aggregated_Credit_Protocol // Oracle_v2
          </span>
          <h1 className="text-white text-2xl tracking-tighter font-bold uppercase">
            Global Credit Identity
          </h1>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Limit Card */}
          <div className="glass-card rounded-lg border border-primary/30 overflow-hidden shadow-2xl col-span-1 md:col-span-2 relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-32 h-32 text-primary" />
            </div>
            <div className="bg-primary/5 px-4 py-2 border-b border-primary/20 flex justify-between items-center">
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Active_Borrowing_Power</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white/40 font-mono">LIVE_ORACLE_FEED</span>
              </div>
            </div>
            <div className="p-8 flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase">Total_Limit_USDC</span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                  ${Number(creditLimit).toLocaleString()}
                </span>
                <span className="text-primary font-bold text-sm tracking-widest uppercase">Available</span>
              </div>
              <p className="text-[10px] text-white/30 max-w-md mt-4 leading-relaxed">
                Your limit is dynamically calculated based on your Polaris local equity,
                external DeFi footprints (Aave, Morpho, Compound), and your on-chain behavior score.
              </p>
            </div>
          </div>

          {/* Credit Score Card */}
          <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Trust_Metric</span>
              <ShieldCheck className="w-3 h-3 text-primary" />
            </div>
            <div className="p-8 flex flex-col items-center justify-center flex-1 gap-2">
              <div className="relative">
                <div className="text-5xl font-black tracking-tighter text-primary">{creditScore}</div>
                <div className="text-[10px] text-white/20 absolute -bottom-4 right-0 font-bold">MAX 850</div>
              </div>
              <div className="mt-8 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000"
                  style={{ width: `${(Number(creditScore) / 850) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 uppercase mt-2 tracking-[0.2em]">Verified_Rating</span>
            </div>
          </div>
        </div>

        {/* Data Sources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Local Equity */}
          <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-white flex gap-2 items-center">
              <Wallet className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Local_Pool_Equity</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 uppercase font-bold">Total_Deposits</span>
                  <div className="text-2xl font-bold font-mono tracking-tight">${Number(nativeCollateral).toLocaleString()}</div>
                </div>
                <div className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-sm uppercase tracking-tighter">
                  + LOCAL_ASSETS
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">USDC Vault</span>
                  <span className="font-bold">SYNCED</span>
                </div>
                <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">USDT Vault</span>
                  <span className="font-bold">SYNCED</span>
                </div>
              </div>
            </div>
          </div>

          {/* External Credit Oracle */}
          <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col relative">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-white flex gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Global_External_Credit</span>
              </div>
              {attestationData && (
                <div className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold animate-pulse uppercase">
                  UNAPPLIED_SYNC
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/30 uppercase font-bold">Net_External_Value</span>
                  <div className={`text-2xl font-bold font-mono tracking-tight ${Number(externalNetValue) >= 0 ? "text-white" : "text-red-400"}`}>
                    {Number(externalNetValue) >= 0 ? "" : "-"}${Math.abs(Number(externalNetValue)).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={syncExternalData}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "FETCHING..." : "SYNC_GLOBAL"}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {/* Aggregation Detail */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-sm border border-white/5">
                    <span className="text-[9px] text-white/30 uppercase">Morpho</span>
                    <span className="text-xs font-bold text-white/80">${attestationData?.details.morpho.collateral || "---"}</span>
                  </div>
                  <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-sm border border-white/5">
                    <span className="text-[9px] text-white/30 uppercase">Aave</span>
                    <span className="text-xs font-bold text-white/80">${attestationData?.details.aave.collateral || "---"}</span>
                  </div>
                  <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-sm border border-white/5">
                    <span className="text-[9px] text-white/30 uppercase">Compound</span>
                    <span className="text-xs font-bold text-white/80">${attestationData?.details.compound.collateral || "---"}</span>
                  </div>
                </div>

                {attestationData && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                      <ShieldCheck className="w-4 h-4" />
                      Attestation_Ready_for_On-Chain_Update
                    </div>
                    <button
                      onClick={applyAttestation}
                      className="w-full bg-primary text-black font-black py-2 rounded-sm text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                    >
                      Push_to_Sepolia
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-white/40" />
              <h3 className="text-white font-bold text-xs uppercase tracking-widest">Oracle_Transparency</h3>
            </div>
            <div className="text-[10px] text-white/30 leading-relaxed font-mono space-y-2">
              <p>
                1. AGGREGATION: We fetch supply/debt data across 30+ chains using decentralized subgraphs and provider APIs.
              </p>
              <p>
                2. ATTESTATION: The backend signs an ECDSA payload with your net equity and a timestamp-bound nonce.
              </p>
              <p>
                3. ON-CHAIN_VERIFICATION: The Sepolia network verifies the signature and updates your identity state.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-white/40" />
              <h3 className="text-white font-bold text-xs uppercase tracking-widest">Connect_DeFi_Protocols</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Morpho Blue", "Aave v3", "Compound v3", "Silo", "Radiant"].map(p => (
                <div key={p} className="text-[9px] border border-white/10 px-3 py-1.5 rounded-full text-white/40 font-bold uppercase transition-colors hover:text-white hover:border-white">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConnectGate>
  )
}
