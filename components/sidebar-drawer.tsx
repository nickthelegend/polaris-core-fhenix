"use client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import NextImage from "next/image"
import { usePathname } from "next/navigation"
import {
  MenuIcon,
  LayoutDashboard,
  PiggyBank,
  ShoppingBag,
  Gauge,
  CreditCard,
  History,
  LogOut,
  User
} from "lucide-react"
import { useObolusWallet } from "@/lib/hooks/useObolusWallet"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/pools", label: "POOLS", icon: PiggyBank },
  { href: "/borrow", label: "BORROW", icon: ShoppingBag },
  { href: "/credit", label: "CREDIT", icon: CreditCard },
  { href: "/positions", label: "POSITIONS", icon: Gauge },
  { href: "/transactions", label: "ACTIVITY", icon: History },
  { href: "/faucet", label: "FAUCET", icon: LayoutDashboard },
]

export function SidebarDrawer({ open, onOpenChange }: { open?: boolean; onOpenChange?: (v: boolean) => void }) {
  const pathname = usePathname()
  const { address, connected: authenticated, disconnect: logout } = useObolusWallet()

  const shortAddress = (a: string) => a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="sm:hidden rounded-full bg-card/40 border border-border/40 p-2" aria-label="Open menu">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-[#070B12] border-r border-white/5 flex flex-col font-mono uppercase">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-primary italic">Polaris//</span>
          </div>
        </SheetHeader>

        <nav className="flex-1 mt-6 px-0 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange?.(false)}
                className={cn(
                  "relative flex items-center gap-3 px-6 py-4 text-[11px] font-bold tracking-widest transition-all group",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary shadow-[inset_0_0_15px_rgba(166,242,74,0.05)]"
                    : "text-white/40 hover:text-primary/70 hover:bg-primary/5 hover:text-white"
                )}
              >
                <item.icon className={cn("size-4", isActive ? "text-primary" : "text-white/40 group-hover:text-white")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="size-1.5 bg-primary rounded-full neon-glow animate-pulse"></span>
              <span className="text-[9px] font-bold text-white/40 tracking-widest">NETWORK ONLINE</span>
            </div>
            <span className="text-[9px] font-bold text-primary/60">24ms</span>
          </div>

          {authenticated && address && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-primary border border-primary/20 flex items-center justify-center">
                  <User className="size-4 text-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white tracking-tight">{shortAddress(address)}</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">VERIFIED USER</span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="text-white/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
