/**
 * Token configuration for Polaris.
 * Addresses are keyed by chainId.
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  addresses: Record<number, string>;
}

// Chain IDs
const SEPOLIA = 11155111;

export const TOKENS: Record<string, TokenConfig> = {
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logo: "/tokens/weth.svg",
    addresses: {
      [SEPOLIA]: process.env.NEXT_PUBLIC_MOCK_WETH || "0x35504AceAea50B3dbeF640618b535feDB2db680B",
    },
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/tokens/usdc.svg",
    addresses: {
      [SEPOLIA]: process.env.NEXT_PUBLIC_MOCK_USDC || "0xA715e84556b03aBdaC42aa421b5D6081A5434a2F",
    },
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: "/tokens/usdt.svg",
    addresses: {
      [SEPOLIA]: process.env.NEXT_PUBLIC_MOCK_USDT || "",
    },
  },
  BNB: {
    symbol: "BNB",
    name: "Wrapped BNB",
    decimals: 18,
    logo: "/tokens/bnb.svg",
    addresses: {
      [SEPOLIA]: process.env.NEXT_PUBLIC_MOCK_BNB || "0xd376252519348D8d219C250E374CE81A1B528BE5",
    },
  },
};

/** Get a token's address for the given chainId, or undefined if not configured. */
export function getTokenAddress(symbol: string, chainId: number): string | undefined {
  const token = TOKENS[symbol];
  if (!token) return undefined;
  return token.addresses[chainId];
}

/** Get all tokens configured for a given chainId. */
export function getTokensForChain(chainId: number): Array<TokenConfig & { address: string }> {
  return Object.values(TOKENS)
    .filter((t) => t.addresses[chainId] && t.addresses[chainId] !== "0x0000000000000000000000000000000000000000")
    .map((t) => ({ ...t, address: t.addresses[chainId] }));
}
