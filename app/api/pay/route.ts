import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount ?? 0);
  const note = String(body?.note ?? "Execute Payment");
  const userAddress = String(body?.userAddress ?? "0x...");

  const txId = `0x${Math.random().toString(16).slice(2, 42)}`;
  const explorerUrl = `https://sepolia.etherscan.io/tx/${txId}`;

  try {
    const db = await getDb();
    await db.collection("transactions").insertOne({
      userAddress,
      title: note,
      amount,
      asset: "USDC",
      category: "spend",
      status: "verified",
      txHash: txId,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("Failed to log transaction", e);
  }

  return NextResponse.json({ txId, explorerUrl });
}
