"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePolarisPay } from "@/hooks/use-polaris-pay"
import { useAccount } from "wagmi"
import {
  ShieldCheck, Zap, AlertCircle, CheckCircle2, Loader2,
  ArrowLeft, CreditCard, SplitSquareHorizontal, Calendar
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { NETWORKS } from "@/lib/contracts"
import { syncTransaction } from "@/lib/sync-utils"
import {
  isBNPLEligible,
  isSplit3Eligible,
  computeSplitInstallments,
  generateSplitSchedule,
  generateBNPLSchedule,
} from "@/lib/credit-utils"

type PaymentMode = "bnpl" | "split3"

interface PaymentResult {
  type: "POLARIS_PAYMENT_RESULT"
  success: boolean
  loanId?: number
  amount?: number
  paymentMode: PaymentMode
  txHash?: string
  error?: string
}

export default function CheckoutPage() {
  const params = useParams()
  const hash = params.hash
  const router = useRouter()
  const {
    authenticated,
    address,
    getMasterConfig,
    getCreditLimit,
    payWithCredit,
    loading: polarisLoading,
  } = usePolarisPay()
  const { isConnected } = useAccount()

  const [bill, setBill] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [creditLimit, setCreditLimit] = useState("0")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("bnpl")
  const [completedLoanId, setCompletedLoanId] = useState<number | undefined>()
  const [splitSchedule, setSplitSchedule] = useState<{ dueDates: number[]; initialDeduction: number } | null>(null)
  const [bnplSchedule, setBnplSchedule] = useState<number[]>([])

  const billAmount = bill ? Number(bill.amount) : 0
  const credit = Number(creditLimit)
  const bnplEnabled = isBNPLEligible(credit, billAmount)
  const split3Enabled = isSplit3Eligible(credit, billAmount)
  const installments = billAmount > 0 ? computeSplitInstallments(billAmount) : [0, 0, 0]

  useEffect(() => {
    if (authenticated && address) {
      getCreditLimit().then(setCreditLimit)
    }
  }, [authenticated, address])

  useEffect(() => {
    if (hash) fetchBill()
  }, [hash])

  const fetchBill = async () => {
    try {
      const res = await fetch(`/api/bills/${hash}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBill(data)
    } catch (e: any) {
      toast.error(e.message || "Failed to load bill")
    } finally {
      setFetching(false)
    }
  }

  const sendPaymentResult = (result: PaymentResult) => {
    try {
      if (window.opener) {
        window.opener.postMessage(result, "*")
      }
    } catch (e) {
      console.warn("[POLARIS] postMessage failed:", e)
    }
  }

  const handlePayment = async () => {
    if (!authenticated) {
      toast.warn("Please connect your wallet first")
      return
    }

    if (paymentMode === "bnpl" && !bnplEnabled) {
      toast.error("Insufficient credit for BNPL. Top up your equity!")
      return
    }

    if (paymentMode === "split3" && !split3Enabled) {
      toast.error("Insufficient credit for Split-in-3. Top up your equity!")
      return
    }

    const targetAddress = bill.merchant?.user?.wallet_address || bill.merchant?.escrow_contract
    if (!targetAddress || targetAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Merchant settlement address not configured. Ask merchant to set wallet.")
      return
    }

    setPaying(true)
    try {
      const { config } = getMasterConfig() as any
      const usdcAddress = config.USDC

      if (!usdcAddress) {
        throw new Error("USDC address not configured")
      }

      // Verify we're on Sepolia
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" })
        const currentChain = parseInt(chainIdHex, 16)
        if (currentChain !== 11155111) {
          toast.warn("Switching to Sepolia...")
          try {
            await (window as any).ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xaa36a7" }],
            })
          } catch (switchErr: any) {
            throw new Error("Please switch to Sepolia network in your wallet")
          }
        }
      }

      console.log(`[POLARIS] Payment details:`, { targetAddress, amount: bill.amount, usdcAddress, paymentMode })

      // Execute on-chain payment (full amount for both modes)
      console.log(`[POLARIS] Authorizing ${paymentMode.toUpperCase()} Credit via MerchantRouter...`)
      const receipt = await payWithCredit(targetAddress, bill.amount.toString(), usdcAddress)
      const finalTxHash = receipt.hash
      console.log("[POLARIS] Credit Authorized:", finalTxHash)

      // Extract loan ID from receipt logs if available
      let loanId: number | undefined
      try {
        if (receipt.logs && receipt.logs.length > 0) {
          // LoanCreated event typically emits loanId as first indexed param
          for (const log of receipt.logs) {
            if (log.topics && log.topics.length > 1) {
              const parsed = parseInt(log.topics[1], 16)
              if (!isNaN(parsed)) {
                loanId = parsed
                break
              }
            }
          }
        }
      } catch (e) {
        console.warn("[POLARIS] Could not parse loan ID from receipt:", e)
      }

      // Backend sync - update bill status
      const res = await fetch("/api/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billHash: hash,
          txHash: finalTxHash,
          userAddress: address,
          paymentMode,
          loanId,
        }),
      })

      // Log to Transaction Ledger
      await syncTransaction({
        userAddress: address || "",
        type: "repay",
        title: `Checkout (${paymentMode.toUpperCase()}): Paid ${bill.merchant?.name}`,
        amount: bill.amount.toString(),
        asset: "USDC",
        txHash: finalTxHash,
        status: "SETTLED",
      })

      // For Split-in-3: create split plan record
      if (paymentMode === "split3") {
        const now = Math.floor(Date.now() / 1000)
        const schedule = generateSplitSchedule(now, billAmount)
        const splitInstallments = computeSplitInstallments(billAmount)

        // TODO: Wire to Convex createSplitPlan mutation once ConvexClientProvider is active
        // For now, store via API endpoint
        try {
          await fetch("/api/credit/split-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userAddress: address,
              loanId: loanId ?? 0,
              totalAmount: billAmount,
              installments: splitInstallments.map((amount, index) => ({
                index,
                amount,
                dueDate: schedule.dueDates[index],
                status: index === 0 ? "paid" : "upcoming",
                paidAt: index === 0 ? now : undefined,
                txHash: index === 0 ? finalTxHash : undefined,
              })),
              merchantAddress: targetAddress,
              billHash: hash,
            }),
          })
        } catch (e) {
          console.warn("[POLARIS] Split plan sync failed:", e)
        }

        setSplitSchedule(schedule)
      } else {
        // BNPL: compute schedule for confirmation display
        const now = Math.floor(Date.now() / 1000)
        setBnplSchedule(generateBNPLSchedule(now))
      }

      const result = await res.json()

      if (result.success) {
        setTxHash(finalTxHash)
        setCompletedLoanId(loanId)
        setSuccess(true)
        toast.success(`${paymentMode === "bnpl" ? "BNPL" : "Split-in-3"} Payment Finalized!`)

        sendPaymentResult({
          type: "POLARIS_PAYMENT_RESULT",
          success: true,
          loanId,
          amount: billAmount,
          paymentMode,
          txHash: finalTxHash,
        })
      } else {
        throw new Error(result.error || "Platform sync failed")
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Payment sequence failed")

      sendPaymentResult({
        type: "POLARIS_PAYMENT_RESULT",
        success: false,
        paymentMode,
        error: e.message,
      })
    } finally {
      setPaying(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // ── Loading state ──
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Initializing Secure Session...</p>
      </div>
    )
  }

  // ── Bill not found ──
  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center text-white">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black uppercase tracking-tighter">Bill Not Found</h1>
          <p className="text-[10px] text-white/40 uppercase">This payment link may be expired or invalid.</p>
        </div>
        <Link href="/" className="bg-white/5 px-6 py-2 rounded border border-white/10 text-[10px] font-bold uppercase hover:bg-white/10 transition-all">
          Return to Polaris
        </Link>
      </div>
    )
  }

  // ── Success: BNPL confirmation ──
  if (success && paymentMode === "bnpl") {
    return (
      <div className="max-w-md mx-auto mt-12 glass-card rounded-lg border border-primary/30 p-8 flex flex-col items-center text-center gap-6 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] text-white">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black uppercase tracking-tighter">BNPL_Settled</h1>
          <p className="text-[10px] text-white/40 uppercase">Buy Now Pay Later — payment authorized on Polaris Hub.</p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 p-4 rounded flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-white/40">Merchant</span>
            <span className="text-white font-black">{bill.merchant?.name}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-white/40">Amount</span>
            <span className="text-primary font-black">${bill.amount} {bill.asset}</span>
          </div>
          {completedLoanId !== undefined && (
            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
              <span className="text-white/40">Loan ID</span>
              <span className="text-white font-black">#{completedLoanId}</span>
            </div>
          )}
          {bnplSchedule.length > 0 && (
            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
              <span className="text-white/40">First Due Date</span>
              <span className="text-yellow-400 font-black">{formatDate(bnplSchedule[0])}</span>
            </div>
          )}
        </div>

        {/* BNPL repayment schedule */}
        {bnplSchedule.length > 0 && (
          <div className="w-full bg-white/5 border border-white/10 p-4 rounded flex flex-col gap-2">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Repayment Schedule</span>
            {bnplSchedule.map((date, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-white/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Due {i + 1}
                </span>
                <span className="text-white">{formatDate(date)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col w-full gap-2">
          <a
            href={`${NETWORKS.SEPOLIA.explorer}/tx/${txHash}`}
            target="_blank"
            className="w-full bg-primary py-3 rounded text-[10px] font-black uppercase text-black hover:opacity-90 transition-all text-center"
          >
            View Sepolia Explorer
          </a>
          {bill.metadata?.redirect_url ? (
            <a href={bill.metadata.redirect_url} className="w-full bg-white/5 border border-white/10 py-3 rounded text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all text-center">
              Return to Merchant
            </a>
          ) : (
            <button onClick={() => window.close()} className="w-full bg-white/5 border border-white/10 py-3 rounded text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
              Close Checkout
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Success: Split-in-3 confirmation ──
  if (success && paymentMode === "split3" && splitSchedule) {
    return (
      <div className="max-w-md mx-auto mt-12 glass-card rounded-lg border border-primary/30 p-8 flex flex-col items-center text-center gap-6 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] text-white">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Split_3_Settled</h1>
          <p className="text-[10px] text-white/40 uppercase">Split-in-3 — first installment paid, two remaining.</p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 p-4 rounded flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-white/40">Merchant</span>
            <span className="text-white font-black">{bill.merchant?.name}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-white/40">Total</span>
            <span className="text-primary font-black">${bill.amount} {bill.asset}</span>
          </div>
        </div>

        {/* Installment schedule */}
        <div className="w-full bg-white/5 border border-white/10 p-4 rounded flex flex-col gap-2">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Installment Schedule</span>
          {installments.map((amt, i) => (
            <div key={i} className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-white/60 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {i === 0 ? "Today (Paid)" : `Installment ${i + 1}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white">${amt.toFixed(2)}</span>
                <span className="text-white/40">{formatDate(splitSchedule.dueDates[i])}</span>
                {i === 0 && <CheckCircle2 className="w-3 h-3 text-primary" />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col w-full gap-2">
          <a
            href={`${NETWORKS.SEPOLIA.explorer}/tx/${txHash}`}
            target="_blank"
            className="w-full bg-primary py-3 rounded text-[10px] font-black uppercase text-black hover:opacity-90 transition-all text-center"
          >
            View Sepolia Explorer
          </a>
          {bill.metadata?.redirect_url ? (
            <a href={bill.metadata.redirect_url} className="w-full bg-white/5 border border-white/10 py-3 rounded text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all text-center">
              Return to Merchant
            </a>
          ) : (
            <button onClick={() => window.close()} className="w-full bg-white/5 border border-white/10 py-3 rounded text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
              Close Checkout
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Main checkout view ──
  return (
    <div className="max-w-md mx-auto mt-12 flex flex-col gap-8 text-white">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-all">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-lg font-black uppercase tracking-tighter">Confirm_Payment</h1>
      </div>

      <div className="glass-card rounded-lg border border-white/10 overflow-hidden shadow-2xl">
        {/* Merchant + amount header */}
        <div className="bg-white/5 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary italic uppercase">
              {bill.merchant?.name?.[0] || "M"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight">{bill.merchant?.name}</span>
              <span className="text-[9px] text-white/40 uppercase font-bold">{bill.merchant?.category}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-black text-white">${bill.amount}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase">{bill.asset}</span>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Description */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest italic">Description</span>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              {bill.description || "Payment for digital assets via Polaris Protocol."}
            </p>
          </div>

          {/* Available credit display */}
          <div className="bg-primary/5 border border-primary/20 rounded p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white uppercase tracking-wide">Pay_Later_With_Polaris</span>
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Available Credit: ${creditLimit}</span>
              </div>
            </div>
            <Zap className="w-4 h-4 text-primary animate-pulse" />
          </div>

          {/* Payment mode selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Payment Mode</span>
            <div className="grid grid-cols-2 gap-3">
              {/* BNPL option */}
              <button
                onClick={() => setPaymentMode("bnpl")}
                disabled={!bnplEnabled}
                className={`relative p-4 rounded border transition-all flex flex-col items-center gap-2 ${
                  !bnplEnabled
                    ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                    : paymentMode === "bnpl"
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <CreditCard className={`w-5 h-5 ${paymentMode === "bnpl" ? "text-primary" : "text-white/60"}`} />
                <span className="text-[10px] font-black uppercase tracking-wide">BNPL</span>
                <span className="text-[9px] text-white/40 font-bold">${billAmount.toFixed(2)}</span>
                {!bnplEnabled && (
                  <span className="text-[8px] text-red-400 font-bold uppercase">Insufficient Credit</span>
                )}
              </button>

              {/* Split-in-3 option */}
              <button
                onClick={() => setPaymentMode("split3")}
                disabled={!split3Enabled}
                className={`relative p-4 rounded border transition-all flex flex-col items-center gap-2 ${
                  !split3Enabled
                    ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                    : paymentMode === "split3"
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <SplitSquareHorizontal className={`w-5 h-5 ${paymentMode === "split3" ? "text-primary" : "text-white/60"}`} />
                <span className="text-[10px] font-black uppercase tracking-wide">Split-in-3</span>
                <span className="text-[9px] text-white/40 font-bold">3 × ${installments[0].toFixed(2)}</span>
                {!split3Enabled && (
                  <span className="text-[8px] text-red-400 font-bold uppercase">Insufficient Credit</span>
                )}
              </button>
            </div>
          </div>

          {/* Mode-specific details */}
          {paymentMode === "bnpl" && bnplEnabled && (
            <div className="bg-white/5 border border-white/10 rounded p-4 flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">BNPL Details</span>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60">Full Amount</span>
                <span className="text-white">${billAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60">Repayment</span>
                <span className="text-white">4 installments over 56 days</span>
              </div>
            </div>
          )}

          {paymentMode === "split3" && split3Enabled && (
            <div className="bg-white/5 border border-white/10 rounded p-4 flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Split-in-3 Details</span>
              {installments.map((amt, i) => (
                <div key={i} className="flex justify-between text-[10px] font-bold">
                  <span className="text-white/60">
                    {i === 0 ? "Due Today" : i === 1 ? "Due in 30 days" : "Due in 60 days"}
                  </span>
                  <span className="text-white">${amt.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 mt-1 flex justify-between text-[10px] font-bold">
                <span className="text-white/40">Total</span>
                <span className="text-primary">${billAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Pay button */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePayment}
                disabled={paying || bill.status === "paid" || !authenticated || (paymentMode === "bnpl" && !bnplEnabled) || (paymentMode === "split3" && !split3Enabled)}
                className={`w-full py-4 rounded font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  paying || bill.status === "paid" || !authenticated || (paymentMode === "bnpl" && !bnplEnabled) || (paymentMode === "split3" && !split3Enabled)
                    ? "bg-zinc-800 text-white/20 cursor-not-allowed"
                    : "bg-primary text-black hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]"
                }`}
              >
                {paying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {paying
                  ? "Authorizing..."
                  : !authenticated
                    ? "Wallet_Needs_Link"
                    : bill.status === "paid"
                      ? "Already_Settled"
                      : paymentMode === "bnpl"
                        ? "Pay_BNPL"
                        : "Pay_Split_3"}
              </button>
              <p className="text-[8px] text-center text-white/20 uppercase font-bold tracking-[0.1em] leading-relaxed">
                {paymentMode === "bnpl"
                  ? `By clicking above, you authorize Polaris Protocol to reserve $${billAmount.toFixed(2)} from your credit limit for immediate settlement.`
                  : `By clicking above, you authorize Polaris Protocol to deduct $${installments[0].toFixed(2)} now and schedule two more installments.`}
              </p>
            </div>
            <p className="text-[9px] text-center text-white/20 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
              Secured by Polaris ZK-Verification
            </p>
          </div>
        </div>
      </div>

      {bill.status === "paid" && !success && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest leading-loose">
            This bill was already settled. Reference: {bill.tx_hash?.slice(0, 12)}...
          </span>
        </div>
      )}
    </div>
  )
}
