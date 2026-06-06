const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
const MNEMONIC = 'vivid broccoli amateur meadow wheel ceiling gain donate faint avoid evil lady proof spice process render state black pact tenant silly abandon craft able pave';

async function fundAndDeploy() {
  try {
    const account = algosdk.mnemonicToSecretKey(MNEMONIC);
    const address = account.addr;
    
    console.log('🚀 Account Address:', address.toString());
    
    // Check balance first
    try {
      const accountInfo = await algodClient.accountInformation(address.toString()).do();
      const balance = Number(accountInfo.amount) / 1000000;
    console.log('💰 Current Balance:', balance, 'ALGO');
      
      if (balance < 1) {
        console.log('❌ Insufficient balance. Please fund this account:');
        console.log('🔗 https://bank.testnet.algorand.network/');
        console.log('📋 Address to fund:', address.toString());
        return;
      }
    } catch (error) {
      console.log('❌ Account not found. Please fund this account first:');
      console.log('🔗 https://bank.testnet.algorand.network/');
      console.log('📋 Address to fund:', address.toString());
      return;
    }
    
    // Read compiled TEAL files
    const approvalTeal = fs.readFileSync('contracts/src/out/MainSmartContract.approval.teal', 'utf8');
    const clearTeal = fs.readFileSync('contracts/src/out/MainSmartContract.clear.teal', 'utf8');
    
    console.log('📄 Compiling TEAL programs...');
    const approvalResult = await algodClient.compile(approvalTeal).do();
    const clearResult = await algodClient.compile(clearTeal).do();
    
    const params = await algodClient.getTransactionParams().do();
    
    console.log('📦 Creating application...');
    const createTxn = algosdk.makeApplicationCreateTxnFromObject({
      from: address,
      approvalProgram: new Uint8Array(Buffer.from(approvalResult.result, 'base64')),
      clearProgram: new Uint8Array(Buffer.from(clearResult.result, 'base64')),
      numGlobalByteSlices: 2,
      numGlobalInts: 2,
      numLocalByteSlices: 0,
      numLocalInts: 0,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC
    });
    
    const signedTxn = createTxn.signTxn(account.sk);
    const result = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log('⏳ Waiting for confirmation...');
    await algosdk.waitForConfirmation(algodClient, result.txId, 4);
    
    const txInfo = await algodClient.pendingTransactionInformation(result.txId).do();
    const appId = txInfo['application-index'];
    
    console.log('✅ SUCCESS! Real Contract deployed!');
    console.log('📍 Contract ID:', appId);
    console.log('🔗 View at: https://lora.algokit.io/testnet/application/' + appId);
    console.log('📋 Transaction: https://lora.algokit.io/testnet/transaction/' + result.txId);
    
    // Update contracts.ts with real ID
    updateContractId(appId);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

function updateContractId(appId) {
  const contractsPath = path.join(__dirname, '../lib/algorand/contracts.ts');
  let content = fs.readFileSync(contractsPath, 'utf8');
  
  content = content.replace(
    /export const MAIN_CONTRACT_ID = \d+;/,
    `export const MAIN_CONTRACT_ID = ${appId};`
  );
  
  fs.writeFileSync(contractsPath, content);
  console.log('📝 Updated MAIN_CONTRACT_ID in contracts.ts');
}

fundAndDeploy();