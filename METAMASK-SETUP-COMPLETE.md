# 🦊 Complete MetaMask Setup Guide

## **🚨 CRITICAL: Follow These Steps Exactly**

### **Step 1: Reset MetaMask (IMPORTANT)**
1. Open MetaMask extension
2. Click the account icon (top right)
3. Go to **Settings** → **Advanced**
4. Click **"Reset Account"** (this clears transaction history only)
5. Confirm the reset

### **Step 2: Add Hardhat Local Network**
1. In MetaMask, click the network dropdown (currently showing your network)
2. Click **"Add Network"** or **"Add a network manually"**
3. Enter these EXACT details:

```
Network Name: Hardhat Local
New RPC URL: http://localhost:8545
Chain ID: 1337
Currency Symbol: ETH
Block Explorer URL: (leave empty)
```

4. Click **"Save"**
5. **IMPORTANT**: Switch to this network immediately

### **Step 3: Import Test Account**
1. In MetaMask, click account icon → **"Import Account"**
2. Select **"Private Key"**
3. Use this private key (first Hardhat account):
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
4. Click **"Import"**
5. You should see **~10000 ETH** balance

### **Step 4: Verify Connection**
1. Go to: http://localhost:3000
2. Click "Connect Wallet"
3. MetaMask should show "Hardhat Local" network
4. Account should show: 0xf39F...2266
5. Balance should show: ~10000 ETH

### **Step 5: Test Payment**
1. Go to marketplace: http://localhost:3000/marketplace
2. Click "Buy Now" on any property
3. You should see the payment page without errors
4. Click "Pay X.XX ETH" button
5. MetaMask should prompt for transaction confirmation

## **🔧 If Still Getting Errors:**

### **Circuit Breaker Error Fix:**
1. Close all browser tabs with the app
2. In MetaMask: Settings → Advanced → Reset Account
3. Restart browser completely
4. Go to http://localhost:3000
5. Reconnect wallet

### **Connection Error Fix:**
1. Make sure you're on "Hardhat Local" network in MetaMask
2. Check that Chain ID is exactly: **1337**
3. RPC URL is exactly: **http://localhost:8545**
4. Try switching to Mainnet and back to Hardhat Local

### **Transaction Error Fix:**
1. Make sure you have ETH balance (should be ~10000)
2. Try a different test account if needed
3. Reset MetaMask account if transactions are stuck

## **📋 Current Service Status:**
- ✅ Blockchain: http://localhost:8545 (Chain ID: 1337)
- ✅ Smart Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- ✅ Backend: http://localhost:3003
- ✅ Frontend: http://localhost:3000

## **🆘 Emergency Reset:**
If nothing works:
1. Uninstall and reinstall MetaMask extension
2. Restore your wallet with seed phrase
3. Follow steps 1-5 above
4. Try in incognito/private browser window