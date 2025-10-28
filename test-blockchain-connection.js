// Quick test script to verify blockchain connection
const { ethers } = require('ethers');

async function testConnection() {
  console.log('🔍 Testing blockchain connection...');
  
  try {
    // Connect to local Hardhat node
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Test 1: Get block number
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Block number:', blockNumber);
    
    // Test 2: Get network info
    const network = await provider.getNetwork();
    console.log('✅ Network:', network.name, 'Chain ID:', network.chainId.toString());
    
    // Test 3: Get first account balance
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0]);
      console.log('✅ First account:', accounts[0]);
      console.log('✅ Balance:', ethers.formatEther(balance), 'ETH');
    }
    
    // Test 4: Test contract interaction
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const contractABI = [
      "function owner() view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const owner = await contract.owner();
    console.log('✅ Contract owner:', owner);
    
    console.log('\n🎉 All tests passed! Blockchain is ready for MetaMask.');
    console.log('\n📋 MetaMask Configuration:');
    console.log('   Network Name: Hardhat Local');
    console.log('   RPC URL: http://localhost:8545');
    console.log('   Chain ID: 1337');
    console.log('   Currency: ETH');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n💡 Make sure Hardhat node is running:');
    console.log('   cd contracts && npm run dev');
  }
}

testConnection();