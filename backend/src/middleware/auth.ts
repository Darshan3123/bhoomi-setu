import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import User from "../models/User";

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
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

    // Find user by wallet address
    const user = await User.findOne({
      walletAddress: decoded.walletAddress.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = user;
    (req as any).walletAddress = user.walletAddress;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

/**
 * Verify wallet signature for authentication
 */
export const verifyWalletSignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    console.log("🔍 Signature verification debug:");
    console.log("Message:", JSON.stringify(message));
    console.log("Signature:", signature);
    console.log("Expected address:", expectedAddress);

    // Normalize addresses for comparison
    const normalizedExpectedAddress = expectedAddress.toLowerCase();

    // Method 1: Standard ethers.js verification (most common)
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log("Method 1 - Recovered address:", recoveredAddress);

      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Signature verification successful");
        return true;
      }
    } catch (error) {
      console.log("❌ Method 1 failed:", error instanceof Error ? error.message : String(error));
    }

    // Method 2: Try with different message formats (MetaMask compatibility)
    const messageVariations = [
      message.replace(/\r\n/g, "\n"), // Normalize line endings
      message.trim(), // Remove whitespace
      message.replace(/\s+/g, " "), // Normalize spaces
    ];

    for (let i = 0; i < messageVariations.length; i++) {
      try {
        const recoveredAddress = ethers.verifyMessage(messageVariations[i], signature);
        console.log(`Method 2.${i + 1} - Recovered address:`, recoveredAddress);

        if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
          console.log(`✅ Signature verification successful with variation ${i + 1}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Method 2.${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Method 3: Manual verification with proper message hashing
    try {
      const messageHash = ethers.hashMessage(message);
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);
      console.log("Method 3 - Recovered address (manual):", recoveredAddress);
      
      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Manual signature verification successful");
        return true;
      }
    } catch (error) {
      console.log("❌ Method 3 failed:", error instanceof Error ? error.message : String(error));
    }

    console.log("❌ All verification methods failed");
    return false;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes((req as any).user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: (req as any).user.role,
      });
    }

    next();
  };
};

/**
 * Admin only access
 */
export const requireAdmin = requireRole("admin");

/**
 * Inspector only access
 */
export const requireInspector = requireRole("inspector");

/**
 * Admin or Inspector access
 */
export const requireAdminOrInspector = requireRole(["admin", "inspector"]);



/**
 * Generate JWT token for wallet address
 */
export const generateToken = (walletAddress: string): string => {
  return jwt.sign(
    { walletAddress: walletAddress.toLowerCase() },
    process.env.JWT_SECRET || "fallback-secret"
  );
};
