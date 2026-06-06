// Test script to verify smart contracts are working
const { PayEaseContracts } = require('./lib/algorand/contracts.ts');

async function testContracts() {
  console.log('🧪 Testing PayEase Smart Contracts...\n');
  
  try {
    // Test 1: Check connection
    console.log('1. Testing connection...');
    const status = await PayEaseContracts.checkConnection();
    console.log('✅ Connection Status:', status);
    
    // Test 2: Register user
    console.log('\n2. Testing user registration...');
    const registration = await PayEaseContracts.registerUser('test-address-123');
    console.log('✅ Registration:', registration);
    
    // Test 3: Get user limit
    console.log('\n3. Testing user limit...');
    const limit = await PayEaseContracts.getUserLimit('test-address-123');
    console.log('✅ User Limit:', limit, 'USDC');
    
    // Test 4: Add to piggy bank
    console.log('\n4. Testing piggy bank...');
    const piggyBank = await PayEaseContracts.addToPiggyBank('test-address-123', 50);
    console.log('✅ Piggy Bank:', piggyBank);
    
    console.log('\n🎉 All tests passed! Your contracts are working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContracts();