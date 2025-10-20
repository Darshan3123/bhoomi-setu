import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/database";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to database (with error handling)
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err.message);
  console.log("⚠️  Starting server without database connection...");
  console.log("💡 To fix this, either:");
  console.log("   1. Install and start MongoDB: mongod");
  console.log("   2. Use MongoDB Atlas (cloud): Update MONGODB_URI in .env");
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: "unknown",
      ipfs: "unknown",
    },
  };

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.database = "connected";
    } else {
      health.services.database = "disconnected";
    }
  } catch (error) {
    health.services.database = "error";
  }

  // Check IPFS connection
  try {
    const { ipfsService } = await import("./utils/ipfs");
    const isOnline = await ipfsService.isOnline();
    health.services.ipfs = isOnline ? "connected" : "disconnected";
  } catch (error) {
    health.services.ipfs = "error";
  }

  res.json(health);
});

// Import routes
import authRoutes from "./routes/auth";
import devAuthRoutes from "./routes/devAuth";
import documentRoutes from "./routes/documents";
import caseRoutes from "./routes/cases";
import uploadRoutes from "./routes/upload";
import kycRoutes from "./routes/kyc";
import inspectorRoutes from "./routes/inspector";
import unifiedPropertiesRoutes from "./routes/unified-properties";
import blockchainRoutes from "./routes/blockchain";
import eventsRoutes from "./routes/events";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/dev-auth", devAuthRoutes); // Development authentication
app.use("/api/documents", documentRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/properties", unifiedPropertiesRoutes); // Unified properties route only
app.use("/api/upload", uploadRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/inspector", inspectorRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/events", eventsRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Bhoomi Setu Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);

  // Start blockchain event listener
  try {
    const { eventListenerService } = await import("./services/eventListener");
    await eventListenerService.startListening();
    console.log("🎧 Blockchain event listener started");
  } catch (error) {
    console.warn("⚠️ Failed to start blockchain event listener:", error);
    console.log("💡 Make sure your blockchain network is running");
  }
});

export default app;
