/**
 * Feature: real-data-layer
 * Property 1: Pool document round-trip
 * Property 5: Unknown symbol returns 404
 * Validates: Requirements 1.1, 2.2, 2.4, 2.6
 */

import * as fc from "fast-check";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { getPoolBySymbol } from "../route";

const REQUIRED_FIELDS = [
  "symbol",
  "name",
  "supplyApy",
  "borrowApy",
  "totalLiquidity",
  "utilization",
  "updatedAt",
] as const;

const SYMBOLS = ["ETH", "USDC", "WBTC", "BNB"] as const;

let mongod: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  client = new MongoClient(mongod.getUri());
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await mongod.stop();
});

const poolArbitrary = fc.record({
  symbol: fc.constantFrom(...SYMBOLS),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  supplyApy: fc.float({ min: 0, max: 100, noNaN: true }),
  borrowApy: fc.float({ min: 0, max: 100, noNaN: true }),
  totalLiquidity: fc.integer({ min: 0, max: 100_000_000 }),
  utilization: fc.integer({ min: 0, max: 100 }),
  updatedAt: fc.date(),
});

describe("Property 1: Pool document round-trip", () => {
  it("GET by symbol returns all required fields for any inserted pool", async () => {
    await fc.assert(
      fc.asyncProperty(poolArbitrary, async (poolDoc) => {
        const db: Db = client.db(
          `test_symbol_rt_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
        );
        try {
          await db.collection("pools").insertOne({ ...poolDoc });
          const result = await getPoolBySymbol(db, poolDoc.symbol);
          if (!result) return false;
          return REQUIRED_FIELDS.every((field) => field in result);
        } finally {
          await db.dropDatabase();
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 5: Unknown symbol returns 404", () => {
  it("returns null for any symbol not present in the collection", async () => {
    // Symbols that are never inserted
    const unknownSymbols = ["UNKNOWN", "XYZ", "FAKE", "NOTREAL", "???"];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...unknownSymbols),
        async (unknownSymbol) => {
          const db: Db = client.db(
            `test_symbol_404_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
          );
          try {
            // Insert a known pool so the collection is not empty
            await db.collection("pools").insertOne({
              symbol: "ETH",
              name: "Ether",
              supplyApy: 3.4,
              borrowApy: 5.2,
              totalLiquidity: 14200000,
              utilization: 68,
              updatedAt: new Date(),
            });
            const result = await getPoolBySymbol(db, unknownSymbol);
            return result === null;
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
