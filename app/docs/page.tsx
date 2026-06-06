"use client"

import {
  FolderOpen,
  ShieldCheck,
  Zap,
  Lock,
  Terminal,
  Code,
  HelpCircle,
  ChevronRight,
  Database
} from "lucide-react"

export default function DocsPage() {
  return (
    <div className="flex -mx-4 md:-mx-8 lg:-mx-12 h-[calc(100vh-140px)] overflow-hidden border-t border-white/5 font-mono">
      {/* Left Column: Navigation Tree */}
      <aside className="w-72 glass-sidebar flex flex-col custom-scrollbar overflow-y-auto hidden lg:flex bg-[#05080f]/70 border-r border-white/5">
        <div className="p-8">
          <div className="mb-10">
            <h1 className="text-white text-sm font-black tracking-[0.2em] mb-1">POLARIS_V2</h1>
            <p className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.3em]">CONFIDENTIAL_LENDING_BETA</p>
          </div>
          <nav className="space-y-2">
            {[
              { id: "intro", label: "01_INTRODUCTION", icon: FolderOpen },
              { id: "fhevm", label: "02_FHEVM_RUNTIME", icon: ShieldCheck },
              { id: "pools", label: "03_PRIVATE_POOLS", icon: Database },
              { id: "borrowing", label: "04_BORROW_LOGIC", icon: Zap },
              { id: "liquidation", label: "05_LIQUIDATION", icon: Lock },
            ].map((item) => (
              <a key={item.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-[11px] font-bold tracking-tighter text-white/50 hover:text-white" href={`#${item.id}`}>
                <item.icon className="text-white/20 group-hover:text-primary size-4" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-2 border border-primary/40 text-primary px-4 py-3 rounded-xl text-[10px] font-black hover:bg-primary/10 transition-all uppercase tracking-widest">
            <Code className="size-3" />
            V2_SOURCE_CODE
          </button>
        </div>
      </aside>

      {/* Center Column: Main Content */}
      <main className="flex-1 custom-scrollbar overflow-y-auto bg-background/20">
        <div className="max-w-4xl mx-auto px-12 py-12">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-10 font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase">
            <a className="hover:text-primary transition-colors" href="#">PROTOCOL</a>
            <ChevronRight className="size-2 text-white/10" />
            <span className="text-primary/70">ARCH_SPECIFICATION</span>
          </div>

          <div className="mb-16">
            <h1 className="text-5xl font-black tracking-tighter leading-none mb-8 text-white uppercase italic">
              POLARIS_PROTOCOL <span className="text-primary">//</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/30">CONFIDENTIAL_SPEC</span>
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-2xl font-medium">
              A state-of-the-art Confidential Lending Protocol built on Fhenix's FHEVM. Polaris enables users to supply collateral and borrow assets with 100% on-chain privacy for positions and debts.
            </p>
          </div>

          <div className="space-y-24 pb-32">
            <section id="intro" className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-primary font-mono text-sm">[1.0]</span>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">THE_FHE_ADVANTAGE</h3>
              </div>
              <p className="text-white/60 text-xs leading-relaxed uppercase tracking-wider">
                Unlike traditional lending protocols where every position is public, Polaris encrypts your balance and debt using **Fully Homomorphic Encryption**. Operations like interest accrual and health factor checks occur entirely within the encrypted state.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <h4 className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">State_Confidentiality</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase italic tracking-tighter">Your debt amount and collateral value are invisible to the public, including the protocol operators.</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Coprocessor_Execution</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase italic tracking-tighter">Large computations are offloaded to Fhenix's coprocessors to ensure high performance on Sepolia.</p>
                </div>
              </div>
            </section>

            <section id="pools" className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-primary font-mono text-sm">[2.0]</span>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">PRIVATE_LIQUIDITY_POOLS</h3>
              </div>
              <p className="text-white/60 text-xs leading-relaxed uppercase tracking-wider">
                Assets are supplied to vaults where the total liquidity is encrypted. Deposits use **Encrypted Inputs** (externalEuint128) with ZK-Proofs to ensure validity without revealing amounts.
              </p>

              {/* Terminal Code Block */}
              <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-3xl">
                <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Solidity // PrivateLendingPool.sol</span>
                </div>
                <div className="p-8 font-mono text-[11px] leading-relaxed text-white/80">
                  <div><span className="text-primary font-bold">function</span> <span className="text-blue-400 font-bold">supply</span>(externalEuint128 <span className="text-white">encryptedAmount</span>, <span className="text-primary">bytes</span> <span className="text-white">proof</span>) <span className="text-primary">external</span> {'{'}</div>
                  <div className="pl-6 text-white/50 italic">// Convert handle to encrypted type</div>
                  <div className="pl-6"><span className="text-blue-400">euint128</span> <span className="text-white">amount</span> = <span className="text-primary">FHE</span>.fromExternal(<span className="text-white">encryptedAmount</span>, <span className="text-white">proof</span>);</div>
                  <div className="pl-6"><span className="text-white">balances</span>[msg.sender] = <span className="text-primary">FHE</span>.add(<span className="text-white">balances</span>[msg.sender], <span className="text-white">amount</span>);</div>
                  <div className="pl-6"><span className="text-primary">FHE</span>.allowThis(<span className="text-white">balances</span>[msg.sender]);</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </section>

            <section id="borrowing" className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-primary font-mono text-sm">[3.0]</span>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">BORROW_LOAN_TO_VALUE</h3>
              </div>
              <p className="text-white/60 text-xs leading-relaxed uppercase tracking-wider">
                Borrowing logic enforces a 150% collateral ratio. The condition `weightedCollateral {">="} requiredDebt` is computed homomorphically, returning an encrypted boolean (`ebool`) that determines if the update clears.
              </p>
              <div className="p-8 bg-primary/5 border border-primary/20 rounded-2xl">
                 <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">HEALTH_FACTOR_LOGIC</div>
                 <div className="text-sm font-black text-white leading-relaxed font-mono italic">
                    HF = (Private_Collateral * 100) / (Private_Debt * 150)
                 </div>
                 <div className="text-[10px] text-white/30 mt-4 uppercase font-bold">Processed in Coprocessor // Result Re-encrypted for Owner</div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Right Column: Key Metrics */}
      <aside className="w-72 glass-sidebar p-10 hidden xl:flex flex-col bg-[#05080f]/70 border-l border-white/5">
        <div className="sticky top-0 space-y-12">
          <div>
            <h5 className="text-white text-[9px] font-black tracking-[0.4em] uppercase mb-8 opacity-40">Documentation_Progress</h5>
            <div className="space-y-8">
              {[
                { label: "ARCH_SUMMARY", pct: "100%" },
                { label: "POOL_SPECS", pct: "100%" },
                { label: "BORROW_API", pct: "85%" },
                { label: "ZK_INPUTS", pct: "40%" },
              ].map(p => (
                <div key={p.label} className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black text-white/60">
                    <span>{p.label}</span>
                    <span>{p.pct}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: p.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-[#1a1c22] border border-white/5 rounded-2xl space-y-4">
             <Terminal className="text-primary size-5" />
             <p className="text-[10px] font-black text-white uppercase tracking-wider">Integration Support</p>
             <p className="text-[9px] text-white/30 uppercase leading-relaxed">Connect with our engineering team on the Fhenix ecosystem Discord for Sepolia deployment support.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}