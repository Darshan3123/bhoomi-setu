const mongoose = require("mongoose");
require("dotenv").config();

// User schema (simplified for script)
const UserSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["user", "inspector", "admin"],
      default: "user",
    },
    profile: {
      name: String,
      email: String,
      phone: String,
      aadhaarNumber: String,
      panNumber: String,
      kycDocuments: {
        aadhaar: String,
        pan: String,
        verified: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

async function makeUserAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/bhoomi-setu";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Get wallet address from command line argument
    const walletAddress = process.argv[2];

    if (!walletAddress) {
      console.log("Usage: node make-user-admin.js <wallet-address>");
      console.log(
        "Example: node make-user-admin.js 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
      );
      return;
    }

    // Find and update user
    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      console.log("User not found with wallet address:", walletAddress);
      console.log("Available users:");
      const allUsers = await User.find(
        {},
        { walletAddress: 1, role: 1, "profile.name": 1 }
      );
      allUsers.forEach((u) => {
        console.log(
          `- ${u.walletAddress} (${u.role}) - ${u.profile?.name || "No name"}`
        );
      });
      return;
    }

    // Update role to admin
    user.role = "admin";
    await user.save();

    console.log("✅ User successfully made admin!");
    console.log("Wallet Address:", user.walletAddress);
    console.log("Role:", user.role);
    console.log("Name:", user.profile?.name || "N/A");

    console.log("\nTo access admin panel:");
    console.log("1. Connect MetaMask with this wallet address");
    console.log("2. Sign the authentication message");
    console.log("3. Navigate to /admin page");
  } catch (error) {
    console.error("Error making user admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

makeUserAdmin();
