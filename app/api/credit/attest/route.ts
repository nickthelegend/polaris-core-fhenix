import { NextResponse } from "next/server";
import { ethers } from "ethers";
const MORPHO_GRAPHQL_URL = "https://blue-api.morpho.org/graphql";

const GET_USER_MORPHO_QUERY = `
  query GetUserMorpho($address: String!) {
    userByAddress(address: $address) {
      address
      sumVaultSharesUsd
      sumBorrowAssetsUsd
      sumSupplyAssetsUsd
    }
  }
`;

// In production, this should be in an environment variable
// DO NOT USE THIS KEY IN PRODUCTION
const ATTESTER_PRIVATE_KEY = process.env.ATTESTER_PRIVATE_KEY || "0xdb8cfa2db2a866e6fea3d4388da2278f8ef7367180d5921b96661d946b244c86";

export async function POST(req: Request) {
    try {
        const { walletAddress, nonce } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
        }

        console.log(`[ATTESTER] Attesting credit profile for ${walletAddress}`);

        // 1. Fetch from Morpho Blue
        let morphoCollateral = 0;
        let morphoDebt = 0;

        try {
            const morphoRes = await fetch(MORPHO_GRAPHQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: GET_USER_MORPHO_QUERY,
                    variables: { address: walletAddress },
                }),
            });
            const result = await morphoRes.json();
            const data = result.data?.userByAddress;
            if (data) {
                morphoCollateral = parseFloat(data.sumSupplyAssetsUsd) || 0;
                morphoDebt = parseFloat(data.sumBorrowAssetsUsd) || 0;
            }
        } catch (e) {
            console.warn("Failed to fetch Morpho data", e);
        }

        // 2. Fetch from Aave (Mocked for now, in prod use Subgraphs)
        const aaveCollateral = 1200.50; // Mocked
        const aaveDebt = 300.00; // Mocked

        // 3. Fetch from Compound (Mocked for now)
        const compoundCollateral = 500.25; // Mocked
        const compoundDebt = 0; // Mocked

        // Aggregate
        const totalCollateral = morphoCollateral + aaveCollateral + compoundCollateral;
        const totalDebt = morphoDebt + aaveDebt + compoundDebt;

        // Scale to 18 decimals for Solidity
        const collateralBN = ethers.parseUnits(totalCollateral.toFixed(6), 18);
        const debtBN = ethers.parseUnits(totalDebt.toFixed(6), 18);
        const timestamp = Math.floor(Date.now() / 1000);

        // 4. Sign the payload
        const wallet = new ethers.Wallet(ATTESTER_PRIVATE_KEY);

        // Payload should match CreditOracle.sol updateProfile
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "uint256", "uint256", "uint256"],
            [walletAddress, collateralBN, debtBN, timestamp, nonce || 0]
        );

        const signature = await wallet.signMessage(ethers.toBeArray(messageHash));

        return NextResponse.json({
            walletAddress,
            collateral: collateralBN.toString(),
            debt: debtBN.toString(),
            timestamp,
            signature,
            details: {
                morpho: { collateral: morphoCollateral, debt: morphoDebt },
                aave: { collateral: aaveCollateral, debt: aaveDebt },
                compound: { collateral: compoundCollateral, debt: compoundDebt },
                netGlobalValue: totalCollateral - totalDebt
            }
        });

    } catch (error: any) {
        console.error("Attestation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
