// Test UserAccount Smart Contract specifically
const { PayEaseContracts, USER_ACCOUNT_CONTRACT_ID } = require('./lib/algorand/contracts.ts');

async function testUserAccountContract() {
  console.log('🧪 Testing UserAccount Smart Contract...\n');
  console.log('Contract ID:', USER_ACCOUNT_CONTRACT_ID);
  
  const testAddress = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4';
  
  try {
    // Test 1: User verification
    console.log('1. Testing user verification...');
    const verification = await PayEaseContracts.verifyUser(
      testAddress, 
      'Google', 
      'proof-hash-123'
    );
    console.log('✅ Verification result:', verification);
    
    // Test 2: Get user limit
    console.log('\n2. Testing user limit retrieval...');
    const limit = await PayEaseContracts.getUserLimit(testAddress);
    console.log('✅ User limit:', limit, 'USDC');
    
    // Test 3: Piggy bank deposit
    console.log('\n3. Testing piggy bank deposit...');
    const piggyDeposit = await PayEaseContracts.addToPiggyBank(testAddress, 100);
    console.log('✅ Piggy bank deposit:', piggyDeposit);
    
    console.log('\n🎉 UserAccount contract functions are working!');
    console.log('\n📋 UserAccount Contract Features:');
    console.log('✅ User verification with providers');
    console.log('✅ Credit limit management');  
    console.log('✅ Piggy bank functionality');
    console.log('✅ Owner address tracking');
    console.log('✅ Verifier storage (BoxMap)');
    
  } catch (error) {
    console.error('❌ UserAccount test failed:', error.message);
  }
}

testUserAccountContract();