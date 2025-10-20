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
    console.log("Message length:", message.length);
    console.log("Signature:", signature);
    console.log("Expected address:", expectedAddress);

    // Normalize the expected address
    const normalizedExpectedAddress = expectedAddress.toLowerCase();

    // Method 1: Direct ethers.js verification
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log("Method 1 - Recovered address (direct):", recoveredAddress);

      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Method 1 - Direct verification successful");
        return true;
      }
    } catch (directError) {
      console.log("❌ Method 1 - Direct verification failed:", directError instanceof Error ? directError.message : String(directError));
    }

    // Method 2: Try with different message encodings
    const messageVariations = [
      message.replace(/\r\n/g, "\n"), // Normalize line endings to Unix
      message.replace(/\n/g, "\r\n"), // Try Windows line endings  
      message.trim(), // Remove leading/trailing whitespace
      message.replace(/\s+/g, " "), // Normalize multiple spaces
      message.replace(/\r\n/g, "\n").trim(), // Normalize and trim
    ];

    for (let i = 0; i < messageVariations.length; i++) {
      const msgVariation = messageVariations[i];
      try {
        const recoveredAddress = ethers.verifyMessage(msgVariation, signature);
        console.log(`Method 2.${i + 1} - Trying variation: ${JSON.stringify(msgVariation)}`);
        console.log(`Method 2.${i + 1} - Recovered address:`, recoveredAddress);

        if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
          console.log(`✅ Method 2.${i + 1} - Verification successful with variation`);
          return true;
        }
      } catch (variationError) {
        console.log(`❌ Method 2.${i + 1} - Variation failed:`, variationError instanceof Error ? variationError.message : String(variationError));
      }
    }

    // Method 3: Manual hash and recover
    try {
      console.log("🔍 Method 3 - Trying manual hash verification...");
      const messageHash = ethers.hashMessage(message);
      console.log("Method 3 - Message hash:", messageHash);
      
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);
      console.log("Method 3 - Recovered address (manual):", recoveredAddress);
      
      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Method 3 - Manual verification successful");
        return true;
      }
    } catch (manualError) {
      console.log("❌ Method 3 - Manual verification failed:", manualError instanceof Error ? manualError.message : String(manualError));
    }

    // Method 4: Try with Buffer conversion (for different encoding issues)
    try {
      console.log("🔍 Method 4 - Trying with Buffer conversion...");
      const messageBuffer = Buffer.from(message, 'utf8');
      const messageFromBuffer = messageBuffer.toString('utf8');
      
      const recoveredAddress = ethers.verifyMessage(messageFromBuffer, signature);
      console.log("Method 4 - Recovered address (buffer):", recoveredAddress);
      
      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Method 4 - Buffer verification successful");
        return true;
      }
    } catch (bufferError) {
      console.log("❌ Method 4 - Buffer verification failed:", bufferError instanceof Error ? bufferError.message : String(bufferError));
    }

    // Method 5: Try with personal_sign format (some wallets use this)
    try {
      console.log("🔍 Method 5 - Trying personal_sign format...");
      // Some wallets prefix with "\x19Ethereum Signed Message:\n" + message.length + message
      const personalMessage = `\x19Ethereum Signed Message:\n${message.length}${message}`;
      const personalHash = ethers.keccak256(ethers.toUtf8Bytes(personalMessage));
      const recoveredAddress = ethers.recoverAddress(personalHash, signature);
      console.log("Method 5 - Recovered address (personal):", recoveredAddress);
      
      if (recoveredAddress.toLowerCase() === normalizedExpectedAddress) {
        console.log("✅ Method 5 - Personal sign verification successful");
        return true;
      }
    } catch (personalError) {
      console.log("❌ Method 5 - Personal sign verification failed:", personalError instanceof Error ? personalError.message : String(personalError));
    }

    console.log("❌ All verification methods failed");
    console.log("🔍 Final debug info:");
    console.log("- Message bytes:", Array.from(new TextEncoder().encode(message)));
    console.log("- Signature length:", signature.length);
    console.log("- Expected address checksum:", ethers.getAddress(expectedAddress));
    
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
