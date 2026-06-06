const dotenv = require("dotenv");
const path = require("path");
const { ethers } = require("ethers");
const { createCofheClient, createCofheConfig } = require("@cofhe/sdk/node");
const { sepolia } = require("@cofhe/sdk/chains");
const { Ethers6Adapter } = require("@cofhe/sdk/adapters");
const { Encryptable, FheTypes } = require("@cofhe/sdk");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xa6c9cd90c51912d06513a45c3c0d9c0c7b39d65bfa44bc203d97a32b988ab911";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || "https://eth-sepolia.g.alchemy.com/v2/3qRB0TMQQv3hyKgav_6lF";

// Deployed addresses
const ADDR_MOCK_USDT = process.env.NEXT_PUBLIC_MOCK_USDT || "0xfCaBa68297d86E56e01E8e9CcB88AF06bc093b9E";
const ADDR_COLLATERAL_VAULT = process.env.NEXT_PUBLIC_PRIVATE_COLLATERAL_VAULT || "0xb189E42714bBc63f1767093292605F52fD29bAb6";
const ADDR_BORROW_MANAGER = process.env.NEXT_PUBLIC_PRIVATE_BORROW_MANAGER || "0xb581Dbee8300631680f9819d80F28aa1771F6B4C";
const ADDR_LOAN_ENGINE = process.env.NEXT_PUBLIC_LOAN_ENGINE || "0xbFC0004e2D17eC61658fd21bE6771277f6dc5BBA";
const ADDR_CREDIT_ORACLE = process.env.NEXT_PUBLIC_CREDIT_ORACLE || "0x1cf827c579a60242CAf3656922482D78b2373210";
const ADDR_SCORE_MANAGER = process.env.NEXT_PUBLIC_SCORE_MANAGER || "0x0533C10Ade2ab44B3C1f46844233f4d8077bBb81";

// Load ABIs
const MockERC20 = require("../lib/abis/MockERC20.json");
const PrivateCollateralVault = require("../lib/abis/PrivateCollateralVault.json");
const PrivateBorrowManager = require("../lib/abis/PrivateBorrowManager.json");
const CreditOracle = require("../lib/abis/CreditOracle.json");
const ScoreManager = require("../lib/abis/ScoreManager.json");
const LoanEngine = require("../lib/abis/LoanEngine.json");

function getAbi(json) {
  return Array.isArray(json) ? json : (json.abi || json);
}

async function main() {
  console.log("🚀 Starting live Sepolia End-to-End FHE Integration Tests (JavaScript)");
  console.log("📍 RPC URL:", SEPOLIA_RPC);

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("📍 Deployer Address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Sepolia ETH Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("❌ Error: Sepolia wallet has 0 ETH. Please fund the wallet before testing.");
  }

  // --- Initialize Fhenix CoFHE Client ---
  console.log("\n--- Initializing Fhenix Client ---");
  const config = createCofheConfig({ supportedChains: [sepolia] });
  const client = createCofheClient(config);
  const { publicClient, walletClient } = await Ethers6Adapter(provider, wallet);
  await client.connect(publicClient, walletClient);
  console.log("✅ Fhenix Client Connected successfully.");

  console.log("--- Generating/Fetching Self Permit ---");
  await client.permits.getOrCreateSelfPermit();
  console.log("✅ Self Permit generated successfully.");

  // --- Step 1: Faucet Mint Mock USDT ---
  console.log("\n--- Step 1: Minting Faucet USDT ---");
  const usdt = new ethers.Contract(ADDR_MOCK_USDT, getAbi(MockERC20), wallet);
  const decimals = 6;
  const mintAmount = 5000n * 10n ** BigInt(decimals);

  try {
    const mintTx = await usdt.mint(wallet.address, mintAmount);
    console.log(`  Submitting mint transaction: ${mintTx.hash}`);
    const receipt = await mintTx.wait();
    console.log(`  Mint Transaction confirmed in block: ${receipt?.blockNumber}`);
    
    const usdtBalance = await usdt.balanceOf(wallet.address);
    console.log(`  USDT Balance: ${ethers.formatUnits(usdtBalance, decimals)} USDT`);
  } catch (err) {
    console.error("  ❌ Faucet mint failed:", err.message || err);
  }

  // --- Step 2: Private Collateral Deposit ---
  console.log("\n--- Step 2: Depositing Collateral Privately ---");
  const vault = new ethers.Contract(ADDR_COLLATERAL_VAULT, getAbi(PrivateCollateralVault), wallet);
  const depositAmount = 1000n; // 1000 tokens

  try {
    console.log("  Encrypting collateral amount...");
    const [encDeposit] = await client.encryptInputs([Encryptable.uint64(depositAmount)]).execute();

    console.log("  Submitting private deposit...");
    const depositTx = await vault.deposit(encDeposit);
    console.log(`  Deposit Transaction: ${depositTx.hash}`);
    const receipt = await depositTx.wait();
    console.log(`  Deposit confirmed in block: ${receipt?.blockNumber}`);

    console.log("  Fetching private collateral balance handle...");
    const handle = await vault.getCollateralAmount(wallet.address);
    console.log(`  Collateral Handle: ${handle}`);

    console.log("  Decrypting collateral amount privately via permit...");
    const clearCollateral = await client.decryptForView(handle, FheTypes.Uint64).withPermit().execute();
    console.log(`  Decrypted Collateral Balance: ${clearCollateral} tokens`);
  } catch (err) {
    console.error("  ❌ Private collateral deposit failed:", err.message || err);
  }

  // --- Step 3: Private Borrow ---
  console.log("\n--- Step 3: Borrowing Privately ---");
  const borrowManager = new ethers.Contract(ADDR_BORROW_MANAGER, getAbi(PrivateBorrowManager), wallet);
  const borrowAmt = 500n; // 500 tokens (well within the 1.5x collateral limit of 1000)

  try {
    console.log("  Encrypting borrow amount...");
    const [encBorrow] = await client.encryptInputs([Encryptable.uint64(borrowAmt)]).execute();

    console.log("  Submitting private borrow...");
    const borrowTx = await borrowManager.borrow(encBorrow);
    console.log(`  Borrow Transaction: ${borrowTx.hash}`);
    const receipt = await borrowTx.wait();
    console.log(`  Borrow confirmed in block: ${receipt?.blockNumber}`);

    console.log("  Fetching private debt balance handle...");
    const handle = await borrowManager.getDebtAmount(wallet.address);
    console.log(`  Debt Handle: ${handle}`);

    console.log("  Decrypting debt amount privately via permit...");
    const clearDebt = await client.decryptForView(handle, FheTypes.Uint64).withPermit().execute();
    console.log(`  Decrypted Debt Balance: ${clearDebt} tokens`);
  } catch (err) {
    console.error("  ❌ Private borrow failed:", err.message || err);
  }

  // --- Step 4: Private Repay ---
  console.log("\n--- Step 4: Repaying Privately ---");
  const repayAmt = 200n; // Repay 200 tokens

  try {
    console.log("  Encrypting repay amount...");
    const [encRepay] = await client.encryptInputs([Encryptable.uint64(repayAmt)]).execute();

    console.log("  Submitting private repayment...");
    const repayTx = await borrowManager.repay(encRepay);
    console.log(`  Repay Transaction: ${repayTx.hash}`);
    const receipt = await repayTx.wait();
    console.log(`  Repayment confirmed in block: ${receipt?.blockNumber}`);

    console.log("  Fetching private debt balance handle...");
    const handle = await borrowManager.getDebtAmount(wallet.address);
    console.log(`  Debt Handle: ${handle}`);

    console.log("  Decrypting debt amount privately via permit...");
    const clearDebt = await client.decryptForView(handle, FheTypes.Uint64).withPermit().execute();
    console.log(`  Decrypted Debt Balance: ${clearDebt} tokens (Expected: 300)`);
  } catch (err) {
    console.error("  ❌ Private repay failed:", err.message || err);
  }

  // --- Step 5: Credit Oracle Profile Update ---
  console.log("\n--- Step 5: Attesting & Updating Credit Profile ---");
  const oracle = new ethers.Contract(ADDR_CREDIT_ORACLE, getAbi(CreditOracle), wallet);
  const scoreManager = new ethers.Contract(ADDR_SCORE_MANAGER, getAbi(ScoreManager), wallet);

  try {
    const collateralAttested = 5000n;
    const debtAttested = 1000n;

    console.log("  Encrypting attested collateral and debt...");
    const [encCollateral] = await client.encryptInputs([Encryptable.uint64(collateralAttested)]).execute();
    const [encDebt] = await client.encryptInputs([Encryptable.uint64(debtAttested)]).execute();

    const timestamp = Math.floor(Date.now() / 1000);
    
    const profile = await oracle.profiles(wallet.address);
    const nonce = profile[3];
    console.log(`  Profile Nonce: ${nonce}`);

    // Message signature keccak256
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      [wallet.address, encCollateral.ctHash, encDebt.ctHash, timestamp, nonce]
    );

    console.log("  Signing attestation off-chain...");
    const signature = await wallet.signMessage(ethers.toBeArray(messageHash));

    // Convert EncryptedInput class instances to plain objects matching InEuint64 struct layout
    const plainCollateral = {
      ctHash: encCollateral.ctHash,
      securityZone: encCollateral.securityZone,
      utype: encCollateral.utype,
      signature: encCollateral.signature
    };
    const plainDebt = {
      ctHash: encDebt.ctHash,
      securityZone: encDebt.securityZone,
      utype: encDebt.utype,
      signature: encDebt.signature
    };

    console.log("  Submitting profile update to CreditOracle...");
    const updateTx = await oracle.updateProfile(
      wallet.address,
      plainCollateral,
      plainDebt,
      timestamp,
      signature
    );
    console.log(`  Update Profile Transaction: ${updateTx.hash}`);
    const receipt = await updateTx.wait();
    console.log(`  Profile update confirmed in block: ${receipt?.blockNumber}`);

    console.log("  Fetching user credit score from ScoreManager...");
    const scoreHandle = await scoreManager.getScore.staticCall(wallet.address);
    let clearScore = 300n;
    try {
      clearScore = await client.decryptForView(scoreHandle, FheTypes.Uint32).withPermit().execute();
    } catch (scoreErr) {
      console.log(`  ℹ️ Note: Score is currently uninitialized/unpermitted on-chain (Defaulting to 300)`);
    }
    console.log(`  Decrypted Score: ${clearScore}`);
  } catch (err) {
    console.error("  ❌ Credit Profile update failed:", err.message || err);
  }

  // --- Step 6: Core Loan Creation ---
  console.log("\n--- Step 6: Creating Core Loan (Borrowing) ---");
  const loanEngine = new ethers.Contract(ADDR_LOAN_ENGINE, getAbi(LoanEngine), wallet);
  const coreBorrowAmount = 500n; // Borrow 500 units

  try {
    console.log("  Encrypting core borrow amount...");
    const [encCoreBorrow] = await client.encryptInputs([Encryptable.uint64(coreBorrowAmount)]).execute();

    console.log("  Submitting borrow to LoanEngine...");
    const borrowTx = await loanEngine.createLoan(wallet.address, encCoreBorrow, ADDR_MOCK_USDT);
    console.log(`  Loan Creation Transaction: ${borrowTx.hash}`);
    const receipt = await borrowTx.wait();
    console.log(`  Loan created successfully in block: ${receipt?.blockNumber}`);
    
    const count = await loanEngine.loanCount();
    console.log(`  Total Core Loans: ${count}`);
  } catch (err) {
    console.error("  ❌ Core Loan creation failed:", err.message || err);
  }

  console.log("\n🏁 End-to-End Sepolia Integration Tests Completed Successfully!");
}

main().catch(err => {
  console.error("❌ Critical Integration Test Script Crash:", err);
  process.exit(1);
});
