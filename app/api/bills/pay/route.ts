import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const MERCHANT_APP_URL = process.env.MERCHANT_APP_URL || "http://localhost:3002";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { billHash, txHash, userAddress, paymentMode, loanId } = body;

  if (!billHash) {
    return NextResponse.json({ error: "Missing billHash" }, { status: 400 });
  }

  try {
    const db = await getDb();

    // 1. Try updating in local polaris-core DB
    const localResult = await db.collection("bills").updateOne(
      { hash: billHash },
      {
        $set: {
          status: "paid",
          payment_mode: paymentMode || "bnpl",
          loan_id: loanId,
          tx_hash: txHash,
          paid_at: new Date(),
          paid_by: userAddress,
        },
      }
    );

    // 2. Also sync to merchant app
    try {
      await fetch(`${MERCHANT_APP_URL}/api/bills/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billHash, txHash, userAddress, paymentMode, loanId }),
      });
    } catch (e) {
      console.warn("[BILLS] Merchant app sync failed (non-critical):", e);
    }

    return NextResponse.json({
      success: true,
      updated: localResult.modifiedCount > 0,
    });
  } catch (e: any) {
    console.error("Bill Pay Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
