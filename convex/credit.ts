import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Split Plans ──

export const createSplitPlan = mutation({
  args: {
    userAddress: v.string(),
    loanId: v.number(),
    totalAmount: v.number(),
    installments: v.array(
      v.object({
        index: v.number(),
        amount: v.number(),
        dueDate: v.number(),
        status: v.union(v.literal("paid"), v.literal("upcoming"), v.literal("overdue")),
        paidAt: v.optional(v.number()),
        txHash: v.optional(v.string()),
      })
    ),
    merchantAddress: v.string(),
    billHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("splitPlans", {
      userAddress: args.userAddress,
      loanId: args.loanId,
      totalAmount: args.totalAmount,
      installments: args.installments,
      merchantAddress: args.merchantAddress,
      billHash: args.billHash,
      createdAt: Date.now(),
    });
  },
});

export const getSplitPlans = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("splitPlans")
      .withIndex("by_user_address", (q) => q.eq("userAddress", args.userAddress))
      .collect();
  },
});

export const updateInstallmentStatus = mutation({
  args: {
    planId: v.id("splitPlans"),
    installmentIndex: v.number(),
    status: v.union(v.literal("paid"), v.literal("upcoming"), v.literal("overdue")),
    paidAt: v.optional(v.number()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Split plan not found");

    const updatedInstallments = plan.installments.map((inst) => {
      if (inst.index === args.installmentIndex) {
        return {
          ...inst,
          status: args.status,
          paidAt: args.paidAt ?? inst.paidAt,
          txHash: args.txHash ?? inst.txHash,
        };
      }
      return inst;
    });

    await ctx.db.patch(args.planId, { installments: updatedInstallments });
  },
});

// ── Repayment History ──

export const addRepaymentRecord = mutation({
  args: {
    userAddress: v.string(),
    loanId: v.number(),
    amount: v.number(),
    txHash: v.string(),
    loanType: v.union(v.literal("bnpl"), v.literal("split3")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("repaymentHistory", {
      userAddress: args.userAddress,
      loanId: args.loanId,
      amount: args.amount,
      txHash: args.txHash,
      loanType: args.loanType,
      timestamp: Date.now(),
    });
  },
});

export const getRepaymentHistory = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repaymentHistory")
      .withIndex("by_user_address", (q) => q.eq("userAddress", args.userAddress))
      .collect();
  },
});
