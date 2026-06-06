import { defineChain } from "viem";

export const fhenixSepolia = defineChain({
  id: 42069,
  name: "Fhenix Sepolia",
  nativeCurrency: { name: "FHE", symbol: "FHE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.sepolia.fhenix.zone"] },
    public:  { http: ["https://api.sepolia.fhenix.zone"] }
  },
  blockExplorers: {
    default: { name: "Fhenix Explorer", url: "https://explorer.sepolia.fhenix.zone" }
  },
  testnet: true
});
