// Feature: polaris-credit-bnpl, Property 17: Bill create API returns required fields
import * as fc from "fast-check";
import { buildBillCreateResponse } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 9.1**
 *
 * Property 17: Bill create API returns required fields
 * For any valid bill creation request (with valid API credentials and positive amount),
 * the response shall contain billId, billHash, checkoutUrl, merchantName, and status
 * fields, all non-empty.
 */
describe("Property 17: Bill create API returns required fields", () => {
  // --- Arbitraries ---

  const insertedIdArb = fc.hexaString({ minLength: 12, maxLength: 24 });
  const billHashArb = fc.hexaString({ minLength: 20, maxLength: 40 });
  const baseUrlArb = fc.constantFrom(
    "http://localhost:3000",
    "https://app.polaris.pay",
    "https://staging.polaris.pay"
  );
  const merchantNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
    (s) => s.trim().length > 0
  );

  // --- Sub-property 1: Response contains all five required fields ---

  it("should contain billId, billHash, checkoutUrl, merchantName, and status for any valid inputs", () => {
    fc.assert(
      fc.property(
        insertedIdArb,
        billHashArb,
        baseUrlArb,
        merchantNameArb,
        (insertedId, billHash, baseUrl, merchantName) => {
          const response = buildBillCreateResponse(insertedId, billHash, baseUrl, merchantName);

          expect(response).toHaveProperty("billId");
          expect(response).toHaveProperty("billHash");
          expect(response).toHaveProperty("checkoutUrl");
          expect(response).toHaveProperty("merchantName");
          expect(response).toHaveProperty("status");
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 2: All fields are non-empty strings ---

  it("should have all fields as non-empty strings for any valid inputs", () => {
    fc.assert(
      fc.property(
        insertedIdArb,
        billHashArb,
        baseUrlArb,
        merchantNameArb,
        (insertedId, billHash, baseUrl, merchantName) => {
          const response = buildBillCreateResponse(insertedId, billHash, baseUrl, merchantName);

          expect(typeof response.billId).toBe("string");
          expect(response.billId.length).toBeGreaterThan(0);

          expect(typeof response.billHash).toBe("string");
          expect(response.billHash.length).toBeGreaterThan(0);

          expect(typeof response.checkoutUrl).toBe("string");
          expect(response.checkoutUrl.length).toBeGreaterThan(0);

          expect(typeof response.merchantName).toBe("string");
          expect(response.merchantName.length).toBeGreaterThan(0);

          expect(typeof response.status).toBe("string");
          expect(response.status.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 3: billId matches the insertedId ---

  it("should return billId equal to the insertedId for any valid inputs", () => {
    fc.assert(
      fc.property(
        insertedIdArb,
        billHashArb,
        baseUrlArb,
        merchantNameArb,
        (insertedId, billHash, baseUrl, merchantName) => {
          const response = buildBillCreateResponse(insertedId, billHash, baseUrl, merchantName);
          expect(response.billId).toBe(insertedId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 4: checkoutUrl is correctly constructed ---

  it("should construct checkoutUrl as baseUrl/pay/billHash for any valid inputs", () => {
    fc.assert(
      fc.property(
        insertedIdArb,
        billHashArb,
        baseUrlArb,
        merchantNameArb,
        (insertedId, billHash, baseUrl, merchantName) => {
          const response = buildBillCreateResponse(insertedId, billHash, baseUrl, merchantName);
          expect(response.checkoutUrl).toBe(`${baseUrl}/pay/${billHash}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 5: status is always "pending" ---

  it("should always return status as 'pending' for any valid inputs", () => {
    fc.assert(
      fc.property(
        insertedIdArb,
        billHashArb,
        baseUrlArb,
        merchantNameArb,
        (insertedId, billHash, baseUrl, merchantName) => {
          const response = buildBillCreateResponse(insertedId, billHash, baseUrl, merchantName);
          expect(response.status).toBe("pending");
        }
      ),
      { numRuns: 100 }
    );
  });
});
