import { ethers } from 'ethers';

/**
 * Interface for Native Query Proof
 */
export interface NativeQueryProof {
    chainKey: number;
    blockHeight: number;
    encodedTransaction: string;
    merkleRoot: string;
    siblings: { hash: string; isLeft: boolean }[];
    lowerEndpointDigest: string;
    continuityRoots: string[];
}

/**
 * Utility to format and validate proof data
 */
export const ProofUtils = {
    /**
     * Formats raw proof data into the protocol's expected format
     */
    formatProof: (raw: any): NativeQueryProof => {
        // Handle Gluwa API Response Format (data.data) vs. Flat format
        const data = raw.data || raw;

        return {
            chainKey: Number(data.chainKey || 1),
            blockHeight: Number(data.headerNumber || data.blockHeight || 0),
            encodedTransaction: data.txBytes || data.encodedTransaction || "0x",
            merkleRoot: data.merkleProof?.root || data.merkleRoot || ethers.ZeroHash,
            siblings: (data.merkleProof?.siblings || data.siblings || []).map((s: any) => {
                if (Array.isArray(s)) return { hash: s[0], isLeft: !!s[1] };
                if (typeof s === 'string') return { hash: s, isLeft: false }; // Fallback for raw hashes
                return {
                    hash: s.hash,
                    isLeft: !!s.isLeft
                };
            }),
            lowerEndpointDigest: data.continuityProof?.lowerEndpointDigest || data.lowerEndpointDigest || ethers.ZeroHash,
            continuityRoots: data.continuityProof?.roots || data.continuityRoots || []
        };
    },

    /**
     * Fetches a real proof from the PayEase API (which calls the Gluwa Prover).
     * @param txHash Source Chain Transaction Hash
     * @param chainKey Chain Key (1 for Sepolia, etc.)
     */
    fetchProof: async (txHash: string, chainKey: number = 1): Promise<NativeQueryProof> => {
        try {
            const response = await fetch(`/api/proof?txHash=${txHash}&chainKey=${chainKey}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch proof");
            }

            const result = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.error || "Proof generation failed");
            }

            const data = result.data;

            return {
                chainKey: data.chainKey,
                blockHeight: data.headerNumber,
                encodedTransaction: data.txBytes,
                merkleRoot: data.merkleProof.root,
                siblings: data.merkleProof.siblings.map((s: any) => ({
                    hash: s.hash,
                    isLeft: s.isLeft
                })),
                lowerEndpointDigest: data.continuityProof.lowerEndpointDigest,
                continuityRoots: data.continuityProof.roots || []
            };
        } catch (error) {
            console.error("[ProofUtils] Error fetching proof:", error);
            throw error;
        }
    },

    /**
     * Generates a mock proof (Legacy support for local dev without API)
     */
    generateMockProof: (overrides: Partial<NativeQueryProof> = {}): NativeQueryProof => {
        return {
            chainKey: 1,
            blockHeight: 100,
            encodedTransaction: "0x00",
            merkleRoot: ethers.ZeroHash,
            siblings: [],
            lowerEndpointDigest: ethers.ZeroHash,
            continuityRoots: [],
            ...overrides
        };
    }
};
