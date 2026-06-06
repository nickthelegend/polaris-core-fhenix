// Feature: polaris-credit-bnpl, Property 5: BNPL insufficient credit guard
import * as fc from "fast-check";
import { isBNPLEligible } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 5.4**
 *
 * Property 5: BNPL insufficient credit guard
 * For any available credit line and purchase amount where the credit line is
 * less than the purchase amount, the BNPL payment option shall be disabled.
 * Conversely, when credit line >= purchase amount, it shall be enabled.
 */
describe("Property 5: BNPL insufficient credit guard", () => {
  it("should be disabled when credit line is less than purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (creditLine, extra) => {
          // Ensure amount > creditLine by adding a positive offset
          const amount = creditLine + Math.abs(extra) + 0.01;
          expect(isBNPLEligible(creditLine, amount)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be enabled when credit line is greater than or equal to purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount, extra) => {
          // Ensure creditLine >= amount
          const creditLine = amount + Math.abs(extra);
          expect(isBNPLEligible(creditLine, amount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be enabled when credit line exactly equals purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          expect(isBNPLEligible(amount, amount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be enabled for zero amount regardless of credit line", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (creditLine) => {
          expect(isBNPLEligible(creditLine, 0)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
