import express from "express";
import { ethers } from "ethers";
import User from "../models/User";
import {
  authenticateToken,
  verifyWalletSignature,
  generateToken,
} from "../middleware/auth";
import { ipfsService } from "../utils/ipfs";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types for KYC documents
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and PDF files are allowed."
        )
      );
    }
  },
});

/**
 * POST /api/auth/verify-wallet
 * Verify wallet signature and authenticate user
 */
router.post("/verify-wallet", async (req, res) => {
  try {
    const { walletAddress, signature, message, role } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        error: "Missing required fields: walletAddress, signature, message",
      });
    }

    // Verify the signature
    console.log("🔍 Verifying signature for wallet verification...");
    const isValidSignature = verifyWalletSignature(
      message,
      signature,
      walletAddress
    );

    if (!isValidSignature) {
      console.log("❌ Signature verification failed for wallet:", walletAddress);
      return res.status(401).json({ 
        error: "Invalid signature",
        debug: process.env.NODE_ENV === 'development' ? {
          message: message,
          signature: signature,
          walletAddress: walletAddress
        } : undefined
      });
    }

    console.log("✅ Signature verification successful for wallet:", walletAddress);

    // Check if user exists, create if not
    let user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    let isNewUser = false;

    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        role: "user", // Default role for all new users
      });
      await user.save();
      isNewUser = true;
    }

    // Generate JWT token
    const token = generateToken(walletAddress);

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Wallet verification error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * GET /api/auth/user-role
 * Get current user's role and profile
 */
router.get("/user-role", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    console.log("🔍 Debug - Current authenticated user:", {
      walletAddress: user.walletAddress,
      role: user.role,
      isAdmin: user.role === "admin",
    });

    res.json({
      walletAddress: user.walletAddress,
      role: user.role,
      profile: user.profile,
      isRegistered: true,
      isAdmin: user.role === "admin",
    });
  } catch (error) {
    console.error("Get user role error:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
});

/**
 * POST /api/auth/update-profile
 * Update user profile information
 */
router.post("/update-profile", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, email, phone } = req.body;

    // Validate input
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (phone && !/^[+]?[\d\s\-()]+$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone format" });
    }

    // Update profile
    user.profile = {
      ...user.profile,
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
    };

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: user.profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /api/auth/upload-kyc
 * Upload KYC documents (Aadhaar/PAN)
 */
router.post(
  "/upload-kyc",
  authenticateToken,
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = (req as any).user;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      console.log("KYC Upload Request:");
      console.log("User:", user.walletAddress);
      console.log("Files received:", files ? Object.keys(files) : 'No files');
      console.log("User profile exists:", !!user.profile);
      console.log(
        "User profile kycDocuments exists:",
        !!user.profile?.kycDocuments
      );

      // Check if any files were uploaded
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ 
          error: "No files uploaded. Please select documents to upload." 
        });
      }

      // Initialize profile if it doesn't exist
      if (!user.profile) {
        user.profile = {
          kycDocuments: {
            verified: false,
          },
        };
      }

      // Initialize kycDocuments if it doesn't exist
      if (!user.profile.kycDocuments) {
        user.profile.kycDocuments = {
          verified: false,
        };
      }

      const uploadedDocs: { [key: string]: string } = {};

      // Upload Aadhaar document
      if (files.aadhaar && files.aadhaar[0]) {
        const aadhaarFile = files.aadhaar[0];
        console.log(
          "Uploading Aadhaar file:",
          aadhaarFile.originalname,
          aadhaarFile.size
        );
        try {
          const aadhaarHash = await ipfsService.uploadFile(
            aadhaarFile.buffer,
            `aadhaar_${
              user.walletAddress
            }_${Date.now()}.${aadhaarFile.originalname.split(".").pop()}`
          );
          console.log("Aadhaar uploaded with hash:", aadhaarHash);
          uploadedDocs.aadhaar = aadhaarHash;
        } catch (ipfsError) {
          console.error("IPFS upload error for Aadhaar:", ipfsError);
          return res.status(500).json({ 
            error: "Failed to upload Aadhaar document to IPFS: " + (ipfsError instanceof Error ? ipfsError.message : String(ipfsError))
          });
        }
      }

      // Upload PAN document
      if (files.pan && files.pan[0]) {
        const panFile = files.pan[0];
        console.log("Uploading PAN file:", panFile.originalname, panFile.size);
        try {
          const panHash = await ipfsService.uploadFile(
            panFile.buffer,
            `pan_${user.walletAddress}_${Date.now()}.${panFile.originalname
              .split(".")
              .pop()}`
          );
          console.log("PAN uploaded with hash:", panHash);
          uploadedDocs.pan = panHash;
        } catch (ipfsError) {
          console.error("IPFS upload error for PAN:", ipfsError);
          return res.status(500).json({ 
            error: "Failed to upload PAN document to IPFS: " + (ipfsError instanceof Error ? ipfsError.message : String(ipfsError))
          });
        }
      }

      // Update user's KYC documents
      console.log("Updating user KYC documents:", uploadedDocs);
      user.profile.kycDocuments = {
        ...user.profile.kycDocuments,
        ...uploadedDocs,
        verified: false, // Reset verification status when new docs are uploaded
      };

      console.log("Saving user with updated KYC documents...");
      await user.save();
      console.log("User saved successfully");

      res.json({
        success: true,
        message: "KYC documents uploaded successfully",
        uploadedDocuments: uploadedDocs,
      });
    } catch (error) {
      console.error("KYC upload error:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      res.status(500).json({ 
        error: "Failed to upload KYC documents",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  }
);

/**
 * GET /api/auth/kyc-status
 * Get KYC verification status
 */
router.get("/kyc-status", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if profile and kycDocuments exist
    if (!user.profile || !user.profile.kycDocuments) {
      return res.json({
        hasAadhaar: false,
        hasPan: false,
        verified: false,
        kycComplete: false,
        status: 'not_submitted'
      });
    }

    const hasAadhaar = !!user.profile.kycDocuments.aadhaar;
    const hasPan = !!user.profile.kycDocuments.pan;
    const verified = user.profile.kycDocuments.verified || false;
    const kycComplete = hasAadhaar && hasPan;

    // Determine status
    let status = 'not_submitted';
    if (verified) {
      status = 'verified';
    } else if (kycComplete) {
      status = 'pending';
    } else if (hasAadhaar || hasPan) {
      status = 'partial';
    }

    res.json({
      hasAadhaar,
      hasPan,
      verified,
      kycComplete,
      status
    });
  } catch (error) {
    console.error("KYC status error:", error);
    res.status(500).json({ error: "Failed to get KYC status" });
  }
});

/**
 * POST /api/auth/generate-message
 * Generate message for wallet signature
 */
router.post("/generate-message", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Valid wallet address required" });
    }

    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2);
    // Use a very simple message format that MetaMask handles well
    const message = `Welcome to Bhoomi Setu!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    console.log("🔍 Generated message for signing:", JSON.stringify(message));
    console.log("🔍 Message length:", message.length);

    res.json({
      message,
      timestamp,
    });
  } catch (error) {
    console.error("Generate message error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate authentication message" });
  }
});

/**
 * POST /api/auth/register-with-profile
 * Register user with complete profile
 */
router.post("/register-with-profile", async (req, res) => {
  try {
    console.log("🔍 Registration request received");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Remove any role field from request body to prevent conflicts
    delete req.body.role;

    const {
      walletAddress,
      signature,
      message,
      name,
      email,
      phone,
      aadhaarNumber,
      panNumber,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!walletAddress) missingFields.push("walletAddress");
    if (!signature) missingFields.push("signature");
    if (!message) missingFields.push("message");
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone");
    if (!aadhaarNumber) missingFields.push("aadhaarNumber");
    if (!panNumber) missingFields.push("panNumber");

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      return res.status(400).json({
        error: "Missing required fields: " + missingFields.join(", "),
      });
    }

    // Verify the signature
    console.log("🔍 Registration debug - Received data:");
    console.log("Wallet address:", walletAddress);
    console.log("Message:", JSON.stringify(message));
    console.log("Signature:", signature);

    const isValidSignature = verifyWalletSignature(
      message,
      signature,
      walletAddress
    );

    if (!isValidSignature) {
      console.log("❌ Signature verification failed");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verification successful");

    // Validate Aadhaar number format
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({ error: "Invalid Aadhaar number format" });
    }

    // Validate PAN number format
    const cleanPAN = panNumber.toUpperCase().trim();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
      return res.status(400).json({ error: "Invalid PAN number format" });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user already exists
    let user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });
    let isNewUser = false;

    if (user) {
      // If user exists, update their profile instead of throwing error
      user.profile = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        aadhaarNumber: cleanAadhaar,
        panNumber: cleanPAN,
        kycDocuments: {
          verified: false, // Reset verification status when profile is updated
        },
      };
      await user.save();
      isNewUser = false;
    } else {
      // Create new user
      isNewUser = true;

      // Create new user with complete profile (default role: user)
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        role: "user", // Default role for all new users
        profile: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          aadhaarNumber: cleanAadhaar,
          panNumber: cleanPAN,
          kycDocuments: {
            verified: false, // Will be verified by admin later
          },
        },
      });

      await user.save();
    }

    // Generate JWT token
    const token = generateToken(walletAddress);

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        profile: user.profile,
      },
      message: isNewUser
        ? "Registration successful! Your profile has been created."
        : "Profile updated successfully!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    // Check if it's a MongoDB connection error
    if (error instanceof Error && error.message.includes("MongooseError")) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Check if it's a validation error
    if (error instanceof Error && error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Invalid data provided: " + error.message });
    }

    res.status(500).json({
      error: "Registration failed",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
});

/**
 * GET /api/auth/admin/users
 * Get all users for admin dashboard (admin only)
 */
router.get("/admin/users", authenticateToken, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    console.log("🔍 Admin endpoint access attempt:", {
      walletAddress: currentUser.walletAddress,
      role: currentUser.role,
      isAdmin: currentUser.role === "admin",
    });

    // Check if current user is admin (you can modify this logic based on your admin system)
    if (currentUser.role !== "admin") {
      console.log("❌ Access denied - user is not admin");
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    console.log("✅ Admin access granted");

    // Fetch all users with their profiles
    const users = await User.find(
      {},
      {
        walletAddress: 1,
        role: 1,
        profile: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).sort({ createdAt: -1 });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user._id,
      walletAddress: user.walletAddress,
      role: user.role,
      name: user.profile?.name || "N/A",
      email: user.profile?.email || "N/A",
      phone: user.profile?.phone || "N/A",
      aadhaarNumber: user.profile?.aadhaarNumber || "N/A",
      panNumber: user.profile?.panNumber || "N/A",
      kycVerified: user.profile?.kycDocuments?.verified || false,
      hasAadhaar: !!user.profile?.kycDocuments?.aadhaar,
      hasPan: !!user.profile?.kycDocuments?.pan,
      registeredAt: user.createdAt,
      lastUpdated: user.updatedAt,
    }));

    res.json({
      success: true,
      users: formattedUsers,
      totalUsers: formattedUsers.length,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PUT /api/auth/admin/verify-kyc/:userId
 * Verify user's KYC documents (admin only)
 */
router.put("/admin/verify-kyc/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { userId } = req.params;
    const { verified } = req.body;

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update KYC verification status
    user.profile.kycDocuments.verified = verified;
    await user.save();

    res.json({
      success: true,
      message: `KYC ${verified ? "verified" : "unverified"} successfully`,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        kycVerified: user.profile.kycDocuments.verified,
      },
    });
  } catch (error) {
    console.error("Admin verify KYC error:", error);
    res.status(500).json({ error: "Failed to update KYC status" });
  }
});

/**
 * GET /api/auth/admin/dashboard-stats
 * Get dashboard statistics for admin (admin only)
 */
router.get("/admin/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({
      "profile.kycDocuments.verified": true,
    });
    const pendingUsers = await User.countDocuments({
      "profile.kycDocuments.aadhaar": { $exists: true },
      "profile.kycDocuments.verified": false,
    });

    // Get user role distribution
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        pendingUsers,
        recentRegistrations,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

/**
 * GET /api/auth/users/by-address/:address
 * Get user by wallet address (public route for property transactions)
 */
router.get("/users/by-address/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: "Wallet address is required" 
      });
    }

    // Find user by wallet address (case insensitive)
    const user = await User.findOne({ 
      walletAddress: address.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Return user profile information (excluding sensitive data)
    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        profile: {
          name: user.profile?.name || null,
          email: user.profile?.email || null,
          phone: user.profile?.phone || null,
        },
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error("Get user by address error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch user details" 
    });
  }
});

/**
 * GET /api/auth/admin/pending-kyc
 * Get users with pending KYC verification (admin only)
 */
router.get("/admin/pending-kyc", authenticateToken, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    // Find users with uploaded documents but not verified
    const pendingUsers = await User.find({
      $and: [
        {
          $or: [
            { "profile.kycDocuments.aadhaar": { $exists: true, $ne: null } },
            { "profile.kycDocuments.pan": { $exists: true, $ne: null } },
          ],
        },
        { "profile.kycDocuments.verified": { $ne: true } },
      ],
    })
      .select("walletAddress role profile createdAt updatedAt")
      .sort({ updatedAt: -1 });

    const formattedUsers = pendingUsers.map((user) => ({
      id: user._id,
      walletAddress: user.walletAddress,
      role: user.role,
      name: user.profile?.name || "N/A",
      email: user.profile?.email || "N/A",
      phone: user.profile?.phone || "N/A",
      aadhaarNumber: user.profile?.aadhaarNumber || "N/A",
      panNumber: user.profile?.panNumber || "N/A",
      hasAadhaar: !!user.profile?.kycDocuments?.aadhaar,
      hasPan: !!user.profile?.kycDocuments?.pan,
      kycVerified: user.profile?.kycDocuments?.verified || false,
      submittedAt: user.updatedAt,
      registeredAt: user.createdAt,
    }));

    res.json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error("Admin pending KYC error:", error);
    res.status(500).json({ error: "Failed to fetch pending KYC users" });
  }
});

/**
 * GET /api/auth/admin/user-documents/:userId
 * Get user's KYC documents with IPFS hashes (admin only)
 */
router.get(
  "/admin/user-documents/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const { userId } = req.params;

      // Check if current user is admin
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Access denied. Admin privileges required." });
      }

      // Find user and get their KYC documents
      const user = await User.findById(userId).select(
        "walletAddress profile.kycDocuments profile.name"
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const documents = [];

      if (user.profile?.kycDocuments?.aadhaar) {
        documents.push({
          type: "aadhaar",
          name: "Address Proof (Aadhaar)",
          hash: user.profile.kycDocuments.aadhaar,
          uploadedAt: user.updatedAt,
        });
      }

      if (user.profile?.kycDocuments?.pan) {
        documents.push({
          type: "pan",
          name: "PAN Card",
          hash: user.profile.kycDocuments.pan,
          uploadedAt: user.updatedAt,
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.profile?.name || "Unknown",
          walletAddress: user.walletAddress,
        },
        documents,
      });
    } catch (error) {
      console.error("Admin get user documents error:", error);
      res.status(500).json({ error: "Failed to fetch user documents" });
    }
  }
);

/**
 * GET /api/auth/admin/ipfs/:hash
 * Serve IPFS file for admin viewing (development only)
 */
router.get("/admin/ipfs/:hash", authenticateToken, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { hash } = req.params;

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    // Get file from IPFS service
    const fileBuffer = await ipfsService.getFile(hash);

    // Determine content type based on file content
    let contentType = "application/octet-stream";
    if (fileBuffer.toString("hex", 0, 4) === "25504446") {
      // PDF magic number
      contentType = "application/pdf";
    } else if (fileBuffer.toString("hex", 0, 2) === "ffd8") {
      // JPEG magic number
      contentType = "image/jpeg";
    } else if (fileBuffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
      // PNG magic number
      contentType = "image/png";
    }

    res.set({
      "Content-Type": contentType,
      "Content-Length": fileBuffer.length,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Content-Disposition": "inline", // Display in browser instead of download
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error("IPFS file serve error:", error);
    res.status(404).json({ error: "File not found" });
  }
});

/**
 * POST /api/auth/test-signature
 * Test signature verification (development only)
 */
router.post("/test-signature", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "This endpoint is not available in production" });
    }

    const { message, signature, walletAddress } = req.body;

    if (!message || !signature || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields: message, signature, walletAddress" });
    }

    console.log("🔍 Test signature verification:");
    console.log("Message:", JSON.stringify(message));
    console.log("Signature:", signature);
    console.log("Wallet:", walletAddress);

    const isValid = verifyWalletSignature(message, signature, walletAddress);

    res.json({
      success: true,
      isValid,
      message: isValid ? "Signature is valid" : "Signature is invalid",
      debug: {
        messageLength: message.length,
        signatureLength: signature.length,
        walletAddress: walletAddress.toLowerCase(),
        messageBytes: Array.from(new TextEncoder().encode(message))
      }
    });

  } catch (error) {
    console.error("Test signature error:", error);
    res.status(500).json({ error: "Failed to test signature" });
  }
});

/**
 * DELETE /api/auth/reset-user/:walletAddress
 * Reset/delete user for testing purposes (development only)
 */
router.delete("/reset-user/:walletAddress", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ error: "This endpoint is not available in production" });
    }

    const { walletAddress } = req.params;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Valid wallet address required" });
    }

    const result = await User.deleteOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Reset user error:", error);
    res.status(500).json({ error: "Failed to reset user" });
  }
});

export default router;
