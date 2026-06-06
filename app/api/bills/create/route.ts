import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  const clientId = req.headers.get("x-client-id");
  const clientSecret = req.headers.get("x-client-secret");

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing Client Auth Headers (x-client-id, x-client-secret)" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { amount, description, metadata, asset = "USDC" } = body;

  if (!amount) {
    return NextResponse.json({ error: "Amount is required" }, { status: 400 });
  }

  const db = await getDb();
  const app = await db.collection("apps").findOne({ clientId, clientSecret });

  if (!app) {
    return NextResponse.json({ error: "Invalid API Credentials" }, { status: 403 });
  }

  const billHash = crypto.randomBytes(20).toString("hex");

  const result = await db.collection("bills").insertOne({
    appId: app._id,
    amount: parseFloat(amount),
    asset,
    description,
    metadata: metadata || {},
    hash: billHash,
    status: "pending",
    createdAt: new Date(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    billId: result.insertedId,
    billHash,
    checkoutUrl: `${baseUrl}/pay/${billHash}`,
    merchantName: app.name,
    status: "pending",
  });
}
