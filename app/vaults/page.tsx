"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Zap,
    RefreshCw,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    ShieldCheck,
    Coins,
    Lock
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { LendingActionModal, ModalMode } from "@/components/lending-action-modal"
import { useFhePrivateLending } from "@/hooks/use-fhe-private-lending"

const VAULTS = [
    {
        id: "v1",
        name: "WETH VAULT",
        platform: "POLARIS",
        type: "LIQUIDITY",
        category: "BLUE_CHIP",
        symbol: "WETH",
        apy: "4.20%",
        daily: "0.011%",
        description: "Confidential WETH vault. Earn yield while keeping your balance private via FHE.",
        risk: "LOW",
        chain: "SEPOLIA",
        color: "blue"
    },
    {
        id: "v2",
        name: "BNB VAULT",
        platform: "POLARIS",
        type: "LIQUIDITY",
        category: "BLUE_CHIP",
        symbol: "BNB",
        apy: "5.80%",
        daily: "0.015%",
        description: "High-yield BNB vault with FHE-enabled privacy for your positions.",
        risk: "LOW",
        chain: "SEPOLIA",
        color: "yellow"
    },
    {
        id: "v3",
        name: "USDC VAULT",
        platform: "POLARIS",
        type: "LIQUIDITY",
        category: "STABLECOIN",
        symbol: "USDC",
        apy: "8.50%",
        daily: "0.023%",
        description: "Private USDC stablecoin vault. Optimized for lending yield and privacy.",
        risk: "VERY LOW",
        chain: "SEPOLIA",
        color: "blue"
    },
    {
        id: "v4",
        name: "USDT VAULT",
        platform: "POLARIS",
        type: "LIQUIDITY",
        category: "STABLECOIN",
        symbol: "USDT",
        apy: "8.20%",
        daily: "0.022%",
        description: "Secure USDT vault with Fhenix FHEVM encryption for all user balances.",
        risk: "VERY LOW",
        chain: "SEPOLIA",
        color: "green"
    }
]

export default function VaultsPage() {
    const [selectedVault, setSelectedVault] = useState<typeof VAULTS[0] | null>(null)
    const [modalMode, setModalMode] = useState<ModalMode>("supply")
    const [filter, setFilter] = useState("ALL_VAULTS")
    const { isConnected } = useAccount()
    const { collateralBalance, loading: fheLoading } = useFhePrivateLending()

    const filteredVaults = filter === "ALL_VAULTS"
        ? VAULTS
        : VAULTS.filter(v => v.category === filter || v.type.includes(filter.replace("_VAULTS", "")))

    const handleAction = (vault: typeof VAULTS[0], mode: ModalMode) => {
        if (!isConnected) {
            toast.info("Please connect your Polaris wallet first.")
            return
        }
        setSelectedVault(vault)
        setModalMode(mode)
    }

    return (
        <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono text-white">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Yield_Engine // Vault_Management</span>
                <h1 className="text-white text-xl tracking-tighter font-bold uppercase">VAULTS_TERMINAL_V1.2 // INITIA</h1>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Auto-compounding yield vaults on Initia. Deposit assets, earn yield, unlock credit.</p>
            </div>

            {/* Stats Bar */}
            <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center text-white">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Protocol_Metrics</span>
                    <span className="text-primary text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        SYSTEM_READY // SEPOLIA_CONNECTED
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-white">
                    <div className="p-4 sm:p-6 flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 tracking-wider uppercase">Total_Vault_TVL</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-2xl font-bold tracking-tighter">$0</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary text-[8px] border-primary/20">SYNCED</Badge>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 tracking-wider uppercase">Average_Vault_APY</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-2xl font-bold tracking-tighter">0.00%</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-[8px] border-blue-500/20">STABLE</Badge>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 tracking-wider uppercase">Active_Vaults</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-2xl font-bold tracking-tighter">4</span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 text-[8px] border-green-500/20">LIVE</Badge>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col gap-1 text-blue-400">
                        <span className="text-blue-400/60 tracking-wider uppercase text-[10px]">Your_Deposits</span>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 text-2xl font-bold tracking-tighter">$0.00</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 text-[8px] border-blue-500/20">WALLET</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {["ALL_VAULTS", "STABLECOIN", "BLUE_CHIP", "LP_VAULTS"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                            filter === f
                                ? "bg-primary text-primary-foreground border border-primary"
                                : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Vault Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredVaults.map((vault) => (
                    <div key={vault.id} className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col hover:border-primary/30 transition-all group">
                        <div className="p-6 flex flex-col gap-6">
                            {/* Card Top */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-full bg-${vault.color}-500/20 border border-${vault.color}-500/30 flex items-center justify-center text-[10px] font-black text-${vault.color}-400`}>
                                        {vault.name.split('/')[0].slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-white text-sm font-bold tracking-tight">{vault.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">{vault.platform}</span>
                                            <span className="size-1 bg-white/10 rounded-full" />
                                            <span className="text-[8px] text-primary/60 font-bold uppercase tracking-wider">{vault.type}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* APY Section */}
                            <div className="flex flex-col gap-1 bg-white/5 p-4 rounded-sm border border-white/5 group-hover:border-primary/20 transition-all">
                                <span className="text-[8px] text-white/40 uppercase tracking-widest">Expected_APY</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-primary text-3xl font-black tracking-tighter">{vault.apy}</span>
                                    <TrendingUp className="size-4 text-primary opacity-50" />
                                </div>
                                <span className="text-[9px] text-white/20 uppercase tracking-tighter">Daily: {vault.daily}</span>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Total_TVL</span>
                                    <span className="text-xs font-bold text-white/80">$0</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Your_Deposit</span>
                                    <span className="text-xs font-bold text-primary">$0</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-[10px] text-white/40 leading-relaxed min-h-[30px]">
                                {vault.description}
                            </p>

                            {/* Actions */}
                                <button 
                                    onClick={() => handleAction(vault, "supply")}
                                    className="bg-primary hover:bg-primary/80 text-primary-foreground py-2.5 rounded-sm font-black text-[10px] uppercase transition-all active:scale-95"
                                >
                                    Deposit
                                </button>
                                <button 
                                    onClick={() => handleAction(vault, "supply")} // Withdraw logic can be added to modal or separate modal
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white py-2.5 rounded-sm font-bold text-[10px] uppercase transition-all active:scale-95"
                                >
                                    Withdraw
                                </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Credit Banner */}
            <div className="mt-8 glass-card rounded-lg border border-primary/20 overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-all" />
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="size-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <ShieldCheck className="size-8 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-primary tracking-[0.3em] uppercase">Credit_Engine // Status: Available</span>
                            <p className="text-[11px] text-white/60 max-w-xl leading-relaxed font-medium">
                                Deposit into any vault to unlock your <span className="text-primary font-bold">USDCx credit line</span>. 
                                Vault receipt tokens (vTokens) are accepted as collateral. Yield auto-services your debt.
                            </p>
                        </div>
                    </div>
                    <Link href="/pools" className="w-full md:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-sm font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(166,242,74,0.3)] text-center">
                        View Credit Terminal
                    </Link>
                </div>
            </div>

            {/* Status Footer */}
            <div className="mt-auto pt-12">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-6 text-[9px] font-bold text-white/20 tracking-[0.2em] uppercase">
                    <div className="flex items-center gap-4">
                        <span className="text-primary/60 flex items-center gap-1.5">
                            <span className="size-1.5 bg-primary rounded-full animate-pulse" />
                            INITIA_NODE_OK
                        </span>
                        <span>SYSTEM_LATENCY: 14ms</span>
                        <span>ENGINE_STATUS: STABLE</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Polaris_NETWORK: ONLINE</span>
                        <span className="text-primary/40">TERMINAL_SESSION_ACTIVE</span>
                    </div>
                </div>
            </div>
            {/* Modal Overlay */}
            {selectedVault && (
                <LendingActionModal
                    mode={modalMode}
                    pool={{
                        symbol: selectedVault.symbol,
                        name: selectedVault.name,
                        supplyApy: selectedVault.apy,
                        borrowApy: "0%" // Vaults don't have borrow APY usually
                    }}
                    onClose={() => setSelectedVault(null)}
                />
            )}
        </div>
    )
}
