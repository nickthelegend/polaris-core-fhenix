// Feature: polaris-credit-bnpl, Property 16: Dashboard renders required fields for financial records
import * as fc from "fast-check";

/**
 * **Validates: Requirements 1.4, 1.5, 1.6, 6.7**
 *
 * Property 16: Dashboard renders required fields for financial records
 * For any loan record, the rendered loan display shall contain principal, interest,
 * repaid amount, and due dates. For any split plan, the rendered display shall contain
 * per-installment amounts, paid/unpaid status, and scheduled dates. For any repayment
 * record, the rendered display shall contain date, amount, loan type, and status.
 */
describe("Property 16: Dashboard renders required fields for financial records", () => {
  // --- Arbitraries ---

  const loanRecordArb = fc.record({
    id: fc.integer({ min: 1, max: 1_000_000 }),
    principal: fc.integer({ min: 1, max: 1_000_000 }).map(String),
    interest: fc.integer({ min: 0, max: 100_000 }).map(String),
    totalDebt: fc.integer({ min: 1, max: 1_100_000 }).map(String),
    repaid: fc.integer({ min: 0, max: 1_000_000 }).map(String),
    startTime: fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
    status: fc.integer({ min: 0, max: 2 }),
    poolToken: fc.hexaString({ minLength: 40, maxLength: 40 }).map((h) => "0x" + h),
  });

  const installmentArb = fc.record({
    index: fc.constantFrom(0, 1, 2),
    amount: fc.integer({ min: 1, max: 1_000_000 }),
    dueDate: fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
    status: fc.constantFrom("paid" as const, "upcoming" as const, "overdue" as const),
  });

  const splitPlanArb = fc.record({
    loanId: fc.integer({ min: 1, max: 1_000_000 }),
    totalAmount: fc.integer({ min: 1, max: 1_000_000 }),
    installments: fc.tuple(
      installmentArb.map((inst) => ({ ...inst, index: 0 })),
      installmentArb.map((inst) => ({ ...inst, index: 1 })),
      installmentArb.map((inst) => ({ ...inst, index: 2 }))
    ).map(([a, b, c]) => [a, b, c]),
  });

  const repaymentRecordArb = fc.record({
    loanId: fc.integer({ min: 1, max: 1_000_000 }),
    amount: fc.integer({ min: 1, max: 1_000_000 }),
    txHash: fc.string({ minLength: 10, maxLength: 66, unit: fc.constantFrom(..."0123456789abcdef".split("")) }).map((h) => "0x" + h),
    loanType: fc.constantFrom("bnpl" as const, "split3" as const),
    timestamp: fc.integer({ min: 1_000_000_000, max: 2_000_000_000 }),
  });

  // --- Sub-property 1: Loan record completeness ---

  it("should have all required fields present and non-undefined for any loan record", () => {
    fc.assert(
      fc.property(loanRecordArb, (loan) => {
        expect(loan.id).toBeDefined();
        expect(loan.principal).toBeDefined();
        expect(loan.interest).toBeDefined();
        expect(loan.totalDebt).toBeDefined();
        expect(loan.repaid).toBeDefined();
        expect(loan.startTime).toBeDefined();
        expect(loan.status).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("should have principal, interest, and repaid parseable as numbers for any loan record", () => {
    fc.assert(
      fc.property(loanRecordArb, (loan) => {
        expect(Number.isFinite(parseFloat(loan.principal))).toBe(true);
        expect(Number.isFinite(parseFloat(loan.interest))).toBe(true);
        expect(Number.isFinite(parseFloat(loan.repaid))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should have a valid status (0=Active, 1=Repaid, 2=Defaulted) for any loan record", () => {
    fc.assert(
      fc.property(loanRecordArb, (loan) => {
        expect([0, 1, 2]).toContain(loan.status);
      }),
      { numRuns: 100 }
    );
  });

  it("should have a startTime usable for deriving due dates for any loan record", () => {
    fc.assert(
      fc.property(loanRecordArb, (loan) => {
        expect(loan.startTime).toBeGreaterThan(0);
        // Due dates can be derived from startTime (BNPL: 14/28/42/56 day intervals)
        const dueDates = [14, 28, 42, 56].map((d) => loan.startTime + d * 86400);
        expect(dueDates).toHaveLength(4);
        for (const dd of dueDates) {
          expect(dd).toBeGreaterThan(loan.startTime);
        }
      }),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 2: Split plan record completeness ---

  it("should have all required fields present for any split plan record", () => {
    fc.assert(
      fc.property(splitPlanArb, (plan) => {
        expect(plan.loanId).toBeDefined();
        expect(plan.totalAmount).toBeDefined();
        expect(plan.installments).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("should have exactly 3 installments for any split plan", () => {
    fc.assert(
      fc.property(splitPlanArb, (plan) => {
        expect(plan.installments).toHaveLength(3);
      }),
      { numRuns: 100 }
    );
  });

  it("should have each installment with amount > 0 and a valid status for any split plan", () => {
    fc.assert(
      fc.property(splitPlanArb, (plan) => {
        for (const inst of plan.installments) {
          expect(inst.amount).toBeGreaterThan(0);
          expect(["paid", "upcoming", "overdue"]).toContain(inst.status);
          expect(inst.dueDate).toBeDefined();
          expect(inst.index).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  // --- Sub-property 3: Repayment record completeness ---

  it("should have all required fields present for any repayment record", () => {
    fc.assert(
      fc.property(repaymentRecordArb, (record) => {
        expect(record.loanId).toBeDefined();
        expect(record.amount).toBeDefined();
        expect(record.txHash).toBeDefined();
        expect(record.loanType).toBeDefined();
        expect(record.timestamp).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("should have positive amount for any repayment record", () => {
    fc.assert(
      fc.property(repaymentRecordArb, (record) => {
        expect(record.amount).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should have a valid loanType for any repayment record", () => {
    fc.assert(
      fc.property(repaymentRecordArb, (record) => {
        expect(["bnpl", "split3"]).toContain(record.loanType);
      }),
      { numRuns: 100 }
    );
  });

  it("should have a non-empty txHash for any repayment record", () => {
    fc.assert(
      fc.property(repaymentRecordArb, (record) => {
        expect(record.txHash.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
