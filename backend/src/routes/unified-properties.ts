import express from "express";
import multer from "multer";
import { authenticateToken, requireAdmin, requireRole } from "../middleware/auth";
import { requireKYCVerification, checkKYCStatus } from "../middleware/kycValidation";
import { Property } from "../models/Property";
import User from "../models/User";
import { ipfsService } from "../utils/ipfs";
import { ethers } from "ethers";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, JPG, and PNG files are allowed."
        )
      );
    }
  },
});

/**
 * POST /api/unified-properties/submit-for-verification
 * Submit property for verification (creates property with verification status)
 */
router.post("/submit-for-verification", authenticateToken, upload.array('documents', 5), async (req: any, res) => {
  try {
    console.log('🔍 Property verification submit request received');
    console.log('Request body:', req.body);
    console.log('Files:', req.files?.length || 0);
    console.log('User:', req.user?.walletAddress);
    
    const { surveyNumber, location, area, areaUnit, propertyType, priceInETH } = req.body;
    const files = req.files as Express.Multer.File[];
    const ownerAddress = req.walletAddress;
    const user = req.user;

    if (!surveyNumber || !location || !area || !propertyType) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: surveyNumber, location, area, propertyType' 
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one document is required' });
    }

    // Check if property already exists
    const existingProperty = await Property.findOne({ surveyId: surveyNumber });
    if (existingProperty) {
      return res.status(409).json({ error: 'Property already exists' });
    }

    // Generate verification ID
    const lastProperty = await Property.findOne({ verificationId: { $exists: true } }).sort({ verificationId: -1 });
    const verificationId = lastProperty?.verificationId ? lastProperty.verificationId + 1 : 1;

    // Upload documents to IPFS
    console.log('📤 Starting IPFS upload for', files.length, 'files');
    const verificationDocuments = [];
    const documentHashes = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`📄 Uploading file ${i + 1}:`, file.originalname, 'Size:', file.size);
        const filename = `property_doc_${surveyNumber}_${Date.now()}_${file.originalname}`;
        const ipfsHash = await ipfsService.uploadFile(file.buffer, filename);
        console.log('✅ IPFS upload successful:', ipfsHash);
        
        // Skip pinning for now (requires paid Pinata plan)
        try {
          await ipfsService.pinFile(ipfsHash);
          console.log('📌 IPFS pin successful');
        } catch (pinError) {
          console.log('⚠️ IPFS pin skipped (requires paid plan):', pinError instanceof Error ? pinError.message : 'Unknown error');
        }

        verificationDocuments.push({
          type: req.body.documentTypes?.[i] || 'other',
          ipfsHash,
          uploadedAt: new Date(),
          filename: file.originalname,
          size: file.size
        });
        
        documentHashes.push(ipfsHash);
      } catch (uploadError) {
        console.error(`❌ IPFS upload failed for file ${file.originalname}:`, uploadError);
        throw new Error(`Failed to upload document ${file.originalname}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    // Convert price from ETH to Wei if provided
    let priceInWei = '0';
    let priceInINR = 0;
    
    if (priceInETH && parseFloat(priceInETH) > 0) {
      try {
        priceInWei = ethers.parseEther(priceInETH.toString()).toString();
        // Rough conversion: 1 ETH ≈ ₹100,000 (you can update this rate)
        priceInINR = Math.round(parseFloat(priceInETH) * 100000);
        console.log(`💰 Price conversion: ${priceInETH} ETH = ${priceInWei} Wei = ₹${priceInINR}`);
      } catch (error) {
        console.error('❌ Price conversion error:', error);
        // Keep default values if conversion fails
      }
    }

    // Create unified property with verification data
    console.log('💾 Creating unified property record');
    const property = new Property({
      surveyId: surveyNumber,
      location,
      propertyType,
      area: parseFloat(area),
      areaUnit: areaUnit || 'sq ft',
      priceInWei,
      priceInINR,
      owner: user._id,
      ownerAddress: ownerAddress.toLowerCase(),
      forSale: false,
      status: 'active',
      documentHashes,
      hasDocuments: {
        saleDeed: documentHashes.length >= 1,
        taxReceipt: documentHashes.length >= 2,
        noc: documentHashes.length >= 3,
        propertyPhoto: documentHashes.length >= 4
      },
      
      // Verification fields
      verificationId,
      verificationStatus: 'pending',
      verificationDocuments,
      verificationNotifications: [{
        message: `Property verification submitted for ${surveyNumber}. Awaiting inspector assignment.`,
        sentAt: new Date(),
        recipients: [ownerAddress.toLowerCase()],
        type: 'info'
      }],
      verificationCreatedAt: new Date(),
      verificationUpdatedAt: new Date()
    });

    await property.save();
    console.log('✅ Unified property saved successfully');

    res.json({
      success: true,
      message: 'Property submitted for verification successfully',
      verificationId,
      property: {
        surveyId: property.surveyId,
        verificationId: property.verificationId,
        verificationStatus: property.verificationStatus,
        location: property.location,
        propertyType: property.propertyType,
        area: property.area,
        areaUnit: property.areaUnit
      }
    });

  } catch (error) {
    console.error('Property verification submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit property for verification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/unified-properties/admin/pending-verifications
 * Get pending property verifications (admin only)
 */
router.get("/admin/pending-verifications", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingProperties = await Property.find({
      verificationStatus: 'pending'
    })
    .populate('owner', 'profile walletAddress')
    .sort({ verificationCreatedAt: -1 });

    const propertiesWithOwners = pendingProperties.map(property => ({
      ...property.toObject(),
      owner: property.owner ? {
        walletAddress: (property.owner as any).walletAddress,
        name: (property.owner as any).profile?.name || 'Unknown',
        email: (property.owner as any).profile?.email || 'N/A',
        phone: (property.owner as any).profile?.phone || 'N/A'
      } : null
    }));

    res.json({
      success: true,
      verifications: propertiesWithOwners,
      count: propertiesWithOwners.length
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve pending verifications' });
  }
});

/**
 * POST /api/unified-properties/admin/assign-inspector
 * Assign inspector to property verification (admin only)
 */
router.post("/admin/assign-inspector", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { surveyId, inspectorAddress } = req.body;

    if (!surveyId || !inspectorAddress) {
      return res.status(400).json({ error: 'Survey ID and inspector address are required' });
    }

    // Verify inspector exists and has inspector role
    const inspector = await User.findOne({ 
      walletAddress: inspectorAddress.toLowerCase(),
      role: 'inspector'
    });

    if (!inspector) {
      return res.status(400).json({ error: 'Inspector not found or invalid role' });
    }

    const property = await Property.findOne({ surveyId });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'Property must be in pending verification status' });
    }

    // Assign inspector
    property.inspectorAddress = inspectorAddress.toLowerCase();
    property.verificationStatus = 'assigned';
    property.verificationUpdatedAt = new Date();
    
    // Add notification
    if (!property.verificationNotifications) {
      property.verificationNotifications = [];
    }
    property.verificationNotifications.push({
      message: `Inspector assigned: ${inspector.profile?.name || inspectorAddress}. Property verification will begin.`,
      sentAt: new Date(),
      recipients: [property.ownerAddress, inspectorAddress.toLowerCase()],
      type: 'info'
    });
    
    await property.save();

    res.json({
      success: true,
      message: 'Inspector assigned successfully',
      property: {
        surveyId: property.surveyId,
        verificationId: property.verificationId,
        verificationStatus: property.verificationStatus,
        inspectorAddress: property.inspectorAddress
      },
      inspector: {
        walletAddress: inspector.walletAddress,
        name: inspector.profile?.name || 'Unknown',
        email: inspector.profile?.email || 'N/A'
      }
    });

  } catch (error) {
    console.error('Assign inspector error:', error);
    res.status(500).json({ error: 'Failed to assign inspector' });
  }
});

/**
 * GET /api/unified-properties/inspector/assigned
 * Get assigned property verifications for inspector
 */
router.get("/inspector/assigned", authenticateToken, requireRole("inspector"), async (req: any, res) => {
  try {
    const inspectorAddress = req.walletAddress;

    const assignedProperties = await Property.find({
      inspectorAddress: inspectorAddress,
      verificationStatus: { $in: ['assigned', 'inspection_scheduled', 'inspected'] }
    })
    .populate('owner', 'profile walletAddress role createdAt')
    .sort({ verificationUpdatedAt: -1 });

    const propertiesWithOwners = assignedProperties.map(property => ({
      ...property.toObject(),
      owner: property.owner ? {
        walletAddress: (property.owner as any).walletAddress,
        name: (property.owner as any).profile?.name || 'Unknown',
        email: (property.owner as any).profile?.email || 'Not provided',
        phone: (property.owner as any).profile?.phone || 'Not provided',
        role: (property.owner as any).role || 'user',
        isKYCVerified: (property.owner as any).profile?.kycDocuments?.verified || false,
        kycStatus: (property.owner as any).profile?.kycDocuments?.verified ? 'verified' : 'pending',
        memberSince: (property.owner as any).createdAt
      } : null
    }));

    res.json({
      success: true,
      verifications: propertiesWithOwners,
      count: propertiesWithOwners.length
    });

  } catch (error) {
    console.error('Get assigned verifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve assigned verifications' });
  }
});

/**
 * GET /api/unified-properties/inspectors
 * Get available inspectors (simplified for property page)
 */
router.get("/inspectors", async (req, res) => {
  try {
    const inspectors = await User.find({ 
      role: 'inspector',
      'profile.kycDocuments.verified': true 
    }).select('walletAddress profile');

    const inspectorsWithStats = inspectors.map(inspector => ({
      walletAddress: inspector.walletAddress,
      name: inspector.profile?.name || 'Unknown',
      email: inspector.profile?.email || 'N/A',
      phone: inspector.profile?.phone || 'N/A'
    }));

    res.json({
      success: true,
      inspectors: inspectorsWithStats,
      totalInspectors: inspectorsWithStats.length
    });

  } catch (error) {
    console.error('Get inspectors error:', error);
    res.status(500).json({ error: 'Failed to retrieve inspectors' });
  }
});

/**
 * GET /api/unified-properties/my-properties
 * Get user's properties with KYC status (unified from Property collection)
 */
router.get("/my-properties", authenticateToken, async (req: any, res) => {
  try {
    console.log('🔍 My Properties API called');
    console.log('User ID:', req.user._id);
    console.log('User wallet:', req.user.walletAddress);
    console.log('User role:', req.user.role);
    
    // Get all properties from unified Property collection
    const properties = await Property.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });

    console.log(`📊 Found ${properties.length} properties for user ${req.user._id}`);
    
    if (properties.length === 0) {
      // Also check by wallet address in case there's a mismatch
      const propertiesByWallet = await Property.find({ 
        ownerAddress: req.user.walletAddress.toLowerCase() 
      }).sort({ createdAt: -1 });
      
      console.log(`📊 Found ${propertiesByWallet.length} properties by wallet address`);
      
      if (propertiesByWallet.length > 0) {
        console.log('⚠️ Properties found by wallet but not by user ID - possible data inconsistency');
        // Use properties found by wallet address
        properties.push(...propertiesByWallet);
      }
    }

    // Format all properties with verification status
    const formattedProperties = properties.map((property) => ({
      id: property._id,
      surveyId: property.surveyId,
      location: property.location,
      propertyType: property.propertyType,
      area: property.area,
      areaUnit: property.areaUnit,
      priceInWei: property.priceInWei,
      priceInINR: property.priceInINR,
      ownerAddress: property.ownerAddress,
      forSale: property.forSale,
      status: property.status,
      hasDocuments: property.hasDocuments,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      
      // Verification fields
      verificationId: property.verificationId,
      verificationStatus: property.verificationStatus || 'verified', // Default to verified for old properties
      inspectorAddress: property.inspectorAddress,
      rejectionReason: property.rejectionReason,
      verificationCreatedAt: property.verificationCreatedAt,
      verificationUpdatedAt: property.verificationUpdatedAt,
      verificationNotifications: property.verificationNotifications || [], // Include verification messages
      
      // Source indicator for frontend
      source: property.verificationStatus ? 'verification' : 'approved'
    }));

    console.log('✅ Returning properties:', formattedProperties.length);
    
    // Debug: Log verification notifications for first property
    if (formattedProperties.length > 0 && formattedProperties[0].verificationNotifications) {
      console.log('🔍 First property verification notifications:', formattedProperties[0].verificationNotifications.length);
    }

    res.json({
      success: true,
      properties: formattedProperties,
      kycStatus: 'verified', // Simplified for now
    });
  } catch (error) {
    console.error("❌ Get properties error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties",
    });
  }
});

/**
 * GET /api/unified-properties
 * Get all properties (with pagination and filters)
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      propertyType,
      forSale,
      verificationStatus,
      minPrice,
      maxPrice,
      location,
    } = req.query;

    // Auto-fix: Ensure all verified properties are marked for sale
    await Property.updateMany(
      { verificationStatus: 'verified', forSale: { $ne: true } },
      { $set: { forSale: true } }
    );

    // Build filter object
    const filter: any = {};

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    if (forSale !== undefined) {
      filter.forSale = forSale === "true";
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (minPrice || maxPrice) {
      filter.priceInWei = {};
      if (minPrice) {
        filter.priceInWei.$gte = minPrice;
      }
      if (maxPrice) {
        filter.priceInWei.$lte = maxPrice;
      }
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "profile walletAddress")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      properties: properties.map((property) => ({
        id: property._id,
        surveyId: property.surveyId,
        location: property.location,
        propertyType: property.propertyType,
        area: property.area,
        areaUnit: property.areaUnit,
        priceInWei: property.priceInWei,
        priceInINR: property.priceInINR,
        ownerAddress: property.ownerAddress,
        forSale: property.forSale,
        status: property.status,
        hasDocuments: property.hasDocuments,
        verificationId: property.verificationId,
        verificationStatus: property.verificationStatus,
        inspectorAddress: property.inspectorAddress,
        owner: property.owner,
        createdAt: property.createdAt,
      })),
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalProperties: total,
        hasNext: skip + properties.length < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties",
    });
  }
});

/**
 * POST /api/unified-properties/update-price
 * Update property price (owner only)
 */
router.post("/update-price", authenticateToken, async (req: any, res) => {
  try {
    const { surveyId, priceInETH } = req.body;

    if (!surveyId || !priceInETH) {
      return res.status(400).json({ 
        error: 'Survey ID and price in ETH are required' 
      });
    }

    if (parseFloat(priceInETH) <= 0) {
      return res.status(400).json({ 
        error: 'Price must be greater than 0' 
      });
    }

    const property = await Property.findOne({ surveyId });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if user is the owner
    if (property.ownerAddress.toLowerCase() !== req.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Only property owner can update price' });
    }

    // Convert price from ETH to Wei
    const priceInWei = ethers.parseEther(priceInETH.toString()).toString();
    const priceInINR = Math.round(parseFloat(priceInETH) * 100000); // 1 ETH ≈ ₹100,000

    // Update property price
    property.priceInWei = priceInWei;
    property.priceInINR = priceInINR;
    property.updatedAt = new Date();
    
    await property.save();

    console.log(`💰 Price updated for ${surveyId}: ${priceInETH} ETH = ${priceInWei} Wei = ₹${priceInINR}`);

    res.json({
      success: true,
      message: `Property price updated to ${priceInETH} ETH`,
      property: {
        surveyId: property.surveyId,
        priceInWei: property.priceInWei,
        priceInINR: property.priceInINR,
        priceInETH: priceInETH
      }
    });

  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Failed to update property price' });
  }
});

/**
 * POST /api/unified-properties/update-verification-status
 * Update verification status with remarks (admin/inspector only)
 */
router.post("/update-verification-status", authenticateToken, requireRole(["admin", "inspector"]), async (req: any, res) => {
  try {
    const { surveyId, status, remarks, updatedBy } = req.body;

    if (!surveyId || !status || !remarks) {
      return res.status(400).json({ 
        error: 'Survey ID, status, and remarks are required' 
      });
    }

    // Validate status
    const validStatuses = ['pending', 'assigned', 'inspection_scheduled', 'inspected', 'verified', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const property = await Property.findOne({ surveyId });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Store previous status for notification
    const previousStatus = property.verificationStatus;

    // Update verification status
    property.verificationStatus = status;
    property.verificationUpdatedAt = new Date();
    
    // Auto-list verified properties for sale in marketplace
    if (status === 'verified') {
      property.forSale = true;
      console.log(`🏷️ Property ${surveyId} automatically listed for sale (verified)`);
    }
    
    // Add status change notification
    if (!property.verificationNotifications) {
      property.verificationNotifications = [];
    }
    
    let notificationMessage = `Verification status changed from ${previousStatus || 'unknown'} to ${status}. Remarks: ${remarks}`;
    if (status === 'verified') {
      notificationMessage += ' Property has been automatically listed for sale in the marketplace.';
    }
    
    property.verificationNotifications.push({
      message: notificationMessage,
      sentAt: new Date(),
      recipients: [property.ownerAddress, ...(property.inspectorAddress ? [property.inspectorAddress] : [])],
      type: 'info'
    });
    
    await property.save();

    console.log(`✅ Verification status updated for ${surveyId}: ${previousStatus} → ${status}`);

    const responseMessage = status === 'verified' 
      ? `Verification status updated to ${status}. Property automatically listed for sale.`
      : `Verification status updated to ${status}`;

    res.json({
      success: true,
      message: responseMessage,
      property: {
        surveyId: property.surveyId,
        verificationId: property.verificationId,
        verificationStatus: property.verificationStatus,
        forSale: property.forSale,
        previousStatus,
        updatedAt: property.verificationUpdatedAt
      }
    });

  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

/**
 * GET /api/unified-properties/:surveyId
 * Get property details by survey ID (includes verification data)
 * NOTE: This route must be LAST to avoid conflicts with specific routes like /my-properties
 */
router.get("/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;

    const property = await Property.findOne({ surveyId })
      .populate('owner', 'profile walletAddress role createdAt');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Format response with both property and verification data
    const response = {
      success: true,
      property: {
        // Basic property info
        id: property._id,
        surveyId: property.surveyId,
        location: property.location,
        propertyType: property.propertyType,
        area: property.area,
        areaUnit: property.areaUnit,
        priceInWei: property.priceInWei,
        priceInINR: property.priceInINR,
        ownerAddress: property.ownerAddress,
        forSale: property.forSale,
        status: property.status,
        hasDocuments: property.hasDocuments,
        documentHashes: property.documentHashes,
        blockchainTxHash: property.blockchainTxHash,
        contractAddress: property.contractAddress,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        
        // Verification data (if exists)
        verificationId: property.verificationId,
        verificationStatus: property.verificationStatus,
        inspectorAddress: property.inspectorAddress,
        verificationDocuments: property.verificationDocuments,
        inspectionReport: property.inspectionReport,
        verificationNotifications: property.verificationNotifications,
        rejectionReason: property.rejectionReason,
        verificationCreatedAt: property.verificationCreatedAt,
        verificationUpdatedAt: property.verificationUpdatedAt,
        
        // Owner details
        owner: property.owner ? {
          walletAddress: (property.owner as any).walletAddress,
          name: (property.owner as any).profile?.name || 'Unknown',
          email: (property.owner as any).profile?.email || 'Not provided',
          phone: (property.owner as any).profile?.phone || 'Not provided',
          role: (property.owner as any).role || 'user',
          isKYCVerified: (property.owner as any).profile?.kycDocuments?.verified || false,
          kycStatus: (property.owner as any).profile?.kycDocuments?.verified ? 'verified' : 'pending',
          memberSince: (property.owner as any).createdAt
        } : null
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
});

export default router;