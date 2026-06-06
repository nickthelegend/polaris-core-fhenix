import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(), // EOA or Privy Address
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()), // merchant, user, admin
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_email", ["email"]),

  merchants: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    usedCredit: v.optional(v.number()),
    status: v.string(), // active, pending, suspended
    isVerified: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  apps: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    clientId: v.string(),
    clientSecret: v.string(),
    network: v.string(), // e.g. sepolia
    status: v.string(), // active, inactive
    webhookUrl: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_client_id", ["clientId"]),

  apiKeys: defineTable({
    appId: v.id("apps"),
    key: v.string(),
    name: v.string(),
    status: v.string(),
  })
    .index("by_app", ["appId"])
    .index("by_key", ["key"]),

  webhooks: defineTable({
    appId: v.id("apps"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    status: v.string(),
  }).index("by_app", ["appId"]),

  webhookLogs: defineTable({
    appId: v.id("apps"),
    webhookId: v.id("webhooks"),
    event: v.string(),
    payload: v.any(),
    status: v.number(), // HTTP Status code
    response: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_app", ["appId"]),

  pools: defineTable({
    name: v.string(),
    asset: v.string(),
    tvl: v.number(),
    apr: v.number(),
    lpBalance: v.number(),
    physicalBalance: v.number(),
    status: v.string(),
  }).index("by_name", ["name"]),

  limits: defineTable({
    userId: v.id("users"),
    asset: v.string(),
    currentLimit: v.number(),
    used: v.number(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.optional(v.id("users")),
    userAddress: v.string(),
    title: v.string(),
    amount: v.number(),
    asset: v.string(),
    status: v.string(), // pending, completed, failed
    category: v.string(), // spend, repayment, deposit, withdrawal
    txHash: v.optional(v.string()),
    hubTxHash: v.optional(v.string()),
    chainId: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_address", ["userAddress"])
    .index("by_tx_hash", ["txHash"]),

  deposits: defineTable({
    userAddress: v.string(),
    amount: v.number(),
    tokenAddress: v.string(),
    asset: v.optional(v.string()), // Added for easier lookup (USDC, USDT, etc.)
    txHash: v.string(),
    hubTxHash: v.optional(v.string()),
    chainKey: v.number(),
    status: v.string(), // PENDING, Synced, Failed
    proof: v.optional(v.any()), // Cached Merkle Proof
  })
    .index("by_user", ["userAddress"])
    .index("by_tx_hash", ["txHash"]),

  bridgeTransactions: defineTable({
    userAddress: v.string(),
    sourceChainId: v.number(),
    targetChainId: v.number(),
    amount: v.number(),
    txHash: v.string(),
    status: v.string(),
  }).index("by_user", ["userAddress"]),

  balances: defineTable({
    userAddress: v.string(),
    network: v.string(),
    symbol: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userAddress"])
    .index("by_user_network", ["userAddress", "network"])
    .index("by_user_network_symbol", ["userAddress", "network", "symbol"]),

  bills: defineTable({
    appId: v.id("apps"),
    amount: v.number(),
    asset: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    hash: v.string(),
    status: v.string(), // pending, paid, expired
  })
    .index("by_hash", ["hash"])
    .index("by_app", ["appId"]),

  splitPlans: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_user_address", ["userAddress"])
    .index("by_loan_id", ["loanId"]),

  repaymentHistory: defineTable({
    userAddress: v.string(),
    loanId: v.number(),
    amount: v.number(),
    txHash: v.string(),
    loanType: v.union(v.literal("bnpl"), v.literal("split3")),
    timestamp: v.number(),
  })
    .index("by_user_address", ["userAddress"])
    .index("by_loan_id", ["loanId"]),
});
