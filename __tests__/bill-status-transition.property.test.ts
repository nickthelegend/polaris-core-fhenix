// Feature: polaris-credit-bnpl, Property 11: Bill status transition on payment
import * as fc from "fast-check";
import { transitionBillStatus, BillStatus } from "@/lib/bill-utils";

/**
 * **Validates: Requirements 8.2**
 *
 * Property 11: Bill status transition on payment
 * For any bill in "pending" status, when a payment is recorded against it,
 * the bill status shall transition to "paid". A bill already in "paid" status
 * shall not transition again.
 */
describe("Property 11: Bill status transition on payment", () => {
  const billStatusArb: fc.Arbitrary<BillStatus> = fc.constantFrom(
    "pending",
    "paid",
    "expired"
  );

  it("should transition a pending bill to paid on payment", () => {
    fc.assert(
      fc.property(fc.constant("pending" as BillStatus), (status) => {
        const result = transitionBillStatus(status, "payment");
        expect(result).toBe("paid");
      }),
      { numRuns: 100 }
    );
  });

  it("should keep a paid bill as paid on payment (no double-transition)", () => {
    fc.assert(
      fc.property(fc.constant("paid" as BillStatus), (status) => {
        const result = transitionBillStatus(status, "payment");
        expect(result).toBe("paid");
      }),
      { numRuns: 100 }
    );
  });

  it("should never transition an expired bill on payment", () => {
    fc.assert(
      fc.property(fc.constant("expired" as BillStatus), (status) => {
        const result = transitionBillStatus(status, "payment");
        expect(result).toBe("expired");
      }),
      { numRuns: 100 }
    );
  });

  it("should be idempotent: applying payment twice yields the same result as once", () => {
    fc.assert(
      fc.property(billStatusArb, (status) => {
        const once = transitionBillStatus(status, "payment");
        const twice = transitionBillStatus(once, "payment");
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });

  it("should only produce 'paid' from 'pending'; all other statuses remain unchanged", () => {
    fc.assert(
      fc.property(billStatusArb, (status) => {
        const result = transitionBillStatus(status, "payment");
        if (status === "pending") {
          expect(result).toBe("paid");
        } else {
          expect(result).toBe(status);
        }
      }),
      { numRuns: 100 }
    );
  });
});
