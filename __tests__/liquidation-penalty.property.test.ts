// Feature: polaris-credit-bnpl, Property 15: Liquidation penalty and collateral slash
import * as fc from "fast-check";
import {
  checkLiquidatable,
  applyLiquidationPenalty,
  computeCollateralSlash,
  LoanStatus,
} from "@/lib/credit-utils";

/**
 * **Validates: Requirements 10.5, 10.6, 4.3**
 *
 * Property 15: Liquidation penalty and collateral slash
 * For any active loan past its final due date with remaining unpaid balance,
 * the loan shall be eligible for liquidation. Upon liquidation, the borrower's
 * credit score shall decrease by 50 points (floored at 300), and the borrower's
 * collateral shall be slashed by the outstanding amount.
 */

const DAY_IN_SECONDS = 86400;

/** Generator for an active loan with due dates and partial repayment. */
const liquidatableLoanArb = fc
  .record({
    principal: fc.integer({ min: 1, max: 1_000_000 }),
    interestAmount: fc.integer({ min: 0, max: 100_000 }),
    repaidFraction: fc.double({ min: 0, max: 0.99, noNaN: true }),
    startTime: fc.integer({ min: 1_000_000, max: 2_000_000_000 }),
    numDueDates: fc.integer({ min: 1, max: 4 }),
  })
  .map(({ principal, interestAmount, repaidFraction, startTime, numDueDates }) => {
    const totalDebt = principal + interestAmount;
    const repaid = Math.floor(totalDebt * repaidFraction);
    const dueDates = Array.from(
      { length: numDueDates },
      (_, i) => startTime + (i + 1) * 14 * DAY_IN_SECONDS
    );
    return {
      principal,
      interestAmount,
      repaid,
      status: "Active" as const,
      dueDates,
    };
  });

describe("Property 15: Liquidation penalty and collateral slash", () => {
  it("should mark an active loan as liquidatable when past final due date with unpaid balance", () => {
    fc.assert(
      fc.property(
        liquidatableLoanArb,
        fc.integer({ min: 1, max: 1_000_000 }),
        (loan, extraSeconds) => {
          const finalDueDate = loan.dueDates[loan.dueDates.length - 1];
          const currentTime = finalDueDate + extraSeconds; // past the final due date

          expect(checkLiquidatable(loan, currentTime)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT mark a loan as liquidatable when before or at the final due date", () => {
    fc.assert(
      fc.property(
        liquidatableLoanArb,
        fc.integer({ min: 0, max: 1_000_000 }),
        (loan, secondsBefore) => {
          const finalDueDate = loan.dueDates[loan.dueDates.length - 1];
          const currentTime = finalDueDate - secondsBefore; // at or before final due date

          expect(checkLiquidatable(loan, currentTime)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT mark non-Active loans as liquidatable", () => {
    fc.assert(
      fc.property(
        liquidatableLoanArb,
        fc.constantFrom("Repaid" as LoanStatus, "Defaulted" as LoanStatus),
        fc.integer({ min: 1, max: 1_000_000 }),
        (loan, status, extraSeconds) => {
          const nonActiveLoan = { ...loan, status };
          const finalDueDate = loan.dueDates[loan.dueDates.length - 1];
          const currentTime = finalDueDate + extraSeconds;

          expect(checkLiquidatable(nonActiveLoan, currentTime)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should decrease credit score by 50 on liquidation, floored at 300", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const penalized = applyLiquidationPenalty(score);

          expect(penalized).toBe(Math.max(score - 50, 300));
          expect(penalized).toBeGreaterThanOrEqual(300);
          expect(penalized).toBeLessThanOrEqual(score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should floor the penalized score at 300 for scores near the minimum", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 349 }),
        (score) => {
          expect(applyLiquidationPenalty(score)).toBe(300);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should slash collateral by the outstanding amount, floored at 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (collateral, outstanding) => {
          const remaining = computeCollateralSlash(collateral, outstanding);

          expect(remaining).toBe(Math.max(collateral - outstanding, 0));
          expect(remaining).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should slash collateral to 0 when outstanding exceeds collateral", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500_000 }),
        fc.integer({ min: 1, max: 500_000 }),
        (collateral, extra) => {
          const outstanding = collateral + extra;
          expect(computeCollateralSlash(collateral, outstanding)).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
