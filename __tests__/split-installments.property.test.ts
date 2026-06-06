// Feature: polaris-credit-bnpl, Property 6: Split-in-3 installment calculation
import * as fc from "fast-check";
import { computeSplitInstallments } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 6.1**
 *
 * Property 6: Split-in-3 installment calculation
 * For any positive total purchase amount, each of the three installments shall
 * equal floor(totalAmount / 3) or ceil(totalAmount / 3) such that the three
 * installments sum exactly to the total amount.
 */
describe("Property 6: Split-in-3 installment calculation", () => {
  it("should return exactly three installments", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (totalAmount) => {
          const installments = computeSplitInstallments(totalAmount);
          expect(installments).toHaveLength(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should sum installments exactly to the total amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (totalAmount) => {
          const [a, b, c] = computeSplitInstallments(totalAmount);
          expect(a + b + c).toBe(totalAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have first two installments equal floor(total/3) and third absorb remainder", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (totalAmount) => {
          const base = Math.floor(totalAmount / 3);
          const [a, b, c] = computeSplitInstallments(totalAmount);
          expect(a).toBe(base);
          expect(b).toBe(base);
          expect(c).toBe(totalAmount - base * 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should produce non-negative installments for any positive amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        (totalAmount) => {
          const installments = computeSplitInstallments(totalAmount);
          for (const inst of installments) {
            expect(inst).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle amounts evenly divisible by 3", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 333_333_333 }),
        (base) => {
          const totalAmount = base * 3;
          const [a, b, c] = computeSplitInstallments(totalAmount);
          expect(a).toBe(base);
          expect(b).toBe(base);
          expect(c).toBe(base);
        }
      ),
      { numRuns: 100 }
    );
  });
});
