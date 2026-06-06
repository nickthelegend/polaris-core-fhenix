"use client"

import { ConnectGate } from "@/components/connect-gate"
import { usePolarisPay } from "@/hooks/use-polaris-pay"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import {
    QrCode,
    ChevronRight,
    Banknote,
    History,
    ArrowUpRight,
    Download,
    Store,
    LayoutDashboard,
    Wallet,
    ShieldCheck,
    RefreshCw
} from "lucide-react"
import QRCode from "qrcode"
import { syncTransaction } from "@/lib/sync-utils"
import { ethers } from "ethers"
import { ABIS, CONTRACTS, NETWORKS } from "@/lib/contracts"

export default function MerchantDashboard() {
    const { address, authenticated, loading, requestWithdrawal, getContract } = usePolarisPay();
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [amount, setAmount] = useState("10");
    const [activeTab, setActiveTab] = useState<"terminal" | "transactions">("terminal");

    const [balance, setBalance] = useState("0");
    const [withdrawing, setWithdrawing] = useState(false);

    const generatePaymentQr = async () => {
        try {
            // Standardizing the payment protocol: polaris://pay?merchant=ADDR&amount=VAL&token=ADDR
            const protocol = `polaris://pay?merchant=${address}&amount=${amount}&token=${CONTRACTS.MASTER.USDC}`;
            const url = await QRCode.toDataURL(protocol, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#58e271', // primary color
                    light: '#00000000'
                }
            });
            setQrDataUrl(url);
            toast.info("Payment Terminal Generated");
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBalance = async () => {
        if (!address) return;
        try {
            const { config, id } = (usePolarisPay() as any).getMasterConfig();
            const router = await getContract(config.MERCHANT_ROUTER, ABIS.MerchantRouter, id, false);
            const bal = await router.merchantBalances(address, CONTRACTS.MASTER.USDC);
            setBalance(ethers.formatUnits(bal, 18));
        } catch (e) {
            console.error("Failed to fetch merchant balance", e);
        }
    };

    useEffect(() => {
        if (address) {
            generatePaymentQr();
            fetchBalance();
        }
    }, [address, amount]);

    const handleWithdraw = async () => {
        if (!address || parseFloat(balance) <= 0) return;
        setWithdrawing(true);
        try {
            const hash = await requestWithdrawal(CONTRACTS.MASTER.USDC, balance, 11155111); // Dest chain = Sepolia (demo)
            toast.success("Settlement Initiated!");
            
            await syncTransaction({
                userAddress: address,
                type: "repay", // Using repay type for merchant withdraw in this demo ledger
                title: `Merchant Settlement: ${balance} USDC`,
                amount: balance,
                asset: "USDC",
                txHash: hash,
                status: "VERIFIED"
            });

            fetchBalance();
        } catch (e: any) {
            toast.error(e.message || "Settlement failed");
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <ConnectGate>
            <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono text-white">
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">System Status // polaris_core_v1</span>
                    <h1 className="text-white text-xl tracking-tighter font-bold uppercase underline decoration-primary/40 underline-offset-8">Merchant Acceptance Hub</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar / Stats */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col p-6 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest">Available_to_Withdraw</span>
                                <span className="text-2xl font-black tracking-tighter text-white">${balance}</span>
                            </div>
                            <button 
                                onClick={handleWithdraw}
                                disabled={withdrawing || parseFloat(balance) <= 0}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-2 rounded-sm text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                            >
                                {withdrawing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
                                {withdrawing ? "Processing..." : "Initiate_Settlement"}
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setActiveTab("terminal")}
                                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'terminal' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Terminal
                            </button>
                            <button
                                onClick={() => setActiveTab("transactions")}
                                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'}`}
                            >
                                <History className="w-4 h-4" />
                                History
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeTab === "terminal" ? (
                            <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col h-full bg-zinc-950/40">
                                <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Dynamic_POS_Terminal</span>
                                    </div>
                                    <span className="text-primary text-[10px] font-bold animate-pulse">ACTIVE_RECEPTION</span>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col gap-4">
                                            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest font-mono">Set_Request_Amount (USDC)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100" />
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-sm py-4 px-6 text-2xl font-black tracking-tighter text-white focus:outline-none focus:border-primary/50 relative z-10 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 bg-primary/5 border border-primary/20 p-6 rounded-sm">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Verified Protocol Acceptance</span>
                                            </div>
                                            <p className="text-[11px] text-white/50 leading-relaxed font-mono">
                                                By scanning this code, the customer authorizes a BNPL loan through Polaris Protocol. Funds are credited to your merchant balance immediately upon customer confirmation.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="relative p-6 bg-white rounded-lg shadow-[0_0_50px_rgba(88,226,113,0.15)] overflow-hidden group">
                                            <div className="absolute inset-0 border-4 border-black/5" />
                                            {qrDataUrl ? (
                                                <img src={qrDataUrl} className="w-[300px] h-[300px] relative z-10" alt="Payment QR" />
                                            ) : (
                                                <div className="w-[300px] h-[300px] flex items-center justify-center">
                                                    <RefreshCw className="w-8 h-8 text-black animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs font-bold text-white uppercase tracking-widest">{address?.slice(0, 10)}...{address?.slice(-10)}</span>
                                            <span className="text-[10px] text-white/30 uppercase">Merchant_Identification_Key</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col h-full">
                                <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Settled_Request_Log</span>
                                </div>
                                <div className="flex flex-col divide-y divide-white/5">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-primary/10 rounded-sm">
                                                    <Download className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">Customer Payment Received</span>
                                                    <span className="text-[10px] text-white/30">0x8a1...2B9 • 2 hours ago</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-primary">+$150.00</span>
                                                <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">SETTLED</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ConnectGate>
    );
}
