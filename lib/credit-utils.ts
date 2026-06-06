// Pure computation functions for the Polaris Credit & BNPL system.
// No side effects or external dependencies.

import crypto from "crypto";

const DAY_IN_SECONDS = 86400;

/**
 * Generate a unique pair of API credentials for a merchant app.
 * Mirrors the credential generation logic from polaris-merchant-app/app/api/apps/route.ts.
 *   - clientId:     `prod_<UUID without dashes>`
 *   - clientSecret: `sk_<24 random bytes as hex>`
 */
export function generateCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = `prod_${crypto.randomUUID().replace(/-/g, "")}`;
  const clientSecret = `sk_${crypto.randomBytes(24).toString("hex")}`;
  return { clientId, clientSecret };
}

/**
 * Compute the available credit line using 90% LTV.
 * credit = max(collateral * 0.9 - activeDebt, 0)
 */
export function computeCreditLine(
  collateral: number,
  activeDebt: number
): number {
  return Math.max(collateral * 0.9 - activeDebt, 0);
}

/**
 * Map a credit score (300–850) to a tier and color.
 *   300–499  → Poor,      Red
 *   500–649  → Fair,      Yellow
 *   650–749  → Good,      Green
 *   750–850  → Excellent, Bright Green
 */
export function getScoreTier(score: number): { tier: string; color: string } {
  if (score < 500) return { tier: "Poor", color: "Red" };
  if (score < 650) return { tier: "Fair", color: "Yellow" };
  if (score < 750) return { tier: "Good", color: "Green" };
  return { tier: "Excellent", color: "Bright Green" };
}

/**
 * Returns true when the credit score is below 400 (limited credit access warning).
 */
export function shouldShowWarning(score: number): boolean {
  return score < 400;
}

/**
 * Generate a BNPL repayment schedule: 4 due dates at 14, 28, 42, 56 days
 * from the given start timestamp (in seconds).
 */
export function generateBNPLSchedule(startTime: number): number[] {
  return [
    startTime + 14 * DAY_IN_SECONDS,
    startTime + 28 * DAY_IN_SECONDS,
    startTime + 42 * DAY_IN_SECONDS,
    startTime + 56 * DAY_IN_SECONDS,
  ];
}

/**
 * Split a total amount into three installments that sum exactly to the total.
 * First two installments = floor(totalAmount / 3), third = remainder.
 */
export function computeSplitInstallments(
  totalAmount: number
): [number, number, number] {
  const base = Math.floor(totalAmount / 3);
  const remainder = totalAmount - base * 2;
  return [base, base, remainder];
}

/**
 * Generate a Split-in-3 schedule: 3 due dates at 0, 30, 60 days from checkout,
 * plus the initial deduction (first installment = totalAmount / 3).
 */
export function generateSplitSchedule(
  checkoutTime: number,
  totalAmount: number
): { dueDates: number[]; initialDeduction: number } {
  const dueDates = [
    checkoutTime,
    checkoutTime + 30 * DAY_IN_SECONDS,
    checkoutTime + 60 * DAY_IN_SECONDS,
  ];
  const initialDeduction = Math.floor(totalAmount / 3);
  return { dueDates, initialDeduction };
}

/**
 * BNPL eligibility: credit line must cover the full purchase amount.
 */
export function isBNPLEligible(
  creditLine: number,
  amount: number
): boolean {
  return creditLine >= amount;
}

/**
 * Split-in-3 eligibility: credit line must cover at least one-third of the amount.
 */
export function isSplit3Eligible(
  creditLine: number,
  amount: number
): boolean {
  return creditLine >= amount / 3;
}

/**
 * Compute the remaining merchant balance after a withdrawal.
 * balance - amount, where amount must be <= balance.
 */
export function computePostWithdrawalBalance(
  balance: number,
  amount: number
): number {
  return balance - amount;
}

/**
 * Apply a repayment bonus to a credit score.
 * Each successful repayment increases the score by 5 points, capped at 850.
 */
export function applyRepaymentBonus(currentScore: number): number {
  return Math.min(currentScore + 5, 850);
}

/**
 * Check whether a loan is eligible for liquidation.
 * A loan is liquidatable when it is Active, its final due date has passed,
 * and there is remaining unpaid balance.
 */
export function checkLiquidatable(
  loan: { status: LoanStatus; dueDates: number[]; principal: number; interestAmount: number; repaid: number },
  currentTime: number
): boolean {
  if (loan.status !== "Active") return false;
  if (loan.dueDates.length === 0) return false;
  const finalDueDate = loan.dueDates[loan.dueDates.length - 1];
  const totalDebt = loan.principal + loan.interestAmount;
  const remaining = totalDebt - loan.repaid;
  return currentTime > finalDueDate && remaining > 0;
}

/**
 * Apply a liquidation penalty to a credit score.
 * Decreases the score by 50 points, floored at 300.
 */
export function applyLiquidationPenalty(currentScore: number): number {
  return Math.max(currentScore - 50, 300);
}

/**
 * Compute remaining collateral after a liquidation slash.
 * The outstanding amount is deducted from the collateral, floored at 0.
 */
export function computeCollateralSlash(
  collateral: number,
  outstandingAmount: number
): number {
  return Math.max(collateral - outstandingAmount, 0);
}

/**
 * Create a MerchantApp-like record from the given inputs.
 * Uses generateCredentials() for client_id/client_secret.
 */
export interface MerchantAppRecord {
  name: string;
  category: string;
  wallet_address: string;
  client_id: string;
  client_secret: string;
  status: "active" | "inactive";
  created_at: Date;
}

export function createMerchantAppRecord(
  name: string,
  category: string,
  walletAddress: string
): MerchantAppRecord {
  const { clientId, clientSecret } = generateCredentials();
  return {
    name,
    category,
    wallet_address: walletAddress,
    client_id: clientId,
    client_secret: clientSecret,
    status: "active",
    created_at: new Date(),
  };
}

/**
 * Build the bill create API response object.
 * Mirrors the response shape produced by both polaris-core and polaris-merchant-app
 * bill creation routes.
 */
export function buildBillCreateResponse(
  insertedId: string,
  billHash: string,
  baseUrl: string,
  merchantName: string
): {
  billId: string;
  billHash: string;
  checkoutUrl: string;
  merchantName: string;
  status: "pending";
} {
  return {
    billId: insertedId,
    billHash,
    checkoutUrl: `${baseUrl}/pay/${billHash}`,
    merchantName,
    status: "pending" as const,
  };
}

/**
 * Find a merchant app record by clientId in an array of records.
 */
export function findMerchantAppByClientId(
  records: MerchantAppRecord[],
  clientId: string
): MerchantAppRecord | undefined {
  return records.find((r) => r.client_id === clientId);
}

/** Loan status enum mirroring the on-chain LoanStatus. */
export type LoanStatus = "Active" | "Repaid" | "Defaulted";

/** Minimal loan state used by pure repayment logic. */
export interface LoanState {
  principal: number;
  interestAmount: number;
  repaid: number;
  status: LoanStatus;
  activeDebt: number; // user-level active debt tracker
}

/** Result of applying a repayment to a loan. */
export interface RepaymentResult {
  loan: LoanState;
  effectiveAmount: number;
}

/**
 * Pure repayment logic mirroring LoanEngine._applyRepayment.
 *
 * - Caps the repayment at the remaining debt (principal + interest - repaid).
 * - Increases `repaid` by the effective amount.
 * - When cumulative repaid >= principal + interest, transitions status to "Repaid"
 *   and decreases activeDebt by the principal.
 * - Only operates on Active loans; returns unchanged state otherwise.
 */
export function applyRepayment(
  loan: LoanState,
  amount: number
): RepaymentResult {
  if (loan.status !== "Active") {
    return { loan: { ...loan }, effectiveAmount: 0 };
  }

  const totalDebt = loan.principal + loan.interestAmount;
  const remaining = totalDebt - loan.repaid;
  const effectiveAmount = Math.min(amount, remaining);

  const newRepaid = loan.repaid + effectiveAmount;
  const fullyRepaid = newRepaid >= totalDebt;

  return {
    loan: {
      ...loan,
      repaid: newRepaid,
      status: fullyRepaid ? "Repaid" : "Active",
      activeDebt: fullyRepaid
        ? loan.activeDebt - loan.principal
        : loan.activeDebt,
    },
    effectiveAmount,
  };
}
