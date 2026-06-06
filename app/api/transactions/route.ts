import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet address required" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const transactions = await db
      .collection("transactions")
      .find({ userAddress: wallet.toLowerCase() })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    return NextResponse.json(transactions);
  } catch (err) {
    console.error("[GET /api/transactions] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, type, title, amount, asset, txHash, status } = body;

    const db = await getDb();
    await db.collection("transactions").insertOne({
      userAddress: userAddress.toLowerCase(),
      type,
      title,
      amount,
      asset,
      txHash,
      status: status || "VERIFIED",
      timestamp: Date.now(),
      createdAt: new Date(),
    });
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/transactions] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
