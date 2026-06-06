
import { useBridge, BridgeTransaction } from "@/hooks/use-bridge"
import { RefreshCw, ExternalLink, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react"
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BridgeStatusProps {
    address: string | undefined;
}

export function BridgeStatus({ address }: BridgeStatusProps) {
    const { transactions, loading } = useBridge(address);
    const [syncing, setSyncing] = useState<string | null>(null);
    const router = useRouter();

    if (!address || (transactions.length === 0 && !loading)) return null;

    const triggerSync = async (txHash: string) => {
        setSyncing(txHash);
        try {
            const res = await fetch(`/api/proof?txHash=${txHash}&chainKey=1`);
            const data = await res.json();
            if (data.merkleRoot) {
                toast.success("Ready to Sync! Go to Pools page and click 'Manual Sync'");
            } else if (data.status === 'WAITING_ATTESTATION') {
                toast.info("Still waiting for Hub attestation...");
            } else {
                toast.error(data.error || "Sync failed");
            }
        } catch (e) {
            toast.error("Sync request failed");
        } finally {
            setSyncing(null);
        }
    };

    const getStatusIcon = (status: BridgeTransaction['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-3 h-3 text-primary" />;
            case 'FAILED': return <AlertCircle className="w-3 h-3 text-red-500" />;
            case 'DETECTED':
            case 'BUILDING_PROOF':
            case 'WAITING_ATTESTATION':
            case 'SUBMITTED':
            case 'VERIFIED':
                return <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: BridgeTransaction['status']) => {
        switch (status) {
            case 'DETECTED': return 'Deposit Detected';
            case 'BUILDING_PROOF': return 'Building Proof';
            case 'WAITING_ATTESTATION': return 'Waiting for Attestation (10m)';
            case 'SUBMITTED': return 'Verifying on Sepolia (5m)';
            case 'VERIFIED': return 'Verified (Finalizing)';
            case 'COMPLETED': return 'Ready on Sepolia';
            default: return status;
        }
    };

    return (
        <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col mt-6">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap">Cross_Chain_Bridge_Monitor</span>
                    <a href="https://sepolia.etherscan.io" target="_blank" className="text-[9px] text-primary hover:underline flex items-center gap-1 font-bold">
                        SEPOLIA <ExternalLink className="w-2 h-2" />
                    </a>
                </div>
                {loading && <RefreshCw className="w-2.5 h-2.5 text-primary animate-spin" />}
            </div>
            <div className="max-h-[250px] overflow-y-auto">
                {transactions.length === 0 ? (
                    <div className="p-4 text-center text-[10px] text-white/20 uppercase">No active bridge transfers</div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">
                                        Bridging {tx.amount} {tx.token_address.toLowerCase().includes('a715') || tx.token_address.toLowerCase().includes('8437') ? 'USDC' : 'USDT'}
                                    </span>
                                    <span className="text-[8px] text-white/30 font-mono">{tx.source_tx_hash.slice(0, 6)}...</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {getStatusIcon(tx.status)}
                                    <span className={`text-[9px] uppercase font-bold tracking-wider ${tx.status === 'COMPLETED' ? 'text-primary' : 'text-white/60'}`}>
                                        {getStatusLabel(tx.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {tx.status === 'VERIFIED' && (
                                    <button
                                        onClick={() => {
                                            console.log("[BRIDGE-MONITOR] FINALIZE clicked for hash:", tx.source_tx_hash);
                                            router.push('/pools?sync=' + tx.source_tx_hash);
                                        }}
                                        className="p-1 px-2 bg-green-500/20 hover:bg-green-500/30 rounded text-[9px] font-black text-green-400 border border-green-500/20 flex items-center gap-1 active:scale-95 transition-transform"
                                    >
                                        <Zap className="w-2.5 h-2.5" />
                                        FINALIZE
                                    </button>
                                )}
                                {tx.status !== 'COMPLETED' && tx.status !== 'VERIFIED' && (
                                    <button
                                        onClick={() => triggerSync(tx.source_tx_hash)}
                                        disabled={syncing === tx.source_tx_hash}
                                        className="p-1 px-2 bg-primary/10 hover:bg-primary/20 rounded text-[9px] font-black text-primary border border-primary/20 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {syncing === tx.source_tx_hash ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                                        RE-SYNC
                                    </button>
                                )}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${tx.source_tx_hash}`}
                                    target="_blank"
                                    className="p-1.5 hover:bg-white/10 rounded-sm transition-colors"
                                    title="View on Sepolia"
                                >
                                    <ExternalLink className="w-3 h-3 text-white/40" />
                                </a>
                                {tx.hub_tx_hash && (
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${tx.hub_tx_hash}`}
                                        target="_blank"
                                        className="p-1 px-2 bg-primary/20 hover:bg-primary/30 rounded text-[9px] font-black text-primary border border-primary/20 flex items-center gap-1 transition-all"
                                        title="View on Sepolia"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        HUB_TX
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
