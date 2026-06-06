import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserVerifications } from "@/lib/verification-store";

export async function GET(req: Request) {
  const walletAddress = req.headers.get("x-wallet-address") || "mock-wallet-address";
  const userData = getUserVerifications(walletAddress);

  try {
    const db = await getDb();
    const limitData = await db.collection("limits").findOne({ userAddress: walletAddress, asset: "USDC" });

    const baseLimit = limitData?.currentLimit ?? 250.0;
    const used = limitData?.used ?? 48.5;
    const additionalLimit = userData.limitIncrease;

    return NextResponse.json({
      currentLimit: Number(baseLimit) + additionalLimit,
      used: Number(used),
      available: (Number(baseLimit) + additionalLimit) - Number(used),
      creditScore: 612 + userData.verifiedProviders.size * 10,
      lastUpdated: new Date().toISOString(),
      verifications: {
        totalAlgoEarned: userData.totalAlgoEarned,
        verifiedProviders: Array.from(userData.verifiedProviders),
        limitIncrease: userData.limitIncrease,
      },
    });
  } catch (e: any) {
    console.error("Limits Error:", e);
    return NextResponse.json({ error: "Failed to fetch limits" }, { status: 500 });
  }
}
