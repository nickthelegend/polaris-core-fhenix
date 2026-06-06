import { useEffect, useState } from "react";

export interface BridgeTransaction {
  id: string;
  user_address: string;
  token_address: string;
  amount: string;
  source_tx_hash: string;
  hub_tx_hash?: string;
  usc_query_id: string;
  status: "DETECTED" | "BUILDING_PROOF" | "WAITING_ATTESTATION" | "SUBMITTED" | "VERIFIED" | "COMPLETED" | "FAILED";
  created_at: string;
}

export function useBridge(userAddress: string | undefined) {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;
    setLoading(true);
    fetch(`/api/bridge?userAddress=${userAddress}`)
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [userAddress]);

  return { transactions, loading };
}
