import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

/**
 * Development-friendly authentication middleware
 * Bypasses signature verification for easier testing
 */
export const devAuthenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as any;

    console.log("🔍 Dev Auth - Decoded token:", {
      walletAddress: decoded.walletAddress,
      timestamp: new Date(decoded.iat * 1000).toISOString()
    });

    // Find user by wallet address
    const user = await User.findOne({
      walletAddress: decoded.walletAddress.toLowerCase(),
    });

    if (!user) {
      console.log("❌ Dev Auth - User not found for wallet:", decoded.walletAddress);
      return res.status(401).json({ error: "User not found" });
    }

    console.log("✅ Dev Auth - User found:", {
      wallet: user.walletAddress,
      role: user.role,
      kycVerified: user.profile?.kycDocuments?.verified
    });

    (req as any).user = user;
    (req as any).walletAddress = user.walletAddress;
    next();
  } catch (error) {
    console.error("❌ Dev Auth middleware error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

/**
 * Generate JWT token for wallet address (development version)
 */
export const generateDevToken = (walletAddress: string): string => {
  return jwt.sign(
    { 
      walletAddress: walletAddress.toLowerCase(),
      timestamp: Date.now(),
      dev: true
    },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: "7d" }
  );
};

/**
 * Development login endpoint - bypasses signature verification
 */
export const devLogin = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    console.log("🔍 Dev Login attempt for wallet:", walletAddress);

    // Find or create user
    let user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      console.log("👤 Creating new user for wallet:", walletAddress);
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        role: "user", // Default role
        profile: {
          kycDocuments: {
            verified: false
          }
        }
      });
      await user.save();
    }

    // Generate token
    const token = generateDevToken(walletAddress);

    console.log("✅ Dev Login successful for:", {
      wallet: user.walletAddress,
      role: user.role,
      tokenGenerated: true
    });

    res.json({
      success: true,
      token,
      user: {
        walletAddress: user.walletAddress,
        role: user.role,
        kycVerified: user.profile?.kycDocuments?.verified || false,
      },
    });
  } catch (error) {
    console.error("❌ Dev Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};