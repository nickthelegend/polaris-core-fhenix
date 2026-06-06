const { ethers } = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF";

const contractsToCheck = {
  PROTOCOL_FUNDS: "0x5791665C56c3e048200BC5bF0D90b8aa0fE748b1",
  POOL_MANAGER: "0xB0a35Af393CBB3Aa9297C0517db8836F03e413cb",
  CREDIT_ORACLE: "0x1cf827c579a60242CAf3656922482D78b2373210",
  SCORE_MANAGER: "0x0533C10Ade2ab44B3C1f46844233f4d8077bBb81",
  LOAN_ENGINE: "0xbFC0004e2D17eC61658fd21bE6771277f6dc5BBA",
  MERCHANT_ROUTER: "0x01d4A20a8275A12D62805aCEDF5a4782A7966FdF",
  PRIVATE_COLLATERAL_VAULT: "0xb189E42714bBc63f1767093292605F52fD29bAb6",
  PRIVATE_BORROW_MANAGER: "0xb581Dbee8300631680f9819d80F28aa1771F6B4C"
};

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  console.log("Checking contract bytecode on Sepolia:");
  for (const [name, addr] of Object.entries(contractsToCheck)) {
    const code = await provider.getCode(addr);
    console.log(`- ${name} (${addr}): ${code !== "0x" ? "✅ DEPLOYED (" + code.length + " chars)" : "❌ EMPTY"}`);
  }
}

main().catch(console.error);
