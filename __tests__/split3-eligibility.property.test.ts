// Feature: polaris-credit-bnpl, Property 8: Split-in-3 insufficient credit guard
import * as fc from "fast-check";
import { isSplit3Eligible } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 6.5**
 *
 * Property 8: Split-in-3 insufficient credit guard
 * For any available credit line and purchase amount where the credit line is
 * less than one-third of the purchase amount, the Split-in-3 payment option
 * shall be disabled. Conversely, when credit line >= amount/3, it shall be enabled.
 */
describe("Property 8: Split-in-3 insufficient credit guard", () => {
  it("should be disabled when credit line is less than one-third of purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (creditLine, extra) => {
          // Ensure amount / 3 > creditLine → amount > creditLine * 3
          const amount = creditLine * 3 + Math.abs(extra) + 0.01;
          expect(isSplit3Eligible(creditLine, amount)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be enabled when credit line is greater than or equal to one-third of purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount, extra) => {
          // Ensure creditLine >= amount / 3
          const creditLine = amount / 3 + Math.abs(extra);
          expect(isSplit3Eligible(creditLine, amount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be enabled when credit line exactly equals one-third of purchase amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          expect(isSplit3Eligible(amount / 3, amount)).toBe(true);
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
          expect(isSplit3Eligible(creditLine, 0)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
