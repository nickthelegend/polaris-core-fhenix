import { NextResponse } from "next/server"
import type { VerificationProof, VerificationProvider } from "@/lib/reclaim-types"
import { addVerification } from "@/lib/verification-store"

// Reward amounts in ALGO for each provider
const ALGO_REWARDS = {
  github: 10,
  gmail: 50,
  linkedin: 50,
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const proofs = body.proofs as VerificationProof[]

    if (!proofs || !Array.isArray(proofs) || proofs.length === 0) {
      return NextResponse.json({ error: "No proofs provided" }, { status: 400 })
    }

    // Extract provider from proof
    const providerData = proofs[0].claimData.provider.toLowerCase()
    let provider: VerificationProvider

    // Map provider string to our provider type
    if (providerData.includes("github")) {
      provider = "github"
    } else if (providerData.includes("gmail") || providerData.includes("google")) {
      provider = "gmail"
    } else if (providerData.includes("linkedin")) {
      provider = "linkedin"
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    const algoReward = ALGO_REWARDS[provider] || 0

    // In production, get wallet address from authenticated session
    const walletAddress = req.headers.get("x-wallet-address") || "mock-wallet-address"

    console.log("[v0] Proof verified successfully:", {
      provider,
      algoReward,
      proofCount: proofs.length,
      walletAddress,
    })

    // Store verification and update limits
    const userData = addVerification(walletAddress, provider, algoReward)

    // In a real implementation, you would also:
    // 1. Verify the proof signatures using Reclaim SDK
    // 2. Store the verification in your database
    // 3. Transfer ALGO rewards to the user's wallet via smart contract

    return NextResponse.json({
      success: true,
      provider,
      algoReward,
      message: `Verification successful! You've earned ${algoReward} ALGO`,
      userData: {
        totalAlgoEarned: userData.totalAlgoEarned,
        limitIncrease: userData.limitIncrease,
        verifiedProviders: Array.from(userData.verifiedProviders),
      },
    })
  } catch (error) {
    console.error("[v0] Error verifying proof:", error)
    return NextResponse.json({ error: "Failed to verify proof" }, { status: 500 })
  }
}
