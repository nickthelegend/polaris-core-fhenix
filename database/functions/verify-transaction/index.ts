
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

console.info('Verify Transaction Function Started');

Deno.serve(async (req: Request) => {
    // 1. Get pending transactions
    const { data: pendingTxs, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending');

    if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    const results = [];

    // 2. Mock verification process (In real world, query blockchain/relayer)
    for (const tx of pendingTxs) {
        // Logic to check transaction status
        // For demo, we'll verify if it's older than 1 minute (simulation of 16 min process speeding up)
        const txTime = new Date(tx.created_at).getTime();
        const now = Date.now();
        const diffMins = (now - txTime) / 1000 / 60;

        let newStatus = 'pending';
        if (diffMins > 0.5) { // Verify quickly for demo
            newStatus = 'verified';
        }

        if (newStatus !== 'pending') {
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: newStatus })
                .eq('id', tx.id);

            if (!updateError) {
                results.push({ id: tx.id, status: newStatus });
            }
        }
    }

    return new Response(
        JSON.stringify({
            message: `Processed ${pendingTxs.length} transactions`,
            updated: results
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
