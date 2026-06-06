const { ethers } = require("ethers");
const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF";

const keys = {
  USER_PRIVATE_KEY: "0xc1c46d8f06533e4aa0899a933ee5ba8556b244b7f262cf1b4702c575257956a2",
  ATTESTER_PRIVATE_KEY: "0xdb8cfa2db2a866e6fea3d4388da2278f8ef7367180d5921b96661d946b244c86",
  DEPLOYER_PRIVATE_KEY: "0xa6c9cd90c51912d06513a45c3c0d9c0c7b39d65bfa44bc203d97a32b988ab911"
};

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  console.log("Checking balances on Sepolia:");
  for (const [name, key] of Object.entries(keys)) {
    const wallet = new ethers.Wallet(key, provider);
    const bal = await provider.getBalance(wallet.address);
    console.log(`- ${name} (${wallet.address}): ${ethers.formatEther(bal)} ETH`);
  }
}

main().catch(console.error);
