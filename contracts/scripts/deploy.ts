import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Bhoomi Setu Land Registry contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy LandRegistry contract (which includes AccessControl)
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

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    landRegistry: landRegistryAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("Deployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

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
