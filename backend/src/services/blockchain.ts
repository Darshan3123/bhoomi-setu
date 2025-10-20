import { ethers } from "ethers";

/**
 * Blockchain service for interacting with smart contracts
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contractAddress?: string;
  private contract?: ethers.Contract;

  constructor() {
    // Initialize provider (Hardhat local network by default)
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Set contract address if available
    this.contractAddress = process.env.LAND_REGISTRY_CONTRACT_ADDRESS;

    console.log("🔗 Blockchain service initialized");
    console.log("📡 RPC URL:", rpcUrl);
    console.log("📋 Contract Address:", this.contractAddress || "Not set");
  }

  /**
   * Initialize contract connection
   */
  async initializeContract(contractAddress?: string, abi?: any[]) {
    try {
      const address = contractAddress || this.contractAddress;
      if (!address) {
        console.warn("⚠️ No contract address provided");
        return false;
      }

      if (!abi) {
        // Use a basic ABI for now - this should be replaced with actual contract ABI
        abi = [
          "function getLandDetails(uint256 landId) view returns (tuple(uint256 landId, address currentOwner, string ipfsHash, uint256 registrationDate, bool isActive, string location, uint256 area, string surveyNumber, uint8 status, uint256 priceInWei, uint256 lastPriceUpdate))",
          "function getPropertyStatus(uint256 landId) view returns (uint8)",
          "function isPropertyForSale(uint256 landId) view returns (bool)",
          "function getPropertyPrice(uint256 landId) view returns (uint256)",
          "function setPropertyPrice(uint256 landId, uint256 priceInWei)",
          "function registerLand(string ipfsHash, string location, uint256 area, string surveyNumber, uint256 priceInWei) returns (uint256)",
          "event LandRegistered(uint256 indexed landId, address indexed owner, string ipfsHash, string location)",
          "event PropertyPriceSet(uint256 indexed landId, address indexed owner, uint256 priceInWei)",
          "event PropertyPriceUpdated(uint256 indexed landId, address indexed owner, uint256 oldPrice, uint256 newPrice)"
        ];
      }

      this.contract = new ethers.Contract(address, abi, this.provider);
      console.log("✅ Contract initialized:", address);
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize contract:", error);
      return false;
    }
  }

  /**
   * Get property details from blockchain
   */
  async getPropertyDetails(landId: number) {
    try {
      if (!this.contract) {
        console.warn("⚠️ Contract not initialized");
        return null;
      }

      const details = await this.contract.getLandDetails(landId);
      return {
        landId: details.landId,
        currentOwner: details.currentOwner,
        ipfsHash: details.ipfsHash,
        registrationDate: details.registrationDate,
        isActive: details.isActive,
        location: details.location,
        area: details.area,
        surveyNumber: details.surveyNumber,
        status: details.status,
        priceInWei: details.priceInWei.toString(),
        lastPriceUpdate: Number(details.lastPriceUpdate)
      };
    } catch (error) {
      console.error("❌ Failed to get property details:", error);
      return null;
    }
  }

  /**
   * Check if property is for sale
   */
  async isPropertyForSale(landId: number): Promise<boolean> {
    try {
      if (!this.contract) {
        console.warn("⚠️ Contract not initialized");
        return false;
      }

      return await this.contract.isPropertyForSale(landId);
    } catch (error) {
      console.error("❌ Failed to check property sale status:", error);
      return false;
    }
  }

  /**
   * Get property price from blockchain
   */
  async getPropertyPrice(landId: number): Promise<string> {
    try {
      if (!this.contract) {
        console.warn("⚠️ Contract not initialized");
        return "0";
      }

      console.log("💰 Getting price for property:", landId);
      
      const priceInWei = await this.contract.getPropertyPrice(landId);
      return priceInWei.toString();
      
    } catch (error) {
      console.error("❌ Failed to get property price:", error);
      return "0";
    }
  }

  /**
   * Set property price on blockchain
   */
  async setPropertyPrice(
    landId: number,
    priceInWei: string,
    privateKey: string
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        console.warn("⚠️ Contract not initialized");
        return false;
      }

      console.log("💰 Setting price for property:", landId, "to", priceInWei, "wei");
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Connect contract with wallet for transactions
      const contractWithSigner = this.contract.connect(wallet);
      
      // Send transaction (let ethers handle gas estimation automatically)
      const tx = await (contractWithSigner as any).setPropertyPrice(landId, priceInWei);
      
      console.log("📝 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      
      return true;
    } catch (error) {
      console.error("❌ Failed to set property price:", error);
      return false;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        isConnected: true,
      };
    } catch (error) {
      console.error("❌ Failed to get network info:", error);
      return {
        chainId: null,
        name: "Unknown",
        blockNumber: 0,
        isConnected: false,
      };
    }
  }

  /**
   * Check if blockchain is available
   */
  async isBlockchainAvailable(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.warn(
        "⚠️ Blockchain not available:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      return "0";
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Export utility functions
export const formatEther = (wei: string): string => {
  try {
    return ethers.formatEther(wei);
  } catch {
    return "0";
  }
};

export const parseEther = (ether: string): string => {
  try {
    return ethers.parseEther(ether).toString();
  } catch {
    return "0";
  }
};

export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};
