import { ethers } from 'ethers';
import PropertyRegistryABI from '../contracts/PropertyRegistry.json';

// Blockchain configuration
const PROVIDER_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.PROPERTY_REGISTRY_CONTRACT_ADDRESS;

let provider: ethers.JsonRpcProvider;
let signer: ethers.Wallet;
let contract: ethers.Contract;

// Initialize blockchain connection
function initializeBlockchain() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(PROVIDER_URL);
  }
  
  if (!signer && PRIVATE_KEY) {
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
  }
  
  if (!contract && CONTRACT_ADDRESS && signer) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, PropertyRegistryABI.abi, signer);
  }
}

export interface PropertyRegistrationData {
  surveyId: string;
  location: string;
  propertyType: string;
  area: number;
  areaUnit: string;
  priceInWei: string;
  priceInINR: number;
  documentHashes: string[];
}

export interface BlockchainResult {
  success: boolean;
  txHash?: string;
  contractAddress?: string;
  error?: string;
}

/**
 * Register property on blockchain
 */
export async function registerPropertyOnBlockchain(
  propertyData: PropertyRegistrationData
): Promise<BlockchainResult> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized. Check configuration.'
      };
    }

    // Prepare contract parameters
    const {
      surveyId,
      location,
      propertyType,
      area,
      areaUnit,
      priceInWei,
      priceInINR,
      documentHashes
    } = propertyData;

    console.log('Registering property on blockchain:', {
      surveyId,
      location,
      propertyType,
      area,
      areaUnit,
      priceInWei,
      priceInINR,
      documentHashesCount: documentHashes.length
    });

    // Call smart contract function
    const tx = await contract.registerProperty(
      surveyId,
      location,
      propertyType,
      area,
      areaUnit,
      priceInWei,
      priceInINR,
      documentHashes,
      {
        gasLimit: 500000 // Set appropriate gas limit
      }
    );

    console.log('Transaction sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt.hash);

    return {
      success: true,
      txHash: receipt.hash,
      contractAddress: CONTRACT_ADDRESS
    };

  } catch (error: any) {
    console.error('Blockchain registration error:', error);
    
    let errorMessage = 'Blockchain registration failed';
    
    if (error?.code === 'CALL_EXCEPTION') {
      errorMessage = 'Smart contract call failed. Check if property already exists.';
    } else if (error?.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (error?.code === 'NETWORK_ERROR') {
      errorMessage = 'Network connection error';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get property from blockchain
 */
export async function getPropertyFromBlockchain(surveyId: string): Promise<{
  success: boolean;
  property?: any;
  error?: string;
}> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized'
      };
    }

    const property = await contract.getProperty(surveyId);

    return {
      success: true,
      property: {
        surveyId: property.surveyId,
        location: property.location,
        propertyType: property.propertyType,
        area: property.area.toString(),
        areaUnit: property.areaUnit,
        priceInWei: property.priceInWei.toString(),
        priceInINR: property.priceInINR.toString(),
        owner: property.owner,
        forSale: property.forSale,
        isRegistered: property.isRegistered,
        registrationDate: property.registrationDate.toString(),
        documentHashes: property.documentHashes
      }
    };

  } catch (error: any) {
    console.error('Get property from blockchain error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get property from blockchain'
    };
  }
}

/**
 * List property for sale on blockchain
 */
export async function listPropertyForSale(
  surveyId: string,
  priceInWei: string
): Promise<BlockchainResult> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized'
      };
    }

    const tx = await contract.listForSale(surveyId, priceInWei, {
      gasLimit: 200000
    });

    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      contractAddress: CONTRACT_ADDRESS
    };

  } catch (error: any) {
    console.error('List for sale error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to list property for sale'
    };
  }
}

/**
 * Buy property on blockchain
 */
export async function buyPropertyOnBlockchain(
  surveyId: string,
  priceInWei: string,
  buyerPrivateKey: string
): Promise<BlockchainResult> {
  try {
    // Create buyer signer
    const buyerSigner = new ethers.Wallet(buyerPrivateKey, provider);
    const buyerContract = new ethers.Contract(CONTRACT_ADDRESS!, PropertyRegistryABI.abi, buyerSigner);

    const tx = await buyerContract.buyProperty(surveyId, {
      value: priceInWei,
      gasLimit: 300000
    });

    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      contractAddress: CONTRACT_ADDRESS
    };

  } catch (error: any) {
    console.error('Buy property error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to buy property'
    };
  }
}

/**
 * Transfer property on blockchain
 */
export async function transferPropertyOnBlockchain(
  surveyId: string,
  newOwner: string,
  reason: string
): Promise<BlockchainResult> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized'
      };
    }

    const tx = await contract.transferProperty(surveyId, newOwner, reason, {
      gasLimit: 250000
    });

    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      contractAddress: CONTRACT_ADDRESS
    };

  } catch (error: any) {
    console.error('Transfer property error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to transfer property'
    };
  }
}

/**
 * Get properties for sale from blockchain
 */
export async function getPropertiesForSale(): Promise<{
  success: boolean;
  properties?: string[];
  error?: string;
}> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized'
      };
    }

    const properties = await contract.getPropertiesForSale();

    return {
      success: true,
      properties
    };

  } catch (error: any) {
    console.error('Get properties for sale error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get properties for sale'
    };
  }
}

/**
 * Get properties by owner from blockchain
 */
export async function getPropertiesByOwner(ownerAddress: string): Promise<{
  success: boolean;
  properties?: string[];
  error?: string;
}> {
  try {
    initializeBlockchain();

    if (!contract) {
      return {
        success: false,
        error: 'Blockchain contract not initialized'
      };
    }

    const properties = await contract.getPropertiesByOwner(ownerAddress);

    return {
      success: true,
      properties
    };

  } catch (error: any) {
    console.error('Get properties by owner error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get properties by owner'
    };
  }
}

/**
 * Get blockchain network info
 */
export async function getNetworkInfo(): Promise<{
  success: boolean;
  network?: any;
  error?: string;
}> {
  try {
    initializeBlockchain();

    if (!provider) {
      return {
        success: false,
        error: 'Provider not initialized'
      };
    }

    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    return {
      success: true,
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber
      }
    };

  } catch (error: any) {
    console.error('Get network info error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get network info'
    };
  }
}

/**
 * Check blockchain connection
 */
export async function checkBlockchainConnection(): Promise<boolean> {
  try {
    initializeBlockchain();
    
    if (!provider) {
      return false;
    }

    await provider.getBlockNumber();
    return true;

  } catch (error) {
    console.error('Blockchain connection check failed:', error);
    return false;
  }
}