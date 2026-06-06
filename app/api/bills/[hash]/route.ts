import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const MERCHANT_APP_URL = process.env.MERCHANT_APP_URL || "http://localhost:3002";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  if (!hash) {
    return NextResponse.json({ error: "Missing hash" }, { status: 400 });
  }

  try {
    // 1. Check local polaris-core DB first
    const db = await getDb();
    const bill = await db.collection("bills").findOne({ hash });

    if (bill) {
      const app = bill.appId ? await db.collection("apps").findOne({ _id: bill.appId }) : null;
      return NextResponse.json({
        ...bill,
        merchant: app ? {
          name: app.name,
          category: app.category || "General",
          escrow_contract: app.escrow_contract,
          user: { wallet_address: app.wallet_address || "" },
        } : null,
      });
    }

    // 2. Fallback: fetch from merchant app's API
    const merchantRes = await fetch(`${MERCHANT_APP_URL}/api/bills/${hash}`);
    if (merchantRes.ok) {
      const merchantBill = await merchantRes.json();
      if (merchantBill && !merchantBill.error) {
        return NextResponse.json(merchantBill);
      }
    }

    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  } catch (e: any) {
    console.error("Bill Lookup Error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
