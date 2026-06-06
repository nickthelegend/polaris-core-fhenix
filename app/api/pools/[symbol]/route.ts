import { NextResponse } from "next/server";
import { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function getPoolBySymbol(db: Db, symbol: string) {
  return db.collection("pools").findOne({ symbol: symbol.toUpperCase() });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const db = await getDb();
    const pool = await getPoolBySymbol(db, symbol);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }
    return NextResponse.json(pool);
  } catch (err) {
    console.error("[GET /api/pools/[symbol]] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
