const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load Environment Variables (Simulated for this script)
// In production, use dotenv
const SEPOLIA_RPC = "https://rpc.sepolia.org"; // Or use your specific RPC
const API_URL = "http://localhost:3000/api/proof"; // Local PayEase instance
const POLLING_INTERVAL = 15000; // 15 seconds

// Contracts from deployments (Assuming updated structure)
// You might need to adjust paths based on where you run this script from
const DEPLOYMENTS_PATH = path.join(__dirname, "../lib/contracts.ts");

// Minimal ABI for LiquidityVault Event
const VAULT_ABI = [
    "event LiquidityDeposited(address indexed lender, address indexed token, uint256 amount, uint256 depositId)"
];

// Address of Sepolia Vault (Hardcoded or read from config)
const VAULT_ADDRESS = "0x8C213a3Db9187966Ebf8DfD0488A225044265AeF";

async function main() {
    console.log("🚀 Starting Auto-Sync Worker for Obolus Protocol...");
    console.log(`📡 Monitoring Vault: ${VAULT_ADDRESS} on Sepolia`);

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    // Listen for events
    // filter: lender, token, amount, depositId
    vault.on("LiquidityDeposited", async (lender, token, amount, depositId, event) => {
        console.log(`\n🔔 New Deposit Detected!`);
        console.log(`   User: ${lender}`);
        console.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDC/USDT`);
        console.log(`   Tx Hash: ${event.log.transactionHash}`);

        try {
            console.log("   ⏳ Requesting Proof Generation...");

            // Call the local API to generate and sync
            // In a real worker, this might call the Prover directly + Contract Write
            // Here we simulate the "Relayer" via our API
            const response = await fetch(`${API_URL}?txHash=${event.log.transactionHash}&chainKey=1`);
            const data = await response.json();

            if (data.merkleRoot) {
                console.log("   ✅ Proof Generated!");
                console.log("   📤 Submitting to Master Chain (via API/Frontend logic)...");
                // Note: The API route currently returns the proof. 
                // A full worker would verify it on-chain here using a Signer.
                // For this step, logging the success proves the "Listening" part works.
            } else {
                console.error("   ❌ Proof Generation Failed:", data.error);
            }
        } catch (err) {
            console.error("   ⚠️ Error processing deposit:", err.message);
        }
    });

    console.log("✅ Worker is running. Waiting for events...");

    // Keep alive
    setInterval(() => {
        process.stdout.write(".");
    }, 5000);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
