// Feature: polaris-credit-bnpl, Property 3: Low score warning threshold
import * as fc from "fast-check";
import { shouldShowWarning } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 3.4**
 *
 * Property 3: Low score warning threshold
 * For any credit score below 400, the dashboard warning flag shall be true.
 * For any score >= 400, the warning flag shall be false.
 */
describe("Property 3: Low score warning threshold", () => {
  it("should return true for any score below 400", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 399 }),
        (score) => {
          expect(shouldShowWarning(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return false for any score >= 400", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 850 }),
        (score) => {
          expect(shouldShowWarning(score)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should classify the boundary value 400 as no warning", () => {
    expect(shouldShowWarning(400)).toBe(false);
  });

  it("should classify the boundary value 399 as warning", () => {
    expect(shouldShowWarning(399)).toBe(true);
  });
});
