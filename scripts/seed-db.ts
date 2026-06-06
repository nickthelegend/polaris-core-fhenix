import { MongoClient } from "mongodb";
import type { PoolDocument, GlobalStatsDocument } from "../lib/db-types";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "polaris";

const SEED_POOLS: Omit<PoolDocument, "_id">[] = [
  { symbol: "ETH",  name: "Ether",          supplyApy: 3.4, borrowApy: 5.2, totalLiquidity: 12400, utilization: 68, updatedAt: new Date() },
  { symbol: "USDC", name: "USD Coin",        supplyApy: 2.1, borrowApy: 4.8, totalLiquidity: 28500, utilization: 74, updatedAt: new Date() },
  { symbol: "WBTC", name: "Wrapped Bitcoin", supplyApy: 2.8, borrowApy: 4.1, totalLiquidity: 4800,  utilization: 55, updatedAt: new Date() },
  { symbol: "BNB",  name: "BNB",             supplyApy: 5.1, borrowApy: 7.5, totalLiquidity: 6200,  utilization: 42, updatedAt: new Date() },
];

export async function seedDatabase(db: import("mongodb").Db): Promise<void> {
  const poolsCol = db.collection<PoolDocument>("pools");
  const statsCol = db.collection<GlobalStatsDocument>("globalStats");

  for (const pool of SEED_POOLS) {
    await poolsCol.updateOne(
      { symbol: pool.symbol },
      { $set: { ...pool, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  const totalSupplied = SEED_POOLS.reduce((sum, p) => sum + p.totalLiquidity, 0);
  const avgSupplyApy = SEED_POOLS.reduce((sum, p) => sum + p.supplyApy, 0) / SEED_POOLS.length;

  const globalStats: Omit<GlobalStatsDocument, "_id"> = {
    totalSupplied,
    totalBorrowed: 0,
    activePools: SEED_POOLS.length,
    avgSupplyApy,
    updatedAt: new Date(),
  };

  await statsCol.updateOne(
    {},
    { $set: { ...globalStats, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    await seedDatabase(db);
    console.log("Seed complete.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
