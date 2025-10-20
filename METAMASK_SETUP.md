# MetaMask Setup for Bhoomi Setu

## 🦊 Quick MetaMask Configuration

### 1. Add Hardhat Local Network

**Network Details:**
- **Network Name:** Hardhat Local
- **RPC URL:** http://localhost:8545
- **Chain ID:** 1337
- **Currency Symbol:** ETH
- **Block Explorer:** (leave empty)

### 2. Import Test Accounts

**Admin Account (Contract Owner):**
```
Private Key: ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Role: Admin (can assign roles, approve transfers)
```

**User Account #1:**
```
Private Key: 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Role: User (can register land, request transfers)
```

**Inspector Account:**
```
Private Key: 5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Role: Inspector (can inspect land, submit reports)
```

**User Account #2:**
```
Private Key: 7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Role: User (for testing transfers between users)
```

## 📋 Setup Steps

### Step 1: Install MetaMask
1. Install MetaMask browser extension
2. Create or import your wallet
3. Complete the setup process

### Step 2: Add Local Network
1. Open MetaMask
2. Click the network dropdown (top center)
3. Click "Add Network" or "Add a network manually"
4. Enter the network details above
5. Click "Save"

### Step 3: Import Test Accounts
1. Click the account icon (top right)
2. Select "Import Account"
3. Choose "Private Key"
4. Paste one of the private keys above (without 0x)
5. Click "Import"
6. Repeat for other accounts you want to test

### Step 4: Switch to Local Network
1. Click network dropdown
2. Select "Hardhat Local"
3. Verify you see 10000 ETH balance

## 🎯 Testing Different Roles

### As Admin (First Account):
- Register as user first
- You'll automatically have admin role
- Can assign inspector roles to other accounts
- Can approve/reject transfer requests

### As User (Second/Fourth Account):
- Register and complete profile
- Upload KYC documents
- Register land properties
- Request land transfers

### As Inspector (Third Account):
- Register as user first
- Admin needs to assign inspector role
- View assigned inspection cases
- Submit inspection reports

## 🔧 Troubleshooting

### Network Issues:
- Make sure Hardhat is running: `cd contracts && npm run dev`
- Check RPC URL is exactly: `http://localhost:8545`
- Chain ID must be: `1337`

### Account Issues:
- Each account starts with 10000 ETH
- If balance is 0, restart Hardhat network
- Make sure you're on "Hardhat Local" network

### Transaction Issues:
- Reset account if transactions are stuck
- MetaMask → Settings → Advanced → Reset Account

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Hardhat Network
cd contracts
npm run dev

# Terminal 2: Deploy Contracts (wait for Hardhat to start)
cd contracts
npm run deploy:local

# Terminal 3: Start Backend
cd backend
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3002
- **Hardhat Network:** http://localhost:8545

## 📝 Notes

- These are TEST accounts with fake ETH
- Never use these private keys on mainnet
- Each account has 10000 ETH for testing
- Restart Hardhat to reset all balances and state