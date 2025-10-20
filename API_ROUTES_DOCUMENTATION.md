# 🚀 BHOOMI SETU API ROUTES DOCUMENTATION

## 📋 Overview

**Base URL**: `http://localhost:3002/api`  
**Server Port**: 3002  
**Authentication**: JWT Token-based  
**File Upload**: Multer with IPFS storage  
**Rate Limiting**: 100 requests per 15 minutes per IP  

---

## 🔐 Authentication & Authorization

### Headers Required
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json (for JSON requests)
Content-Type: multipart/form-data (for file uploads)
```

### User Roles
- **user**: Regular property owners
- **admin**: System administrators
- **inspector**: Property inspectors

---

## 📚 API ROUTES BY MODULE

### 1. 🔐 AUTHENTICATION ROUTES (`/api/auth`)

#### **POST** `/api/auth/verify-wallet`
**Purpose**: Verify wallet signature and authenticate user  
**Access**: Public  
**Body**:
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Authentication message",
  "role": "user" // optional
}
```
**Response**:
```json
{
  "success": true,
  "token": "jwt_token",
  "isNewUser": false,
  "user": {
    "walletAddress": "0x...",
    "role": "user",
    "profile": {...}
  }
}
```

#### **GET** `/api/auth/user-role`
**Purpose**: Get current user's role and profile  
**Access**: Private (Authenticated)  
**Response**:
```json
{
  "walletAddress": "0x...",
  "role": "user",
  "profile": {...},
  "isRegistered": true,
  "isAdmin": false
}
```

#### **POST** `/api/auth/update-profile`
**Purpose**: Update user profile information  
**Access**: Private  
**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

#### **POST** `/api/auth/upload-kyc`
**Purpose**: Upload KYC documents (Aadhaar/PAN)  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**Files**: `aadhaar`, `pan` (max 5MB each)  
**Response**:
```json
{
  "success": true,
  "message": "KYC documents uploaded successfully",
  "uploadedDocuments": {
    "aadhaar": "QmHash...",
    "pan": "QmHash..."
  }
}
```

#### **GET** `/api/auth/kyc-status`
**Purpose**: Get KYC verification status  
**Access**: Private  
**Response**:
```json
{
  "hasAadhaar": true,
  "hasPan": true,
  "verified": false,
  "kycComplete": true,
  "status": "pending"
}
```

#### **POST** `/api/auth/generate-message`
**Purpose**: Generate message for wallet signature  
**Access**: Public  
**Body**:
```json
{
  "walletAddress": "0x..."
}
```

#### **POST** `/api/auth/register-with-profile`
**Purpose**: Register user with complete profile  
**Access**: Public  
**Body**:
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F"
}
```

#### **Admin Routes** (Require Admin Role)

#### **GET** `/api/auth/admin/users`
**Purpose**: Get all users for admin dashboard  
**Access**: Admin Only  
**Response**:
```json
{
  "success": true,
  "users": [...],
  "totalUsers": 50
}
```

#### **PUT** `/api/auth/admin/verify-kyc/:userId`
**Purpose**: Verify user's KYC documents  
**Access**: Admin Only  
**Body**:
```json
{
  "verified": true
}
```

#### **GET** `/api/auth/admin/dashboard-stats`
**Purpose**: Get dashboard statistics  
**Access**: Admin Only  

#### **GET** `/api/auth/admin/pending-kyc`
**Purpose**: Get users with pending KYC verification  
**Access**: Admin Only  

#### **GET** `/api/auth/admin/user-documents/:userId`
**Purpose**: Get user's KYC documents with IPFS hashes  
**Access**: Admin Only  

---

### 2. 🏠 PROPERTY ROUTES (`/api/properties`)

#### **GET** `/api/properties/test`
**Purpose**: Test route to verify router is working  
**Access**: Public  

#### **POST** `/api/properties/register`
**Purpose**: Register a new property on blockchain  
**Access**: Private (KYC Verified Users Only)  
**Body**:
```json
{
  "surveyId": "PROP001",
  "location": "Mumbai, Maharashtra",
  "propertyType": "Residential",
  "area": 1200,
  "areaUnit": "sq ft",
  "priceInWei": "1000000000000000000",
  "priceInINR": 5000000,
  "ownerAddress": "0x...",
  "forSale": false,
  "documentHashes": ["QmHash1...", "QmHash2..."]
}
```

#### **GET** `/api/properties/my-properties`
**Purpose**: Get user's properties with KYC status  
**Access**: Private  

#### **GET** `/api/properties/:surveyId`
**Purpose**: Get property details by survey ID  
**Access**: Public  
**Response**:
```json
{
  "success": true,
  "property": {
    "id": "...",
    "surveyId": "PROP001",
    "location": "Mumbai, Maharashtra",
    "propertyType": "Residential",
    "area": 1200,
    "areaUnit": "sq ft",
    "priceInWei": "1000000000000000000",
    "priceInINR": 5000000,
    "ownerAddress": "0x...",
    "forSale": false,
    "status": "active",
    "hasDocuments": {...},
    "owner": {...}
  }
}
```

#### **GET** `/api/properties`
**Purpose**: Get all properties with pagination and filters  
**Access**: Public  
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `propertyType`: Filter by property type
- `forSale`: Filter by sale status
- `minPrice`, `maxPrice`: Price range filter
- `location`: Location search

#### **PUT** `/api/properties/:surveyId/list-for-sale`
**Purpose**: List property for sale  
**Access**: Private (Owner Only)  
**Body**:
```json
{
  "priceInWei": "2000000000000000000"
}
```

#### **PUT** `/api/properties/:surveyId/remove-from-sale`
**Purpose**: Remove property from sale  
**Access**: Private (Owner Only)  

---

### 3. 📋 PROPERTY VERIFICATION ROUTES (`/api/property-verification`)

#### **GET** `/api/property-verification/test`
**Purpose**: Test route to verify router is working  
**Access**: Public  

#### **POST** `/api/property-verification/submit`
**Purpose**: Submit property for verification  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**Files**: `documents` (max 5 files, 10MB each)  
**Body**:
```json
{
  "surveyNumber": "PROP001",
  "location": "Mumbai, Maharashtra",
  "area": "1200",
  "areaUnit": "sq ft",
  "propertyType": "Residential",
  "documentTypes": ["property_deed", "tax_receipt"]
}
```

#### **GET** `/api/property-verification/admin/pending`
**Purpose**: Get pending property verifications  
**Access**: Admin Only  

#### **POST** `/api/property-verification/admin/assign-inspector`
**Purpose**: Assign inspector to property verification  
**Access**: Admin Only  
**Body**:
```json
{
  "verificationId": 1,
  "inspectorAddress": "0x..."
}
```

#### **GET** `/api/property-verification/inspector/assigned`
**Purpose**: Get assigned property verifications for inspector  
**Access**: Inspector Only  

#### **GET** `/api/property-verification/inspector/:verificationId`
**Purpose**: Get detailed property verification for inspector  
**Access**: Inspector Only  

#### **PUT** `/api/property-verification/inspector/:verificationId/schedule`
**Purpose**: Schedule property inspection  
**Access**: Inspector Only  
**Body**:
```json
{
  "scheduledDate": "2024-01-15",
  "notes": "Inspection scheduled for morning"
}
```

#### **POST** `/api/property-verification/inspector/:verificationId/submit-report`
**Purpose**: Submit property verification report  
**Access**: Inspector Only  
**Content-Type**: `multipart/form-data`  
**File**: `report` (PDF/Image)  
**Body**:
```json
{
  "recommendation": "approve",
  "notes": "Property verified successfully",
  "gpsLocation": "19.0760,72.8777",
  "visitDate": "2024-01-15"
}
```

#### **GET** `/api/property-verification/property/:surveyId`
**Purpose**: Get property verification details by survey ID  
**Access**: Public  

#### **GET** `/api/property-verification/admin/all-properties`
**Purpose**: Get all properties including verifications for admin dashboard  
**Access**: Admin Only  
**Query Parameters**:
- `page`, `limit`: Pagination
- `search`: Search term
- `verificationStatus`: Filter by verification status
- `propertyType`: Filter by property type

#### **GET** `/api/property-verification/user/:walletAddress`
**Purpose**: Get user details by wallet address  
**Access**: Public  

#### **GET** `/api/property-verification/inspector/dashboard-stats`
**Purpose**: Get inspector dashboard statistics  
**Access**: Inspector Only  

---

### 4. ⚖️ CASE ROUTES (`/api/cases`)

#### **POST** `/api/cases/create`
**Purpose**: Create a new transfer case  
**Access**: Private  
**Body**:
```json
{
  "requestId": 1001,
  "landId": 123,
  "toAddress": "0x...",
  "documentsHash": "QmHash..."
}
```

#### **GET** `/api/cases/my-cases`
**Purpose**: Get cases for current user  
**Access**: Private  

#### **GET** `/api/cases/:requestId`
**Purpose**: Get specific case details  
**Access**: Private (Involved parties + Admin)  

#### **POST** `/api/cases/:requestId/update-status`
**Purpose**: Update case status  
**Access**: Admin Only  
**Body**:
```json
{
  "status": "approved",
  "reason": "All documents verified"
}
```

#### **GET** `/api/cases/pending/count`
**Purpose**: Get count of pending cases  
**Access**: Admin Only  

#### **POST** `/api/cases/:requestId/assign-inspector`
**Purpose**: Assign inspector to a case  
**Access**: Admin Only  
**Body**:
```json
{
  "inspectorAddress": "0x..."
}
```

#### **GET** `/api/cases/available-inspectors`
**Purpose**: Get list of available inspectors  
**Access**: Admin Only  

#### **GET** `/api/cases/:requestId/notifications`
**Purpose**: Get notifications for a specific case  
**Access**: Private (Involved parties + Admin)  

---

### 5. 📄 DOCUMENT ROUTES (`/api/documents`)

#### **POST** `/api/documents/upload`
**Purpose**: Upload property documents to IPFS  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**Files**: `documents` (max 10 files, 10MB each)  
**Body**:
```json
{
  "documentType": "property_deed",
  "landId": "123",
  "requestId": "1001"
}
```

#### **GET** `/api/documents/:hash`
**Purpose**: Retrieve document from IPFS  
**Access**: Private (With access control)  

#### **POST** `/api/documents/verify`
**Purpose**: Verify document integrity using IPFS hash  
**Access**: Private  
**Body**:
```json
{
  "hash": "QmHash..."
}
```

#### **GET** `/api/documents/case/:requestId`
**Purpose**: Get all documents for a specific case  
**Access**: Private (Involved parties + Admin)  

---

### 6. 🔍 INSPECTOR ROUTES (`/api/inspector`)

#### **GET** `/api/inspector/assigned-cases`
**Purpose**: Get all cases assigned to inspector (both transfer and verification)  
**Access**: Inspector Only  

#### **GET** `/api/inspector/case/:requestId`
**Purpose**: Get detailed case information for inspector  
**Access**: Inspector Only  

#### **PUT** `/api/inspector/case/:requestId/schedule-visit`
**Purpose**: Mark case as visit scheduled  
**Access**: Inspector Only  
**Body**:
```json
{
  "scheduledDate": "2024-01-15",
  "notes": "Site visit scheduled"
}
```

#### **POST** `/api/inspector/case/:requestId/submit-report`
**Purpose**: Submit inspection report  
**Access**: Inspector Only  
**Content-Type**: `multipart/form-data`  
**File**: `report`  
**Body**:
```json
{
  "recommendation": "approve",
  "notes": "Property inspection completed",
  "gpsLocation": "19.0760,72.8777",
  "visitDate": "2024-01-15"
}
```

#### **GET** `/api/inspector/dashboard-stats`
**Purpose**: Get inspector dashboard statistics  
**Access**: Inspector Only  

#### **GET** `/api/inspector/inspection-history`
**Purpose**: Get inspector's inspection history  
**Access**: Inspector Only  
**Query Parameters**:
- `page`, `limit`: Pagination
- `status`: Filter by recommendation status

---

### 7. 📋 KYC ROUTES (`/api/kyc`)

#### **POST** `/api/kyc/upload-documents`
**Purpose**: Upload KYC documents (Aadhaar and PAN)  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**Files**: `aadhaar`, `pan` (max 5MB each)  
**Body**:
```json
{
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F"
}
```

#### **GET** `/api/kyc/status`
**Purpose**: Get user's KYC status  
**Access**: Private  

#### **GET** `/api/kyc/admin/pending`
**Purpose**: Get all pending KYC verifications  
**Access**: Admin Only  
**Query Parameters**:
- `page`, `limit`: Pagination

#### **POST** `/api/kyc/admin/verify/:userId`
**Purpose**: Verify or reject user's KYC documents  
**Access**: Admin Only  
**Body**:
```json
{
  "action": "approve", // or "reject"
  "rejectionReason": "Invalid document" // required for reject
}
```

#### **GET** `/api/kyc/admin/stats`
**Purpose**: Get KYC verification statistics  
**Access**: Admin Only  

---

### 8. 📤 UPLOAD ROUTES (`/api/upload`)

#### **POST** `/api/upload/ipfs`
**Purpose**: Upload single file to IPFS  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**File**: `file` (max 10MB)  
**Body**:
```json
{
  "documentType": "saleDeed"
}
```

#### **GET** `/api/upload/ipfs/:hash`
**Purpose**: Get file from IPFS  
**Access**: Public  

#### **POST** `/api/upload/multiple`
**Purpose**: Upload multiple files to IPFS  
**Access**: Private  
**Content-Type**: `multipart/form-data`  
**Files**: `files` (max 4 files)  
**Body**:
```json
{
  "documentTypes": ["saleDeed", "taxReceipt", "noc", "propertyPhoto"]
}
```

---

## 🔧 SYSTEM ROUTES

### **GET** `/health`
**Purpose**: Health check endpoint  
**Access**: Public  
**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "ipfs": "connected"
  }
}
```

---

## 📊 RESPONSE FORMATS

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔐 AUTHENTICATION FLOW

1. **Generate Message**: `POST /api/auth/generate-message`
2. **Sign Message**: Client signs with wallet
3. **Verify Signature**: `POST /api/auth/verify-wallet`
4. **Get Token**: Receive JWT token
5. **Use Token**: Include in Authorization header for protected routes

---

## 📁 FILE UPLOAD SPECIFICATIONS

### Supported File Types
- **Images**: JPEG, PNG, JPG
- **Documents**: PDF
- **Reports**: PDF, JSON

### File Size Limits
- **KYC Documents**: 5MB per file
- **Property Documents**: 10MB per file
- **Inspection Reports**: 10MB per file

### IPFS Integration
- All files uploaded to IPFS via Pinata
- Files pinned for permanent storage
- IPFS hashes stored in database
- Gateway URLs provided for access

---

## ⚡ RATE LIMITING

- **Global Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` routes
- **Response**: 429 Too Many Requests

---

## 🛡️ SECURITY FEATURES

### Middleware Stack
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **JWT Authentication**: Token-based auth
- **Role-based Access**: Admin/Inspector/User roles
- **File Validation**: Type and size checks
- **Input Sanitization**: Data validation

### Access Control
- **Public Routes**: Property listings, health check
- **Private Routes**: User-specific data, file uploads
- **Admin Routes**: User management, KYC verification
- **Inspector Routes**: Case assignments, inspections

---

## 🔄 WORKFLOW INTEGRATION

### Property Registration Flow
1. User uploads KYC → `POST /api/kyc/upload-documents`
2. Admin verifies KYC → `POST /api/kyc/admin/verify/:userId`
3. User submits property → `POST /api/property-verification/submit`
4. Admin assigns inspector → `POST /api/property-verification/admin/assign-inspector`
5. Inspector completes verification → `POST /api/property-verification/inspector/:id/submit-report`
6. Property gets registered → `POST /api/properties/register`

### Land Transfer Flow
1. Create transfer case → `POST /api/cases/create`
2. Admin assigns inspector → `POST /api/cases/:id/assign-inspector`
3. Inspector schedules visit → `PUT /api/inspector/case/:id/schedule-visit`
4. Inspector submits report → `POST /api/inspector/case/:id/submit-report`
5. Admin approves transfer → `POST /api/cases/:id/update-status`

---

*Last Updated: October 2025*  
*Version: 1.0.0*  
*Total Routes: 50+ endpoints across 8 modules*