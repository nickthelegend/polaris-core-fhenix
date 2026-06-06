// Feature: polaris-credit-bnpl, Property 13: Repayment updates loan state correctly
import * as fc from "fast-check";
import { applyRepayment, LoanState } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 10.1, 10.2, 10.3**
 *
 * Property 13: Repayment updates loan state correctly
 * For any active loan and any repayment amount, the loan's repaid field shall
 * increase by the effective repayment amount (capped at remaining debt). When
 * the cumulative repaid amount equals or exceeds principal + interest, the loan
 * status shall become Repaid and the user's active debt shall decrease by the
 * principal.
 */

/** Arbitrary generator for an active loan with consistent constraints. */
const activeLoanArb = fc
  .record({
    principal: fc.integer({ min: 1, max: 1_000_000 }),
    interestAmount: fc.integer({ min: 0, max: 100_000 }),
    // repaid is between 0 and totalDebt - 1 so the loan is still active
    repaidFraction: fc.double({ min: 0, max: 0.99, noNaN: true }),
    extraDebt: fc.integer({ min: 0, max: 500_000 }),
  })
  .map(({ principal, interestAmount, repaidFraction, extraDebt }) => {
    const totalDebt = principal + interestAmount;
    const repaid = Math.floor(totalDebt * repaidFraction);
    return {
      principal,
      interestAmount,
      repaid,
      status: "Active" as const,
      activeDebt: principal + extraDebt, // activeDebt >= principal
    };
  });

describe("Property 13: Repayment updates loan state correctly", () => {
  it("should increase repaid by the effective amount (capped at remaining debt)", () => {
    fc.assert(
      fc.property(
        activeLoanArb,
        fc.integer({ min: 1, max: 2_000_000 }),
        (loan, amount) => {
          const totalDebt = loan.principal + loan.interestAmount;
          const remaining = totalDebt - loan.repaid;
          const expectedEffective = Math.min(amount, remaining);

          const { loan: updated, effectiveAmount } = applyRepayment(loan, amount);

          expect(effectiveAmount).toBe(expectedEffective);
          expect(updated.repaid).toBe(loan.repaid + expectedEffective);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should transition to Repaid when cumulative repaid >= principal + interest", () => {
    fc.assert(
      fc.property(activeLoanArb, (loan) => {
        const totalDebt = loan.principal + loan.interestAmount;
        const remaining = totalDebt - loan.repaid;
        // Pay exactly the remaining amount to fully repay
        const { loan: updated } = applyRepayment(loan, remaining);

        expect(updated.status).toBe("Repaid");
        expect(updated.repaid).toBe(totalDebt);
      }),
      { numRuns: 100 }
    );
  });

  it("should decrease activeDebt by principal when fully repaid", () => {
    fc.assert(
      fc.property(activeLoanArb, (loan) => {
        const totalDebt = loan.principal + loan.interestAmount;
        const remaining = totalDebt - loan.repaid;

        const { loan: updated } = applyRepayment(loan, remaining);

        expect(updated.activeDebt).toBe(loan.activeDebt - loan.principal);
      }),
      { numRuns: 100 }
    );
  });

  it("should keep status Active when repayment does not cover full debt", () => {
    fc.assert(
      fc.property(
        activeLoanArb,
        (loan) => {
          const totalDebt = loan.principal + loan.interestAmount;
          const remaining = totalDebt - loan.repaid;
          if (remaining <= 1) return; // skip if already nearly repaid

          // Pay less than remaining
          const partialAmount = Math.floor(remaining / 2);
          if (partialAmount === 0) return;

          const { loan: updated } = applyRepayment(loan, partialAmount);

          expect(updated.status).toBe("Active");
          expect(updated.activeDebt).toBe(loan.activeDebt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should cap effective amount at remaining debt even when overpaying", () => {
    fc.assert(
      fc.property(
        activeLoanArb,
        fc.integer({ min: 1, max: 1_000_000 }),
        (loan, extra) => {
          const totalDebt = loan.principal + loan.interestAmount;
          const remaining = totalDebt - loan.repaid;
          const overpayment = remaining + extra;

          const { loan: updated, effectiveAmount } = applyRepayment(
            loan,
            overpayment
          );

          expect(effectiveAmount).toBe(remaining);
          expect(updated.repaid).toBe(totalDebt);
          expect(updated.status).toBe("Repaid");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be a no-op on non-Active loans", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("Repaid" as const, "Defaulted" as const),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (status, principal, interestAmount, repaid, amount) => {
          const loan: LoanState = {
            principal,
            interestAmount,
            repaid,
            status,
            activeDebt: principal,
          };

          const { loan: updated, effectiveAmount } = applyRepayment(
            loan,
            amount
          );

          expect(effectiveAmount).toBe(0);
          expect(updated.repaid).toBe(loan.repaid);
          expect(updated.status).toBe(status);
          expect(updated.activeDebt).toBe(loan.activeDebt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
