import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACTS, NETWORKS, ABIS } from '@/lib/contracts';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address, token, network = 'SEPOLIA', amount = '1000' } = body;

        if (!address || !token) {
            return NextResponse.json({ error: 'Missing address or token' }, { status: 400 });
        }

        const privKey = process.env.FAUCET_PRIVATE_KEY;
        if (!privKey) {
            return NextResponse.json({ error: 'Faucet not configured (Missing PK)' }, { status: 500 });
        }

        // 1. Get Network Config
        const net = (NETWORKS as any)[network];
        if (!net) {
            return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
        }

        // 2. Get Token Config
        const spoke = (CONTRACTS.SPOKES as any)[network];
        if (!spoke) {
            return NextResponse.json({ error: 'Source network not configured' }, { status: 400 });
        }

        const tokenAddress = spoke[token];
        if (!tokenAddress) {
            return NextResponse.json({ error: `Token ${token} not found on ${network}` }, { status: 404 });
        }

        // 3. Initialize Provider & Signer
        const provider = new ethers.JsonRpcProvider(net.rpc);
        const wallet = new ethers.Wallet(privKey, provider);

        // 4. Get Decimals
        const tokenContract = new ethers.Contract(tokenAddress, ABIS.MockERC20, wallet);
        let decimals = 18;
        try {
            decimals = await tokenContract.decimals();
        } catch (e) {
            console.warn(`Could not fetch decimals for ${token}, defaulting to 18`);
        }

        // 5. Mint
        console.log(`[FAUCET] Minting ${amount} ${token} to ${address} on ${network}...`);
        const amountWei = ethers.parseUnits(amount, decimals);

        // Check balance of faucet wallet for gas? 
        // We assume it has gas since it's the deployer.

        const tx = await tokenContract.mint(address, amountWei);
        console.log(`[FAUCET] Tx sent: ${tx.hash}`);

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            message: `Successfully minted ${amount} ${token} to ${address}`
        });

    } catch (error: any) {
        console.error('[FAUCET_ERROR]', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
