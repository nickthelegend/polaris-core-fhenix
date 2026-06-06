/**
 * POLARIS PROTOCOL — REVERT MAPPER
 * Maps cryptic Ethereum revert strings and Solidity error selectors to human-readable messages.
 */

const ERROR_MAP: Record<string, string> = {
  // Common ERC20 / Provider Errors
  "ACTION_REJECTED": "Transaction was rejected in your wallet.",
  "INSUFFICIENT_FUNDS": "Insufficient ETH for gas fees.",
  "UNPREDICTABLE_GAS_LIMIT": "Gas estimation failed. The transaction is likely to revert.",
  "USER_REJECTED": "Transaction was cancelled.",
  
  // Custom Solidity Errors (Common Selectors)
  "0xf4d678b8": "Insufficient balance for this action.", // Example: InsufficientBalance()
  "0x82b42900": "Unauthorized: You do not have permission for this operation.", // Example: Unauthorized()
  "0x4e487b71": "Arithmetic overflow or underflow.", // Panic(uint256)
  
  // Protocol Specific Strings (Found in 'reason' or 'message')
  "already processed": "This transaction has already been synced to the Polaris Hub.",
  "replay": "Transaction replay detected. This action was already completed.",
  "HUB_NOT_SYNCED": "The Polaris Oracle is still processing. Please try again in 2-3 minutes.",
  "Insufficient credit limit": "Your credit limit is too low. Please supply more collateral.",
  "Oracle not synced": "Wait for the Hub Oracle to verify the latest block continuity.",
  "Native verification failed": "ZK-Proof verification failed. Please try re-generating the proof.",
};

export function parseRevertReason(error: any): string {
  // 1. Extract the raw reason/message
  const message = error?.reason || error?.message || String(error);
  
  // 2. Check for known string matches
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 3. Handle specific Ethers/Wagmi error objects
  if (error?.code === 'ACTION_REJECTED') return ERROR_MAP["ACTION_REJECTED"];
  
  // 4. Fallback to a cleaner version of the original message
  // Strip common prefixes like "Execution reverted: "
  return message
    .replace("execution reverted: ", "")
    .replace("unknown custom error ", "Contract error: ")
    .split("(")[0] // Remove function arguments if present
    .trim();
}
