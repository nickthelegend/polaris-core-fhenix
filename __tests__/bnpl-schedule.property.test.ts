// Feature: polaris-credit-bnpl, Property 4: BNPL loan schedule generation
import * as fc from "fast-check";
import { generateBNPLSchedule } from "@/lib/credit-utils";

const DAY_IN_SECONDS = 86400;

/**
 * **Validates: Requirements 5.3**
 *
 * Property 4: BNPL loan schedule generation
 * For any start timestamp, a BNPL loan shall produce exactly 4 due dates
 * at intervals of 14, 28, 42, and 56 days from the start timestamp.
 */
describe("Property 4: BNPL loan schedule generation", () => {
  it("should produce exactly 4 due dates for any start timestamp", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        (startTime) => {
          const schedule = generateBNPLSchedule(startTime);
          expect(schedule).toHaveLength(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should place due dates at 14, 28, 42, and 56 days from start", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        (startTime) => {
          const schedule = generateBNPLSchedule(startTime);
          expect(schedule[0]).toBe(startTime + 14 * DAY_IN_SECONDS);
          expect(schedule[1]).toBe(startTime + 28 * DAY_IN_SECONDS);
          expect(schedule[2]).toBe(startTime + 42 * DAY_IN_SECONDS);
          expect(schedule[3]).toBe(startTime + 56 * DAY_IN_SECONDS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should produce strictly increasing due dates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        (startTime) => {
          const schedule = generateBNPLSchedule(startTime);
          for (let i = 1; i < schedule.length; i++) {
            expect(schedule[i]).toBeGreaterThan(schedule[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should space each consecutive due date exactly 14 days apart", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        (startTime) => {
          const schedule = generateBNPLSchedule(startTime);
          for (let i = 1; i < schedule.length; i++) {
            expect(schedule[i] - schedule[i - 1]).toBe(14 * DAY_IN_SECONDS);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have all due dates after the start timestamp", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2_000_000_000 }),
        (startTime) => {
          const schedule = generateBNPLSchedule(startTime);
          for (const dueDate of schedule) {
            expect(dueDate).toBeGreaterThan(startTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
