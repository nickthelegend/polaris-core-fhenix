import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const stats = await db.collection("globalStats").findOne({});
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[GET /api/global-stats] DB error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
