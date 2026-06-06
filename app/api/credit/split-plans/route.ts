import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const userAddress = req.nextUrl.searchParams.get("userAddress");
  if (!userAddress) return NextResponse.json({ plans: [] });

  const db = await getDb();
  const plans = await db
    .collection("splitPlans")
    .find({ userAddress: userAddress.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();

  const doc = {
    ...body,
    userAddress: (body.userAddress || "").toLowerCase(),
    createdAt: body.createdAt || Date.now(),
  };

  const result = await db.collection("splitPlans").insertOne(doc);
  return NextResponse.json({ id: result.insertedId });
}
