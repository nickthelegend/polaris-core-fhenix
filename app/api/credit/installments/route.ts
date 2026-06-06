import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { planId, installmentIndex, status, paidAt, txHash } = body;

  const db = await getDb();
  const result = await db.collection("splitPlans").updateOne(
    { _id: new ObjectId(planId) },
    {
      $set: {
        [`installments.${installmentIndex}.status`]: status,
        [`installments.${installmentIndex}.paidAt`]: paidAt || Date.now(),
        [`installments.${installmentIndex}.txHash`]: txHash || "",
      },
    }
  );

  return NextResponse.json({ modified: result.modifiedCount });
}
