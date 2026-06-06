import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const userAddress = req.nextUrl.searchParams.get("userAddress");
  if (!userAddress) return NextResponse.json({ records: [] });

  const db = await getDb();
  const records = await db
    .collection("repaymentHistory")
    .find({ userAddress: userAddress.toLowerCase() })
    .sort({ timestamp: -1 })
    .toArray();

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();

  const doc = {
    userAddress: (body.userAddress || "").toLowerCase(),
    loanId: body.loanId,
    amount: body.amount,
    txHash: body.txHash,
    loanType: body.loanType || "bnpl",
    timestamp: body.timestamp || Date.now(),
  };

  const result = await db.collection("repaymentHistory").insertOne(doc);
  return NextResponse.json({ id: result.insertedId });
}
