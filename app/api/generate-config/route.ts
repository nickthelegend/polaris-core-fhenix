import { NextResponse } from "next/server"
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk"

// Provider IDs for different verification types
// These should be obtained from Reclaim Protocol dashboard
const PROVIDER_IDS = {
  github: process.env.RECLAIM_GITHUB_PROVIDER_ID || "github-provider-id",
  gmail: process.env.RECLAIM_GMAIL_PROVIDER_ID || "gmail-provider-id",
  linkedin: process.env.RECLAIM_LINKEDIN_PROVIDER_ID || "linkedin-provider-id",
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { provider } = body as { provider: "github" | "gmail" | "linkedin" }

    if (!provider || !PROVIDER_IDS[provider]) {
      return NextResponse.json({ error: "Invalid provider specified" }, { status: 400 })
    }

    const APP_ID = process.env.RECLAIM_APP_ID || "your-app-id"
    const APP_SECRET = process.env.RECLAIM_APP_SECRET || "your-app-secret"
    const PROVIDER_ID = PROVIDER_IDS[provider]

    // Initialize Reclaim Proof Request
    const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID)

    // Set callback URL for proof verification
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/verify-proof`
    reclaimProofRequest.setAppCallbackUrl(callbackUrl)

    // Generate the configuration
    const reclaimProofRequestConfig = reclaimProofRequest.toJsonString()

    return NextResponse.json({
      reclaimProofRequestConfig,
      provider,
    })
  } catch (error) {
    console.error("[v0] Error generating Reclaim config:", error)
    return NextResponse.json({ error: "Failed to generate verification config" }, { status: 500 })
  }
}
