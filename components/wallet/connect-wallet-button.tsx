"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldAlert, Copy, Terminal } from "lucide-react";
import { toast } from "react-toastify";

const LOCALNET_CHAIN_ID = 31337;
const SEPOLIA_CHAIN_ID = 11155111;

export function ConnectWalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const truncateAddress = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    }
  };

  const switchToLocalnet = () => {
    switchChain(
      { chainId: LOCALNET_CHAIN_ID },
      {
        onError: () => {
          (window as any).ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x7A69",
              chainName: "Hardhat Local",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            }],
          }).catch(console.error);
        },
      }
    );
  };

  const switchToSepolia = () => {
    switchChain(
      { chainId: SEPOLIA_CHAIN_ID },
      {
        onError: () => {
          (window as any).ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xAA36A7",
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          }).catch(console.error);
        },
      }
    );
  };

  const isLocalnet = chain?.id === LOCALNET_CHAIN_ID;
  const isSepolia = chain?.id === SEPOLIA_CHAIN_ID;
  const isSupportedNetwork = isLocalnet || isSepolia;

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <Button
            onClick={openConnectModal}
            variant="outline"
            className="bg-primary/10 border-primary/20 text-primary font-mono text-[10px] tracking-widest uppercase hover:bg-primary/20 rounded-sm px-4 h-9"
          >
            CONNECT_POLARIS_WALLET
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex flex-col items-end gap-1 cursor-pointer group">
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-sm font-mono text-[10px] font-black tracking-tight transition-all active:scale-95 shadow-[0_0_15px_rgba(166,242,74,0.2)]">
            <span className="size-1.5 bg-primary-foreground rounded-full animate-pulse" />
            {truncateAddress(address!)}
          </div>
          {!isSupportedNetwork && (
            <span className="text-[7px] text-amber-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
              <ShieldAlert className="size-2" />
              WRONG_NETWORK // SWITCH_TO_PROTOCOL
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-white font-mono min-w-[280px] p-0 overflow-hidden shadow-2xl">
        {/* Address header */}
        <div className="bg-white/5 px-4 py-4 border-b border-white/10 flex flex-col gap-2 relative">
          <div className="absolute top-4 right-4">
            <button onClick={copyAddress} className="text-white/20 hover:text-primary transition-colors">
              <Copy className="size-3" />
            </button>
          </div>
          <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Active_Session</span>
          <span className="text-[10px] font-bold break-all text-primary/80 pr-6">{address}</span>
        </div>

        <div className="p-3 flex flex-col gap-2">
          {/* Current network */}
          <div className="bg-white/5 p-2 rounded-sm border border-white/5 flex justify-between items-center">
            <span className="text-[7px] text-white/30 uppercase">Network</span>
            <span className={`text-[9px] font-black ${isSupportedNetwork ? "text-primary" : "text-amber-400"}`}>
              {chain?.name || "UNKNOWN"} ({chain?.id || "???"})
            </span>
          </div>

          {/* Network Switches */}
          <div className="grid grid-cols-2 gap-2">
            <DropdownMenuItem
              onClick={switchToLocalnet}
              className={`flex items-center justify-center gap-2 py-3 px-3 cursor-pointer border text-[10px] uppercase font-black tracking-widest transition-all ${
                isLocalnet
                  ? "text-primary/40 border-primary/10 bg-primary/5 pointer-events-none"
                  : "text-primary hover:text-black hover:bg-primary border-primary/30"
              }`}
            >
              <Terminal className="size-3" />
              {isLocalnet ? "LOCALNET_" : "LOCALNET"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={switchToSepolia}
              className={`flex items-center justify-center gap-2 py-3 px-3 cursor-pointer border text-[10px] uppercase font-black tracking-widest transition-all ${
                isSepolia
                  ? "text-primary/40 border-primary/10 bg-primary/5 pointer-events-none"
                  : "text-primary hover:text-black hover:bg-primary border-primary/30"
              }`}
            >
              <ShieldAlert className="size-3" />
              {isSepolia ? "SEPOLIA_" : "SEPOLIA"}
            </DropdownMenuItem>
          </div>

          {/* Disconnect */}
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="flex items-center justify-center gap-2 py-3 px-3 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-[10px] uppercase font-black tracking-widest transition-all"
          >
            <LogOut className="size-3" />
            DISCONNECT_TERMINAL
          </DropdownMenuItem>
        </div>

        <div className="bg-white/5 px-4 py-2 border-t border-white/10">
          <span className="text-[7px] text-white/20 uppercase tracking-widest">Polaris_Terminal_v1.3 // {isSepolia ? "Sepolia_Main" : "Hardhat_Local"}</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
