const { ethers } = require("ethers");

const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF";
const ADDR_CREDIT_ORACLE = "0x1cf827c579a60242CAf3656922482D78b2373210";

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const abi = ["function attester() public view returns (address)", "function owner() public view returns (address)"];
  const oracle = new ethers.Contract(ADDR_CREDIT_ORACLE, abi, provider);
  
  const attester = await oracle.attester();
  const owner = await oracle.owner();
  
  console.log("Deployed CreditOracle properties:");
  console.log("- Attester:", attester);
  console.log("- Owner:", owner);
}

main().catch(console.error);
