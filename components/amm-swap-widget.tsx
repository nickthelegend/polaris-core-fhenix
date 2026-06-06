"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Info, Loader2 } from "lucide-react"
import { TokenIcon } from "@/components/token-icon"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { toast } from "sonner"
import { AMM_DEPLOYMENTS, ERC20_ABI, AMM_ABI } from "@/lib/amm-contracts"
import { useFhePrivateSwap } from "@/hooks/use-fhe-private-swap"
import { CONTRACTS } from "@/lib/contracts"
import { syncTransaction, syncPosition } from "@/lib/sync-utils"
import { logger } from "@/lib/logger"
import { parseRevertReason } from "@/lib/revert-mapper"
import { cn } from "@/lib/utils"
import { Shield, ShieldOff, Lock } from "lucide-react"

const TOKENS = [
  { symbol: "WETH", address: AMM_DEPLOYMENTS.mockTokens.WETH, decimals: 18, color: "bg-blue-400" },
  { symbol: "BNB", address: AMM_DEPLOYMENTS.mockTokens.BNB, decimals: 18, color: "bg-yellow-500" },
  { symbol: "USDC", address: AMM_DEPLOYMENTS.mockTokens.USDC, decimals: 6, color: "bg-blue-500" },
  { symbol: "USDT", address: AMM_DEPLOYMENTS.mockTokens.USDT, decimals: 6, color: "bg-green-600" },
]

export function AMMSwapWidget() {
  const { address, isConnected } = useAccount()
  const [fromToken, setFromToken] = useState(TOKENS[0]) // WETH
  const [toToken, setToToken] = useState(TOKENS[2]) // USDC (valid WETH-USDC pool)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [isConfidential, setIsConfidential] = useState(false)

  const { depositEncrypted, swapEncrypted, loading: isFheLoading } = useFhePrivateSwap()

  // Get AMM pool address based on token pair
  const getPoolAddress = () => {
    const pair = [fromToken.symbol, toToken.symbol].sort().join("-")
    
    if (pair === "BNB-USDC") return AMM_DEPLOYMENTS.ammPools.BNB_USDC
    if (pair === "BNB-USDT") return AMM_DEPLOYMENTS.ammPools.BNB_USDT
    if (pair === "USDC-WETH") return AMM_DEPLOYMENTS.ammPools.WETH_USDC
    if (pair === "USDT-WETH") return AMM_DEPLOYMENTS.ammPools.WETH_USDT
    
    return null
  }

  const poolAddress = getPoolAddress()

  // Read token balance
  const { data: balance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  })

  // Read allowance
  const { data: allowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && poolAddress ? [address, poolAddress as `0x${string}`] : undefined,
    query: { enabled: !!address && !!poolAddress }
  })

  // Get expected output amount
  const { data: expectedOutput, refetch: refetchOutput } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: AMM_ABI,
    functionName: "getAmountOut",
    args: fromAmount && poolAddress ? [
      fromToken.address as `0x${string}`,
      parseUnits(fromAmount, fromToken.decimals)
    ] : undefined,
    query: { enabled: !!fromAmount && !!poolAddress && parseFloat(fromAmount) > 0 }
  })

  // Update toAmount when expectedOutput changes
  useEffect(() => {
    if (expectedOutput) {
      setToAmount(formatUnits(expectedOutput, toToken.decimals))
    } else {
      setToAmount("")
    }
  }, [expectedOutput, toToken.decimals])

  // Refetch output when fromAmount changes
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      refetchOutput()
    }
  }, [fromAmount, refetchOutput])

  const { writeContract: approveToken, data: approveHash } = useWriteContract()
  const { writeContract: executeSwap, data: swapHash } = useWriteContract()

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isSwapConfirming } = useWaitForTransactionReceipt({
    hash: swapHash,
  })

  useEffect(() => {
    if (swapHash && address) {
      logger.info('AMM_SWAP', 'Syncing public swap to ledger', { txHash: swapHash, from: fromToken.symbol, to: toToken.symbol });
      syncTransaction({
        userAddress: address,
        type: "swap",
        title: `Swapped ${fromAmount} ${fromToken.symbol} → ${toToken.symbol}`,
        amount: fromAmount,
        asset: fromToken.symbol,
        txHash: swapHash,
        status: "VERIFIED"
      });
      syncPosition({
        walletAddress: address,
        type: "SUPPLY",
        symbol: fromToken.symbol,
        entryAmount: -parseFloat(fromAmount),
        txHash: swapHash
      });
    }
  }, [swapHash, address, fromAmount, fromToken.symbol, toToken.symbol]);

  const handleApprove = async () => {
    if (!poolAddress || !fromAmount) return
    
    setIsApproving(true)
    try {
      const amount = parseUnits(fromAmount, fromToken.decimals)
      approveToken({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress as `0x${string}`, amount],
      } as any)
      logger.info('AMM_SWAP', 'Approval transaction submitted', { token: fromToken.symbol, amount: fromAmount });
      toast.success("Approval submitted!")
    } catch (error: any) {
      const msg = parseRevertReason(error)
      logger.error('AMM_SWAP', 'Approval failed', { error, msg });
      toast.error(msg)
    } finally {
      setIsApproving(false)
    }
  }

  const handleSwap = async () => {
    if (!poolAddress || !fromAmount) return
    
    if (isConfidential) {
      setIsSwapping(true)
      try {
        const amountWei = parseUnits(fromAmount, fromToken.decimals)
        const swapContract = (CONTRACTS.SPOKES.SEPOLIA.PRIVATE_SWAPS as any)[fromToken.symbol]
        
        if (!swapContract) {
          toast.error(`No private swap contract for ${fromToken.symbol}`)
          return
        }

        logger.info('AMM_SWAP', 'Initiating confidential swap', { swapContract, from: fromToken.symbol, to: toToken.symbol });
        const hash = await swapEncrypted(swapContract, amountWei, toToken.address)
        toast.success("Confidential Swap submitted!")

        if (address) {
          logger.info('AMM_SWAP', 'Syncing confidential swap to ledger', { txHash: hash });
          await syncTransaction({
            userAddress: address,
            type: "swap",
            title: `Swapped ${fromAmount} ${fromToken.symbol} → ${toToken.symbol}`,
            amount: fromAmount,
            asset: fromToken.symbol,
            txHash: hash,
            status: "VERIFIED"
          });

          await syncPosition({
            walletAddress: address,
            type: "SUPPLY",
            symbol: fromToken.symbol,
            entryAmount: -parseFloat(fromAmount),
            txHash: hash
          });
        }
      } catch (error: any) {
        const msg = parseRevertReason(error)
        logger.error('AMM_SWAP', 'Confidential swap failed', { error, msg });
        toast.error(msg)
      } finally {
        setIsSwapping(false)
      }
      return
    }

    setIsSwapping(true)
    try {
      const amount = parseUnits(fromAmount, fromToken.decimals)
      executeSwap({
        address: poolAddress as `0x${string}`,
        abi: AMM_ABI,
        functionName: "swap",
        args: [fromToken.address as `0x${string}`, amount],
      } as any)
      logger.info('AMM_SWAP', 'Public swap submitted', { from: fromToken.symbol, to: toToken.symbol, amount: fromAmount });
      toast.success("Swap submitted!")
    } catch (error: any) {
      const msg = parseRevertReason(error)
      logger.error('AMM_SWAP', 'Public swap failed', { error, msg });
      toast.error(msg)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleFlipTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount("")
  }

  const needsApproval = allowance !== undefined && fromAmount && 
    parseUnits(fromAmount, fromToken.decimals) > allowance

  const canSwap = isConnected && fromAmount && parseFloat(fromAmount) > 0 && 
    poolAddress && !needsApproval && balance !== undefined &&
    parseUnits(fromAmount, fromToken.decimals) <= balance

  const priceImpact = expectedOutput && fromAmount && parseFloat(fromAmount) > 0
    ? ((parseFloat(toAmount) / parseFloat(fromAmount)) * 100).toFixed(2)
    : "0.00"

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">AMM Swap</h3>
        <p className="text-xs text-foreground/40 mt-1">
          Swap tokens using our AMM pools with 0.3% fee
        </p>
      </div>

      {/* Confidential Toggle */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isConfidential ? "bg-primary/20 text-primary" : "bg-foreground/5 text-foreground/40"}`}>
            {isConfidential ? <Shield size={18} /> : <ShieldOff size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Confidential Mode</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest">Powered by Fhenix FHEVM</p>
          </div>
        </div>
        <button 
          onClick={() => setIsConfidential(!isConfidential)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isConfidential ? "bg-primary" : "bg-foreground/20"}`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isConfidential ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* From Token */}
      <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2 group focus-within:border-primary/40 transition-all">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">From_Source</label>
          {balance !== undefined && (
            <span className="text-[10px] text-foreground/30 font-black uppercase tracking-widest">
              Balance: {formatUnits(balance, fromToken.decimals)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-3xl font-light text-foreground/60 placeholder:text-foreground/20 focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 rounded-xl px-3 py-2.5 shadow-sm">
            <TokenIcon symbol={fromToken.symbol} size={20} />
            <span className="text-sm font-black text-white">{fromToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center">
        <button
          onClick={handleFlipTokens}
          className="p-2 rounded-full bg-[#1a1d24] border border-border/30 hover:border-primary/40 transition-colors cursor-pointer"
        >
          <ArrowLeftRight size={16} className="text-foreground/40" />
        </button>
      </div>

      {/* To Token */}
      <div className="bg-[#05080f]/60 border border-border/20 rounded-2xl p-4 space-y-2">
        <label className="text-[10px] text-foreground/40 font-black uppercase tracking-widest text-primary/60 animate-pulse">To_Destination (est)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0"
            className="flex-1 bg-transparent text-3xl font-light text-primary/40 placeholder:text-foreground/20 focus:outline-none min-w-0"
          />
          <div className="flex items-center gap-2 bg-[#1a1d24] border border-border/40 rounded-xl px-3 py-2.5">
            <TokenIcon symbol={toToken.symbol} size={20} />
            <span className="text-sm font-black text-white">{toToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* Swap Info */}
      {fromAmount && toAmount && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-foreground/40">Rate</span>
            <span className="text-foreground/70">
              1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-foreground/40">Fee (0.3%)</span>
            <span className="text-foreground/70">
              {(parseFloat(fromAmount) * 0.003).toFixed(6)} {fromToken.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Warning if pool not available */}
      {!poolAddress && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <Info size={14} className="text-yellow-500 flex-shrink-0" />
          <span className="text-xs text-yellow-500">
            No pool available for this token pair
          </span>
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-center gap-2 bg-[#05080f]/40 border border-border/20 rounded-xl px-4 py-3">
        {isConfidential ? <Lock size={14} className="text-primary/60 flex-shrink-0" /> : <Info size={14} className="text-foreground/30 flex-shrink-0" />}
        <span className="text-xs text-foreground/40">
          {isConfidential 
            ? "Confidential swaps are executed via encrypted inputs — only you see the amount" 
            : "Swaps are executed on-chain via AMM pools"}
        </span>
      </div>

      {/* Action Buttons */}
      {!isConnected ? (
        <button
          disabled
          className="w-full py-4 rounded-2xl bg-foreground/10 text-foreground/40 font-black text-sm uppercase tracking-widest"
        >
          Connect_Wallet_Interface
        </button>
      ) : needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApproving || isApproveConfirming}
          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(166,242,74,0.2)] hover:scale-[1.02] active:scale-[0.98]"
        >
          {(isApproving || isApproveConfirming) && <Loader2 size={16} className="animate-spin" />}
          {isApproveConfirming ? "Confirming_Protocol..." : isApproving ? "Authorizing..." : `Approve_${fromToken.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={!canSwap || isSwapping || isSwapConfirming || isFheLoading}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]",
            isConfidential 
              ? "bg-primary text-black shadow-[0_0_20px_rgba(166,242,74,0.3)]" 
              : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
          )}
        >
          {(isSwapping || isSwapConfirming || isFheLoading) && <Loader2 size={16} className="animate-spin" />}
          {isSwapConfirming ? "Verifying_Proof..." : (isSwapping || isFheLoading) ? "Calculating_FHE..." : isConfidential ? "Confidential_Swap" : "Public_Swap"}
        </button>
      )}
    </div>
  )
}
