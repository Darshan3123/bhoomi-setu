# 🔧 Fix MetaMask Circuit Breaker Error

## **❌ Error:** "Execution prevented because the circuit breaker is open"

This happens when MetaMask blocks requests due to connection issues.

## **🚀 Quick Fixes:**

### **1. Reset MetaMask Network**
1. Open MetaMask
2. Click network dropdown (currently showing a network)
3. Switch to "Ethereum Mainnet"
4. Switch back to "Localhost 8545" (or add it if missing)

### **2. Clear MetaMask Cache**
1. MetaMask → Settings → Advanced
2. Click "Reset Account" (this clears transaction history, not your wallet)
3. Confirm reset

### **3. Add/Re-add Localhost Network**
- **Network Name:** Hardhat Local
- **RPC URL:** http://localhost:8545
- **Chain ID:** 31337
- **Currency Symbol:** ETH

### **4. Restart Blockchain Node**
1. Close Hardhat node window
2. Run: `start-full-stack.bat` again
3. Wait for "Started HTTP and WebSocket JSON-RPC server"

### **5. Check Blockchain Status**
Visit: http://localhost:8545 (should show JSON-RPC response)

## **🎯 Prevention:**
- Always start blockchain before frontend
- Don't switch networks while transactions are pending
- Use the startup script for proper order