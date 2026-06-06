// Feature: polaris-credit-bnpl, Property 9: API credential uniqueness
import * as fc from "fast-check";
import { generateCredentials } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 7.1, 7.4**
 *
 * Property 9: API credential uniqueness
 * For any sequence of N merchant app creations (N >= 2), all generated clientId
 * values shall be distinct and all generated clientSecret values shall be distinct.
 */
describe("Property 9: API credential uniqueness", () => {
  it("all clientId values are distinct across N generations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const ids = Array.from({ length: n }, () => generateCredentials().clientId);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(n);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all clientSecret values are distinct across N generations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const secrets = Array.from({ length: n }, () => generateCredentials().clientSecret);
          const uniqueSecrets = new Set(secrets);
          expect(uniqueSecrets.size).toBe(n);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("clientId and clientSecret are distinct from each other across N generations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const credentials = Array.from({ length: n }, () => generateCredentials());
          const allIds = credentials.map((c) => c.clientId);
          const allSecrets = credentials.map((c) => c.clientSecret);

          // No clientId should appear as a clientSecret and vice versa
          const idSet = new Set(allIds);
          const secretSet = new Set(allSecrets);
          for (const secret of allSecrets) {
            expect(idSet.has(secret)).toBe(false);
          }
          for (const id of allIds) {
            expect(secretSet.has(id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("clientId follows the prod_ prefix format", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const credentials = Array.from({ length: n }, () => generateCredentials());
          for (const { clientId } of credentials) {
            expect(clientId).toMatch(/^prod_[0-9a-f]{32}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("clientSecret follows the sk_ prefix format", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const credentials = Array.from({ length: n }, () => generateCredentials());
          for (const { clientSecret } of credentials) {
            expect(clientSecret).toMatch(/^sk_[0-9a-f]{48}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
