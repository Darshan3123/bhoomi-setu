# Bhoomi Setu - Blockchain Land Registry System

A decentralized land registry system built on Ethereum blockchain with IPFS for document storage.

## 🏗️ Architecture

- **Smart Contracts**: Solidity contracts on Ethereum (Sepolia testnet)
- **Frontend**: Next.js with React and Web3 integration
- **Backend**: Node.js + Express + MongoDB
- **Storage**: IPFS for decentralized document storage
- **Authentication**: MetaMask wallet-based authentication

## ✨ Features

- 🔐 **Secure Authentication**: MetaMask wallet-based login with role management
- 🏞️ **Land Registration**: Register land properties with document upload to IPFS
- 🔄 **Transfer Management**: Request and track land ownership transfers
- 👨‍💼 **Multi-Role System**: Users, Inspectors, and Admins with specific permissions
- 📋 **Inspection Workflow**: Site verification by assigned inspectors
- 📜 **Digital Certificates**: Blockchain-verified ownership certificates
- 📊 **Real-time Dashboard**: Track all activities and notifications
- 🔍 **Transparent Process**: All transactions recorded on blockchain

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (optional - will run without it initially)
- MetaMask browser extension
- Git

### One-Command Setup

```bash
# Clone and setup everything
git clone <repository-url>
cd bhoomi-setu
npm run setup
```

### Start Development Environment

```bash
# Start all services (blockchain, backend, frontend)
npm run dev
```

This will start:
- 🔗 **Hardhat Network**: http://localhost:8545
- 🔧 **Backend API**: http://localhost:3002
- 📱 **Frontend App**: http://localhost:3000

### Manual Setup (Alternative)

1. **Install dependencies for all modules:**
```bash
npm install
cd contracts && npm install
cd ../backend && npm install  
cd ../frontend && npm install
cd ..
```

2. **Set up environment variables:**
```bash
# Copy example files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit the files with your configuration
```

3. **Start services individually:**
```bash
# Terminal 1: Start blockchain
cd contracts && npm run dev

# Terminal 2: Deploy contracts (after blockchain starts)
cd contracts && npm run deploy:local

# Terminal 3: Start backend
cd backend && npm run dev

# Terminal 4: Start frontend  
cd frontend && npm run dev
```

## 📁 Project Structure

```
bhoomi-setu/
├── contracts/              # Smart Contracts
│   ├── contracts/
│   │   ├── AccessControl.sol    # Role-based access control
│   │   └── LandRegistry.sol     # Main land registry contract
│   ├── scripts/deploy.ts        # Deployment scripts
│   ├── test/                    # Contract tests
│   └── hardhat.config.ts
├── backend/                # Backend API
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── models/             # Database models
│   │   ├── middleware/         # Auth & validation
│   │   ├── utils/              # IPFS integration
│   │   └── index.ts
│   └── package.json
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/              # Next.js pages
│   │   ├── components/         # React components
│   │   ├── contexts/           # Web3 & Auth contexts
│   │   └── styles/
│   └── package.json
├── scripts/
│   └── start-dev.js           # Development startup script
└── package.json               # Root package.json
```

## 🎯 How to Use

### 1. Connect Your Wallet
- Install MetaMask browser extension
- Visit http://localhost:3000
- Click "Connect Wallet" and approve the connection
- Sign the authentication message (no gas fees)

### 2. Complete Your Profile
- Navigate to Profile tab in dashboard
- Fill in your personal information
- Upload KYC documents (Aadhaar, PAN)

### 3. Register Land
- Go to "Register New Land" 
- Upload property documents
- Fill in land details (location, area, survey number)
- Submit for blockchain registration

### 4. Transfer Land
- Select land to transfer
- Enter recipient's wallet address
- Upload transfer documents
- Submit transfer request

### 5. Track Progress
- Monitor transfer status in dashboard
- Receive notifications for updates
- Download digital certificates when approved

## 👥 User Roles

### 🙋‍♂️ Users (Land Owners)
- Register and manage land properties
- Upload property documents to IPFS
- Request land transfers
- Track transfer status
- Download digital certificates

### 🔍 Inspectors
- View assigned inspection cases
- Schedule and conduct site visits
- Upload inspection reports
- Recommend approval/rejection

### 👨‍💼 Admins
- Assign inspectors to cases
- Review inspection reports
- Approve/reject transfers
- Issue digital certificates
- Manage system users

## 🔧 Development

### Running Tests

```bash
# Test smart contracts
npm run test:contracts

# Test backend API
npm run test:backend

# Test frontend
npm run test:frontend

# Run all tests
npm run test
```

### Building for Production

```bash
# Build all modules
npm run build

# Build individual modules
npm run build:contracts
npm run build:backend  
npm run build:frontend
```

## 🌐 Deployment

### Local Testnet
- Contracts deployed to Hardhat local network
- Use for development and testing

### Sepolia Testnet
1. Get Sepolia ETH from faucet
2. Configure `.env` with Sepolia RPC URL and private key
3. Deploy: `cd contracts && npm run deploy:sepolia`
4. Update frontend with contract address

### Production
- Deploy contracts to Ethereum mainnet
- Deploy frontend to Vercel
- Deploy backend to Railway/Render
- Use MongoDB Atlas for database
- Configure IPFS with Pinata/Infura

## 🔐 Security Features

- **Role-Based Access Control**: Smart contract enforced permissions
- **Wallet Authentication**: Signature-based login without passwords
- **Document Integrity**: IPFS content addressing ensures tamper-proof documents
- **Blockchain Immutability**: All ownership records permanently stored
- **Input Validation**: Comprehensive validation on all user inputs
- **Rate Limiting**: API protection against abuse

## 🛠️ Technology Stack

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Frontend**: Next.js, React, TailwindCSS, Ethers.js
- **Backend**: Node.js, Express, MongoDB, JWT
- **Storage**: IPFS for decentralized file storage
- **Authentication**: MetaMask wallet signatures
- **Testing**: Mocha, Chai, Jest, Cypress

## 📊 Current Implementation Status

✅ **Completed Features:**
- Smart contract development and testing
- Backend API with authentication
- Frontend with Web3 integration
- User dashboard and profile management
- Document upload to IPFS
- Case management system
- Role-based access control

🚧 **In Progress:**
- Inspector and Admin dashboards
- Document viewing and verification
- Digital certificate generation
- Email notifications
- Advanced search and filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔧 Troubleshooting

### Common Issues

1. **"User not found. Please register first." Error**
   - This happens when your browser has stale authentication data
   - **Quick Fix**: Run `./fix-auth-error.bat` (Windows) or `./fix-auth-error.sh` (Linux/Mac)
   - **Manual Fix**: Visit `http://localhost:3000/clear-auth` to clear authentication state
   - **Alternative**: Clear browser data for localhost:3000 or use incognito mode
   - See [AUTH_TROUBLESHOOTING.md](AUTH_TROUBLESHOOTING.md) for detailed solutions

2. **MetaMask Connection Issues**
   - Make sure MetaMask is installed and unlocked
   - Check that you're on the correct network (Hardhat local network)
   - Try refreshing the page and reconnecting

3. **Backend Connection Errors**
   - Ensure the backend server is running on port 3002
   - Check that MongoDB is running
   - Verify environment variables are set correctly

4. **Smart Contract Issues**
   - Make sure Hardhat network is running
   - Verify contracts are deployed
   - Check that contract addresses match in the frontend

For more detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and [AUTH_TROUBLESHOOTING.md](AUTH_TROUBLESHOOTING.md).

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure MetaMask is installed and connected
3. Verify all services are running
4. Check environment variables are set correctly

For development help, refer to the individual module README files in each directory.