const dotenv = require("dotenv");
const path = require("path");
const { ethers } = require("ethers");
const { createCofheClient, createCofheConfig } = require("@cofhe/sdk/node");
const { sepolia } = require("@cofhe/sdk/chains");
const { Ethers6Adapter } = require("@cofhe/sdk/adapters");
const { Encryptable } = require("@cofhe/sdk");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xa6c9cd90c51912d06513a45c3c0d9c0c7b39d65bfa44bc203d97a32b988ab911";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF";

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const config = createCofheConfig({ supportedChains: [sepolia] });
  const client = createCofheClient(config);
  const { publicClient, walletClient } = await Ethers6Adapter(provider, wallet);
  await client.connect(publicClient, walletClient);

  const [encInput] = await client.encryptInputs([Encryptable.uint64(5000n)]).execute();
  console.log("ctHash type:", typeof encInput.ctHash, "val:", encInput.ctHash);
  console.log("securityZone type:", typeof encInput.securityZone, "val:", encInput.securityZone);
  console.log("utype type:", typeof encInput.utype, "val:", encInput.utype);
  console.log("signature type:", typeof encInput.signature, "val:", encInput.signature);
  
  // Construct plain object
  const plainObj = {
    ctHash: encInput.ctHash.toString(),
    securityZone: encInput.securityZone,
    utype: encInput.utype,
    signature: ethers.hexlify(encInput.signature)
  };
  console.log("Plain object:", plainObj);
}

main().catch(console.error);
