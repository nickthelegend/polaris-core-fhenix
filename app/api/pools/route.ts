import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const pools = await db.collection("pools").find({}).toArray();
    return NextResponse.json(pools);
  } catch (err) {
    console.error("[GET /api/pools] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
