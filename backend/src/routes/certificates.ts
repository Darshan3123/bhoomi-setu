import express from "express";
import { authenticateToken } from "../middleware/auth";
import { Property } from "../models/Property";
import User from "../models/User";
import PDFDocument from "pdfkit";
import { formatEther } from "../services/blockchain";

const router = express.Router();

/**
 * POST /api/certificates/generate-purchase
 * Generate purchase certificate PDF
 */
router.post("/generate-purchase", async (req, res) => {
  try {
    const {
      surveyId,
      location,
      propertyType,
      area,
      areaUnit,
      transactionHash,
      blockNumber,
      purchaseDate,
      newOwner,
      basePrice,
      taxAmount,
      totalCost,
      taxRate,
      gasUsed,
    } = req.body;

    console.log("🎫 Generating purchase certificate for:", surveyId);

    // Try to fetch buyer's profile information
    let userProfile = {
      name: "Property Buyer",
      email: "buyer@example.com", 
      phone: "+1234567890",
    };

    try {
      if (newOwner) {
        const User = (await import("../models/User")).default;
        const buyer = await User.findOne({ 
          walletAddress: newOwner.toLowerCase() 
        });
        
        if (buyer && buyer.profile) {
          userProfile = {
            name: buyer.profile.name || "Property Buyer",
            email: buyer.profile.email || "Not provided",
            phone: buyer.profile.phone || "Not provided",
          };
        }
      }
    } catch (error) {
      console.log("Could not fetch buyer profile, using defaults");
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Property_Purchase_Certificate_${surveyId}_${Date.now()}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc
      .fontSize(24)
      .fillColor("#1e40af")
      .text("BHOOMI SETU", { align: "center" })
      .fontSize(18)
      .fillColor("#374151")
      .text("Blockchain Land Registry", { align: "center" })
      .moveDown(0.5);

    // Add title
    doc
      .fontSize(20)
      .fillColor("#059669")
      .text("PROPERTY PURCHASE CERTIFICATE", { align: "center" })
      .moveDown(1);

    // Add certificate number and date
    const certificateNumber = `CERT-${Date.now()}-${surveyId}`;
    doc
      .fontSize(12)
      .fillColor("#6b7280")
      .text(`Certificate No: ${certificateNumber}`, { align: "right" })
      .text(`Issue Date: ${new Date().toLocaleDateString()}`, {
        align: "right",
      })
      .moveDown(1);

    // Add main content
    doc
      .fontSize(14)
      .fillColor("#111827")
      .text(
        "This is to certify that the following property has been successfully purchased through our blockchain-based land registry system:",
        { align: "justify" }
      )
      .moveDown(1);

    // Property details section
    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("PROPERTY DETAILS", { underline: true })
      .moveDown(0.5);

    const propertyDetails = [
      ["Survey ID:", surveyId],
      ["Property Type:", propertyType],
      ["Location:", location],
      ["Area:", `${area} ${areaUnit}`],
      ["Base Price:", `${basePrice} ETH`],
      ["Property Tax:", `${taxAmount} ETH (${taxRate}%)`],
      ["Total Cost:", `${totalCost} ETH`],
    ];

    propertyDetails.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(label, { continued: true, width: 150 })
        .fillColor("#111827")
        .text(value);
    });

    doc.moveDown(1);

    // Buyer details section
    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("BUYER DETAILS", { underline: true })
      .moveDown(0.5);

    const buyerDetails = [
      ["Name:", userProfile.name || "Not provided"],
      ["Wallet Address:", newOwner],
      ["Email:", userProfile.email || "Not provided"],
      ["Phone:", userProfile.phone || "Not provided"],
    ];

    buyerDetails.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(label, { continued: true, width: 150 })
        .fillColor("#111827")
        .text(value);
    });

    doc.moveDown(1);

    // Transaction details section
    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("BLOCKCHAIN TRANSACTION DETAILS", { underline: true })
      .moveDown(0.5);

    const transactionDetails = [
      ["Transaction Hash:", transactionHash],
      ["Block Number:", blockNumber?.toString() || "Pending"],
      ["Gas Used:", gasUsed || "N/A"],
      ["Purchase Date:", new Date(purchaseDate).toLocaleString()],
      ["Network:", "Ethereum (Local Testnet)"],
    ];

    transactionDetails.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(label, { continued: true, width: 150 })
        .fillColor("#111827")
        .text(value);
    });

    doc.moveDown(2);

    // Add verification section
    doc
      .fontSize(14)
      .fillColor("#059669")
      .text("VERIFICATION", { align: "center", underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor("#374151")
      .text(
        "This certificate is digitally generated and verified through blockchain technology. The transaction details can be independently verified on the blockchain using the transaction hash provided above.",
        { align: "justify" }
      )
      .moveDown(1);

    // Add footer
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        "This is a computer-generated certificate and does not require a physical signature.",
        { align: "center" }
      )
      .moveDown(0.5)
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
      .text("Bhoomi Setu - Blockchain Land Registry System", {
        align: "center",
      });

    // Add QR code placeholder (you can implement actual QR code generation later)
    doc
      .moveDown(1)
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(
        `Verification URL: https://bhoomi-setu.com/verify/${certificateNumber}`,
        { align: "center" }
      );

    // Finalize PDF
    doc.end();

    console.log("✅ Purchase certificate generated successfully");
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({
      error: "Failed to generate certificate",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/certificates/generate-ownership
 * Generate ownership certificate PDF
 */
router.post("/generate-ownership", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { propertyId } = req.body;

    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify user owns the property
    if (
      property.ownerAddress.toLowerCase() !== user.walletAddress.toLowerCase()
    ) {
      return res.status(403).json({ error: "You do not own this property" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Ownership_Certificate_${
        property.surveyId
      }_${Date.now()}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content similar to purchase certificate but for ownership
    doc
      .fontSize(24)
      .fillColor("#1e40af")
      .text("BHOOMI SETU", { align: "center" })
      .fontSize(18)
      .fillColor("#374151")
      .text("Blockchain Land Registry", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(20)
      .fillColor("#059669")
      .text("PROPERTY OWNERSHIP CERTIFICATE", { align: "center" })
      .moveDown(1);

    // Add certificate details
    const certificateNumber = `OWN-${Date.now()}-${property.surveyId}`;
    doc
      .fontSize(12)
      .fillColor("#6b7280")
      .text(`Certificate No: ${certificateNumber}`, { align: "right" })
      .text(`Issue Date: ${new Date().toLocaleDateString()}`, {
        align: "right",
      })
      .moveDown(1);

    doc
      .fontSize(14)
      .fillColor("#111827")
      .text(
        "This is to certify that the following person is the verified owner of the property described below, as recorded in our blockchain-based land registry system:",
        { align: "justify" }
      )
      .moveDown(1);

    // Property and owner details...
    const userProfile = user.profile || {};

    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("OWNER DETAILS", { underline: true })
      .moveDown(0.5);

    const ownerDetails = [
      ["Name:", userProfile.name || "Not provided"],
      ["Wallet Address:", user.walletAddress],
      ["Email:", userProfile.email || "Not provided"],
      ["Phone:", userProfile.phone || "Not provided"],
    ];

    ownerDetails.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(label, { continued: true, width: 150 })
        .fillColor("#111827")
        .text(value);
    });

    doc.moveDown(1);

    doc
      .fontSize(16)
      .fillColor("#1f2937")
      .text("PROPERTY DETAILS", { underline: true })
      .moveDown(0.5);

    const propertyDetails = [
      ["Survey ID:", property.surveyId],
      ["Property Type:", property.propertyType],
      ["Location:", property.location],
      ["Area:", `${property.area} ${property.areaUnit}`],
      ["Status:", property.status],
      ["Registration Date:", property.createdAt.toLocaleDateString()],
    ];

    propertyDetails.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .fillColor("#374151")
        .text(label, { continued: true, width: 150 })
        .fillColor("#111827")
        .text(value);
    });

    // Add footer
    doc
      .moveDown(2)
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        "This is a computer-generated certificate and does not require a physical signature.",
        { align: "center" }
      )
      .moveDown(0.5)
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
      .text("Bhoomi Setu - Blockchain Land Registry System", {
        align: "center",
      });

    doc.end();

    console.log("✅ Ownership certificate generated successfully");
  } catch (error) {
    console.error("Ownership certificate generation error:", error);
    res.status(500).json({
      error: "Failed to generate ownership certificate",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
