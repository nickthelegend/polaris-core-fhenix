import { type Address, toHex } from "viem"

// Lazy-loaded singleton — avoids WASM init on every page
let instancePromise: Promise<any> | null = null

/**
 * Initializes and returns the Fhenix FHEVM instance.
 * Derives pattern from sibling project (BlindPool).
 */
export async function getFhenixInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      console.log("[FHEVM] Importing relayer-sdk/web...")
      const mod = (await import("@fhenix-fhe/relayer-sdk/web")) as any
      
      console.log("[FHEVM] relayer-sdk/web imported", {
        modKeys: Object.keys(mod),
        defaultKeys: mod.default ? Object.keys(mod.default) : null,
        hasInitSDK: typeof mod.initSDK === "function",
        hasDefaultInitSDK: mod.default && typeof mod.default.initSDK === "function"
      })

      // Prioritize named exports as seen in the compiled JS
      const createInstance = mod.createInstance || mod.default?.createInstance
      const SepoliaConfig = mod.SepoliaConfig || mod.default?.SepoliaConfig
      const initSDK = mod.initSDK || mod.default?.initSDK

      if (typeof initSDK !== "function") {
        throw new TypeError(`initSDK is not a function in @fhenix-fhe/relayer-sdk/web. Available keys: ${Object.keys(mod).join(", ")}`)
      }

      console.log("[FHEVM] Initializing WASM (initSDK)...")
      await initSDK()

      console.log("[FHEVM] WASM ready, creating instance...")
      // Using public Sepolia RPC as fallback
      const instance = await createInstance({
        ...SepoliaConfig,
        network: process.env.NEXT_PUBLIC_NETWORK_URL || "https://ethereum-sepolia-rpc.publicnode.com"
      })

      console.log("[FHEVM] Instance created successfully")
      return instance
    })()
  }
  return instancePromise
}

/**
 * Encrypts a 64-bit value for a specific contract.
 * Returns handles and inputProof for use in contract calls.
 */
export async function encrypt64(
  contractAddress: Address,
  userAddress: Address,
  value: bigint | number
): Promise<{ handles: `0x${string}`[]; inputProof: `0x${string}` }> {
  console.log("[FHEVM] encrypt64:", { contractAddress, userAddress, value: value.toString() })
  
  const instance = await getFhenixInstance()
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  input.add64(BigInt(value))
  
  const encrypted = await input.encrypt()
  
  const handles = encrypted.handles.map((h: Uint8Array | string) =>
    typeof h === "string" ? h as `0x${string}` : toHex(h)
  )
  
  const inputProof = typeof encrypted.inputProof === "string"
    ? encrypted.inputProof as `0x${string}`
    : toHex(encrypted.inputProof)
    
  return { handles, inputProof }
}

/**
 * Encrypts an address for a specific contract.
 */
export async function encryptAddress(
  contractAddress: Address,
  userAddress: Address,
  targetAddress: Address
): Promise<{ handles: `0x${string}`[]; inputProof: `0x${string}` }> {
  const instance = await getFhenixInstance()
  const input = instance.createEncryptedInput(contractAddress, userAddress)
  input.addAddress(targetAddress)
  
  const encrypted = await input.encrypt()
  
  const handles = encrypted.handles.map((h: Uint8Array | string) =>
    typeof h === "string" ? h as `0x${string}` : toHex(h)
  )
  
  const inputProof = typeof encrypted.inputProof === "string"
    ? encrypted.inputProof as `0x${string}`
    : toHex(encrypted.inputProof)
    
  return { handles, inputProof }
}
