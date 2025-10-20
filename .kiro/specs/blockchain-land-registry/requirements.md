# Requirements Document

## Introduction

Bhoomi Setu is a blockchain-powered land registry system that enables secure, transparent, and tamper-proof land ownership registration and transfer. The system serves three primary user roles: Users (buyers/sellers), Land Inspectors, and Admins, providing a complete workflow from property registration to digital certificate issuance. The system leverages blockchain technology for immutable record-keeping, IPFS for document storage, and Web3 authentication for secure access.

## Requirements

### Requirement 1: User Authentication and Profile Management

**User Story:** As a User, Land Inspector, or Admin, I want to authenticate using MetaMask and manage my profile, so that I can securely access role-specific features of the land registry system.

#### Acceptance Criteria

1. WHEN a user visits the application THEN the system SHALL provide MetaMask wallet connection option
2. WHEN a user connects their MetaMask wallet THEN the system SHALL authenticate the user based on their wallet address
3. WHEN authentication is successful THEN the system SHALL redirect users to role-specific dashboards based on their assigned role
4. WHEN a User accesses their profile THEN the system SHALL allow them to update personal details and upload KYC documents (Aadhaar/PAN)
5. IF a user's role is not assigned THEN the system SHALL default to User role
6. WHEN KYC documents are uploaded THEN the system SHALL store them on IPFS and save the hash reference

### Requirement 2: Property Document Management

**User Story:** As a User, I want to upload and manage property documents securely, so that I can register my land and maintain proof of ownership.

#### Acceptance Criteria

1. WHEN a User uploads property documents THEN the system SHALL store files on IPFS
2. WHEN documents are stored on IPFS THEN the system SHALL save the IPFS hash on the blockchain via smart contract
3. WHEN documents are successfully uploaded THEN the system SHALL display confirmation with transaction hash
4. WHEN a User views their property documents THEN the system SHALL retrieve and display documents from IPFS using stored hashes
5. WHEN document upload fails THEN the system SHALL display appropriate error messages and retry options
6. WHEN documents are uploaded THEN the system SHALL validate file types and size limits

### Requirement 3: Land Registration and Transfer Process

**User Story:** As a User, I want to register my land and initiate transfer processes, so that I can legally transfer ownership through the blockchain system.

#### Acceptance Criteria

1. WHEN a User initiates land registration THEN the system SHALL create a new land record on the blockchain
2. WHEN a User applies for land transfer THEN the system SHALL create a transfer request with pending status
3. WHEN a transfer is initiated THEN the system SHALL assign a Land Inspector for verification
4. WHEN transfer status changes THEN the system SHALL notify all relevant parties
5. WHEN a transfer is approved THEN the system SHALL update blockchain ownership records
6. WHEN ownership is transferred THEN the system SHALL issue a new digital ownership certificate

### Requirement 4: Land Inspector Verification Workflow

**User Story:** As a Land Inspector, I want to verify land details and submit inspection reports, so that I can ensure the authenticity of land transfer requests.

#### Acceptance Criteria

1. WHEN a Land Inspector logs in THEN the system SHALL display assigned cases for verification
2. WHEN an Inspector views a case THEN the system SHALL show all relevant property documents and details
3. WHEN an Inspector schedules a site visit THEN the system SHALL update the case status and notify relevant parties
4. WHEN an Inspector completes verification THEN the system SHALL allow submission of detailed inspection reports
5. WHEN an inspection report is submitted THEN the system SHALL store the report on IPFS and update case status
6. WHEN an Inspector submits a recommendation THEN the system SHALL forward it to Admin for final approval

### Requirement 5: Administrative Control and Certificate Issuance

**User Story:** As an Admin, I want to manage the entire land registry system and issue digital certificates, so that I can ensure proper governance and provide official documentation.

#### Acceptance Criteria

1. WHEN an Admin logs in THEN the system SHALL display a comprehensive dashboard with all pending cases
2. WHEN an Admin reviews a transfer request THEN the system SHALL show all documents, inspection reports, and recommendations
3. WHEN an Admin approves a transfer THEN the system SHALL execute the smart contract to update ownership
4. WHEN ownership is updated THEN the system SHALL automatically generate and issue a digital ownership certificate
5. WHEN an Admin rejects a transfer THEN the system SHALL update status and notify all parties with rejection reasons
6. WHEN an Admin views system analytics THEN the system SHALL display transaction history, user statistics, and blockchain ledger information

### Requirement 6: Blockchain Integration and Smart Contract Management

**User Story:** As a system, I want to maintain immutable records on the blockchain, so that land ownership data is tamper-proof and transparent.

#### Acceptance Criteria

1. WHEN any land transaction occurs THEN the system SHALL record it on the Ethereum blockchain
2. WHEN smart contracts are deployed THEN the system SHALL use Sepolia testnet for testing and mainnet for production
3. WHEN blockchain transactions are initiated THEN the system SHALL handle gas fee calculations and user confirmations
4. WHEN smart contract events are emitted THEN the system SHALL listen for and process these events
5. WHEN blockchain operations fail THEN the system SHALL provide clear error messages and retry mechanisms
6. WHEN querying blockchain data THEN the system SHALL provide real-time access to land ownership history

### Requirement 7: Document Storage and Retrieval

**User Story:** As a system, I want to store documents securely on IPFS, so that files are decentralized and accessible while maintaining blockchain references.

#### Acceptance Criteria

1. WHEN documents are uploaded THEN the system SHALL store them on IPFS network
2. WHEN IPFS storage is successful THEN the system SHALL return a unique hash for blockchain storage
3. WHEN documents need to be retrieved THEN the system SHALL fetch them from IPFS using stored hashes
4. WHEN IPFS operations fail THEN the system SHALL provide fallback mechanisms and error handling
5. WHEN large files are uploaded THEN the system SHALL handle chunking and reassembly automatically
6. WHEN documents are accessed THEN the system SHALL verify integrity using IPFS hash validation

### Requirement 8: Notification and Communication System

**User Story:** As a User, Inspector, or Admin, I want to receive notifications about case updates, so that I can stay informed about the progress of land transactions.

#### Acceptance Criteria

1. WHEN case status changes THEN the system SHALL send in-app notifications to relevant users
2. WHEN critical actions are required THEN the system SHALL highlight urgent notifications
3. WHEN Users opt-in THEN the system SHALL send email notifications for important updates
4. WHEN notifications are sent THEN the system SHALL maintain a notification history for each user
5. WHEN Users access notifications THEN the system SHALL mark them as read and provide action links
6. WHEN system events occur THEN the system SHALL log them for audit and communication purposes

### Requirement 9: Digital Certificate Generation and Management

**User Story:** As a User, I want to receive and download digital ownership certificates, so that I have official proof of land ownership that is verifiable on the blockchain.

#### Acceptance Criteria

1. WHEN ownership transfer is approved THEN the system SHALL automatically generate a digital certificate
2. WHEN certificates are generated THEN the system SHALL include blockchain transaction references and QR codes
3. WHEN Users download certificates THEN the system SHALL provide PDF format with embedded verification data
4. WHEN certificates are issued THEN the system SHALL store certificate metadata on blockchain for verification
5. WHEN certificate authenticity is questioned THEN the system SHALL provide blockchain-based verification tools
6. WHEN certificates are accessed THEN the system SHALL maintain download history and access logs