import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { generateProofFor } from "@/lib/gluwa-prover";
import { NETWORKS } from "@/lib/contracts";
import { getDb } from "@/lib/mongodb";

const PROVER_API_URL = "https://proof-gen-api.sepolia.etherscan.io";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, chainKey, userAddress, amount, tokenAddress, hubTxHash, status, asset } = body;

    if (!txHash) return NextResponse.json({ error: "Missing txHash" }, { status: 400 });

    const db = await getDb();

    if (hubTxHash) {
      await db.collection("deposits").updateOne(
        { txHash },
        { $set: { hubTxHash, status: status || "Synced" } }
      );
      return NextResponse.json({ success: true, message: "Hub hash updated" });
    }

    await db.collection("deposits").updateOne(
      { txHash },
      {
        $setOnInsert: {
          txHash,
          chainKey: Number(chainKey) || 1,
          userAddress,
          amount: parseFloat(amount),
          tokenAddress,
          asset,
          createdAt: new Date(),
        },
        $set: { status: "PENDING" },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Deposit queued" });
  } catch (e: any) {
    console.error("DB Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const txHash = searchParams.get("txHash");
  const chainKeyParam = searchParams.get("chainKey");

  if (!txHash) {
    return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
  }

  let chainKey = chainKeyParam ? parseInt(chainKeyParam, 10) : 1;
  if (chainKey === 11155111) chainKey = 1;

  if (chainKey === 1337) {
    return NextResponse.json({
      chainKey,
      headerNumber: 1,
      merkleProof: { root: "0x" + "0".repeat(64), siblings: [] },
      continuityProof: { lowerEndpointDigest: "0x" + "0".repeat(64), roots: ["0x" + "0".repeat(64)] },
      txBytes: "0x",
    });
  }

  try {
    const db = await getDb();
    const existing = await db.collection("deposits").findOne({ txHash });

    if (existing?.proof) {
      return NextResponse.json(existing.proof);
    }

    const sepoliaProvider = new ethers.JsonRpcProvider(NETWORKS.SEPOLIA.rpc);
    const sourceProvider = new ethers.JsonRpcProvider(NETWORKS.SEPOLIA.rpc);

    const proof = await generateProofFor(txHash, chainKey, PROVER_API_URL, sepoliaProvider, sourceProvider);

    await db.collection("deposits").updateOne(
      { txHash },
      { $set: { status: "ProofGenerated", proof } }
    );

    return NextResponse.json(proof);
  } catch (error: any) {
    console.error("[PROOF-API] Error:", error.message);

    if (error.message.includes("BLOCK_NOT_ATTESTED")) {
      const db = await getDb();
      await db.collection("deposits").updateOne({ txHash }, { $set: { status: "WaitingAttestation" } });
      return NextResponse.json({ status: "WAITING_ATTESTATION", message: "Block is being verified on Sepolia." });
    }

    return NextResponse.json({ error: error.message, status: "FAILED" }, { status: 500 });
  }
}
