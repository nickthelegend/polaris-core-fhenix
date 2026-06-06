/**
 * Bill status types and transition logic for the merchant billing system.
 */

export type BillStatus = "pending" | "paid" | "expired";
export type BillEvent = "payment";

/**
 * Transitions a bill's status based on an incoming event.
 *
 * Rules (from Requirement 8.2):
 * - A "pending" bill transitions to "paid" on a "payment" event.
 * - A "paid" bill stays "paid" (idempotent — no double-transition).
 * - An "expired" bill cannot be paid; it stays "expired".
 */
export function transitionBillStatus(
  currentStatus: BillStatus,
  event: BillEvent
): BillStatus {
  if (event === "payment") {
    if (currentStatus === "pending") return "paid";
    // Already paid or expired — no transition
    return currentStatus;
  }
  return currentStatus;
}
