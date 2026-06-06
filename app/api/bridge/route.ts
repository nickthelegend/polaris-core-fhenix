import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const userAddress = req.nextUrl.searchParams.get("userAddress");
  if (!userAddress) return NextResponse.json([]);

  try {
    const db = await getDb();
    const deposits = await db.collection("deposits").find({ userAddress }).toArray();

    const mapStatus = (status: string) => {
      if (status === "Synced" || status === "COMPLETED") return "COMPLETED";
      if (status === "ProofGenerated" || status === "VERIFIED") return "VERIFIED";
      if (status === "WaitingAttestation") return "WAITING_ATTESTATION";
      return "BUILDING_PROOF";
    };

    return NextResponse.json(deposits.map((d) => ({
      id: d._id.toString(),
      user_address: d.userAddress,
      token_address: d.tokenAddress || "0x...",
      amount: d.amount?.toString() ?? "0",
      source_tx_hash: d.txHash,
      hub_tx_hash: d.hubTxHash,
      usc_query_id: "",
      status: mapStatus(d.status),
      created_at: d.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (e) {
    return NextResponse.json([]);
  }
}
