/**
 * Feature: real-data-layer, Property 4: GET /api/pools completeness
 * Validates: Requirements 2.1, 2.6
 *
 * For any set of N pool documents in the database, GET /api/pools should return
 * exactly N documents, each containing all required fields.
 */

import * as fc from "fast-check";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { getPoolsFromDb } from "../route";

const REQUIRED_FIELDS = [
  "symbol",
  "name",
  "supplyApy",
  "borrowApy",
  "totalLiquidity",
  "utilization",
  "updatedAt",
] as const;

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

// Arbitrary for a valid pool document
const poolArbitrary = fc.record({
  symbol: fc.constantFrom("ETH", "USDC", "WBTC", "BNB", "DAI", "MATIC"),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  supplyApy: fc.float({ min: 0, max: 100, noNaN: true }),
  borrowApy: fc.float({ min: 0, max: 100, noNaN: true }),
  totalLiquidity: fc.integer({ min: 0, max: 100_000_000 }),
  utilization: fc.integer({ min: 0, max: 100 }),
  updatedAt: fc.date(),
});

describe("Property 4: GET /api/pools completeness", () => {
  it("returns exactly N documents each with all required fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(poolArbitrary, { minLength: 1, maxLength: 10 }),
        async (poolDocs) => {
          const db: Db = client.db(`test_pools_${Date.now()}_${Math.floor(Math.random() * 1e9)}`);
          try {
            await db.collection("pools").insertMany(poolDocs);

            const result = await getPoolsFromDb(db);

            // Length must match
            if (result.length !== poolDocs.length) return false;

            // Every document must have all required fields
            return result.every((doc) =>
              REQUIRED_FIELDS.every((field) => field in doc)
            );
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
