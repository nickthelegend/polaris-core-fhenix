/**
 * Feature: real-data-layer, Property 6: Active-only position filter
 * Feature: real-data-layer, Property 7: Zero entryAmount closes position
 * Validates: Requirements 3.1, 3.5, 3.6, 7.3, 7.4
 *
 * Property 6: For any wallet, GET /api/positions returns only active positions.
 * Property 7: POST with entryAmount=0 closes the position and removes it from GET results.
 */

import * as fc from "fast-check";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { upsertPosition, getPositionsFromDb } from "../route";

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

const walletArbitrary = fc
  .hexaString({ minLength: 40, maxLength: 40 })
  .map((h) => `0x${h}`);

const txHashArbitrary = fc
  .hexaString({ minLength: 64, maxLength: 64 })
  .map((h) => `0x${h}`);

const activePositionArbitrary = fc.record({
  walletAddress: walletArbitrary,
  type: fc.constantFrom("SUPPLY" as const, "BORROW" as const),
  symbol: fc.constantFrom("ETH", "USDC", "WBTC", "BNB"),
  entryAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
  txHash: txHashArbitrary,
});

describe("Property 6: Active-only position filter", () => {
  it("GET returns only active positions — closed ones are excluded", async () => {
    await fc.assert(
      fc.asyncProperty(
        walletArbitrary,
        fc.array(activePositionArbitrary, { minLength: 2, maxLength: 8 }),
        async (wallet, payloads) => {
          const db: Db = client.db(
            `test_p6_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
          );
          try {
            // Insert all positions for this wallet
            for (const p of payloads) {
              await upsertPosition(db, { ...p, walletAddress: wallet });
            }

            // Close the first position
            await upsertPosition(db, {
              ...payloads[0],
              walletAddress: wallet,
              entryAmount: 0,
            });

            const active = await getPositionsFromDb(db, wallet);

            // All returned docs must have status "active"
            return active.every((doc) => doc.status === "active");
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 7: Zero entryAmount closes position", () => {
  it("POST with entryAmount=0 sets status to closed and excludes from GET", async () => {
    await fc.assert(
      fc.asyncProperty(
        activePositionArbitrary,
        async (payload) => {
          const db: Db = client.db(
            `test_p7_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
          );
          try {
            // Insert an active position
            await upsertPosition(db, payload);

            // Close it by posting entryAmount=0
            await upsertPosition(db, { ...payload, entryAmount: 0 });

            // Verify status is "closed" in the DB
            const doc = await db
              .collection("positions")
              .findOne({ txHash: payload.txHash });

            if (!doc || doc.status !== "closed") return false;

            // Verify it does NOT appear in the active GET results
            const active = await getPositionsFromDb(
              db,
              payload.walletAddress
            );
            return !active.some((d) => d.txHash === payload.txHash);
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
