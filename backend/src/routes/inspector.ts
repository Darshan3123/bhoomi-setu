import express from "express";
import Case from "../models/Case";
import { Property } from "../models/Property";
import User from "../models/User";
import { authenticateToken, requireRole } from "../middleware/auth";
import { devAuthenticateToken } from "../middleware/devAuth";
import { ipfsService } from "../utils/ipfs";
import multer from "multer";

const router = express.Router();

// Configure multer for inspection report uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for inspection reports
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/json"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPEG, PNG, and JSON files are allowed."));
    }
  },
});

/**
 * GET /api/inspector/assigned-cases
 * Get all cases assigned to the current inspector (both transfer cases and property verifications)
 */
router.get("/assigned-cases", devAuthenticateToken, requireRole("inspector"), async (req, res) => {
  try {
    const inspectorAddress = (req as any).walletAddress;

    // Get transfer cases
    const assignedCases = await Case.find({
      inspectorAddress: inspectorAddress,
    }).sort({ createdAt: -1 });

    // Get property verification cases
    const assignedVerifications = await Property.find({
      inspectorAddress: inspectorAddress,
      verificationStatus: { $in: ['assigned', 'inspection_scheduled', 'inspected'] }
    }).populate('owner', 'profile walletAddress').sort({ verificationCreatedAt: -1 });

    // Format transfer cases
    const formattedCases = assignedCases.map(caseRecord => ({
      id: caseRecord.requestId,
      type: 'transfer',
      requestId: caseRecord.requestId,
      landId: caseRecord.landId,
      fromAddress: caseRecord.fromAddress,
      toAddress: caseRecord.toAddress,
      status: caseRecord.status,
      documentsCount: caseRecord.documents.length,
      hasInspectionReport: !!caseRecord.inspectionReport,
      assignedAt: caseRecord.updatedAt,
      createdAt: caseRecord.createdAt,
    }));

    // Format property verification cases
    const formattedVerifications = assignedVerifications.map((verification: any) => ({
      id: verification.verificationId,
      type: 'verification',
      verificationId: verification.verificationId,
      propertyId: verification.surveyId,
      ownerAddress: verification.ownerAddress,
      propertyDetails: {
        surveyNumber: verification.surveyId,
        location: verification.location,
        area: verification.area,
        areaUnit: verification.areaUnit,
        propertyType: verification.propertyType,
        ownerName: verification.owner?.profile?.name || 'Unknown'
      },
      status: verification.verificationStatus,
      documentsCount: verification.documents.length,
      hasInspectionReport: !!verification.inspectionReport,
      assignedAt: verification.updatedAt,
      createdAt: verification.createdAt,
    }));

    // Combine and sort all cases
    const allCases = [...formattedCases, ...formattedVerifications].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      cases: allCases,
      totalCases: allCases.length,
      transferCases: formattedCases.length,
      verificationCases: formattedVerifications.length,
      pendingInspections: allCases.filter(c => 
        c.status === 'inspection_scheduled' || c.status === 'assigned'
      ).length,
      completedInspections: allCases.filter(c => c.status === 'inspected').length,
    });

  } catch (error) {
    console.error("Get assigned cases error:", error);
    res.status(500).json({ error: "Failed to retrieve assigned cases" });
  }
});

/**
 * GET /api/inspector/case/:requestId
 * Get detailed case information for inspector
 */
router.get("/case/:requestId", authenticateToken, requireRole("inspector"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const inspectorAddress = (req as any).walletAddress;

    const caseRecord = await Case.findOne({ 
      requestId: parseInt(requestId),
      inspectorAddress: inspectorAddress 
    });

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found or not assigned to you" });
    }

    // Get seller and buyer details
    const [seller, buyer] = await Promise.all([
      User.findOne({ walletAddress: caseRecord.fromAddress }).select('profile walletAddress'),
      User.findOne({ walletAddress: caseRecord.toAddress }).select('profile walletAddress')
    ]);

    res.json({
      success: true,
      case: {
        ...caseRecord.toObject(),
        seller: seller ? {
          walletAddress: seller.walletAddress,
          name: seller.profile?.name || 'Unknown',
          email: seller.profile?.email || 'N/A',
          phone: seller.profile?.phone || 'N/A',
        } : null,
        buyer: buyer ? {
          walletAddress: buyer.walletAddress,
          name: buyer.profile?.name || 'Unknown',
          email: buyer.profile?.email || 'N/A',
          phone: buyer.profile?.phone || 'N/A',
        } : null,
      }
    });

  } catch (error) {
    console.error("Get case details error:", error);
    res.status(500).json({ error: "Failed to retrieve case details" });
  }
});

/**
 * PUT /api/inspector/case/:requestId/schedule-visit
 * Mark case as visit scheduled
 */
router.put("/case/:requestId/schedule-visit", authenticateToken, requireRole("inspector"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { scheduledDate, notes } = req.body;
    const inspectorAddress = (req as any).walletAddress;

    const caseRecord = await Case.findOne({ 
      requestId: parseInt(requestId),
      inspectorAddress: inspectorAddress 
    });

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found or not assigned to you" });
    }

    if (caseRecord.status !== 'pending') {
      return res.status(400).json({ error: "Case is not in pending status" });
    }

    // Update case status
    await caseRecord.updateStatus('inspection_scheduled');

    // Add notification
    const message = scheduledDate 
      ? `Site visit scheduled for ${new Date(scheduledDate).toLocaleDateString()}. ${notes || ''}`
      : `Site visit has been scheduled. ${notes || ''}`;

    await caseRecord.addNotification(
      message,
      [caseRecord.fromAddress, caseRecord.toAddress],
      'info'
    );

    res.json({
      success: true,
      message: "Site visit scheduled successfully",
      case: caseRecord
    });

  } catch (error) {
    console.error("Schedule visit error:", error);
    res.status(500).json({ error: "Failed to schedule site visit" });
  }
});

/**
 * POST /api/inspector/case/:requestId/submit-report
 * Submit inspection report
 */
router.post("/case/:requestId/submit-report", 
  authenticateToken, 
  requireRole("inspector"), 
  upload.single('report'), 
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { recommendation, notes, gpsLocation, visitDate } = req.body;
      const file = req.file;
      const inspectorAddress = (req as any).walletAddress;

      if (!file) {
        return res.status(400).json({ error: "Inspection report file is required" });
      }

      if (!recommendation || !['approve', 'reject'].includes(recommendation)) {
        return res.status(400).json({ error: "Valid recommendation (approve/reject) is required" });
      }

      const caseRecord = await Case.findOne({ 
        requestId: parseInt(requestId),
        inspectorAddress: inspectorAddress 
      });

      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found or not assigned to you" });
      }

      if (caseRecord.status !== 'inspection_scheduled') {
        return res.status(400).json({ error: "Case must be in inspection_scheduled status" });
      }

      // Upload report to IPFS
      const filename = `inspection_report_${requestId}_${Date.now()}_${file.originalname}`;
      const ipfsHash = await ipfsService.uploadFile(file.buffer, filename);

      // Pin the file
      await ipfsService.pinFile(ipfsHash);

      // Update case with inspection report
      caseRecord.inspectionReport = {
        ipfsHash,
        submittedAt: new Date(),
        recommendation: recommendation as 'approve' | 'reject',
        notes: notes || '',
      };

      // Add GPS location and visit date to notes if provided
      let enhancedNotes = notes || '';
      if (gpsLocation) {
        enhancedNotes += `\nGPS Location: ${gpsLocation}`;
      }
      if (visitDate) {
        enhancedNotes += `\nVisit Date: ${visitDate}`;
      }
      
      caseRecord.inspectionReport.notes = enhancedNotes;
      caseRecord.status = 'inspected';
      await caseRecord.save();

      // Add notification
      await caseRecord.addNotification(
        `Inspection report submitted with recommendation: ${recommendation}. ${notes || ''}`,
        [caseRecord.fromAddress, caseRecord.toAddress],
        recommendation === 'approve' ? 'success' : 'warning'
      );

      res.json({
        success: true,
        message: "Inspection report submitted successfully",
        reportHash: ipfsHash,
        recommendation,
        case: caseRecord
      });

    } catch (error) {
      console.error("Submit inspection report error:", error);
      res.status(500).json({ error: "Failed to submit inspection report" });
    }
  }
);

/**
 * GET /api/inspector/dashboard-stats
 * Get inspector dashboard statistics (including property verifications)
 */
router.get("/dashboard-stats", authenticateToken, requireRole("inspector"), async (req, res) => {
  try {
    const inspectorAddress = (req as any).walletAddress;

    // Transfer cases stats
    const [
      totalTransferCases,
      pendingTransferVisits,
      scheduledTransferVisits,
      completedTransferInspections,
      approvedTransferCases,
      rejectedTransferCases
    ] = await Promise.all([
      Case.countDocuments({ inspectorAddress }),
      Case.countDocuments({ inspectorAddress, status: 'pending' }),
      Case.countDocuments({ inspectorAddress, status: 'inspection_scheduled' }),
      Case.countDocuments({ inspectorAddress, status: 'inspected' }),
      Case.countDocuments({ 
        inspectorAddress, 
        status: 'inspected',
        'inspectionReport.recommendation': 'approve'
      }),
      Case.countDocuments({ 
        inspectorAddress, 
        status: 'inspected',
        'inspectionReport.recommendation': 'reject'
      })
    ]);

    // Property verification stats
    const [
      totalVerificationCases,
      pendingVerifications,
      scheduledVerifications,
      completedVerifications,
      approvedVerifications,
      rejectedVerifications
    ] = await Promise.all([
      Property.countDocuments({ inspectorAddress }),
      Property.countDocuments({ inspectorAddress, verificationStatus: 'assigned' }),
      Property.countDocuments({ inspectorAddress, verificationStatus: 'inspection_scheduled' }),
      Property.countDocuments({ inspectorAddress, verificationStatus: 'inspected' }),
      Property.countDocuments({ 
        inspectorAddress, 
        verificationStatus: 'inspected',
        'inspectionReport.recommendation': 'approve'
      }),
      Property.countDocuments({ 
        inspectorAddress, 
        verificationStatus: 'inspected',
        'inspectionReport.recommendation': 'reject'
      })
    ]);

    // Combined stats
    const totalAssigned = totalTransferCases + totalVerificationCases;
    const pendingVisits = pendingTransferVisits + pendingVerifications;
    const scheduledVisits = scheduledTransferVisits + scheduledVerifications;
    const completedInspections = completedTransferInspections + completedVerifications;
    const approvedCases = approvedTransferCases + approvedVerifications;
    const rejectedCases = rejectedTransferCases + rejectedVerifications;

    // Get recent cases (both types)
    const [recentTransferCases, recentVerifications] = await Promise.all([
      Case.find({ inspectorAddress })
        .sort({ updatedAt: -1 })
        .limit(3)
        .select('requestId landId status updatedAt inspectionReport'),
      Property.find({ inspectorAddress })
        .sort({ verificationUpdatedAt: -1 })
        .limit(3)
        .select('verificationId surveyId verificationStatus verificationUpdatedAt inspectionReport')
    ]);

    // Format recent cases
    const recentCases = [
      ...recentTransferCases.map((c: any) => ({
        id: c.requestId,
        type: 'transfer',
        requestId: c.requestId,
        landId: c.landId,
        status: c.status,
        lastUpdated: c.updatedAt,
        recommendation: c.inspectionReport?.recommendation || null
      })),
      ...recentVerifications.map((v: any) => ({
        id: v.verificationId,
        type: 'verification',
        verificationId: v.verificationId,
        propertyId: v.surveyId,
        status: v.verificationStatus,
        lastUpdated: v.verificationUpdatedAt,
        recommendation: v.inspectionReport?.recommendation || null
      }))
    ].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalAssigned,
        pendingVisits,
        scheduledVisits,
        completedInspections,
        approvedCases,
        rejectedCases,
        approvalRate: completedInspections > 0 ? Math.round((approvedCases / completedInspections) * 100) : 0,
        // Breakdown by type
        breakdown: {
          transfers: {
            total: totalTransferCases,
            pending: pendingTransferVisits,
            scheduled: scheduledTransferVisits,
            completed: completedTransferInspections
          },
          verifications: {
            total: totalVerificationCases,
            pending: pendingVerifications,
            scheduled: scheduledVerifications,
            completed: completedVerifications
          }
        }
      },
      recentCases
    });

  } catch (error) {
    console.error("Get inspector dashboard stats error:", error);
    res.status(500).json({ error: "Failed to retrieve dashboard statistics" });
  }
});

/**
 * GET /api/inspector/inspection-history
 * Get inspector's inspection history
 */
router.get("/inspection-history", authenticateToken, requireRole("inspector"), async (req, res) => {
  try {
    const inspectorAddress = (req as any).walletAddress;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { 
      inspectorAddress,
      status: 'inspected' // Only show completed inspections
    };

    if (status && ['approve', 'reject'].includes(status as string)) {
      query['inspectionReport.recommendation'] = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [inspections, total] = await Promise.all([
      Case.find(query)
        .sort({ 'inspectionReport.submittedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('requestId landId inspectionReport fromAddress toAddress createdAt'),
      Case.countDocuments(query)
    ]);

    const formattedInspections = inspections.map(inspection => ({
      requestId: inspection.requestId,
      landId: inspection.landId,
      recommendation: inspection.inspectionReport?.recommendation,
      submittedAt: inspection.inspectionReport?.submittedAt,
      notes: inspection.inspectionReport?.notes,
      reportHash: inspection.inspectionReport?.ipfsHash,
      fromAddress: inspection.fromAddress,
      toAddress: inspection.toAddress,
      caseCreatedAt: inspection.createdAt
    }));

    res.json({
      success: true,
      inspections: formattedInspections,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalInspections: total,
        hasNext: skip + inspections.length < total,
        hasPrev: parseInt(page as string) > 1
      }
    });

  } catch (error) {
    console.error("Get inspection history error:", error);
    res.status(500).json({ error: "Failed to retrieve inspection history" });
  }
});

export default router;