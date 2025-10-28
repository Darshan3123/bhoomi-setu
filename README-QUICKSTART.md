# 🚀 Bhoomi Setu - Complete Full Stack Setup

## **🎯 One-Click Full Stack Startup**

### **🌟 RECOMMENDED: Complete Full Stack (Blockchain + Backend + Frontend)**
```bash
start-full-stack.bat
```
**Just double-click this file!** It will start:
1. 🔗 Hardhat Blockchain (localhost:8545)
2. 📜 Smart Contract Deployment
3. 🚀 Backend API Server (localhost:3003)
4. 🌐 Frontend Application (localhost:3000)

### **⚡ Alternative Startup Options**

#### **Option 1: NPM Command (All Services)**
```bash
npm run dev
```
Starts blockchain, backend, and frontend simultaneously.

#### **Option 2: NPM Command (With Auto-Deploy)**
```bash
npm run dev:full
```
Includes automatic smart contract deployment.

#### **Option 3: PowerShell Script**
```powershell
.\start-dev.ps1
```

#### **Option 4: Manual (Four Terminals)**
```bash
# Terminal 1 - Blockchain
cd contracts
npm run dev

# Terminal 2 - Deploy Contracts (wait for blockchain first)
cd contracts
npm run deploy:local

# Terminal 3 - Backend
cd backend
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

## **🌐 Service URLs**
- **🌐 Frontend**: http://localhost:3000
- **🚀 Backend API**: http://localhost:3003/api
- **🔗 Blockchain RPC**: http://localhost:8545
- **❤️ Health Check**: http://localhost:3003/health

## **📋 Complete Port Configuration**
- **Frontend**: 3000 (Next.js React App)
- **Backend**: 3003 (Express.js API)
- **Blockchain**: 8545 (Hardhat Local Node)
- **MongoDB**: 27017 (Database)

## **🔧 Prerequisites**
1. **Node.js** (v16 or higher)
2. **MongoDB** (running on port 27017)
3. **MetaMask** browser extension
4. **Git** (for cloning)

## **📦 First Time Setup**

### **🚀 Super Easy Setup**
```bash
setup-first-time.bat
```
Double-click this file to install all dependencies automatically!

### **🛠️ Manual Setup**
```bash
# Install all dependencies (root, backend, frontend, contracts)
npm run install-all

# Start the full stack
start-full-stack.bat
```

## **🎯 Complete Testing Flow**
1. **Start Services**: Run `start-full-stack.bat`
2. **Wait**: 30-60 seconds for all services to start
3. **Open Browser**: Visit http://localhost:3000
4. **Configure MetaMask**:
   - Add network: localhost:8545
   - Import test accounts from Hardhat console
5. **Test Features**:
   - Connect wallet
   - Register/Login
   - Browse marketplace
   - Purchase property (real ETH transfer!)
   - Download PDF certificate

## **🔗 MetaMask Configuration**
```
Network Name: Hardhat Local
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH
```

## **🛠️ Troubleshooting**
- **Port conflicts**: Check if ports 3001, 3003, 8545 are free
- **MongoDB**: Ensure service is running (`net start MongoDB`)
- **MetaMask**: Connect to localhost:8545 network
- **Contracts**: Wait for deployment before using frontend

## **📁 Complete Project Structure**
```
bhoomi-setu/
├── contracts/           # Smart contracts (Hardhat)
├── backend/            # Express.js API server
├── frontend/           # Next.js React app
├── scripts/            # Utility scripts
├── start-full-stack.bat # Complete startup script
├── setup-first-time.bat # Dependency installer
└── package.json        # Root package with all scripts
```

## **🎉 You're Ready for Full Stack Development!**
Everything is configured to work with one command: `start-full-stack.bat`

### **🚀 Quick Commands Summary**
- **First time**: `setup-first-time.bat`
- **Daily development**: `start-full-stack.bat`
- **Just frontend/backend**: `npm run dev`