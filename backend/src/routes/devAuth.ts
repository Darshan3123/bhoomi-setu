import express from "express";
import { devLogin } from "../middleware/devAuth";

const router = express.Router();

/**
 * @route POST /api/dev-auth/login
 * @desc Development login - bypasses signature verification
 * @access Public
 */
router.post("/login", devLogin);

/**
 * @route POST /api/dev-auth/quick-inspector
 * @desc Quick inspector login for testing
 * @access Public
 */
router.post("/quick-inspector", async (req, res) => {
  // Use the Hardhat test account as inspector
  const inspectorWallet = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  
  req.body.walletAddress = inspectorWallet;
  
  // Call the dev login function
  await devLogin(req, res);
});

export default router;