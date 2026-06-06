import { useEffect, useState } from "react";
import { GlobalStatsDocument } from "@/lib/db-types";

export function useGlobalStats() {
  const [stats, setStats] = useState<GlobalStatsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/global-stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch global stats");
        return r.json();
      })
      .then((data) => setStats(data ?? null))
      .catch((err) => setError(err.message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
