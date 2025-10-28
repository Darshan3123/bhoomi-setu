# 📊 BHOOMI SETU DATABASE DOCUMENTATION

## 🗄️ Database Overview

- **Database Name**: `bhoomi-setu`
- **Database Type**: MongoDB (NoSQL) with Mongoose ODM
- **Connection URI**: `mongodb://localhost:27017/bhoomi-setu`
- **Total Collections**: 5 main collections
- **Primary Use**: Blockchain-based property verification and land registry system
- **Technology Stack**: Node.js, TypeScript, Mongoose, MongoDB

---

## 📋 Collection Schemas

### 1. 👤 USERS Collection

**Purpose**: Store user accounts, profiles, and KYC information

#### Schema Structure

```typescript
interface IUser {
  _id: ObjectId;
  walletAddress: string; // Ethereum wallet address (0x format)
  role: "user" | "admin" | "inspector";
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    aadhaarNumber?: string; // 12 digit Aadhaar number
    panNumber?: string; // PAN format: ABCDE1234F
    kycDocuments: {
      aadhaar?: string; // IPFS hash
      pan?: string; // IPFS hash
      verified: boolean;
      rejectionReason?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Validation Rules

- **walletAddress**: Required, unique, lowercase, Ethereum format (0x + 40 hex chars)
- **role**: Enum ['user', 'admin', 'inspector'], default: 'user'
- **email**: Unique, lowercase, email format validation
- **phone**: Phone number format validation
- **aadhaarNumber**: 12 digits format
- **panNumber**: Uppercase, format ABCDE1234F
- **IPFS hashes**: Qm format (44 characters)

#### Indexes

- `walletAddress` (unique)
- `role`
- `profile.email`

#### Methods

- `toJSON()`: Clean JSON output (removes \_\_v)

---

### 2. 🏠 PROPERTIES Collection

**Purpose**: Store registered properties with blockchain integration

#### Schema Structure

```typescript
interface IProperty {
  _id: ObjectId;
  surveyId: string; // Unique property identifier
  location: string;
  propertyType: "Agricultural" | "Residential" | "Commercial" | "Industrial";
  area: number;
  areaUnit: "sq ft" | "sq yard" | "acre";
  priceInWei: string; // Blockchain price in Wei
  priceInINR: number;
  owner: ObjectId; // Reference to User
  ownerAddress: string; // Ethereum address
  forSale: boolean;
  status: "active" | "sold" | "transferred";
  documentHashes: string[]; // Array of IPFS hashes
  hasDocuments: {
    saleDeed: boolean;
    taxReceipt: boolean;
    noc: boolean;
    propertyPhoto: boolean;
  };
  blockchainTxHash?: string;
  contractAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Validation Rules

- **surveyId**: Required, unique, trimmed
- **area**: Required, minimum 0
- **priceInWei**: Required string
- **priceInINR**: Default 0, minimum 0
- **ownerAddress**: Required, lowercase, Ethereum format
- **status**: Default 'active'

#### Indexes

- `surveyId` (unique)
- `owner`
- `propertyType, forSale` (compound index)
- `location` (text search)
- `priceInWei`
- `createdAt` (descending)

#### Virtual Fields

- `formattedPrice`: Converts Wei to Ether format using ethers.js

#### Static Methods

- `findForSale()`: Returns properties available for sale
- `findByOwner(ownerId)`: Returns properties by specific owner
- `searchProperties(query)`: Advanced property search with filters

#### Pre-save Middleware

- Automatically updates `hasDocuments` based on `documentHashes` array length

---

### 3. 📋 PROPERTY VERIFICATIONS Collection

**Purpose**: Handle property verification workflow and inspector assignments

#### Schema Structure

```typescript
interface IPropertyVerification {
  _id: ObjectId;
  verificationId: number; // Auto-increment unique ID
  propertyId: string; // Survey ID reference
  ownerAddress: string; // Property owner's wallet
  inspectorAddress?: string; // Assigned inspector's wallet
  status:
    | "pending"
    | "assigned"
    | "inspection_scheduled"
    | "inspected"
    | "verified"
    | "rejected";
  propertyDetails: {
    surveyNumber: string;
    location: string;
    area: number;
    areaUnit: string;
    propertyType: string;
    ownerName?: string;
  };
  documents: Array<{
    type: string; // Document type enum
    ipfsHash: string;
    uploadedAt: Date;
    filename?: string;
    size?: number;
  }>;
  inspectionReport?: {
    ipfsHash: string;
    submittedAt: Date;
    recommendation: "approve" | "reject";
    notes?: string;
    gpsLocation?: string;
    visitDate?: string;
  };
  notifications: Array<{
    message: string;
    sentAt: Date;
    recipients: string[]; // Wallet addresses
    type: "info" | "warning" | "success" | "error";
  }>;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Validation Rules

- **verificationId**: Required, unique
- **propertyId**: Required
- **ownerAddress**: Required, lowercase, Ethereum format
- **inspectorAddress**: Optional, lowercase, Ethereum format
- **status**: Default 'pending'
- **documents.type**: Enum ['property_deed', 'survey_report', 'tax_receipt', 'identity_proof', 'ownership_proof', 'other']
- **propertyType**: Enum ['Residential', 'Commercial', 'Agricultural', 'Industrial']

#### Indexes

- `verificationId` (unique)
- `propertyId`
- `ownerAddress`
- `inspectorAddress`
- `status`
- `createdAt` (descending)

#### Instance Methods

- `addNotification(message, recipients, type)`: Add notification to array
- `updateStatus(newStatus, reason?)`: Update verification status with optional reason

---

### 4. ⚖️ CASES Collection

**Purpose**: Handle land transfer cases and inspection workflow

#### Schema Structure

```typescript
interface ICase {
  _id: ObjectId;
  requestId: number; // Unique request identifier
  landId: number; // Land/Property ID
  fromAddress: string; // Current owner's wallet
  toAddress: string; // New owner's wallet
  inspectorAddress?: string; // Assigned inspector's wallet
  status:
    | "pending"
    | "inspection_scheduled"
    | "inspected"
    | "approved"
    | "rejected"
    | "completed";
  documents: Array<{
    type: string;
    ipfsHash: string; // IPFS hash with Qm format validation
    uploadedAt: Date;
    filename?: string;
    size?: number;
  }>;
  inspectionReport?: {
    ipfsHash: string;
    submittedAt: Date;
    recommendation: "approve" | "reject";
    notes?: string;
  };
  notifications: Array<{
    message: string;
    sentAt: Date;
    recipients: string[];
    type: "info" | "warning" | "success" | "error";
  }>;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Validation Rules

- **requestId**: Required, unique
- **landId**: Required
- **fromAddress**: Required, lowercase, Ethereum format
- **toAddress**: Required, lowercase, Ethereum format
- **inspectorAddress**: Optional, lowercase, Ethereum format
- **status**: Default 'pending'
- **documents.type**: Enum ['property_deed', 'survey_report', 'tax_receipt', 'identity_proof', 'other']
- **ipfsHash**: Qm format validation (44 characters)

#### Indexes

- `requestId` (unique)
- `landId`
- `fromAddress`
- `toAddress`
- `inspectorAddress`
- `status`
- `createdAt` (descending)

#### Instance Methods

- `addNotification(message, recipients, type)`: Add notification
- `updateStatus(newStatus, reason?)`: Update case status

---

### 5. 📜 CERTIFICATES Collection

**Purpose**: Store digital land ownership certificates

#### Schema Structure

```typescript
interface ICertificate {
  _id: ObjectId;
  landId: number; // Unique land identifier
  ownerAddress: string; // Certificate holder's wallet
  certificateHash: string; // IPFS hash of PDF certificate
  blockchainTxHash: string; // Ethereum transaction hash
  issuedAt: Date;
  metadata: {
    landArea: string;
    location: string;
    surveyNumber: string;
    registrationDate: Date;
    previousOwner?: string; // Previous owner's wallet
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Validation Rules

- **landId**: Required, unique
- **ownerAddress**: Required, lowercase, Ethereum format
- **certificateHash**: Required, IPFS Qm format (44 characters)
- **blockchainTxHash**: Required, Ethereum transaction hash format (0x + 64 hex chars)
- **issuedAt**: Default current date
- **previousOwner**: Optional, Ethereum format

#### Indexes

- `landId` (unique)
- `ownerAddress`
- `blockchainTxHash`
- `issuedAt` (descending)

#### Instance Methods

- `toJSON()`: Clean JSON output

#### Static Methods

- `findByOwner(ownerAddress)`: Find certificates by owner
- `findByLand(landId)`: Find certificate for specific land

---

## 🔗 Relationships & Data Flow

### Primary Relationships

1. **User → Properties**: One-to-Many (owner relationship)

   - `Property.owner` references `User._id`
   - `Property.ownerAddress` matches `User.walletAddress`

2. **Property → PropertyVerification**: One-to-One (verification process)

   - `PropertyVerification.propertyId` matches `Property.surveyId`

3. **User → Cases**: Many-to-Many relationships

   - `Case.fromAddress` (current owner)
   - `Case.toAddress` (new owner)
   - `Case.inspectorAddress` (assigned inspector)

4. **Property → Certificate**: One-to-One (ownership certificate)
   - `Certificate.landId` corresponds to property
   - `Certificate.ownerAddress` matches current owner

### Workflow Integration

#### Property Registration Flow

1. User creates account → `Users` collection
2. User registers property → `Properties` collection
3. System creates verification request → `PropertyVerifications` collection
4. Inspector assigned and completes verification
5. Upon approval → `Certificates` collection updated

#### Land Transfer Flow

1. Transfer request created → `Cases` collection
2. Inspector assigned for verification
3. Documents uploaded and verified
4. Upon approval → `Properties.owner` updated
5. New certificate issued → `Certificates` collection

---

## 🔧 Technical Specifications

### Database Configuration

- **Connection**: MongoDB with Mongoose ODM
- **Environment**: Configurable via `MONGODB_URI` environment variable
- **Default URI**: `mongodb://localhost:27017/bhoomi-setu`
- **Connection Features**:
  - Automatic reconnection
  - Error handling
  - Graceful shutdown on SIGINT

### Validation & Security

- **Schema Validation**: Mongoose schema-level validation
- **Data Sanitization**: Automatic trimming and case conversion
- **Pattern Matching**: Regex validation for addresses, emails, phone numbers
- **Unique Constraints**: Database-level unique indexes
- **Type Safety**: TypeScript interfaces for all models

### Performance Optimization

- **Indexing Strategy**:

  - Unique indexes on primary identifiers
  - Compound indexes for common query patterns
  - Text search indexes for location-based queries
  - Descending indexes on timestamps for recent-first sorting

- **Query Optimization**:
  - Population of referenced documents
  - Selective field projection
  - Pagination support
  - Aggregation pipeline support

### Storage Integration

- **Document Storage**: IPFS (InterPlanetary File System)
- **File Upload**: Multer middleware with IPFS integration
- **Blockchain Integration**: Ethereum transaction hash storage
- **Metadata Storage**: JSON objects for flexible additional data

### Dependencies

```json
{
  "mongoose": "^8.0.0",
  "ethers": "^6.8.0",
  "ipfs-http-client": "^60.0.1",
  "multer": "^1.4.5-lts.1"
}
```

---

## 📊 Data Statistics & Usage

### Current Implementation Status

- **Collections**: 5 active collections
- **Relationships**: 4 primary relationship patterns
- **Indexes**: 20+ optimized indexes across collections
- **Methods**: 10+ custom instance and static methods
- **Validation Rules**: 50+ validation constraints

### Typical Data Volumes

- **Users**: Scalable to thousands of registered users
- **Properties**: Hundreds to thousands of property records
- **Verifications**: One-to-one with properties, plus historical records
- **Cases**: Variable based on transfer activity
- **Certificates**: One per verified property ownership

### Query Patterns

- **User Authentication**: By wallet address
- **Property Search**: By location, type, price range, availability
- **Verification Tracking**: By status, inspector, date ranges
- **Case Management**: By parties involved, status, priority
- **Certificate Lookup**: By owner, land ID, issuance date

---

## 🚀 Future Enhancements

### Planned Features

- **Audit Trails**: Complete change history tracking
- **Advanced Search**: Full-text search across all collections
- **Analytics**: Property market trends and statistics
- **Notifications**: Real-time updates via WebSocket
- **Backup Strategy**: Automated backup and recovery procedures

### Scalability Considerations

- **Sharding**: Horizontal scaling for large datasets
- **Replication**: Master-slave setup for high availability
- **Caching**: Redis integration for frequently accessed data
- **Archive Strategy**: Historical data archival for performance

---

_Last Updated: October 2025_
_Version: 1.0.0_
_Maintained by: Bhoomi Setu Development Team_
