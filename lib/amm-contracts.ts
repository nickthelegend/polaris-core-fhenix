// AMM Contract Addresses and ABIs
export const AMM_DEPLOYMENTS = {
  mockTokens: {
    WETH: process.env.NEXT_PUBLIC_MOCK_WETH || "",
    BNB: process.env.NEXT_PUBLIC_MOCK_BNB || "",
    USDC: process.env.NEXT_PUBLIC_MOCK_USDC || "",
    USDT: process.env.NEXT_PUBLIC_MOCK_USDT || ""
  },
  lendingPools: {
    WETH: process.env.NEXT_PUBLIC_LENDING_POOL_WETH || "",
    BNB: process.env.NEXT_PUBLIC_LENDING_POOL_BNB || "",
    USDC: process.env.NEXT_PUBLIC_LENDING_POOL_USDC || "",
    USDT: process.env.NEXT_PUBLIC_LENDING_POOL_USDT || ""
  },
  privateSwaps: {
    WETH: process.env.NEXT_PUBLIC_PRIVATE_SWAP_WETH || "",
    BNB: process.env.NEXT_PUBLIC_PRIVATE_SWAP_BNB || "",
    USDC: process.env.NEXT_PUBLIC_PRIVATE_SWAP_USDC || "",
    USDT: process.env.NEXT_PUBLIC_PRIVATE_SWAP_USDT || ""
  },
  ammPools: {
    BNB_USDC: process.env.NEXT_PUBLIC_AMM_POOL_BNB_USDC || "",
    BNB_USDT: process.env.NEXT_PUBLIC_AMM_POOL_BNB_USDT || "",
    WETH_USDC: process.env.NEXT_PUBLIC_AMM_POOL_WETH_USDC || "",
    WETH_USDT: process.env.NEXT_PUBLIC_AMM_POOL_WETH_USDT || ""
  }
} as const


export const ERC20_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const AMM_ABI = [
  {
    inputs: [{ name: "tokenIn", type: "address" }, { name: "amountIn", type: "uint256" }],
    name: "swap",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenIn", type: "address" }, { name: "amountIn", type: "uint256" }],
    name: "getAmountOut",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const
