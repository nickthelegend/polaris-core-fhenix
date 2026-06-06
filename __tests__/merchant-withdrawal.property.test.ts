// Feature: polaris-credit-bnpl, Property 12: Merchant withdrawal balance invariant
import * as fc from "fast-check";
import { computePostWithdrawalBalance } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 8.4**
 *
 * Property 12: Merchant withdrawal balance invariant
 * For any merchant with a positive token balance, after a withdrawal of amount X
 * (where X <= balance), the merchant's remaining balance shall equal the previous
 * balance minus X.
 */
describe("Property 12: Merchant withdrawal balance invariant", () => {
  it("remaining balance equals previous balance minus withdrawal amount", () => {
    fc.assert(
      fc.property(
        fc
          .double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
          .chain((balance) =>
            fc
              .double({ min: 0, max: balance, noNaN: true, noDefaultInfinity: true })
              .map((amount) => ({ balance, amount }))
          ),
        ({ balance, amount }) => {
          const remaining = computePostWithdrawalBalance(balance, amount);
          expect(remaining).toBeCloseTo(balance - amount, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withdrawing the full balance leaves zero", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (balance) => {
          const remaining = computePostWithdrawalBalance(balance, balance);
          expect(remaining).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withdrawing zero leaves balance unchanged", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (balance) => {
          const remaining = computePostWithdrawalBalance(balance, 0);
          expect(remaining).toBe(balance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("remaining balance is always non-negative when amount <= balance", () => {
    fc.assert(
      fc.property(
        fc
          .double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
          .chain((balance) =>
            fc
              .double({ min: 0, max: balance, noNaN: true, noDefaultInfinity: true })
              .map((amount) => ({ balance, amount }))
          ),
        ({ balance, amount }) => {
          const remaining = computePostWithdrawalBalance(balance, amount);
          expect(remaining).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
