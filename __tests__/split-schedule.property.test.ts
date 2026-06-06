// Feature: polaris-credit-bnpl, Property 7: Split-in-3 schedule and initial deduction
import * as fc from "fast-check";
import { generateSplitSchedule } from "@/lib/credit-utils";

const DAY_IN_SECONDS = 86400;

/**
 * **Validates: Requirements 6.2, 6.3, 6.4**
 *
 * Property 7: Split-in-3 schedule and initial deduction
 * For any checkout timestamp and total amount, the Split-in-3 engine shall
 * schedule three due dates at [checkoutTime, checkoutTime + 30 days,
 * checkoutTime + 60 days], and the initial credit deduction shall equal
 * one-third of the total amount.
 */
describe("Property 7: Split-in-3 schedule and initial deduction", () => {
  it("should produce exactly 3 due dates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (checkoutTime, totalAmount) => {
          const { dueDates } = generateSplitSchedule(checkoutTime, totalAmount);
          expect(dueDates).toHaveLength(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should place due dates at 0, 30, and 60 days from checkout", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (checkoutTime, totalAmount) => {
          const { dueDates } = generateSplitSchedule(checkoutTime, totalAmount);
          expect(dueDates[0]).toBe(checkoutTime);
          expect(dueDates[1]).toBe(checkoutTime + 30 * DAY_IN_SECONDS);
          expect(dueDates[2]).toBe(checkoutTime + 60 * DAY_IN_SECONDS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should produce strictly increasing due dates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (checkoutTime, totalAmount) => {
          const { dueDates } = generateSplitSchedule(checkoutTime, totalAmount);
          for (let i = 1; i < dueDates.length; i++) {
            expect(dueDates[i]).toBeGreaterThan(dueDates[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should set initial deduction to floor(totalAmount / 3)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (checkoutTime, totalAmount) => {
          const { initialDeduction } = generateSplitSchedule(checkoutTime, totalAmount);
          expect(initialDeduction).toBe(Math.floor(totalAmount / 3));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should space second and third due dates exactly 30 days apart", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (checkoutTime, totalAmount) => {
          const { dueDates } = generateSplitSchedule(checkoutTime, totalAmount);
          expect(dueDates[1] - dueDates[0]).toBe(30 * DAY_IN_SECONDS);
          expect(dueDates[2] - dueDates[1]).toBe(30 * DAY_IN_SECONDS);
        }
      ),
      { numRuns: 100 }
    );
  });
});
