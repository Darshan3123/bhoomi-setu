const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated LandRegistry contract with Property Status System...");

  // Get the contract factory
  const AccessControl = await ethers.getContractFactory("AccessControl");
  const LandRegistry = await ethers.getContractFactory("LandRegistry");

  // Deploy AccessControl first
  console.log("📋 Deploying AccessControl contract...");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("✅ AccessControl deployed to:", accessControlAddress);

  // Deploy LandRegistry
  console.log("🏠 Deploying LandRegistry contract...");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();
  console.log("✅ LandRegistry deployed to:", landRegistryAddress);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Set up initial admin
  console.log("🛡️ Setting up initial admin...");
  try {
    const tx = await landRegistry.registerUser(deployer.address, 0); // 0 = Admin role
    await tx.wait();
    console.log("✅ Admin registered successfully");
  } catch (error) {
    console.log("ℹ️ Admin might already be registered:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("AccessControl:", accessControlAddress);
  console.log("LandRegistry:", landRegistryAddress);

  console.log("\n🔧 New Features Added:");
  console.log("✅ PropertyStatus enum (Pending, Verified, ForSale, Sold)");
  console.log("✅ approveProperty() - Admin/Inspector can verify properties");
  console.log("✅ markForSale() - Owners can mark verified properties for sale");
  console.log("✅ getPropertyStatus() - Check current property status");
  console.log("✅ isPropertyForSale() - Check if property is available for purchase");
  console.log("✅ getPropertiesByStatus() - Get all properties with specific status");
  console.log("✅ PropertyVerified event - Emitted when property is verified");
  console.log("✅ PropertyForSale event - Emitted when property is marked for sale");

  console.log("\n📝 Property Workflow:");
  console.log("1. registerLand() → Status: Pending");
  console.log("2. approveProperty() → Status: Verified (Admin/Inspector only)");
  console.log("3. markForSale() → Status: ForSale (Owner only)");
  console.log("4. requestTransfer() → Only allowed for ForSale properties");
  console.log("5. approveTransfer() → Status: Sold");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    accessControl: accessControlAddress,
    landRegistry: landRegistryAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    features: [
      "Property Status System",
      "Admin/Inspector Property Verification",
      "Owner-controlled Sale Marking",
      "Status-based Transfer Restrictions"
    ]
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });