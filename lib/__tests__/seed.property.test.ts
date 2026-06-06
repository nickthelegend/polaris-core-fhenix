/**
 * Feature: real-data-layer, Property 3: Seed idempotence
 * Validates: Requirements 1.4, 1.5, 1.6
 *
 * For any number of times the seed script is run, the `pools` collection should
 * contain exactly 4 documents and the `globalStats` collection should contain
 * exactly 1 document.
 */

import * as fc from "fast-check";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { seedDatabase } from "../../scripts/seed-db";

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

describe("Property 3: Seed idempotence", () => {
  it("running seed N times always results in exactly 4 pools and 1 globalStats", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a number of seed runs between 1 and 5
        fc.integer({ min: 1, max: 5 }),
        async (runs) => {
          const db = client.db(`test_seed_${Date.now()}_${runs}`);
          try {
            for (let i = 0; i < runs; i++) {
              await seedDatabase(db);
            }
            const poolCount = await db.collection("pools").countDocuments();
            const statsCount = await db.collection("globalStats").countDocuments();
            return poolCount === 4 && statsCount === 1;
          } finally {
            await db.dropDatabase();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
