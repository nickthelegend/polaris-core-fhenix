const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("🚀 Syncing Real On-Chain TVL to Supabase...");

    // 1. Load Spoke Deployments for chain mapping
    let allDeployments = {};
    const spokePath = path.join(__dirname, '../../obolus-protocol/spoke_deployments.json');
    const extraPath = path.join(__dirname, '../../obolus-protocol/extra_tokens_sepolia.json');

    if (fs.existsSync(spokePath)) {
        allDeployments = JSON.parse(fs.readFileSync(spokePath));
    }

    // 2. Load Sepolia specifically (from legacy file if needed)
    let sepoliaTokens = {};
    if (fs.existsSync(extraPath)) {
        const extra = JSON.parse(fs.readFileSync(extraPath));
        sepoliaTokens = extra.tokens;
    }

    // 3. Prepare Pool Data from On-Chain (Simplified: using addresses to prove they are real)
    // In a full production sync, we would call ethers.contract.getPoolLiquidity() here.
    // For now, we update the DB entries with the real addresses we just deployed.

    console.log("  🔗 Processing Sepolia Spokes...");
    for (const [symbol, address] of Object.entries(sepoliaTokens)) {
        await upsertPool({
            name: `${symbol}_VAULT`,
            token_address: address,
            chain_id: 11155111,
            network_name: 'Sepolia'
        });
    }

    console.log("  🔗 Processing Multichain Spokes...");
    for (const [netKey, data] of Object.entries(allDeployments)) {
        for (const [symbol, address] of Object.entries(data.tokens)) {
            // Suffix with network to differentiate on dashboard if needed
            const networkLabel = netKey.toUpperCase();
            await upsertPool({
                name: `${symbol}_${networkLabel}`,
                token_address: address,
                chain_id: data.chainId,
                network_name: netKey
            });
        }
    }

    console.log("\n✨ On-chain data sync complete.");
}

async function upsertPool(poolData) {
    const { data: existing, error: fetchError } = await supabase
        .from('pools')
        .select('id')
        .eq('name', poolData.name)
        .eq('chain_id', poolData.chain_id)
        .single();

    let result;
    const finalData = {
        ...poolData,
        updated_at: new Date().toISOString()
    };

    if (existing) {
        result = await supabase
            .from('pools')
            .update(finalData)
            .eq('id', existing.id);
    } else {
        result = await supabase
            .from('pools')
            .insert(finalData);
    }

    if (result.error) {
        console.error(`  ❌ Error syncing ${poolData.name}:`, result.error.message);
    } else {
        console.log(`  ✅ Synced ${poolData.name} (${poolData.token_address.slice(0, 8)}...)`);
    }
}

main().catch(console.error);
