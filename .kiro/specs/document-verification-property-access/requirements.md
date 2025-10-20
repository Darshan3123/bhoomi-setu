# Requirements Document

## Introduction

The Document Verification and Property Access Control feature enhances the existing Bhoomi Setu blockchain land registry system by implementing a mandatory document verification workflow. This feature ensures that users can only add properties to the system after uploading required identity documents (Address Proof and PAN Card) and receiving admin approval. This adds an additional layer of security and compliance to the property registration process, ensuring only verified users can participate in land transactions.

## Requirements

### Requirement 1: Document Upload and Storage

**User Story:** As a User, I want to upload my Address Proof and PAN Card documents, so that I can get verified to add properties to the system.

#### Acceptance Criteria

1. WHEN a User attempts to add a property THEN the system SHALL check if required documents are uploaded and approved
2. WHEN a User accesses the document upload section THEN the system SHALL provide separate upload fields for Address Proof and PAN Card
3. WHEN a User uploads documents THEN the system SHALL validate file types (PDF, JPG, PNG) and size limits (max 5MB per file)
4. WHEN documents are successfully uploaded THEN the system SHALL store them on IPFS and save the hash references in the database
5. WHEN document upload fails THEN the system SHALL display specific error messages and allow retry
6. WHEN documents are uploaded THEN the system SHALL set the user's verification status to "Pending Admin Approval"

### Requirement 2: Admin Document Review and Approval

**User Story:** As an Admin, I want to review and approve user-submitted documents, so that I can ensure only verified users can add properties to the system.

#### Acceptance Criteria

1. WHEN an Admin logs in THEN the system SHALL display a list of users with pending document verification
2. WHEN an Admin views a user's documents THEN the system SHALL display both Address Proof and PAN Card with download options
3. WHEN an Admin approves documents THEN the system SHALL update the user's verification status to "Approved" and enable property addition
4. WHEN an Admin rejects documents THEN the system SHALL update status to "Rejected" and require reason for rejection
5. WHEN document status changes THEN the system SHALL notify the user via in-app notification
6. WHEN an Admin views the verification queue THEN the system SHALL show submission date, user details, and current status

### Requirement 3: Property Addition Access Control

**User Story:** As a User, I want to be able to add properties only after my documents are approved, so that the system maintains verification integrity.

#### Acceptance Criteria

1. WHEN a User with unverified documents attempts to add property THEN the system SHALL block the action and display verification requirements
2. WHEN a User with pending verification attempts to add property THEN the system SHALL show "Verification in Progress" message
3. WHEN a User with rejected documents attempts to add property THEN the system SHALL prompt to re-upload corrected documents
4. WHEN a User with approved documents accesses property addition THEN the system SHALL allow full access to property registration features
5. WHEN verification status changes THEN the system SHALL update UI elements to reflect current access permissions
6. WHEN a verified User adds a property THEN the system SHALL proceed with the existing property registration workflow

### Requirement 4: Document Re-submission and Updates

**User Story:** As a User with rejected documents, I want to re-upload corrected documents, so that I can complete the verification process.

#### Acceptance Criteria

1. WHEN a User's documents are rejected THEN the system SHALL allow re-upload of new documents
2. WHEN a User re-uploads documents THEN the system SHALL reset verification status to "Pending Admin Approval"
3. WHEN documents are re-submitted THEN the system SHALL maintain a history of previous submissions and rejection reasons
4. WHEN an Admin reviews re-submitted documents THEN the system SHALL show previous rejection reasons for context
5. WHEN a User views their verification status THEN the system SHALL display current status and any rejection reasons
6. WHEN multiple re-submissions occur THEN the system SHALL track submission attempts and dates

### Requirement 5: Verification Status Dashboard

**User Story:** As a User, I want to view my document verification status and progress, so that I know when I can start adding properties.

#### Acceptance Criteria

1. WHEN a User accesses their dashboard THEN the system SHALL display current verification status prominently
2. WHEN verification is pending THEN the system SHALL show estimated review time and current queue position
3. WHEN documents are approved THEN the system SHALL display approval date and enable property addition features
4. WHEN documents are rejected THEN the system SHALL show rejection reasons and re-upload options
5. WHEN a User has not uploaded documents THEN the system SHALL show clear instructions and upload buttons
6. WHEN verification status updates THEN the system SHALL show real-time status changes without page refresh

### Requirement 6: Admin Verification Management

**User Story:** As an Admin, I want to efficiently manage the document verification queue, so that I can process user verifications in a timely manner.

#### Acceptance Criteria

1. WHEN an Admin accesses the verification dashboard THEN the system SHALL show pending verifications sorted by submission date
2. WHEN an Admin processes a verification THEN the system SHALL provide quick approve/reject actions with reason fields
3. WHEN an Admin approves documents THEN the system SHALL automatically send approval notification to the user
4. WHEN an Admin rejects documents THEN the system SHALL require a detailed rejection reason
5. WHEN an Admin views verification statistics THEN the system SHALL show daily/weekly processing metrics
6. WHEN multiple Admins are processing verifications THEN the system SHALL prevent duplicate processing of the same user

### Requirement 7: Notification and Communication System

**User Story:** As a User or Admin, I want to receive notifications about verification status changes, so that I stay informed about the process.

#### Acceptance Criteria

1. WHEN a User uploads documents THEN the system SHALL send confirmation notification with expected review time
2. WHEN an Admin approves documents THEN the system SHALL notify the user immediately with property addition instructions
3. WHEN an Admin rejects documents THEN the system SHALL notify the user with specific rejection reasons and re-upload guidance
4. WHEN verification queue grows beyond threshold THEN the system SHALL notify Admins about pending reviews
5. WHEN a User's verification expires (if applicable) THEN the system SHALL notify about renewal requirements
6. WHEN system maintenance affects verification process THEN the system SHALL notify all relevant users

### Requirement 8: Integration with Existing Property System

**User Story:** As a system, I want to seamlessly integrate document verification with the existing property registration workflow, so that verified users can access all property features.

#### Acceptance Criteria

1. WHEN a verified User accesses property features THEN the system SHALL integrate smoothly with existing land registration workflow
2. WHEN property registration is initiated THEN the system SHALL verify user's document approval status before proceeding
3. WHEN a User's verification status changes THEN the system SHALL update all property-related UI components accordingly
4. WHEN property transfer is requested THEN the system SHALL ensure both parties have approved document verification
5. WHEN certificates are issued THEN the system SHALL include verification status in the certificate metadata
6. WHEN system generates reports THEN the system SHALL include document verification statistics and compliance metrics