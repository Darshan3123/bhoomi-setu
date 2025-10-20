import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { blockchainService, formatEther, parseEther, isValidAddress } from '../services/blockchain';

const router = express.Router();

/**
 * GET /api/blockchain/status
 * Get blockchain connection status
 */
router.get('/status', async (req, res) => {
  try {
    const isAvailable = await blockchainService.isBlockchainAvailable();
    const networkInfo = await blockchainService.getNetworkInfo();

    res.json({
      success: true,
      blockchain: {
        available: isAvailable,
        network: networkInfo,
        contractAddress: process.env.LAND_REGISTRY_CONTRACT_ADDRESS || null,
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545'
      }
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get blockchain status',
      blockchain: {
        available: false,
        network: { isConnected: false },
        contractAddress: null,
        rpcUrl: null
      }
    });
  }
});

/**
 * GET /api/blockchain/property/:landId
 * Get property details from blockchain
 */
router.get('/property/:landId', async (req, res) => {
  try {
    const { landId } = req.params;
    const landIdNum = parseInt(landId);

    if (isNaN(landIdNum)) {
      return res.status(400).json({ error: 'Invalid land ID' });
    }

    const details = await blockchainService.getPropertyDetails(landIdNum);
    
    if (!details) {
      return res.status(404).json({ error: 'Property not found on blockchain' });
    }

    res.json({
      success: true,
      property: details
    });
  } catch (error) {
    console.error('Get blockchain property error:', error);
    res.status(500).json({ error: 'Failed to get property from blockchain' });
  }
});

/**
 * GET /api/blockchain/property/:landId/price
 * Get property price from blockchain
 */
router.get('/property/:landId/price', async (req, res) => {
  try {
    const { landId } = req.params;
    const landIdNum = parseInt(landId);

    if (isNaN(landIdNum)) {
      return res.status(400).json({ error: 'Invalid land ID' });
    }

    const priceInWei = await blockchainService.getPropertyPrice(landIdNum);
    const priceInEth = formatEther(priceInWei);

    res.json({
      success: true,
      price: {
        wei: priceInWei,
        eth: priceInEth,
        formatted: `${priceInEth} ETH`
      }
    });
  } catch (error) {
    console.error('Get property price error:', error);
    res.status(500).json({ error: 'Failed to get property price' });
  }
});

/**
 * POST /api/blockchain/property/:landId/price
 * Set property price on blockchain (admin only)
 */
router.post('/property/:landId/price', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { landId } = req.params;
    const { priceInEth, privateKey } = req.body;

    const landIdNum = parseInt(landId);
    if (isNaN(landIdNum)) {
      return res.status(400).json({ error: 'Invalid land ID' });
    }

    if (!priceInEth || isNaN(parseFloat(priceInEth))) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required for transaction' });
    }

    const priceInWei = parseEther(priceInEth);
    const success = await blockchainService.setPropertyPrice(landIdNum, priceInWei, privateKey);

    if (success) {
      res.json({
        success: true,
        message: 'Property price set successfully',
        price: {
          wei: priceInWei,
          eth: priceInEth
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to set property price on blockchain' });
    }
  } catch (error) {
    console.error('Set property price error:', error);
    res.status(500).json({ error: 'Failed to set property price' });
  }
});

/**
 * GET /api/blockchain/balance/:address
 * Get wallet balance
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const balance = await blockchainService.getBalance(address);

    res.json({
      success: true,
      balance: {
        eth: balance,
        address: address
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

/**
 * POST /api/blockchain/initialize
 * Initialize blockchain contract connection (admin only)
 */
router.post('/initialize', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { contractAddress, abi } = req.body;

    if (!contractAddress || !isValidAddress(contractAddress)) {
      return res.status(400).json({ error: 'Valid contract address required' });
    }

    const success = await blockchainService.initializeContract(contractAddress, abi);

    if (success) {
      res.json({
        success: true,
        message: 'Blockchain contract initialized successfully',
        contractAddress
      });
    } else {
      res.status(500).json({ error: 'Failed to initialize blockchain contract' });
    }
  } catch (error) {
    console.error('Initialize blockchain error:', error);
    res.status(500).json({ error: 'Failed to initialize blockchain contract' });
  }
});

export default router;