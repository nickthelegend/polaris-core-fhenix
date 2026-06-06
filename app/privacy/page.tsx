"use client"

import { Shield, FileText, Trash2 } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono">
            <div className="flex flex-col gap-1 mb-2">
                <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">System_Governance // Legal_Layer</span>
                <h1 className="text-white font-mono text-2xl tracking-tighter font-bold uppercase">DATA_PROTECTION // PRIVACY_PROTOCOL</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col">
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col h-full shadow-2xl">
                        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="font-mono text-[10px] text-white font-bold uppercase tracking-widest">PRIVACY_MANIFEST_V1.0.4</span>
                            </div>
                            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Last_Hash: 0x7E...2D</span>
                        </div>
                        <div className="flex-1 p-6 md:p-8 font-mono text-xs leading-relaxed scrollbar-hide overflow-y-auto max-h-[700px] text-white/70">
                            <div className="mb-8 p-4 border-l-2 border-primary/20 bg-primary/[0.02]">
                                <p className="italic">
                                    "In the decentralized architecture of Obolus, privacy is not a setting—it is a foundational protocol logic. This document outlines the technical constraints and cryptographic guarantees governing your data."
                                </p>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        [01] ON_CHAIN_DATA_RETENTION
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">TRANSACTION_IMMUTABILITY:</strong> All financial interactions (deposits, withdrawals, BNPL executions) are recorded on the Sepolia blockchain. These records are permanent and pseudonymous.</p>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">METADATA_CLEANSING:</strong> Off-chain relayers strip non-essential IP headers and device identifiers before broadcast. Your physical location is never stored on the Obolus ledger.</p>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">TTL_VARIABLES:</strong> Temporary session data (UI preferences, local cache) is assigned a "Time-To-Live" of 24 hours before automatic localized purging.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        [02] ENCRYPTION_STANDARDS
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">AES_256_GCM:</strong> All off-chain storage layers utilize military-grade Advanced Encryption Standard with Galois/Counter Mode for authenticated encryption.</p>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">ASYMMETRIC_KEYS:</strong> Secure communication between the Obolus Terminal and the Liquidity Engine is signed using Ed25519 elliptic curve signatures.</p>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">NON_CUSTODIAL_DESIGN:</strong> Obolus never stores private keys. All cryptographic authorizations must be signed via the user's connected hardware or software wallet.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        [03] ZERO_KNOWLEDGE_PROOF_USAGE
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">ZK_IDENTITY:</strong> Obolus utilizes Zero-Knowledge Proofs (zk-SNARKs) to verify creditworthiness without exposing the underlying financial history of the user.</p>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <span className="text-primary font-bold mt-1 text-[10px] tracking-tight">{`>>`}</span>
                                            <p><strong className="text-white uppercase tracking-tight">SOLVENCY_ATTESTATION:</strong> Liquidity pool solvency is proven cryptographically on an hourly basis, ensuring transparency without leaking specific trade secrets or participant sizes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 text-center">
                                <span className="text-[9px] text-white/20 uppercase tracking-[0.4em]">-- End of Manifest --</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">PRIVACY_STATUS</span>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center text-center gap-4">
                            <div className="size-20 rounded-full border border-primary/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_10px_rgba(166,242,74,0.1)]">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#A6F24A]"></span>
                                    <span className="text-primary font-mono text-[11px] font-bold tracking-widest uppercase">ENCRYPTED</span>
                                </div>
                                <span className="text-[9px] font-mono text-white/30 mt-2 uppercase tracking-tighter">Tunnel: AES-256-SHA3</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-lg border border-white/10 p-5 flex flex-col gap-4">
                        <h4 className="text-white font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-red-500" />
                            Data_Control_Center
                        </h4>
                        <p className="text-[11px] text-white/50 leading-relaxed uppercase">
                            Triggering a data purge will immediately clear all local storage, session keys, and off-chain cached identifiers. This action is irreversible.
                        </p>
                        <button className="w-full bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 py-3 rounded-sm font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all group flex items-center justify-center gap-2">
                            REQUEST_DATA_PURGE
                        </button>
                    </div>

                    <div className="glass-card rounded-lg border border-white/10 p-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 space-y-2">
                        <div className="flex justify-between">
                            <span>Integrity_Score:</span>
                            <span className="text-primary">100%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Leak_Detected:</span>
                            <span className="text-white/60">FALSE</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Relay_Nodes:</span>
                            <span className="text-white/60">14_ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
