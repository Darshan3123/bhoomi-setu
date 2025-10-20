import { ethers } from 'ethers';
import { blockchainService } from './blockchain';

/**
 * Event Listener Service for monitoring smart contract events
 */
export class EventListenerService {
  private provider: ethers.JsonRpcProvider;
  private accessControlContract?: ethers.Contract;
  private landRegistryContract?: ethers.Contract;
  private isListening = false;

  constructor() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("🎧 Event Listener Service initialized");
  }

  /**
   * Initialize contracts for event listening
   */
  async initializeContracts() {
    try {
      // AccessControl contract ABI (minimal for events)
      const accessControlABI = [
        "event UserRegistered(address indexed user)",
        "event RoleAssigned(address indexed user, uint8 role)"
      ];

      // LandRegistry contract ABI (minimal for events)
      const landRegistryABI = [
        "event LandRegistered(uint256 indexed landId, address indexed owner, string ipfsHash, string location)",
        "event PropertyPriceSet(uint256 indexed landId, address indexed owner, uint256 priceInWei)",
        "event PropertyPriceUpdated(uint256 indexed landId, address indexed owner, uint256 oldPrice, uint256 newPrice)",
        "event PropertyTransferred(uint256 indexed landId, address indexed from, address indexed to)",
        "event PropertyStatusChanged(uint256 indexed landId, uint8 oldStatus, uint8 newStatus)"
      ];

      // Get contract addresses from environment or use deployed addresses
      const accessControlAddress = process.env.ACCESS_CONTROL_CONTRACT_ADDRESS;
      const landRegistryAddress = process.env.LAND_REGISTRY_CONTRACT_ADDRESS;

      if (accessControlAddress) {
        this.accessControlContract = new ethers.Contract(
          accessControlAddress,
          accessControlABI,
          this.provider
        );
        console.log("✅ AccessControl contract initialized for events:", accessControlAddress);
      }

      if (landRegistryAddress) {
        this.landRegistryContract = new ethers.Contract(
          landRegistryAddress,
          landRegistryABI,
          this.provider
        );
        console.log("✅ LandRegistry contract initialized for events:", landRegistryAddress);
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize contracts for events:", error);
      return false;
    }
  }

  /**
   * Start listening for contract events
   */
  async startListening() {
    if (this.isListening) {
      console.log("⚠️ Event listener is already running");
      return;
    }

    try {
      await this.initializeContracts();

      // Listen for AccessControl events
      if (this.accessControlContract) {
        this.setupAccessControlListeners();
      }

      // Listen for LandRegistry events
      if (this.landRegistryContract) {
        this.setupLandRegistryListeners();
      }

      this.isListening = true;
      console.log("🎧 Started listening for contract events");

    } catch (error) {
      console.error("❌ Failed to start event listening:", error);
    }
  }

  /**
   * Stop listening for events
   */
  stopListening() {
    if (!this.isListening) {
      console.log("⚠️ Event listener is not running");
      return;
    }

    try {
      // Remove all listeners
      if (this.accessControlContract) {
        this.accessControlContract.removeAllListeners();
      }

      if (this.landRegistryContract) {
        this.landRegistryContract.removeAllListeners();
      }

      this.isListening = false;
      console.log("🔇 Stopped listening for contract events");

    } catch (error) {
      console.error("❌ Failed to stop event listening:", error);
    }
  }

  /**
   * Setup AccessControl event listeners
   */
  private setupAccessControlListeners() {
    if (!this.accessControlContract) return;

    // Listen for UserRegistered events
    this.accessControlContract.on("UserRegistered", (user, event) => {
      console.log("🎉 EVENT: UserRegistered");
      console.log("  User:", user);
      console.log("  Block:", event.blockNumber);
      console.log("  Transaction:", event.transactionHash);
      
      // Here you can add database updates, notifications, etc.
      this.handleUserRegistered(user, event);
    });

    // Listen for RoleAssigned events
    this.accessControlContract.on("RoleAssigned", (user, role, event) => {
      console.log("🎉 EVENT: RoleAssigned");
      console.log("  User:", user);
      console.log("  Role:", this.getRoleName(role));
      console.log("  Block:", event.blockNumber);
      console.log("  Transaction:", event.transactionHash);
      
      // Here you can add database updates, notifications, etc.
      this.handleRoleAssigned(user, role, event);
    });

    console.log("✅ AccessControl event listeners setup complete");
  }

  /**
   * Setup LandRegistry event listeners
   */
  private setupLandRegistryListeners() {
    if (!this.landRegistryContract) return;

    // Listen for LandRegistered events
    this.landRegistryContract.on("LandRegistered", (landId, owner, ipfsHash, location, event) => {
      console.log("🎉 EVENT: LandRegistered");
      console.log("  Land ID:", landId.toString());
      console.log("  Owner:", owner);
      console.log("  IPFS Hash:", ipfsHash);
      console.log("  Location:", location);
      console.log("  Block:", event.blockNumber);
      console.log("  Transaction:", event.transactionHash);
      
      this.handleLandRegistered(landId, owner, ipfsHash, location, event);
    });

    // Listen for PropertyPriceSet events
    this.landRegistryContract.on("PropertyPriceSet", (landId, owner, priceInWei, event) => {
      console.log("🎉 EVENT: PropertyPriceSet");
      console.log("  Land ID:", landId.toString());
      console.log("  Owner:", owner);
      console.log("  Price (Wei):", priceInWei.toString());
      console.log("  Price (ETH):", ethers.formatEther(priceInWei));
      console.log("  Block:", event.blockNumber);
      console.log("  Transaction:", event.transactionHash);
      
      this.handlePropertyPriceSet(landId, owner, priceInWei, event);
    });

    // Listen for PropertyPriceUpdated events
    this.landRegistryContract.on("PropertyPriceUpdated", (landId, owner, oldPrice, newPrice, event) => {
      console.log("🎉 EVENT: PropertyPriceUpdated");
      console.log("  Land ID:", landId.toString());
      console.log("  Owner:", owner);
      console.log("  Old Price (ETH):", ethers.formatEther(oldPrice));
      console.log("  New Price (ETH):", ethers.formatEther(newPrice));
      console.log("  Block:", event.blockNumber);
      console.log("  Transaction:", event.transactionHash);
      
      this.handlePropertyPriceUpdated(landId, owner, oldPrice, newPrice, event);
    });

    console.log("✅ LandRegistry event listeners setup complete");
  }

  /**
   * Handle UserRegistered event
   */
  private async handleUserRegistered(user: string, event: any) {
    try {
      // Add your business logic here
      // For example: update database, send notifications, etc.
      console.log("📝 Processing UserRegistered event for:", user);
      
      // Example: You could update your user database here
      // await updateUserInDatabase(user, { isRegistered: true });
      
    } catch (error) {
      console.error("❌ Error handling UserRegistered event:", error);
    }
  }

  /**
   * Handle RoleAssigned event
   */
  private async handleRoleAssigned(user: string, role: number, event: any) {
    try {
      console.log("📝 Processing RoleAssigned event for:", user, "Role:", this.getRoleName(role));
      
      // Example: You could update your user database here
      // await updateUserInDatabase(user, { role: role });
      
    } catch (error) {
      console.error("❌ Error handling RoleAssigned event:", error);
    }
  }

  /**
   * Handle LandRegistered event
   */
  private async handleLandRegistered(landId: bigint, owner: string, ipfsHash: string, location: string, event: any) {
    try {
      console.log("📝 Processing LandRegistered event for Land ID:", landId.toString());
      
      // Example: You could update your property database here
      // await updatePropertyInDatabase(landId.toString(), {
      //   owner,
      //   ipfsHash,
      //   location,
      //   blockNumber: event.blockNumber,
      //   transactionHash: event.transactionHash
      // });
      
    } catch (error) {
      console.error("❌ Error handling LandRegistered event:", error);
    }
  }

  /**
   * Handle PropertyPriceSet event
   */
  private async handlePropertyPriceSet(landId: bigint, owner: string, priceInWei: bigint, event: any) {
    try {
      console.log("📝 Processing PropertyPriceSet event for Land ID:", landId.toString());
      
      // Example: You could update your property database here
      // await updatePropertyInDatabase(landId.toString(), {
      //   priceInWei: priceInWei.toString(),
      //   lastPriceUpdate: Date.now()
      // });
      
    } catch (error) {
      console.error("❌ Error handling PropertyPriceSet event:", error);
    }
  }

  /**
   * Handle PropertyPriceUpdated event
   */
  private async handlePropertyPriceUpdated(landId: bigint, owner: string, oldPrice: bigint, newPrice: bigint, event: any) {
    try {
      console.log("📝 Processing PropertyPriceUpdated event for Land ID:", landId.toString());
      
      // Example: You could update your property database here
      // await updatePropertyInDatabase(landId.toString(), {
      //   priceInWei: newPrice.toString(),
      //   lastPriceUpdate: Date.now()
      // });
      
    } catch (error) {
      console.error("❌ Error handling PropertyPriceUpdated event:", error);
    }
  }

  /**
   * Get role name from role number
   */
  private getRoleName(role: number): string {
    switch (role) {
      case 0: return "User";
      case 1: return "Inspector";
      case 2: return "Admin";
      default: return "Unknown";
    }
  }

  /**
   * Get listening status
   */
  isEventListenerRunning(): boolean {
    return this.isListening;
  }

  /**
   * Get past events from a specific block range
   */
  async getPastEvents(fromBlock: number = 0, toBlock: number | string = 'latest') {
    try {
      console.log(`🔍 Fetching past events from block ${fromBlock} to ${toBlock}`);

      const events: any[] = [];

      // Get AccessControl events
      if (this.accessControlContract) {
        const userRegisteredEvents = await this.accessControlContract.queryFilter(
          this.accessControlContract.filters.UserRegistered(),
          fromBlock,
          toBlock
        );

        const roleAssignedEvents = await this.accessControlContract.queryFilter(
          this.accessControlContract.filters.RoleAssigned(),
          fromBlock,
          toBlock
        );

        events.push(...userRegisteredEvents, ...roleAssignedEvents);
      }

      // Get LandRegistry events
      if (this.landRegistryContract) {
        const landRegisteredEvents = await this.landRegistryContract.queryFilter(
          this.landRegistryContract.filters.LandRegistered(),
          fromBlock,
          toBlock
        );

        const priceSetEvents = await this.landRegistryContract.queryFilter(
          this.landRegistryContract.filters.PropertyPriceSet(),
          fromBlock,
          toBlock
        );

        events.push(...landRegisteredEvents, ...priceSetEvents);
      }

      console.log(`📊 Found ${events.length} past events`);
      return events;

    } catch (error) {
      console.error("❌ Error fetching past events:", error);
      return [];
    }
  }
}

// Export singleton instance
export const eventListenerService = new EventListenerService();