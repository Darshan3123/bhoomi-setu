import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { ipfsService } from '../utils/ipfs';
import Case from '../models/Case';

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow document file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

/**
 * POST /api/documents/upload
 * Upload property documents to IPFS
 */
router.post('/upload', authenticateToken, upload.array('documents', 10), async (req, res) => {
  try {
    const { documentType, landId, requestId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    const validDocTypes = ['property_deed', 'survey_report', 'tax_receipt', 'identity_proof', 'other'];
    if (!validDocTypes.includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const uploadedDocuments = [];

    // Upload each file to IPFS
    for (const file of files) {
      const filename = `${documentType}_${(req as any).walletAddress}_${Date.now()}_${file.originalname}`;
      const ipfsHash = await ipfsService.uploadFile(file.buffer, filename);
      
      // Pin the file to ensure availability
      await ipfsService.pinFile(ipfsHash);

      uploadedDocuments.push({
        type: documentType,
        ipfsHash,
        filename: file.originalname,
        size: file.size,
        uploadedAt: new Date()
      });
    }

    // If requestId is provided, add documents to the case
    if (requestId) {
      const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
      if (caseRecord && caseRecord.fromAddress === (req as any).walletAddress) {
        caseRecord.documents.push(...uploadedDocuments);
        await caseRecord.save();
      }
    }

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

/**
 * GET /api/documents/:hash
 * Retrieve document from IPFS
 */
router.get('/:hash', authenticateToken, async (req, res) => {
  try {
    const { hash } = req.params;

    // Validate IPFS hash format
    if (!/^Qm[a-zA-Z0-9]{44}$/.test(hash)) {
      return res.status(400).json({ error: 'Invalid IPFS hash format' });
    }

    // Check if user has access to this document
    // This is a simplified check - in production, you'd want more sophisticated access control
    const hasAccess = await checkDocumentAccess(hash, (req as any).walletAddress, (req as any).user.role);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this document' });
    }

    // Retrieve file from IPFS
    const fileBuffer = await ipfsService.getFile(hash);
    const fileStats = await ipfsService.getFileStats(hash);

    // Set appropriate headers
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileStats.size.toString(),
      'Content-Disposition': `attachment; filename="${hash}"`
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

/**
 * POST /api/documents/verify
 * Verify document integrity using IPFS hash
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash || !/^Qm[a-zA-Z0-9]{44}$/.test(hash)) {
      return res.status(400).json({ error: 'Valid IPFS hash required' });
    }

    // Get file stats to verify existence and integrity
    const fileStats = await ipfsService.getFileStats(hash);
    
    res.json({
      success: true,
      verified: true,
      hash,
      size: fileStats.size,
      type: fileStats.type
    });

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(404).json({ 
      success: false,
      verified: false,
      error: 'Document not found or corrupted' 
    });
  }
});

/**
 * GET /api/documents/case/:requestId
 * Get all documents for a specific case
 */
router.get('/case/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userRole = (req as any).user.role;
    const walletAddress = (req as any).walletAddress;

    const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
    
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check access permissions
    const hasAccess = userRole === 'admin' || 
                     caseRecord.fromAddress === walletAddress ||
                     caseRecord.toAddress === walletAddress;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to case documents' });
    }

    res.json({
      success: true,
      requestId: caseRecord.requestId,
      documents: caseRecord.documents,
      inspectionReport: caseRecord.inspectionReport
    });

  } catch (error) {
    console.error('Get case documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve case documents' });
  }
});



/**
 * Helper function to check document access permissions
 */
async function checkDocumentAccess(hash: string, walletAddress: string, userRole: string): Promise<boolean> {
  try {
    // Admins have access to all documents
    if (userRole === 'admin') {
      return true;
    }

    // Check if the document belongs to any case the user is involved in
    const cases = await Case.find({
      $and: [
        {
          $or: [
            { fromAddress: walletAddress },
            { toAddress: walletAddress }
          ]
        },
        {
          'documents.ipfsHash': hash
        }
      ]
    });

    return cases.length > 0;
  } catch (error) {
    console.error('Document access check error:', error);
    return false;
  }
}

export default router;