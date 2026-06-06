import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const merchants = await db.collection("merchants").find({}).toArray();
    return NextResponse.json(merchants);
  } catch {
    return NextResponse.json([]);
  }
}
