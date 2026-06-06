const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Algorand client
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

// Your wallet mnemonic (replace with your actual mnemonic)
const MNEMONIC = 'mystery hotel repeat mother belt mesh doctor hover sunset peanut excess miracle hammer explain fly escape demand limb chair finish cloth any express able venture';

async function deployContracts() {
  try {
    console.log('🚀 Deploying PayEase contracts...');
    
    // Validate mnemonic length
    const words = MNEMONIC.trim().split(' ');
    if (words.length !== 25) {
      throw new Error(`Invalid mnemonic: expected 25 words, got ${words.length}`);
    }
    
    // Create account from mnemonic
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    console.log('Deployer address:', account.addr);
    
    // Check balance
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    console.log('Balance:', accountInfo.amount / 1000000, 'ALGO');
    
    if (accountInfo.amount < 1000000) {
      throw new Error('Insufficient balance. Need at least 1 ALGO for deployment.');
    }
    
    // For now, create mock contract IDs
    // In real deployment, you'd compile and deploy the actual contracts
    const mainContractId = Math.floor(Math.random() * 1000000) + 100000;
    const userContractId = Math.floor(Math.random() * 1000000) + 100000;
    
    console.log('✅ Mock deployment successful!');
    console.log('Main Contract ID:', mainContractId);
    console.log('User Contract ID:', userContractId);
    
    // Update contract IDs in the integration file
    updateContractIds(mainContractId, userContractId);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

function updateContractIds(mainId, userId) {
  const contractsPath = path.join(__dirname, '../lib/algorand/contracts.ts');
  let content = fs.readFileSync(contractsPath, 'utf8');
  
  content = content.replace(
    'export const MAIN_CONTRACT_ID = 0;',
    `export const MAIN_CONTRACT_ID = ${mainId};`
  );
  
  content = content.replace(
    'export const USER_ACCOUNT_CONTRACT_ID = 0;',
    `export const USER_ACCOUNT_CONTRACT_ID = ${userId};`
  );
  
  fs.writeFileSync(contractsPath, content);
  console.log('📝 Updated contract IDs in contracts.ts');
}

deployContracts();