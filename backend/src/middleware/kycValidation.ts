import { Request, Response, NextFunction } from "express";
import User from "../models/User";

/**
 * Middleware to check if user has completed and verified KYC
 * Required for property registration
 */
export const requireKYCVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if user has uploaded required KYC documents
    if (!user.profile.kycDocuments.aadhaar || !user.profile.kycDocuments.pan) {
      return res.status(403).json({
        success: false,
        error: "KYC documents required",
        message: "Please upload your Aadhaar card and PAN card to add properties",
        kycStatus: {
          aadhaarUploaded: !!user.profile.kycDocuments.aadhaar,
          panUploaded: !!user.profile.kycDocuments.pan,
          verified: user.profile.kycDocuments.verified,
        },
      });
    }

    // Check if KYC documents are verified by admin
    if (!user.profile.kycDocuments.verified) {
      return res.status(403).json({
        success: false,
        error: "KYC verification pending",
        message: "Your KYC documents are under review. Please wait for admin approval",
        kycStatus: {
          aadhaarUploaded: true,
          panUploaded: true,
          verified: false,
          status: "pending_verification",
        },
      });
    }

    // KYC is complete and verified
    next();
  } catch (error) {
    console.error("KYC validation error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during KYC validation",
    });
  }
};

/**
 * Middleware to check KYC status without blocking the request
 * Returns KYC status information
 */
export const checkKYCStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (user) {
      (req as any).kycStatus = {
        aadhaarUploaded: !!user.profile.kycDocuments.aadhaar,
        panUploaded: !!user.profile.kycDocuments.pan,
        verified: user.profile.kycDocuments.verified,
        canAddProperty: !!(
          user.profile.kycDocuments.aadhaar &&
          user.profile.kycDocuments.pan &&
          user.profile.kycDocuments.verified
        ),
        rejectionReason: user.profile.kycDocuments.rejectionReason,
      };
    }

    next();
  } catch (error) {
    console.error("KYC status check error:", error);
    next();
  }
};