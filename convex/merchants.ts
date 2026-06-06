import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all liquidity pools.
 */
export const listPools = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("pools").collect();
    },
});

/**
 * Sync or Create a Merchant User by their wallet address (via Privy).
 */
export const syncUser = mutation({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (existing) return existing._id;

        const userId = await ctx.db.insert("users", {
            walletAddress: args.walletAddress,
        });

        return userId;
    },
});

export const getUserByWallet = query({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();
    },
});

/**
 * List all verified merchants (public data).
 */
export const listMerchants = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("merchants").collect();
    },
});

/**
 * List all transactions for a user.
 */
export const listTransactions = query({
    args: { userAddress: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userAddress) return [];
        return await ctx.db
            .query("transactions")
            .withIndex("by_user_address", (q) => q.eq("userAddress", args.userAddress as string))
            .collect();
    },
});

export const listDeposits = query({
    args: { userAddress: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userAddress) return [];
        return await ctx.db
            .query("deposits")
            .withIndex("by_user", (q) => q.eq("userAddress", args.userAddress as string))
            .collect();
    },
});

export const listBridges = query({
    args: { userAddress: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userAddress) return [];
        return await ctx.db
            .query("bridgeTransactions")
            .collect();
    },
});

export const listBills = query({
    args: { userAddress: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userAddress) return [];
        return await ctx.db
            .query("transactions")
            .withIndex("by_user_address", (q) => q.eq("userAddress", args.userAddress as string))
            .filter((q) => q.eq(q.field("category"), "bill"))
            .collect();
    },
});

/**
 * List all apps for a user.
 */
export const listApps = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("apps")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const getAppByClient = query({
    args: { clientId: v.string(), clientSecret: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("apps")
            .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.eq(q.field("clientSecret"), args.clientSecret))
            .unique();
    },
});

/**
 * Create a new Merchant App.
 */
export const createApp = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const clientSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const appId = await ctx.db.insert("apps", {
            userId: args.userId,
            name: args.name,
            description: args.description,
            category: args.category,
            clientId,
            clientSecret,
            status: "active",
            network: "sepolia",
        });

        return appId;
    },
});

/**
 * Get App details by ID.
 */
export const getAppById = query({
    args: { appId: v.id("apps") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.appId);
    },
});

export const upsertDeposit = mutation({
    args: {
        txHash: v.string(),
        chainKey: v.number(),
        userAddress: v.string(),
        amount: v.string(),
        tokenAddress: v.string(),
        status: v.string(),
        asset: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("deposits")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                status: args.status,
                amount: parseFloat(args.amount),
                tokenAddress: args.tokenAddress,
                asset: args.asset ?? existing.asset,
            });
            return existing._id;
        }

        return await ctx.db.insert("deposits", {
            txHash: args.txHash,
            chainKey: args.chainKey,
            userAddress: args.userAddress,
            amount: parseFloat(args.amount),
            tokenAddress: args.tokenAddress,
            status: args.status,
            asset: args.asset,
        });
    },
});

export const updateDepositStatus = mutation({
    args: {
        txHash: v.string(),
        status: v.string(),
        hubTxHash: v.optional(v.string()),
        proof: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("deposits")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                status: args.status,
                hubTxHash: args.hubTxHash ?? existing.hubTxHash,
                proof: args.proof ?? existing.proof,
            });
        }
    },
});

/**
 * Get deposit by txHash.
 */
export const getDepositByHash = query({
    args: { txHash: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("deposits")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();
    },
});

export const createBill = mutation({
    args: {
        appId: v.id("apps"),
        amount: v.string(),
        asset: v.string(),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
        hash: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("bills", {
            appId: args.appId,
            amount: parseFloat(args.amount),
            asset: args.asset,
            description: args.description,
            metadata: args.metadata,
            hash: args.hash,
            status: "pending",
        });
    },
});

export const payBill = mutation({
    args: {
        billHash: v.string(),
        txHash: v.string(),
        userAddress: v.string(),
    },
    handler: async (ctx, args) => {
        const bill = await ctx.db
            .query("bills")
            .withIndex("by_hash", (q) => q.eq("hash", args.billHash))
            .unique();

        if (!bill) throw new Error("Bill not found");

        await ctx.db.patch(bill._id, {
            status: "paid",
        });

        const app = await ctx.db.get(bill.appId);

        // Log transaction
        await ctx.db.insert("transactions", {
            userAddress: args.userAddress,
            title: `Checkout: ${app?.name || "Merchant"}`,
            amount: bill.amount,
            asset: bill.asset,
            category: "spend",
            status: "completed",
            txHash: args.txHash,
        });

        return { ...bill, appName: app?.name };
    },
});

export const insertTransaction = mutation({
    args: {
        userAddress: v.string(),
        title: v.string(),
        amount: v.number(),
        asset: v.string(),
        category: v.string(),
        status: v.string(),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("transactions", {
            userAddress: args.userAddress,
            title: args.title,
            amount: args.amount,
            asset: args.asset,
            category: args.category,
            status: args.status,
            txHash: args.txHash,
        });
    },
});

export const getUserLimit = query({
    args: { userAddress: v.string(), asset: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.userAddress))
            .unique();
        if (!user) return null;
        return await ctx.db
            .query("limits")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
    },
});

export const getBillByHash = query({
    args: { hash: v.string() },
    handler: async (ctx, args) => {
        const bill = await ctx.db
            .query("bills")
            .withIndex("by_hash", (q) => q.eq("hash", args.hash))
            .unique();
        if (!bill) return null;

        const app = await ctx.db.get(bill.appId);
        return {
            ...bill,
            app
        };
    },
});

export const updatePoolStats = mutation({
    args: {
        name: v.string(),
        asset: v.string(),
        tvl: v.number(),
        apr: v.number(),
        lpBalance: v.number(),
        physicalBalance: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("pools")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                tvl: args.tvl,
                apr: args.apr,
                lpBalance: args.lpBalance,
                physicalBalance: args.physicalBalance,
                status: args.status,
            });
        } else {
            await ctx.db.insert("pools", {
                name: args.name,
                asset: args.asset,
                tvl: args.tvl,
                apr: args.apr,
                lpBalance: args.lpBalance,
                physicalBalance: args.physicalBalance,
                status: args.status,
            });
        }
    },
});

export const getUserBalances = query({
    args: { userAddress: v.string(), network: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("balances")
            .withIndex("by_user_network", (q) =>
                q.eq("userAddress", args.userAddress).eq("network", args.network)
            )
            .collect();
    },
});

export const updateBalance = mutation({
    args: {
        userAddress: v.string(),
        network: v.string(),
        symbol: v.string(),
        balance: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("balances")
            .withIndex("by_user_network_symbol", (q) =>
                q.eq("userAddress", args.userAddress)
                    .eq("network", args.network)
                    .eq("symbol", args.symbol)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                balance: args.balance,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("balances", {
                userAddress: args.userAddress,
                network: args.network,
                symbol: args.symbol,
                balance: args.balance,
                updatedAt: Date.now(),
            });
        }
    },
});
