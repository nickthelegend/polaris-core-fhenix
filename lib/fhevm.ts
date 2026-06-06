/**
 * Fhenix CoFHE Compatibility Shim for legacy fhevm.ts imports.
 * The new SDK handles WASM initialization and secure context automatically.
 */

export async function getFhenixInstance() {
  console.log("[FHEVM Shim] Auto-initializing WASM context under @cofhe/sdk");
  return true;
}

export async function encrypt64() {
  throw new Error("encrypt64 is deprecated. Use useFhePrivateLending hooks.");
}

export async function encryptAddress() {
  throw new Error("encryptAddress is deprecated. Use useFhePrivateLending hooks.");
}
