import express from "express";
import multer from "multer";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import User from "../models/User";
import { ipfsService } from "../utils/ipfs";

const router = express.Router();

// Configure multer for KYC document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for KYC documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, and PNG files are allowed."));
    }
  },
});

/**
 * @route POST /api/kyc/upload-documents
 * @desc Upload KYC documents (Aadhaar and PAN)
 * @access Private
 */
router.post("/upload-documents", authenticateToken, upload.fields([
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 }
]), async (req: any, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { aadhaarNumber, panNumber } = req.body;

    if (!files.aadhaar || !files.pan) {
      return res.status(400).json({
        success: false,
        error: "Both Aadhaar and PAN documents are required",
      });
    }

    if (!aadhaarNumber || !panNumber) {
      return res.status(400).json({
        success: false,
        error: "Aadhaar number and PAN number are required",
      });
    }

    // Validate Aadhaar number format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Aadhaar number format. Must be 12 digits.",
      });
    }

    // Validate PAN number format (ABCDE1234F)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: "Invalid PAN number format.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Upload documents to IPFS
    const aadhaarFile = files.aadhaar[0];
    const panFile = files.pan[0];

    const [aadhaarHash, panHash] = await Promise.all([
      ipfsService.uploadFile(
        aadhaarFile.buffer,
        `aadhaar_${user._id}_${Date.now()}.${aadhaarFile.originalname.split('.').pop()}`
      ),
      ipfsService.uploadFile(
        panFile.buffer,
        `pan_${user._id}_${Date.now()}.${panFile.originalname.split('.').pop()}`
      ),
    ]);

    // Update user profile with KYC documents
    user.profile.aadhaarNumber = aadhaarNumber;
    user.profile.panNumber = panNumber.toUpperCase();
    user.profile.kycDocuments.aadhaar = aadhaarHash;
    user.profile.kycDocuments.pan = panHash;
    user.profile.kycDocuments.verified = false; // Reset verification status
    user.profile.kycDocuments.rejectionReason = undefined; // Clear any previous rejection reason

    await user.save();

    res.json({
      success: true,
      message: "KYC documents uploaded successfully. Awaiting admin verification.",
      kycStatus: {
        aadhaarUploaded: true,
        panUploaded: true,
        verified: false,
        status: "pending_verification",
      },
    });
  } catch (error) {
    console.error("KYC upload error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload KYC documents",
    });
  }
});

/**
 * @route GET /api/kyc/status
 * @desc Get user's KYC status
 * @access Private
 */
router.get("/status", authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const kycStatus = {
      aadhaarUploaded: !!user.profile.kycDocuments.aadhaar,
      panUploaded: !!user.profile.kycDocuments.pan,
      verified: user.profile.kycDocuments.verified,
      canAddProperty: !!(
        user.profile.kycDocuments.aadhaar &&
        user.profile.kycDocuments.pan &&
        user.profile.kycDocuments.verified
      ),
      rejectionReason: user.profile.kycDocuments.rejectionReason,
      aadhaarNumber: user.profile.aadhaarNumber ? 
        `****-****-${user.profile.aadhaarNumber.slice(-4)}` : null,
      panNumber: user.profile.panNumber,
    };

    res.json({
      success: true,
      kycStatus,
    });
  } catch (error) {
    console.error("KYC status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch KYC status",
    });
  }
});

/**
 * @route GET /api/kyc/admin/pending
 * @desc Get all pending KYC verifications (Admin only)
 * @access Private (Admin)
 */
router.get("/admin/pending", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Find users with uploaded documents but not verified
    const users = await User.find({
      "profile.kycDocuments.aadhaar": { $exists: true, $ne: null },
      "profile.kycDocuments.pan": { $exists: true, $ne: null },
      "profile.kycDocuments.verified": false,
    })
      .select("walletAddress profile.name profile.email profile.aadhaarNumber profile.panNumber profile.kycDocuments createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments({
      "profile.kycDocuments.aadhaar": { $exists: true, $ne: null },
      "profile.kycDocuments.pan": { $exists: true, $ne: null },
      "profile.kycDocuments.verified": false,
    });

    const pendingKYCs = users.map(user => ({
      userId: user._id,
      walletAddress: user.walletAddress,
      name: user.profile.name,
      email: user.profile.email,
      aadhaarNumber: user.profile.aadhaarNumber,
      panNumber: user.profile.panNumber,
      aadhaarDocument: user.profile.kycDocuments.aadhaar,
      panDocument: user.profile.kycDocuments.pan,
      submittedAt: user.createdAt,
      rejectionReason: user.profile.kycDocuments.rejectionReason,
    }));

    res.json({
      success: true,
      pendingKYCs,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalPending: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error("Admin pending KYC error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending KYC verifications",
    });
  }
});

/**
 * @route POST /api/kyc/admin/verify/:userId
 * @desc Verify or reject user's KYC documents (Admin only)
 * @access Private (Admin)
 */
router.post("/admin/verify/:userId", authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'approve' or 'reject'",
      });
    }

    if (action === "reject" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required when rejecting KYC",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.profile.kycDocuments.aadhaar || !user.profile.kycDocuments.pan) {
      return res.status(400).json({
        success: false,
        error: "User has not uploaded KYC documents",
      });
    }

    if (action === "approve") {
      user.profile.kycDocuments.verified = true;
      user.profile.kycDocuments.rejectionReason = undefined;
    } else {
      user.profile.kycDocuments.verified = false;
      user.profile.kycDocuments.rejectionReason = rejectionReason;
    }

    await user.save();

    res.json({
      success: true,
      message: `KYC ${action === "approve" ? "approved" : "rejected"} successfully`,
      user: {
        userId: user._id,
        walletAddress: user.walletAddress,
        name: user.profile.name,
        verified: user.profile.kycDocuments.verified,
        rejectionReason: user.profile.kycDocuments.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Admin KYC verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process KYC verification",
    });
  }
});

/**
 * @route GET /api/kyc/admin/stats
 * @desc Get KYC verification statistics (Admin only)
 * @access Private (Admin)
 */
router.get("/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      pendingKYC,
      verifiedKYC,
      rejectedKYC,
      noKYC
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        "profile.kycDocuments.aadhaar": { $exists: true, $ne: null },
        "profile.kycDocuments.pan": { $exists: true, $ne: null },
        "profile.kycDocuments.verified": false,
        "profile.kycDocuments.rejectionReason": { $exists: false }
      }),
      User.countDocuments({
        "profile.kycDocuments.verified": true
      }),
      User.countDocuments({
        "profile.kycDocuments.rejectionReason": { $exists: true, $ne: null }
      }),
      User.countDocuments({
        $or: [
          { "profile.kycDocuments.aadhaar": { $exists: false } },
          { "profile.kycDocuments.pan": { $exists: false } },
          { "profile.kycDocuments.aadhaar": null },
          { "profile.kycDocuments.pan": null }
        ]
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        pendingKYC,
        verifiedKYC,
        rejectedKYC,
        noKYC,
        verificationRate: totalUsers > 0 ? ((verifiedKYC / totalUsers) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error("KYC stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch KYC statistics"
    });
  }
});

export default router;