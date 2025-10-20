const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Hardhat Network Block Explorer");
  console.log("================================");

  try {
    // Get provider
    const provider = ethers.provider;
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Current Block Number: ${currentBlock}`);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    console.log("\n📦 Recent Blocks:");
    console.log("=================");
    
    // Show last 10 blocks (or all if less than 10)
    const startBlock = Math.max(0, currentBlock - 9);
    
    for (let i = currentBlock; i >= startBlock; i--) {
      const block = await provider.getBlock(i);
      
      if (block) {
        console.log(`\n🧱 Block #${block.number}`);
        console.log(`   Hash: ${block.hash}`);
        console.log(`   Parent Hash: ${block.parentHash}`);
        console.log(`   Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
        console.log(`   Gas Used: ${block.gasUsed.toString()}`);
        console.log(`   Gas Limit: ${block.gasLimit.toString()}`);
        console.log(`   Transactions: ${block.transactions.length}`);
        
        // Show transaction hashes if any
        if (block.transactions.length > 0) {
          console.log(`   Transaction Hashes:`);
          block.transactions.forEach((txHash, index) => {
            console.log(`     ${index + 1}. ${txHash}`);
          });
        }
        
        console.log(`   Miner: ${block.miner}`);
        console.log(`   Difficulty: ${block.difficulty}`);
        console.log(`   Nonce: ${block.nonce}`);
      }
    }
    
    // Show detailed transaction info for the latest block
    if (currentBlock > 0) {
      const latestBlock = await provider.getBlock(currentBlock);
      
      if (latestBlock && latestBlock.transactions.length > 0) {
        console.log("\n💳 Latest Block Transactions Details:");
        console.log("====================================");
        
        for (let i = 0; i < latestBlock.transactions.length; i++) {
          const txHash = latestBlock.transactions[i];
          const tx = await provider.getTransaction(txHash);
          const receipt = await provider.getTransactionReceipt(txHash);
          
          console.log(`\n📝 Transaction ${i + 1}:`);
          console.log(`   Hash: ${tx.hash}`);
          console.log(`   From: ${tx.from}`);
          console.log(`   To: ${tx.to || 'Contract Creation'}`);
          console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
          console.log(`   Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} gwei`);
          console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
          console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
          
          // Show contract events if any
          if (receipt.logs.length > 0) {
            console.log(`   Events: ${receipt.logs.length} log(s)`);
          }
        }
      }
    }
    
    console.log("\n📈 Network Statistics:");
    console.log("=====================");
    console.log(`Total Blocks: ${currentBlock + 1}`);
    
    // Calculate total transactions
    let totalTransactions = 0;
    for (let i = 0; i <= currentBlock; i++) {
      const block = await provider.getBlock(i);
      if (block) {
        totalTransactions += block.transactions.length;
      }
    }
    console.log(`Total Transactions: ${totalTransactions}`);
    
    // Get account balances
    console.log("\n💰 Account Balances:");
    console.log("===================");
    const accounts = await ethers.getSigners();
    
    for (let i = 0; i < Math.min(5, accounts.length); i++) {
      const balance = await provider.getBalance(accounts[i].address);
      console.log(`Account ${i}: ${accounts[i].address}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Make sure your Hardhat network is running:");
    console.log("   npm run dev (from project root)");
    console.log("   or");
    console.log("   npx hardhat node (from contracts directory)");
  }
}

// Function to watch for new blocks
async function watchBlocks() {
  console.log("\n👀 Watching for new blocks... (Press Ctrl+C to stop)");
  console.log("====================================================");
  
  const provider = ethers.provider;
  
  provider.on("block", async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    console.log(`\n🆕 New Block #${blockNumber}`);
    console.log(`   Hash: ${block.hash}`);
    console.log(`   Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
    console.log(`   Transactions: ${block.transactions.length}`);
    
    if (block.transactions.length > 0) {
      console.log(`   Transaction Hashes:`);
      block.transactions.forEach((txHash, index) => {
        console.log(`     ${index + 1}. ${txHash}`);
      });
    }
  });
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--watch') || args.includes('-w')) {
  main().then(() => watchBlocks()).catch(console.error);
} else {
  main().catch(console.error);
}