import { mutation } from "./_generated/server";

export const seedPools = mutation({
    args: {},
    handler: async (ctx) => {
        await ctx.db.insert("pools", {
            name: "USDC_VAULT",
            asset: "USDC",
            tvl: 1250000,
            apr: 12.5,
            lpBalance: 0,
            physicalBalance: 1250000,
            status: "active",
        });
        await ctx.db.insert("pools", {
            name: "USDT_VAULT",
            asset: "USDT",
            tvl: 850000,
            apr: 11.2,
            lpBalance: 0,
            physicalBalance: 850000,
            status: "active",
        });
    },
});
