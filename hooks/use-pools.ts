import { useEffect, useState, useCallback } from "react";
import { usePolaris } from "@/hooks/use-polaris";
import { PoolDocument } from "@/lib/db-types";

export interface EnhancedPool extends PoolDocument {
  liquidity: string;
}

export function usePools() {
  const { getPoolLiquidity } = usePolaris();
  const [pools, setPools] = useState<EnhancedPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/pools");
      if (!r.ok) throw new Error("Failed to fetch pools");
      const data: PoolDocument[] = await r.json();
      
      // Enhance with on-chain public liquidity
      const enhanced = await Promise.all(
        data.map(async (p) => {
          try {
            // For hackathon, some tokens might not be deployed yet, handle fallback
            const liq = await getPoolLiquidity(p.address);
            return { ...p, liquidity: liq };
          } catch {
            return { ...p, liquidity: "0" };
          }
        })
      );
      
      setPools(enhanced);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [getPoolLiquidity]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, error, refresh: fetchPools };
}
