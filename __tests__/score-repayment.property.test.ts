// Feature: polaris-credit-bnpl, Property 14: Score increases on repayment
import * as fc from "fast-check";
import { applyRepaymentBonus } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 4.2, 10.4**
 *
 * Property 14: Score increases on repayment
 * For any user with a credit score in [300, 850], after a successful repayment
 * event, the user's credit score shall increase by 5 points (capped at 850).
 */

describe("Property 14: Score increases on repayment", () => {
  it("should increase score by exactly 5 when below 846", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 845 }),
        (score) => {
          const updated = applyRepaymentBonus(score);
          expect(updated).toBe(score + 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should cap score at 850 when within 5 points of maximum", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 846, max: 850 }),
        (score) => {
          const updated = applyRepaymentBonus(score);
          expect(updated).toBe(850);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should always produce a score in the valid range [300, 850]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const updated = applyRepaymentBonus(score);
          expect(updated).toBeGreaterThanOrEqual(300);
          expect(updated).toBeLessThanOrEqual(850);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be monotonically non-decreasing", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const updated = applyRepaymentBonus(score);
          expect(updated).toBeGreaterThanOrEqual(score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be idempotent at the cap (850 stays 850)", () => {
    const updated = applyRepaymentBonus(850);
    expect(updated).toBe(850);
  });
});
