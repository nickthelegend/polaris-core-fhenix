import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export type Transaction = {
  type: "borrow" | "deposit" | "repay" | "supply" | "liquidation" | "swap";
  title: string;
  amount: string;
  asset: string;
  time: string;
  status: string;
  txHash?: string;
  timestamp: number;
};

export function useTransactions() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    fetch(`/api/transactions?wallet=${address}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch transactions");
        return r.json();
      })
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, [address]);

  return { transactions, loading, error };
}
