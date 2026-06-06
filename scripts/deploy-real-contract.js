const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

async function deployRealContract() {
  try {
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
    
    // Create a simple contract that just returns 1
    const approvalProgram = new Uint8Array([
      0x06, // version 6
      0x81, 0x01, // pushint 1
      0x22 // return
    ]);
    
    const clearProgram = new Uint8Array([
      0x06, // version 6
      0x81, 0x01, // pushint 1
      0x22 // return
    ]);
    
    // Use the funded account
    const mnemonic = 'vivid broccoli amateur meadow wheel ceiling gain donate faint avoid evil lady proof spice process render state black pact tenant silly abandon craft able pave';
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    
    console.log('🚀 Deploying from:', account.addr);
    
    const params = await algodClient.getTransactionParams().do();
    
    const createTxn = algosdk.makeApplicationCreateTxnFromObject({
      from: account.addr,
      approvalProgram,
      clearProgram,
      numGlobalByteSlices: 2,
      numGlobalInts: 2,
      numLocalByteSlices: 0,
      numLocalInts: 0,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC
    });
    
    const signedTxn = createTxn.signTxn(account.sk);
    const result = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log('📋 Transaction ID:', result.txId);
    console.log('⏳ Waiting for confirmation...');
    
    await algosdk.waitForConfirmation(algodClient, result.txId, 4);
    
    const txInfo = await algodClient.pendingTransactionInformation(result.txId).do();
    const appId = txInfo['application-index'];
    
    console.log('✅ SUCCESS! Contract deployed!');
    console.log('📍 Contract ID:', appId);
    console.log('🔗 Contract: https://lora.algokit.io/testnet/application/' + appId);
    console.log('📋 Transaction: https://lora.algokit.io/testnet/transaction/' + result.txId);
    
    // Update the contract ID
    updateContractId(appId);
    
    return { appId, txId: result.txId };
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
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
  console.log('📝 Updated MAIN_CONTRACT_ID to:', appId);
}

deployRealContract();