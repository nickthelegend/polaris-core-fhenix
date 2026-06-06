"use client"

import { Search, Globe, Gamepad2, Cpu, Sparkles, Tv, Zap, ArrowRight } from "lucide-react"
import { ConnectGate } from "@/components/connect-gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import Link from "next/link"

const CATEGORIES = ["ALL", "Gaming", "Technology", "Entertainment", "Fashion", "Travel"]

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<any[]>([])

    useEffect(() => {
        fetch("/api/merchants").then(r => r.json()).then(d => setMerchants(Array.isArray(d) ? d : [])).catch(() => {})
    }, [])

    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("ALL")

    return (
        <ConnectGate>
            <div className="relative z-10 w-full font-mono">
                {/* Header Intro */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tighter uppercase text-primary mb-1">
                            SECURE_VENDOR_NETWORK // PROTOCOL_V.2.1
                        </h1>
                        <p className="text-[10px] text-foreground/40 uppercase tracking-widest">
                            Verified merchants with instant BNPL integration enabled
                        </p>
                    </div>
                    <div className="flex items-center gap-6 text-[9px] tracking-[0.2em] text-foreground/30 uppercase">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            VENDORS: 1,248
                        </span>
                        <span>UPTIME: 99.99%</span>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary size-5" />
                        <Input
                            className="w-full bg-navy-950/50 border-2 border-primary/30 focus:border-primary outline-none px-12 py-7 rounded-xl text-primary placeholder:text-primary/40 font-mono tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(167,242,74,0.05)]"
                            placeholder="[SEARCH_MERCHANT_DATABASE]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-4 py-1.5 rounded border text-[10px] font-bold tracking-widest transition-all uppercase ${activeTab === cat
                                    ? "border-primary bg-primary text-black"
                                    : "border-white/10 text-foreground/40 hover:border-primary/50 hover:text-primary"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {merchants.filter((m: any) =>
                        (activeTab === "ALL" || m.category === activeTab) &&
                        m.name.toLowerCase().includes(search.toLowerCase())
                    ).map((m: any) => {
                        // Dynamic icon mapping based on category or name
                        let IconComponent = Globe;
                        if (m.category === 'Gaming') IconComponent = Gamepad2;
                        if (m.category === 'Technology') IconComponent = Cpu;
                        if (m.category === 'Fashion') IconComponent = Sparkles;
                        if (m.category === 'Entertainment') IconComponent = Tv;

                        return (
                            <div key={m.id} className="glass-card p-6 rounded-2xl flex flex-col group hover:border-primary/40 transition-all bg-card/20 border border-white/5 backdrop-blur-xl">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                                        <IconComponent className="size-6 text-foreground/40 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-foreground/30 block mb-1 uppercase tracking-tighter font-bold">MAX_BORROW_CAPACITY</span>
                                        <span className="text-lg font-bold text-foreground font-mono italic">${Number(m.credit_limit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-white font-bold tracking-widest mb-3 uppercase leading-tight">{m.name}</h3>
                                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                        <span className="text-[9px] font-bold text-primary tracking-widest uppercase">{m.plan_description}</span>
                                    </div>
                                </div>

                                <Link href="/checkout" className="mt-auto">
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-black py-6 rounded-xl font-bold text-xs tracking-[0.2em] transition-all neon-glow flex items-center justify-center gap-2 uppercase">
                                        INITIATE PURCHASE
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </div>
                        )
                    })}
                </div>

                {/* Footer info for this section */}
                <div className="flex flex-col md:flex-row items-center justify-between text-[9px] tracking-[0.3em] text-foreground/20 gap-4 py-8 border-t border-white/5">
                    <div className="flex items-center gap-8 uppercase">
                        <span>ENCRYPTION_LAYER_4_ACTIVE</span>
                        <span className="hidden sm:inline">SSL_256_BIT_SECURITY</span>
                    </div>
                    <p className="italic uppercase">© 2024 OBOLUS_PROTOCOL_ASSETS</p>
                </div>
            </div>
        </ConnectGate>
    )
}
