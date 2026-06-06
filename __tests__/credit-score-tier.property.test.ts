// Feature: polaris-credit-bnpl, Property 2: Credit score tier classification
import * as fc from "fast-check";
import { getScoreTier } from "@/lib/credit-utils";

/**
 * **Validates: Requirements 4.1**
 *
 * Property 2: Credit score tier classification
 * For any credit score in the range [300, 850], the tier classification function
 * shall return "Poor" for 300–499, "Fair" for 500–649, "Good" for 650–749,
 * and "Excellent" for 750–850, and the associated color shall match the tier.
 */
describe("Property 2: Credit score tier classification", () => {
  it("should return the correct tier and color for any score in [300, 850]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const { tier, color } = getScoreTier(score);

          if (score >= 300 && score <= 499) {
            expect(tier).toBe("Poor");
            expect(color).toBe("Red");
          } else if (score >= 500 && score <= 649) {
            expect(tier).toBe("Fair");
            expect(color).toBe("Yellow");
          } else if (score >= 650 && score <= 749) {
            expect(tier).toBe("Good");
            expect(color).toBe("Green");
          } else {
            expect(tier).toBe("Excellent");
            expect(color).toBe("Bright Green");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return exactly one of the four valid tiers for any score in range", () => {
    const validTiers = ["Poor", "Fair", "Good", "Excellent"];
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const { tier } = getScoreTier(score);
          expect(validTiers).toContain(tier);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should assign matching color for every tier", () => {
    const tierColorMap: Record<string, string> = {
      Poor: "Red",
      Fair: "Yellow",
      Good: "Green",
      Excellent: "Bright Green",
    };
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 850 }),
        (score) => {
          const { tier, color } = getScoreTier(score);
          expect(color).toBe(tierColorMap[tier]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should classify boundary values correctly", () => {
    // Exact boundary checks at tier transitions
    expect(getScoreTier(300)).toEqual({ tier: "Poor", color: "Red" });
    expect(getScoreTier(499)).toEqual({ tier: "Poor", color: "Red" });
    expect(getScoreTier(500)).toEqual({ tier: "Fair", color: "Yellow" });
    expect(getScoreTier(649)).toEqual({ tier: "Fair", color: "Yellow" });
    expect(getScoreTier(650)).toEqual({ tier: "Good", color: "Green" });
    expect(getScoreTier(749)).toEqual({ tier: "Good", color: "Green" });
    expect(getScoreTier(750)).toEqual({ tier: "Excellent", color: "Bright Green" });
    expect(getScoreTier(850)).toEqual({ tier: "Excellent", color: "Bright Green" });
  });
});
