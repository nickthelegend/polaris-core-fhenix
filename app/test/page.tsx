"use client"

import { useState, useEffect } from "react"
import { usePolaris } from "@/hooks/use-polaris"
import { usePolarisWallet } from "@/lib/hooks/usePolarisWallet"
import { Zap, ShieldCheck, Info, Loader2, AlertTriangle, CheckCircle2, FlaskConical, Wallet } from "lucide-react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import { ABIS } from "@/lib/contracts"

export default function DebugBNPLPage() {
    const {
        authenticated,
        address,
        getScore,
        getCreditLimit,
        payWithCredit,
        getMasterConfig,
        getUserTotalCollateral,
        getLPBalance,
        loading: polarisLoading
    } = usePolaris()

    const { connect } = usePolarisWallet()

    const [score, setScore] = useState<string>("...")
    const [limit, setLimit] = useState<string>("...")
    const [debt, setDebt] = useState<string>("...")
    const [collateral, setCollateral] = useState<string>("...")
    const [usdcLP, setUsdcLP] = useState<string>("...")
    const [status, setStatus] = useState<string>("Ready")
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString()
        setLogs(prev => [`[${time}] ${msg}`, ...prev])
        console.log(`[BNPL_DEBUG] ${msg}`)
    }

    const refreshData = async () => {
        if (!authenticated || !address) return
        try {
            addLog("Refreshing on-chain data...")
            const s = await getScore()
            const l = await getCreditLimit()
            const c = await getUserTotalCollateral()

            const { config } = getMasterConfig() as any
            const lp = await getLPBalance(config.USDC)

            // EVM Fallback for debt checking
            let activeDebtVal = "0.00";
            if ((window as any).ethereum) {
                const provider = new ethers.BrowserProvider((window as any).ethereum)
                const loanEngine = new ethers.Contract(config.LOAN_ENGINE, ABIS.LoanEngine, provider)
                const activeDebtRaw = await loanEngine.userActiveDebt(address)
                activeDebtVal = ethers.formatUnits(activeDebtRaw, 18)
            }

            setScore(s)
            setLimit(l)
            setDebt(activeDebtVal)
            setCollateral(c)
            setUsdcLP(lp)
            addLog(`Stats updated: Score=${s}, Available=${l} USDC, Debt=${activeDebtVal} USDC`)
        } catch (e: any) {
            addLog(`Refresh Error: ${e.message}`)
        }
    }

    useEffect(() => {
        if (authenticated) {
            refreshData()
        }
    }, [authenticated, address])

    const handleTestBNPL = async () => {
        if (!authenticated) {
            toast.warn("Connect wallet first")
            return
        }

        setStatus("Initializing BNPL...")
        addLog("🚀 Starting Test BNPL Purchase Flow")

        try {
            const { config } = getMasterConfig() as any
            const usdcAddress = config.USDC
            const testMerchant = "0x722878c5349e602E6f6A2A3869a5C9213bAe183F" // Polaris Dev Merchant
            const testAmount = "10.0"

            addLog(`Target Merchant: ${testMerchant}`)
            addLog(`Amount: ${testAmount} USDC`)
            addLog(`Using Hub USDC: ${usdcAddress}`)

            // 1. Verify Limit
            if (parseFloat(limit) < parseFloat(testAmount)) {
                addLog("⚠️ Warning: Your available limit is lower than the amount. This WILL fail.")
                throw new Error("INSUFFICIENT_CREDIT_LIMIT")
            }

            setStatus("Signing payWithCredit...")
            addLog("Executing payWithCredit on MerchantRouter...")

            const receipt = await payWithCredit(testMerchant, testAmount, usdcAddress)
            addLog(`✅ BNPL Success! Hub Tx: ${receipt.hash}`)
            toast.success("BNPL Authorized on Hub!")

            setTimeout(refreshData, 2000) // Wait for block
        } catch (e: any) {
            let reason = e.message
            if (e.reason) reason = e.reason
            addLog(`❌ BNPL Failed: ${reason}`)
            toast.error(`BNPL Error: ${reason}`)
        } finally {
            setStatus("Ready")
        }
    }

    const handleSeedEquity = async () => {
        addLog("Seeding Test Equity (LP Deposit)...")
        try {
            const { config } = getMasterConfig() as any
            const usdcAddress = config.USDC

            if (!(window as any).ethereum) throw new Error("Metamask/EVM wallet required for Hub minting");

            addLog("1. Minting 1000 Mock USDC on Hub...")
            const provider = new ethers.BrowserProvider((window as any).ethereum)
            const signer = await provider.getSigner()
            const usdc = new ethers.Contract(usdcAddress, ABIS.MockERC20, signer)

            const amount = ethers.parseUnits("1000", 18)
            const tx1 = await usdc.mint(address, amount)
            addLog(`Minting broadcasted: ${tx1.hash}`)
            await tx1.wait()
            addLog("Minting confirmed.")

            addLog("Note: To get real credit limit, you must Bridge liquidity via the Bridges page.")
            toast.info("Bridge liquidity from Sepolia to get a credit limit!")

        } catch (e: any) {
            addLog(`Seed Error: ${e.message}`)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FlaskConical className="w-8 h-8 text-teal-400" />
                        <h1 className="text-3xl font-black uppercase tracking-tighter">BNPL_DEBUG_PULSE</h1>
                    </div>
                    {authenticated ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded">
                            <ShieldCheck className="w-4 h-4 text-teal-400" />
                            <span className="text-[10px] font-bold text-teal-400">{address?.slice(0, 10)}...</span>
                        </div>
                    ) : (
                        <button onClick={() => connect("Nami")} className="bg-white text-black px-6 py-2 font-bold uppercase text-xs flex items-center gap-2">
                            <Wallet className="w-3 h-3" /> Connect_Nami
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Metrics */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <span className="text-[10px] text-white/40 uppercase font-bold block mb-2">Polaris Score</span>
                                <div className="text-3xl font-black text-teal-400">{score}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <span className="text-[10px] text-white/40 uppercase font-bold block mb-2">Available Credit</span>
                                <div className="text-3xl font-black text-white">${limit}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl border-red-500/20">
                                <span className="text-[10px] text-red-400/40 uppercase font-bold block mb-2">Active Debt</span>
                                <div className="text-xl font-black text-red-400">${debt}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <span className="text-[10px] text-white/40 uppercase font-bold block mb-2">Total Equity</span>
                                <div className="text-xl font-black text-white/60">${collateral}</div>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Diagnostics Console</h2>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleTestBNPL}
                                    disabled={polarisLoading || !authenticated}
                                    className="w-full bg-teal-500 hover:bg-teal-400 text-black py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                                >
                                    {polarisLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    Run BNPL Transaction
                                </button>

                                <button
                                    onClick={refreshData}
                                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                                >
                                    Sync Hub State
                                </button>

                                <button
                                    onClick={handleSeedEquity}
                                    className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all hover:bg-blue-500/20"
                                >
                                    Check Faucet Support
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4">
                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-amber-500 uppercase">Pro Tip</span>
                                <p className="text-[10px] text-amber-500/60 leading-relaxed font-bold">
                                    If your limit is 0, deposit liquidity into the Vault on Sepolia, wait for the block to be finalized,
                                    and then use the "Bridges" tab to Sync the proof to the Hub.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
                        <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Live_Execution_Trace</span>
                            <div className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${status === "Ready" ? "bg-teal-500/20 text-teal-400" : "bg-teal-500 text-black animate-pulse"}`}>
                                {status}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 selection:bg-teal-500/30">
                            {logs.map((log, i) => (
                                <div key={i} className={`p-2 rounded border border-transparent ${log.includes('❌') ? 'bg-red-500/10 text-red-500 border-red-500/20' : log.includes('✅') ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'text-white/40'}`}>
                                    {log}
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-white/20 italic flex items-center justify-center h-full">
                                    Awaiting interaction...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
