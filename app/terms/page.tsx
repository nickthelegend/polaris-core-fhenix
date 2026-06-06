"use client"

import { Gavel, Download, HelpCircle, CheckCircle } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="flex-1 flex flex-col py-8 gap-6 w-full font-mono">
            <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] tracking-[0.4em] text-primary/60 uppercase">System Legal / compliance_module</span>
                <h1 className="text-white font-mono text-xl tracking-tighter font-bold uppercase">LEGAL_FRAMEWORK // TERMS_OF_SERVICE</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-9 flex flex-col gap-4">
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden flex flex-col">
                        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Gavel className="w-4 h-4 text-primary" />
                                <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">SERVICE_AGREEMENT_MANIFEST</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(166,242,74,0.8)]"></div>
                                <span className="font-mono text-[8px] text-white/40 tracking-widest uppercase">SYSTEM_LIVE: EULA_VER_2.4.1</span>
                            </div>
                        </div>
                        <div className="p-8 md:p-12 overflow-y-auto max-h-[750px] scrollbar-hide font-mono text-xs text-white/70 leading-relaxed">
                            <div className="border-b border-white/5 pb-8 mb-8">
                                <h2 className="text-white text-base font-bold mb-4 uppercase">OBOLUS_PROTOCOL_USER_AGREEMENT</h2>
                                <p className="text-white/40 text-[10px] leading-relaxed italic">
                                    Last Updated: October 12, 2024. Please read this Service Agreement carefully. By accessing or using the Obolus Protocol, you acknowledge that you have read, understood, and agree to be bound by these terms. This document constitutes a legally binding agreement between you and the Obolus Decentralized Autonomous Organization.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-primary font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <span>{`>>`}</span> 01_PROTOCOL_USAGE
                                    </h3>
                                    <p>
                                        The Obolus Protocol provides a decentralized platform for crypto-collateralized buy-now-pay-later (BNPL) services. Users may interact with the protocol via smart contracts deployed on supported blockchain networks. Access to the protocol is provided on an "as-is" basis, and users are solely responsible for managing their private keys and wallet interactions.
                                    </p>
                                    <p className="mt-4">
                                        Eligibility: By using the platform, you represent that you are of legal age and are not subject to any international sanctions or restricted party lists. You agree to comply with all local regulations regarding cryptocurrency asset management and decentralized finance.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-primary font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <span>{`>>`}</span> 02_COLLATERAL_LIQUIDATION_RISKS
                                    </h3>
                                    <p>
                                        Cryptocurrency markets are highly volatile. The Obolus Protocol requires collateralization for all credit extensions. In the event that the value of your collateral falls below the predefined 'Health Factor' threshold, the protocol will automatically trigger a liquidation event.
                                    </p>
                                    <p className="mt-4">
                                        Liquidation Mechanism: Liquidation is handled by decentralized bots and smart contract logic. Obolus DAO is not responsible for losses incurred during market fluctuations or automated liquidation processes. Users are encouraged to maintain a safe buffer above the minimum liquidation threshold.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-primary font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <span>{`>>`}</span> 03_SMART_CONTRACT_DISCLAIMER
                                    </h3>
                                    <p>
                                        While Obolus Protocol code has undergone multiple third-party audits, the nature of blockchain technology involves inherent risks. Smart contracts may contain vulnerabilities that could lead to the loss of funds.
                                    </p>
                                    <p className="mt-4">
                                        By interacting with the Obolus smart contracts, you acknowledge and accept the risk of potential bugs, exploits, or network congestion that may affect the execution of transactions or the security of your deposited assets.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-primary font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <span>{`>>`}</span> 04_GOVERNANCE_AND_UPDATES
                                    </h3>
                                    <p>
                                        Obolus is governed by the $POL holders. The terms of this agreement may be modified via on-chain governance proposals. Continued use of the platform following any modifications constitutes acceptance of the updated framework.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5">
                                <p className="text-[10px] text-white/30 text-center uppercase tracking-[0.4em]">
                                    --- END_OF_MANIFEST_DATA ---
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lg:col-span-3 flex flex-col gap-6">
                    <div className="glass-card rounded-lg border border-white/10 overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">DOCUMENT_METADATA</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-tighter">VERSION</span>
                                <span className="text-xs text-white font-bold">2.4.1</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-tighter">LAST_MODIFIED</span>
                                <span className="text-xs text-white font-bold">2024_10_12</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-tighter uppercase">HASH_VERIFICATION</span>
                                <span className="text-[10px] text-primary/70 break-all">8f3c...b2e1</span>
                            </div>
                            <div className="pt-2">
                                <button className="w-full bg-primary hover:bg-primary/90 text-background-dark font-mono font-bold text-[10px] py-3 rounded flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-primary/10">
                                    <Download className="w-4 h-4" />
                                    DOWNLOAD_PDF_ASSET
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card border border-white/5 p-5 rounded-lg flex flex-col gap-4 bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            <h2 className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Legal_Support</h2>
                        </div>
                        <p className="text-white/50 text-[10px] leading-relaxed">
                            Have questions regarding the legal framework? Connect with our compliance channel on Discord or view the full documentation on GitHub.
                        </p>
                        <button className="text-primary text-[10px] font-bold font-mono hover:underline flex items-center gap-1 uppercase tracking-widest">
                            OPEN_COMPLIANCE_CHANNEL
                        </button>
                    </div>

                    <div className="glass-card border border-white/5 p-4 rounded-lg flex flex-col gap-3">
                        <span className="font-mono text-[9px] text-white/40 tracking-wider uppercase">System_Verification</span>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/70 uppercase">WASH_COMPLIANT</span>
                            <CheckCircle className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/70 uppercase">GDPR_SECURE</span>
                            <CheckCircle className="w-3 h-3 text-primary" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
