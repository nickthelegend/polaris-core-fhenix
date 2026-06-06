// Feature: polaris-credit-bnpl, Property 1: Credit line calculation
import * as fc from "fast-check";
import { computeCreditLine } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 1.2, 3.1, 3.2, 3.3**
 *
 * Property 1: Credit line calculation
 * For any non-negative collateral value and any non-negative active debt value,
 * the computed available credit line shall equal max(collateral * 0.9 - activeDebt, 0).
 * When collateral is zero, the result must be zero regardless of debt.
 */
describe("Property 1: Credit line calculation", () => {
  it("should equal max(collateral * 0.9 - activeDebt, 0) for any non-negative collateral and debt", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (collateral, activeDebt) => {
          const result = computeCreditLine(collateral, activeDebt);
          const expected = Math.max(collateral * 0.9 - activeDebt, 0);
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should always return a non-negative value", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (collateral, activeDebt) => {
          const result = computeCreditLine(collateral, activeDebt);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return zero when collateral is zero regardless of debt", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (activeDebt) => {
          const result = computeCreditLine(0, activeDebt);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return zero when activeDebt >= collateral * 0.9", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (collateral) => {
          const threshold = collateral * 0.9;
          // debt at or above the threshold
          const debt = threshold + Math.abs(collateral) * 0.1;
          const result = computeCreditLine(collateral, debt);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
