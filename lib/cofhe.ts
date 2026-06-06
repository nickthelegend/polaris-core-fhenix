import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import { sepolia, hardhat } from "@cofhe/sdk/chains";
import { Ethers6Adapter } from "@cofhe/sdk/adapters";
import { Encryptable, FheTypes } from "@cofhe/sdk";

let _clientCache: Map<string, any> = new Map();

export async function getCoFHEClient(signer: any) {
  const addr = await signer.getAddress();
  if (!_clientCache.has(addr)) {
    const provider = signer.provider;
    if (!provider) {
      throw new Error("Signer must have a provider connected");
    }

    const config = createCofheConfig({
      supportedChains: [sepolia, hardhat]
    });
    const client = createCofheClient(config);

    const { publicClient, walletClient } = await Ethers6Adapter(provider, signer);
    await client.connect(publicClient, walletClient);

    _clientCache.set(addr, client);
  }
  return _clientCache.get(addr);
}

/** Encrypt a uint64 value. Returns InEuint64-compatible packed struct for Solidity calldata. */
export async function encryptUint64(client: any, value: bigint) {
  const [encryptedInput] = await client
    .encryptInputs([Encryptable.uint64(value)])
    .execute();
  return encryptedInput;
}

/** Encrypt a uint32 value */
export async function encryptUint32(client: any, value: number) {
  const [encryptedInput] = await client
    .encryptInputs([Encryptable.uint32(value)])
    .execute();
  return encryptedInput;
}

/** Decrypt a handle privately (for UI display only) — requires permit */
export async function decryptView(
  client: any,
  handle: bigint,
  fheType: typeof FheTypes[keyof typeof FheTypes] = FheTypes.Uint64
): Promise<bigint> {
  const permit = await client.permits.getOrCreateSelfPermit();
  const result = await client
    .decryptForView(handle, fheType)
    .withPermit()
    .execute();
  return result;
}

/** Decrypt a handle for on-chain submission (public reveal) — no permit needed */
export async function decryptForTransaction(client: any, handle: bigint) {
  const result = await client
    .decryptForTx(handle)
    .withoutPermit()
    .execute();
  return {
    decryptedValue: result.decryptedValue,
    signature: result.signature
  };
}
