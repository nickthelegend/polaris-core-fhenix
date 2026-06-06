import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export type Position = {
  type: "SUPPLY" | "BORROW";
  symbol: string;
  name: string;
  amount: string;
  apy: string;
  value: string;
  txHash?: string;
  timestamp?: number;
};

export function usePositions() {
  const { address } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setPositions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch(`/api/positions?wallet=${address}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch positions");
        return r.json();
      })
      .then((data) => setPositions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, [address]);

  return { positions, loading, error };
}
