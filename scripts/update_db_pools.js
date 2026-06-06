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
    console.log("🚀 Updating Supabase Pools Database Directly...");

    // 1. Existing Tokens
    const EXISTING_POOLS = [
        { name: "USDC_VAULT", apr: 10.5 },
        { name: "USDT_VAULT", apr: 14.5 }
    ];

    // 2. Extra Tokens (Load from file if exists)
    let extraTokens = {};
    const protocolPath = path.join(__dirname, '../../obolus-protocol/extra_tokens_sepolia.json');
    if (fs.existsSync(protocolPath)) {
        const data = JSON.parse(fs.readFileSync(protocolPath));
        extraTokens = data.tokens;
    } else {
        console.warn("⚠️ extra_tokens_sepolia.json not found.");
    }

    const EXTRA_POOLS = Object.keys(extraTokens).map(symbol => ({
        name: `${symbol}_VAULT`,
        apr: 12.0 // Default APR
    }));

    const ALL_POOLS = [...EXISTING_POOLS, ...EXTRA_POOLS];

    for (const pool of ALL_POOLS) {
        console.log(`  Processing ${pool.name}...`);

        // Check if exists
        const { data: existing, error: fetchError } = await supabase
            .from('pools')
            .select('id')
            .eq('name', pool.name)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error(`  ❌ Error fetching ${pool.name}:`, fetchError.message);
            continue;
        }

        const poolData = {
            ...pool,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            console.log(`    Updating ${pool.name}...`);
            result = await supabase
                .from('pools')
                .update(poolData)
                .eq('id', existing.id);
        } else {
            console.log(`    Inserting ${pool.name}...`);
            result = await supabase
                .from('pools')
                .insert(poolData);
        }

        if (result.error) {
            console.error(`  ❌ Error updating ${pool.name}:`, result.error.message);
        } else {
            console.log(`  ✅ ${pool.name} success.`);
        }
    }

    console.log("\n✨ Database update complete.");
}

main().catch(console.error);
