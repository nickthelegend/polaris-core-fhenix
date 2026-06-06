"use client"

import { ConnectGate } from "@/components/connect-gate"
import {
    Terminal,
    MessageSquare,
    Mail,
    Search,
    BookOpen,
    Calculator,
    Zap,
    Shield,
    Link as LinkIcon,
    ChevronRight,
    Monitor,
    ArrowRight
} from "lucide-react"

export default function SupportPage() {
    return (
        <ConnectGate>
            <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono">
                <div className="flex flex-col gap-1 mb-4">
                    <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">Operational_Interface // v4.2.0</span>
                    <h1 className="text-white font-mono text-3xl md:text-4xl tracking-tighter font-bold uppercase">SYSTEM_SUPPORT // TECHNICAL_ASSISTANCE</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-7 flex flex-col gap-6">
                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                                <span className="font-mono text-[10px] text-primary uppercase tracking-widest">SUPPORT_TICKET_PORTAL</span>
                                <span className="text-white/20 text-[10px] font-mono uppercase">Priority: Standard</span>
                            </div>
                            <div className="p-8 flex flex-col gap-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">ISSUE_CATEGORY</label>
                                        <div className="relative">
                                            <select className="bg-white/5 border border-white/10 w-full p-3 font-mono text-xs uppercase appearance-none rounded-sm outline-none focus:border-primary transition-all">
                                                <option>Select_Module_Error</option>
                                                <option>LIQUIDITY_PROVISION_FAILURE</option>
                                                <option>TRANSACTION_LATENCY_QUERY</option>
                                                <option>WALLET_SYNC_DESYNC</option>
                                                <option>SMART_CONTRACT_MISMATCH</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">SUBJECT</label>
                                        <input className="bg-white/5 border border-white/10 w-full p-3 font-mono text-xs uppercase rounded-sm placeholder:text-white/10 outline-none focus:border-primary transition-all" placeholder="ENTER_BRIEF_DESCRIPTOR" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">DETAILED_MANIFEST</label>
                                        <textarea className="bg-white/5 border border-white/10 w-full p-3 font-mono text-xs uppercase rounded-sm placeholder:text-white/10 resize-none outline-none focus:border-primary transition-all" placeholder="DESCRIBE_ANOMALY_PARAMETERS_AND_SYSTEM_STATE..." rows={8}></textarea>
                                    </div>
                                </div>
                                <button className="bg-primary hover:bg-primary/90 text-background-dark font-mono font-black text-xs py-4 rounded-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(166,242,74,0.2)]">
                                    <Terminal className="w-5 h-5" />
                                    INITIALIZE_SUPPORT_PROTOCOL
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 glass-card border border-white/5 p-4 rounded-lg flex items-center gap-3 hover:bg-white/[0.04] transition-all cursor-pointer">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-none">Live_Relay</div>
                                    <div className="text-[11px] font-bold text-white uppercase mt-1">Chat with Agent</div>
                                </div>
                            </div>
                            <div className="flex-1 glass-card border border-white/5 p-4 rounded-lg flex items-center gap-3 hover:bg-white/[0.04] transition-all cursor-pointer">
                                <Mail className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-none">Async_Comm</div>
                                    <div className="text-[11px] font-bold text-white uppercase mt-1">Direct Email</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="lg:col-span-5 flex flex-col gap-6">
                        <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                                <span className="font-mono text-[10px] text-primary uppercase tracking-widest">KNOWLEDGE_BASE_MODULE</span>
                                <div className="flex gap-1">
                                    <div className="size-1.5 rounded-full bg-white/20"></div>
                                    <div className="size-1.5 rounded-full bg-white/20"></div>
                                </div>
                            </div>
                            <div className="p-4 border-b border-white/5">
                                <div className="bg-white/5 border border-white/10 px-3 py-2 rounded flex items-center gap-2">
                                    <Search className="w-4 h-4 text-white/40" />
                                    <input className="bg-transparent border-none p-0 text-[10px] font-mono text-white focus:ring-0 placeholder:text-white/20 uppercase w-full" placeholder="QUERY_KNOWLEDGE_REPOSITORIES" type="text" />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[580px] scrollbar-hide">
                                {[
                                    { title: "STAKING_MECHANICS_V1", desc: "Optimization protocols for maximum yield accrual within the Obolus staking ecosystem.", icon: BookOpen },
                                    { title: "REPAYMENT_LOGIC", desc: "Understanding automated BNPL settlements and health factor protection thresholds.", icon: Calculator },
                                    { title: "NETWORK_LATENCY_FAQ", desc: "Diagnostics for inter-chain settlement delay and RPC endpoint synchronization.", icon: Monitor },
                                    { title: "VAULT_ARCHITECTURE_SEC", desc: "Overview of L3 secure vault implementations and collateral isolation layers.", icon: Shield },
                                    { title: "BRIDGING_PROTOCOL_TX", desc: "Documentation on Sepolia asset bridging procedures.", icon: LinkIcon }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 border-b border-white/5 hover:bg-primary/5 transition-colors cursor-pointer group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <item.icon className="w-4 h-4 text-white/30 group-hover:text-primary mt-0.5" />
                                                <div>
                                                    <h3 className="text-white font-mono text-xs font-bold uppercase tracking-tight group-hover:text-primary">{item.title}</h3>
                                                    <p className="text-[9px] font-mono text-white/30 mt-1 uppercase leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-mono text-white/40 uppercase">Total_Archives: 142_Entries</span>
                                <button className="text-[9px] font-mono font-bold text-primary hover:underline uppercase tracking-widest">[ ACCESS_ALL_DATA ]</button>
                            </div>
                        </div>

                        <div className="glass-card bg-primary/5 border border-primary/20 rounded-lg p-5 relative overflow-hidden">
                            <div className="scanline" />
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                                    <Zap className="w-4 h-4 text-primary" />
                                    System_Broadcast
                                </h3>
                            </div>
                            <p className="text-white/70 text-[11px] leading-relaxed font-mono uppercase">
                                <span className="text-primary font-bold">[!]</span> Maintenance scheduled for <span className="text-white font-bold">SEPOLIA_TESTNET</span> in 12 hours. Bridge operations may experience elevated latency.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </ConnectGate>
    )
}
