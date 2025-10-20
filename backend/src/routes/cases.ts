import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import Case from '../models/Case';
import User from '../models/User';

const router = express.Router();

/**
 * POST /api/cases/create
 * Create a new transfer case
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { requestId, landId, toAddress, documentsHash } = req.body;
    const fromAddress = (req as any).walletAddress;

    if (!requestId || !landId || !toAddress || !documentsHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: requestId, landId, toAddress, documentsHash' 
      });
    }

    // Check if case already exists
    const existingCase = await Case.findOne({ requestId });
    if (existingCase) {
      return res.status(409).json({ error: 'Case already exists' });
    }

    // Verify recipient is registered
    const recipient = await User.findOne({ walletAddress: toAddress.toLowerCase() });
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient is not registered' });
    }

    // Create new case
    const newCase = new Case({
      requestId,
      landId,
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      status: 'pending',
      documents: [{
        type: 'property_deed',
        ipfsHash: documentsHash,
        uploadedAt: new Date()
      }]
    });

    await newCase.save();

    // Add initial notification
    await newCase.addNotification(
      `New land transfer request created for Land ID: ${landId}`,
      [fromAddress.toLowerCase(), toAddress.toLowerCase()],
      'info'
    );

    res.json({
      success: true,
      message: 'Transfer case created successfully',
      case: newCase
    });

  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

/**
 * GET /api/cases/my-cases
 * Get cases for current user
 */
router.get('/my-cases', authenticateToken, async (req, res) => {
  try {
    const walletAddress = (req as any).walletAddress;
    const userRole = (req as any).user.role;

    let query: any;

    if (userRole === 'admin') {
      // Admins see all cases
      query = {};
    } else {
      // Users see cases they're involved in
      query = {
        $or: [
          { fromAddress: walletAddress },
          { toAddress: walletAddress }
        ]
      };
    }

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      cases,
      count: cases.length
    });

  } catch (error) {
    console.error('Get my cases error:', error);
    res.status(500).json({ error: 'Failed to retrieve cases' });
  }
});

/**
 * GET /api/cases/:requestId
 * Get specific case details
 */
router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const walletAddress = (req as any).walletAddress;
    const userRole = (req as any).user.role;

    const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
    
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check access permissions
    const hasAccess = userRole === 'admin' || 
                     caseRecord.fromAddress === walletAddress ||
                     caseRecord.toAddress === walletAddress;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    res.json({
      success: true,
      case: caseRecord
    });

  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to retrieve case' });
  }
});


/**
 * POST /api/cases/:requestId/update-status
 * Update case status
 */
router.post('/:requestId/update-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reason } = req.body;
    const userRole = (req as any).user.role;
    const walletAddress = (req as any).walletAddress;

    const validStatuses = ['pending', 'inspection_scheduled', 'inspected', 'approved', 'rejected', 'completed'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
    
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check permissions - only admin can update case status
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update case status' });
    }

    // Update status
    await caseRecord.updateStatus(status, reason);

    // Add notification
    const message = reason ? 
      `Case status updated to ${status}. Reason: ${reason}` :
      `Case status updated to ${status}`;

    const recipients = [caseRecord.fromAddress, caseRecord.toAddress];

    await caseRecord.addNotification(message, recipients, 'info');

    res.json({
      success: true,
      message: 'Case status updated successfully',
      case: caseRecord
    });

  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({ error: 'Failed to update case status' });
  }
});

/**
 * GET /api/cases/pending/count
 * Get count of pending cases (admin only)
 */
router.get('/pending/count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingCount = await Case.countDocuments({ status: 'pending' });
    const inspectionScheduledCount = await Case.countDocuments({ status: 'inspection_scheduled' });
    const inspectedCount = await Case.countDocuments({ status: 'inspected' });

    res.json({
      success: true,
      counts: {
        pending: pendingCount,
        inspectionScheduled: inspectionScheduledCount,
        inspected: inspectedCount,
        total: pendingCount + inspectionScheduledCount + inspectedCount
      }
    });

  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Failed to get pending cases count' });
  }
});



/**
 * POST /api/cases/:requestId/assign-inspector
 * Assign inspector to a case (admin only)
 */
router.post('/:requestId/assign-inspector', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { inspectorAddress } = req.body;

    if (!inspectorAddress) {
      return res.status(400).json({ error: 'Inspector address is required' });
    }

    // Verify inspector exists and has inspector role
    const inspector = await User.findOne({ 
      walletAddress: inspectorAddress.toLowerCase(),
      role: 'inspector'
    });

    if (!inspector) {
      return res.status(400).json({ error: 'Inspector not found or invalid role' });
    }

    const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
    
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseRecord.status !== 'pending') {
      return res.status(400).json({ error: 'Case must be in pending status to assign inspector' });
    }

    // Assign inspector
    caseRecord.inspectorAddress = inspectorAddress.toLowerCase();
    caseRecord.status = 'inspection_scheduled';
    await caseRecord.save();

    // Add notification
    await caseRecord.addNotification(
      `Inspector assigned: ${inspector.profile?.name || inspectorAddress}. Site inspection will be scheduled.`,
      [caseRecord.fromAddress, caseRecord.toAddress, inspectorAddress.toLowerCase()],
      'info'
    );

    res.json({
      success: true,
      message: 'Inspector assigned successfully',
      case: caseRecord,
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
 * GET /api/cases/available-inspectors
 * Get list of available inspectors (admin only)
 */
router.get('/available-inspectors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const inspectors = await User.find({ 
      role: 'inspector',
      'profile.kycDocuments.verified': true 
    }).select('walletAddress profile');

    // Get case counts for each inspector
    const inspectorsWithStats = await Promise.all(
      inspectors.map(async (inspector) => {
        const [totalAssigned, pendingCases, completedCases] = await Promise.all([
          Case.countDocuments({ inspectorAddress: inspector.walletAddress }),
          Case.countDocuments({ 
            inspectorAddress: inspector.walletAddress, 
            status: { $in: ['inspection_scheduled', 'pending'] }
          }),
          Case.countDocuments({ 
            inspectorAddress: inspector.walletAddress, 
            status: 'inspected' 
          })
        ]);

        return {
          walletAddress: inspector.walletAddress,
          name: inspector.profile?.name || 'Unknown',
          email: inspector.profile?.email || 'N/A',
          phone: inspector.profile?.phone || 'N/A',
          stats: {
            totalAssigned,
            pendingCases,
            completedCases,
            workload: pendingCases // Use pending cases as workload indicator
          }
        };
      })
    );

    // Sort by workload (ascending) to show least busy inspectors first
    inspectorsWithStats.sort((a, b) => a.stats.workload - b.stats.workload);

    res.json({
      success: true,
      inspectors: inspectorsWithStats,
      totalInspectors: inspectorsWithStats.length
    });

  } catch (error) {
    console.error('Get available inspectors error:', error);
    res.status(500).json({ error: 'Failed to retrieve available inspectors' });
  }
});

/**
 * GET /api/cases/:requestId/notifications
 * Get notifications for a specific case
 */
router.get('/:requestId/notifications', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const walletAddress = (req as any).walletAddress;
    const userRole = (req as any).user.role;

    const caseRecord = await Case.findOne({ requestId: parseInt(requestId) });
    
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check access permissions
    const hasAccess = userRole === 'admin' || 
                     caseRecord.fromAddress === walletAddress ||
                     caseRecord.toAddress === walletAddress;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to case notifications' });
    }

    // Filter notifications for current user
    const userNotifications = caseRecord.notifications.filter(notification =>
      notification.recipients.includes(walletAddress) || userRole === 'admin'
    );

    res.json({
      success: true,
      notifications: userNotifications,
      count: userNotifications.length
    });

  } catch (error) {
    console.error('Get case notifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

export default router;