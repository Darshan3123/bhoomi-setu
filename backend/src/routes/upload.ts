import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { ipfsService } from '../utils/ipfs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

/**
 * @route POST /api/upload/ipfs
 * @desc Upload file to IPFS
 * @access Private
 */
router.post('/ipfs', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { documentType } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    // Validate document type
    const validDocumentTypes = ['saleDeed', 'taxReceipt', 'noc', 'propertyPhoto'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type'
      });
    }

    // Upload to IPFS
    const ipfsHash = await ipfsService.uploadFile(
      req.file.buffer,
      `${documentType}_${req.user._id}_${Date.now()}.${req.file.originalname.split('.').pop()}`
    );

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    res.json({
      success: true,
      message: 'File uploaded to IPFS successfully',
      ipfsHash,
      ipfsUrl,
      documentType,
      filename: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

/**
 * @route GET /api/upload/ipfs/:hash
 * @desc Get file from IPFS
 * @access Public
 */
router.get('/ipfs/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'IPFS hash is required'
      });
    }

    // Return IPFS gateway URL
    const ipfsGatewayUrl = `${process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs'}/${hash}`;

    res.json({
      success: true,
      ipfsHash: hash,
      ipfsUrl: ipfsGatewayUrl,
      gatewayUrl: ipfsGatewayUrl
    });

  } catch (error) {
    console.error('IPFS get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IPFS file'
    });
  }
});

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple files to IPFS
 * @access Private
 */
router.post('/multiple', authenticateToken, upload.array('files', 4), async (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { documentTypes } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!documentTypes || documentTypes.length !== files.length) {
      return res.status(400).json({
        success: false,
        error: 'Document types must match number of files'
      });
    }

    const uploadPromises = files.map(async (file, index) => {
      const documentType = documentTypes[index];
      
      try {
        const ipfsHash = await ipfsService.uploadFile(
          file.buffer,
          `${documentType}_${req.user._id}_${Date.now()}.${file.originalname.split('.').pop()}`
        );
        
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        return {
          documentType,
          filename: file.originalname,
          size: file.size,
          contentType: file.mimetype,
          ipfsHash,
          ipfsUrl,
          success: true,
          error: null
        };
      } catch (error) {
        return {
          documentType,
          filename: file.originalname,
          size: file.size,
          contentType: file.mimetype,
          ipfsHash: null,
          ipfsUrl: null,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: failed.length === 0,
      message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results: {
        successful,
        failed,
        total: files.length
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

export default router;