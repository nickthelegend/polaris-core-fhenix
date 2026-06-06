/**
 * Feature: real-data-layer, Property 2: Position upsert idempotence
 * Validates: Requirements 1.2, 3.2, 3.3
 *
 * For any position payload, POST twice with same txHash, assert exactly 1 document in collection.
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

const positionArbitrary = fc.record({
  walletAddress: fc
    .hexaString({ minLength: 40, maxLength: 40 })
    .map((h) => `0x${h}`),
  type: fc.constantFrom("SUPPLY" as const, "BORROW" as const),
  symbol: fc.constantFrom("ETH", "USDC", "WBTC", "BNB"),
  entryAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
  txHash: fc
    .hexaString({ minLength: 64, maxLength: 64 })
    .map((h) => `0x${h}`),
});

describe("Property 2: Position upsert idempotence", () => {
  it("POSTing the same txHash twice results in exactly 1 document", async () => {
    await fc.assert(
      fc.asyncProperty(positionArbitrary, async (payload) => {
        const db: Db = client.db(
          `test_pos_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
        );
        try {
          // Upsert twice with the same txHash
          await upsertPosition(db, payload);
          await upsertPosition(db, payload);

          const count = await db
            .collection("positions")
            .countDocuments({ txHash: payload.txHash });

          return count === 1;
        } finally {
          await db.dropDatabase();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("second upsert updates entryAmount, not inserts a new doc", async () => {
    await fc.assert(
      fc.asyncProperty(
        positionArbitrary,
        fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
        async (payload, newAmount) => {
          const db: Db = client.db(
            `test_pos_upd_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
          );
          try {
            await upsertPosition(db, payload);
            await upsertPosition(db, { ...payload, entryAmount: newAmount });

            const docs = await db
              .collection("positions")
              .find({ txHash: payload.txHash })
              .toArray();

            // Still exactly 1 doc, with the updated amount
            return docs.length === 1 && docs[0].entryAmount === newAmount;
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("active-only filter: GET returns only active positions for wallet", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .hexaString({ minLength: 40, maxLength: 40 })
          .map((h) => `0x${h}`),
        fc.array(positionArbitrary, { minLength: 1, maxLength: 8 }),
        async (wallet, payloads) => {
          const db: Db = client.db(
            `test_pos_filter_${Date.now()}_${Math.floor(Math.random() * 1e9)}`
          );
          try {
            // Insert all as active for this wallet
            for (const p of payloads) {
              await upsertPosition(db, { ...p, walletAddress: wallet });
            }

            // Close the first one
            await upsertPosition(db, {
              ...payloads[0],
              walletAddress: wallet,
              entryAmount: 0,
            });

            const active = await getPositionsFromDb(db, wallet);

            // All returned docs must be active
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
