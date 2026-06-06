/**
 * Utility functions for syncing frontend transaction results with the protocol backend (MongoDB).
 */

export async function syncTransaction(payload: {
    userAddress: string;
    type: "borrow" | "deposit" | "repay" | "supply" | "liquidation" | "swap";
    title: string;
    amount: string;
    asset: string;
    txHash: string;
    status?: string;
}) {
    try {
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Backend sync failed");
        return await res.json();
    } catch (err) {
        console.error("Sync Transaction Error:", err);
        return null;
    }
}

export async function syncPosition(payload: {
    walletAddress: string;
    type: "SUPPLY" | "BORROW";
    symbol: string;
    entryAmount: number;
    txHash: string;
}) {
    try {
        const res = await fetch("/api/positions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Backend sync failed");
        return await res.json();
    } catch (err) {
        console.error("Sync Position Error:", err);
        return null;
    }
}
