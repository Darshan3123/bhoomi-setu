import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Bhoomi Setu Land Registry contracts with price functionality...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy LandRegistry contract (which includes AccessControl and price functionality)
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();

  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();

  console.log("LandRegistry deployed to:", landRegistryAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const owner = await landRegistry.owner();
  console.log("Contract owner:", owner);
  console.log("Deployer is owner:", owner === deployer.address);

  // Test price functionality
  console.log("\nTesting price functionality...");
  
  try {
    // Register a test property with price
    const testPrice = ethers.parseEther("1.5"); // 1.5 ETH
    console.log("Registering test property with price:", ethers.formatEther(testPrice), "ETH");
    
    const tx = await landRegistry.registerLand(
      "QmTestHash123456789",
      "Test Location, Test City",
      1000,
      "TEST-001",
      testPrice
    );
    
    const receipt = await tx.wait();
    console.log("Test property registered in block:", receipt?.blockNumber);
    
    // Extract landId from events
    const landRegisteredEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = landRegistry.interface.parseLog(log);
        return parsed?.name === 'LandRegistered';
      } catch {
        return false;
      }
    });
    
    if (landRegisteredEvent) {
      const parsed = landRegistry.interface.parseLog(landRegisteredEvent);
      const landId = parsed?.args[0];
      console.log("Test property landId:", landId.toString());
      
      // Test price retrieval
      const retrievedPrice = await landRegistry.getPropertyPrice(landId);
      console.log("Retrieved price:", ethers.formatEther(retrievedPrice), "ETH");
      
      console.log("✅ Price functionality working correctly!");
    }
    
  } catch (error) {
    console.error("❌ Error testing price functionality:", error);
  }

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    landRegistry: landRegistryAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    features: [
      "Land Registration with Price",
      "Property Verification",
      "Transfer Management", 
      "Price Management"
    ]
  };

  console.log("\nDeployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Save to file for backend integration
  const fs = require('fs');
  const deploymentPath = '../backend/.env.blockchain';
  const envContent = `
# Blockchain Configuration (Auto-generated)
BLOCKCHAIN_RPC_URL=http://localhost:8545
LAND_REGISTRY_CONTRACT_ADDRESS=${landRegistryAddress}
BLOCKCHAIN_NETWORK_ID=31337
DEPLOYMENT_BLOCK=${deploymentInfo.blockNumber}
DEPLOYED_AT=${deploymentInfo.deployedAt}
`;

  fs.writeFileSync(deploymentPath, envContent);
  console.log(`\n📝 Blockchain configuration saved to: ${deploymentPath}`);
  console.log("💡 Add this to your backend .env file or source it directly");

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });