# 🦊 MetaMask Reset Guide - Fix Circuit Breaker Error

## **❌ Problem:** "Execution prevented because the circuit breaker is open"

This error occurs when MetaMask's internal protection system blocks requests due to repeated failures or connection issues.

## **🔧 Step-by-Step Fix:**

### **Step 1: Reset MetaMask Account**
1. Open MetaMask extension
2. Click the account icon (top right)
3. Go to **Settings** → **Advanced**
4. Click **"Reset Account"**
5. Confirm the reset (this only clears transaction history)

### **Step 2: Re-add Localhost Network**
1. In MetaMask, click the network dropdown
2. Click **"Add Network"** or **"Add a network manually"**
3. Enter these details:
   ```
   Network Name: Hardhat Local
   New RPC URL: http://localhost:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer URL: (leave empty)
   ```
4. Click **"Save"**

### **Step 3: Import Test Account**
1. In MetaMask, click account icon → **"Import Account"**
2. Select **"Private Key"**
3. Use one of these Hardhat test private keys:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
4. Click **"Import"**

### **Step 4: Restart Services**
1. Close all browser tabs with the app
2. Run: `start-full-stack.bat`
3. Wait for all services to start (60 seconds)
4. Open http://localhost:3001

### **Step 5: Test Connection**
1. Connect MetaMask to the app
2. Check that you're on "Hardhat Local" network
3. Verify you have test ETH (should show ~10000 ETH)
4. Try a small transaction

## **🚀 Prevention Tips:**
- Always start blockchain before using the app
- Don't switch networks during transactions
- Use the provided startup scripts
- Reset MetaMask if you see repeated errors

## **🆘 Still Having Issues?**
1. Run: `check-blockchain.bat` to verify all services
2. Check browser console for detailed errors
3. Restart your browser completely
4. Try using a different browser or incognito mode