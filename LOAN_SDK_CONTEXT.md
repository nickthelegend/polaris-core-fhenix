# Phase 5: Loan Data Oracle Implementation (SDK Context)

This document contains snippets and instructions for fetching loan data from Aave, Morpho, and Compound to build a cross-chain credit oracle on Creditcoin USC v2.

## Aave v3 React Integration
Used for fetching markets, supplies, and borrows.

```typescript
import { useAaveMarkets, chainId } from "@aave/react";

const { data, loading, error } = useAaveMarkets({
  chainIds: [chainId(1), chainId(8453)], // Ethereum, Base
});

import { useUserSupplies } from "@aave/react";
import { AaveV3Ethereum } from "@bgd-labs/aave-address-book";
import { chainId, evmAddress } from "@aave/react";

export const chain = chainId(1);
export const market = evmAddress(AaveV3Ethereum.POOL);
export const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"); // Insert account address here

const { data: userSupplies, loading: userSuppliesLoading } = useUserSupplies({
  markets: [
    {
      chainId: chain,
      market,
    },
  ],
  user,
});


import { useUserBorrows } from "@aave/react";
import { AaveV3Ethereum } from "@bgd-labs/aave-address-book";
import { chainId, evmAddress } from "@aave/react";

export const chain = chainId(1);
export const market = evmAddress(AaveV3Ethereum.POOL);
export const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"); // Insert account address here

const { data: userBorrows, loading: userBorrowsLoading } = useUserBorrows({
  markets: [
    {
      chainId: chain,
      market,
    },
  ],
  user,
});
```

## Morpho Blue Integration
Using `@morpho-org/blue-api-sdk` (GraphQL + typed client).

### Installation
```bash
npm install @morpho-org/blue-api-sdk
```

### Basic GraphQL Example
```typescript
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { BLUE_API_GRAPHQL_URL } from "@morpho-org/blue-api-sdk";

const client = new ApolloClient({
  uri: BLUE_API_GRAPHQL_URL,
  cache: new InMemoryCache(),
});

const GET_VAULT = gql`
  query ($addr: String!, $chain: Int!) {
    vaultV2ByAddress(address: $addr, chainId: $chain) {
      address
      totalAssets
      totalAssetsUsd
      totalSupply
      liquidity
      liquidityUsd
      idleAssetsUsd
    }
  }
`;

async function getMorphoVault(address: string, chainId: number) {
  const res = await client.query({
    query: GET_VAULT,
    variables: { addr: address, chain: chainId },
  });
  return res.data.vaultV2ByAddress;
}

// Usage
getMorphoVault("0x04422053aDDbc9bB2759b248B574e3FCA76Bc145", 1)
  .then(vault => console.log(vault))
  .catch(console.error);
```

### GraphQL Codegen Config (Recommended)
```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";
import { BLUE_API_GRAPHQL_URL } from "@morpho-org/blue-api-sdk";

const config: CodegenConfig = {
  schema: BLUE_API_GRAPHQL_URL,
  documents: "src/graphql/**/*.{gql,graphql}",
  generates: {
    "src/generated/": {
      plugins: ["typescript", "typescript-operations", "typescript-react-apollo"],
      config: { skipTypename: false },
    },
  },
};

export default config;
```

## Compound Integration
Using `Compound.js` SDK.

### Installation
```bash
npm install ethers @compound-finance/compound-js
```

### Example: Read Data
```typescript
import Compound from "@compound-finance/compound-js";
import { ethers } from "ethers";

// Setup provider (Infura / Alchemy / Cloudflare)
const provider = new ethers.providers.JsonRpcProvider("https://cloudflare-eth.com");

// Initialize Compound SDK
const compound = new Compound(provider);

// Example: Get all markets
async function listMarkets() {
  const markets = await compound.getAllMarkets();
  console.log("Compound markets:", markets);
}

// Example: Fetch current exchange rate for cUSDC
async function getExchangeRateForCUsdc() {
  const supplyRate = await compound.eth.read(
    Compound.util.getAddress(Compound.cUSDC),
    "function supplyRatePerBlock() returns (uint)",
    [],
    { provider }
  );

  console.log("cUSDC supplyRatePerBlock:", supplyRate.toString());
}

listMarkets();
getExchangeRateForCUsdc();
```

## Credit Engine Flow
1. **Fetch**: Aave, Morpho, Compound SDKs -> Normalize -> UCS style object.
2. **Score**: Run through Risk Engine to calculate score.
3. **Oracle**: Push results to on-chain Creditcoin Oracle.
4. **Limits**: Update Credit Limits on-chain.
