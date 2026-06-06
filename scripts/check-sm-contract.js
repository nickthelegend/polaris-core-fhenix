const dotenv = require("dotenv");
const path = require("path");
const { ethers } = require("ethers");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const smAddress = process.env.NEXT_PUBLIC_SCORE_MANAGER || "0x3a665926175E63f7cD76eC93f2Ed4d6add74B0F8";
  console.log("Checking ScoreManager contract at:", smAddress);

  const testUser = "0x40d5f7408153599aC492FbA00e8B24855a3AF5f7"; // some random address

  // Let's try calling hasScore, isInitialized, getScore, getEncryptedScore
  const smPrivate = new ethers.Contract(smAddress, [
    "function isInitialized(address) view returns (bool)",
    "function hasScore(address) view returns (bool)",
    "function getEncryptedScore(address) view returns (bytes32)",
    "function getEncryptedLimit(address) view returns (bytes32)"
  ], provider);

  const smPublic = new ethers.Contract(smAddress, [
    "function getScore(address) view returns (bytes32)",
    "function getCreditLimit(address) view returns (bytes32)"
  ], provider);

  try {
    const isInit = await smPrivate.isInitialized(testUser);
    console.log("Success calling isInitialized(testUser):", isInit);
  } catch (e) {
    console.log("Failed calling isInitialized:", e.message);
  }

  try {
    const hasSc = await smPrivate.hasScore(testUser);
    console.log("Success calling hasScore(testUser):", hasSc);
  } catch (e) {
    console.log("Failed calling hasScore:", e.message);
  }

  try {
    const encSc = await smPrivate.getEncryptedScore(testUser);
    console.log("Success calling getEncryptedScore(testUser):", encSc);
  } catch (e) {
    console.log("Failed calling getEncryptedScore:", e.message);
  }

  try {
    const sc = await smPublic.getScore(testUser);
    console.log("Success calling getScore(testUser):", sc);
  } catch (e) {
    console.log("Failed calling getScore:", e.message);
  }
}

main().catch(console.error);
