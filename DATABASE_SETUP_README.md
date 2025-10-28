# 🗄️ Bhoomi Setu Database Setup

Easy database setup for new development environments.

## 🚀 Quick Start

### Option 1: Direct Script Execution
```bash
# From project root
node backend/scripts/setup-database.js
```

### Option 2: Using npm script (if added to package.json)
```bash
# Add this to your backend/package.json scripts section:
# "setup-db": "node scripts/setup-database.js"

npm run setup-db
```

### Option 3: Using environment variables
```bash
# Custom MongoDB URI
MONGODB_URI=mongodb://localhost:27017/my-custom-db node backend/scripts/setup-database.js

# Production environment (be careful!)
NODE_ENV=production MONGODB_URI=mongodb://localhost:27017/bhoomi-setu-prod node backend/scripts/setup-database.js
```

## 📋 What This Script Does

### 1. Database Connection
- Connects to MongoDB (default: `mongodb://localhost:27017/bhoomi-setu`)
- Supports custom connection strings via `MONGODB_URI` environment variable

### 2. Data Cleanup
- Clears all existing collections
- Ensures fresh start for development

### 3. Index Creation
- Creates all necessary database indexes
- Optimizes query performance
- Handles missing models gracefully

### 4. Sample Data Creation

#### 👥 Users (5 sample users)
- **Admin User**: Full admin privileges
- **Inspector**: Property verification inspector
- **3 Regular Users**: Property owners with different KYC statuses

#### 🏠 Properties (3 sample properties)
- **Residential**: Gurgaon apartment (for sale)
- **Commercial**: Bangalore office space
- **Agricultural**: Haryana farmland (for sale)

#### 📋 Verifications
- Sample property verification records
- Inspector assignments
- Different verification statuses

#### ⚖️ Cases
- Sample transfer cases
- Inspector assignments
- Document uploads

#### 📜 Certificates
- Digital ownership certificates
- Blockchain transaction references
- IPFS document hashes

#### 🔗 Sample Transactions
- **Transaction 1**: `0x9cb9c21bf4db551b1545334ad018ab69da19fe9abaff290be7af0ad13bfa02cb`
  - Property transfer with 1.53 ETH value
  - From admin to user
- **Transaction 2**: `0x89d6ba0b0e109e142e8afdc93490aebec6a2b58747f23d9179e0584c2ea53794`
  - Property verification transaction
  - From inspector to user

## 🔧 Configuration

### Environment Variables
```bash
# Database connection
MONGODB_URI=mongodb://localhost:27017/bhoomi-setu

# Environment
NODE_ENV=development
```

### Sample Wallet Addresses
```javascript
// Admin
0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

// Inspector
0x70997970c51812dc3a010c7d01b50e0d17dc79c8

// Users
0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc  // Rajesh Sharma
0x90f79bf6eb2c4f870365e785982e1f101e93b906  // Priya Patel
0x15d34aaf54267db7d7c367839aaf71a00a2c6a65  // Amit Singh
```

## 📊 Output Example

```
🚀 BHOOMI SETU DATABASE SETUP
Environment: development
MongoDB URI: mongodb://localhost:27017/bhoomi-setu

[1] Connecting to MongoDB...
✅ Connected to MongoDB: mongodb://localhost:27017/bhoomi-setu

[2] Clearing existing data...
   Cleared collection: users
   Cleared collection: properties
✅ Database cleared successfully

[3] Creating database indexes...
   Created User indexes
   Created Property indexes
✅ Database indexes created successfully

[4] Creating sample users...
   Created admin: Admin User (0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266)
   Created inspector: Inspector Kumar (0x70997970c51812dc3a010c7d01b50e0d17dc79c8)
✅ Created 5 sample users

[5] Creating sample properties...
   Created property: PROP001 - Sector 15, Gurgaon, Haryana
✅ Created 3 sample properties

============================================================
DATABASE SETUP COMPLETE
============================================================

📊 SUMMARY:
   Users: 5
   Properties: 3
   Verifications: 2
   Cases: 1
   Certificates: 2

🚀 NEXT STEPS:
   1. Start your backend server: npm run dev
   2. Start your frontend server: npm run dev
   3. Visit http://localhost:3000 to see the application
   4. Test transaction details at: http://localhost:3000/test-transaction
   5. Login with any of the sample wallet addresses above
```

## 🧪 Testing Features

### Transaction Details Testing
1. Visit `/test-transaction` page
2. Click "View Details" on sample transactions
3. See wallet name resolution in action
4. Test with sample transaction hashes provided

### Admin Panel Testing
1. Login with admin wallet: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
2. Access admin features
3. View all transfers and properties
4. Test transaction details in admin context

### Property Management Testing
1. Login with user wallets
2. View "My Properties" page
3. See sample properties with transaction hashes
4. Test transaction details modal

## 🔄 Re-running Setup

The script is idempotent and can be run multiple times:
- Clears existing data first
- Creates fresh sample data
- Safe for development environments

⚠️ **Warning**: This script clears ALL data in the database. Use with caution in production environments.

## 🛠️ Customization

### Adding More Sample Data
Edit the `SAMPLE_DATA` object in `setup-database.js`:

```javascript
const SAMPLE_DATA = {
  users: [
    // Add more users here
  ],
  properties: [
    // Add more properties here
  ],
  sampleTransactions: [
    // Add more transaction hashes here
  ]
};
```

### Custom Database Name
```bash
MONGODB_URI=mongodb://localhost:27017/my-custom-db node backend/scripts/setup-database.js
```

### Skip Certain Collections
Modify the script to comment out specific creation functions:

```javascript
// const verifications = await createSampleVerifications(properties, users);
// const cases = await createSampleCases(properties, users);
```

## 📝 Notes

- All sample data uses realistic Indian addresses and names
- Wallet addresses are from Hardhat's default accounts
- IPFS hashes are sample/placeholder values
- Transaction hashes match the ones used in your terminal output
- KYC documents are pre-verified for testing
- All users have complete profiles for testing wallet name resolution

## 🤝 Contributing

To add new sample data or improve the setup script:
1. Edit `backend/scripts/setup-database.js`
2. Add new data to the `SAMPLE_DATA` object
3. Create corresponding creation functions
4. Update this README with new features

---

*This setup script makes it easy for any developer to get started with Bhoomi Setu in minutes!*