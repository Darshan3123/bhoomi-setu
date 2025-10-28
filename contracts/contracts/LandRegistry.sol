// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LandRegistry
 * @dev Main contract for land registration and transfer management
 */
contract LandRegistry is AccessControl, ReentrancyGuard, Pausable {
    
    constructor() AccessControl() {
        // Constructor explicitly calls parent constructor
    }
    // Property status enum
    enum PropertyStatus {
        Pending, // Newly registered, awaiting verification
        Verified, // Verified by admin/inspector, can be marked for sale
        ForSale, // Available for purchase
        Sold // Sold and transfer completed
    }

    struct LandRecord {
        uint256 landId;
        address currentOwner;
        string ipfsHash;
        uint256 registrationDate;
        bool isActive;
        string location;
        uint256 area;
        string surveyNumber;
        PropertyStatus status; // New field for property status
        uint256 priceInWei; // Property price in Wei
        uint256 lastPriceUpdate; // Timestamp of last price update
    }

    struct TransferRequest {
        uint256 requestId;
        uint256 landId;
        address from;
        address to;
        address inspector;
        TransferStatus status;
        string documentsHash;
        string inspectionReportHash;
        uint256 requestDate;
        string rejectionReason;
    }

    enum TransferStatus {
        Pending,
        InspectionScheduled,
        Inspected,
        Approved,
        Rejected,
        Completed
    }

    // State variables
    uint256 private nextLandId = 1;
    uint256 private nextRequestId = 1;

    mapping(uint256 => LandRecord) public landRecords;
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(address => uint256[]) public ownerLands;
    mapping(address => uint256[]) public inspectorCases;

    // Events
    event LandRegistered(
        uint256 indexed landId,
        address indexed owner,
        string ipfsHash,
        string location
    );

    event TransferRequested(
        uint256 indexed requestId,
        uint256 indexed landId,
        address indexed from,
        address to
    );

    event InspectorAssigned(
        uint256 indexed requestId,
        address indexed inspector
    );

    event InspectionReportSubmitted(
        uint256 indexed requestId,
        string reportHash
    );

    event TransferApproved(
        uint256 indexed requestId,
        uint256 indexed landId,
        address indexed newOwner
    );

    event TransferRejected(uint256 indexed requestId, string reason);

    event CertificateIssued(uint256 indexed landId, string certificateHash);

    // New events for property status system
    event PropertyVerified(uint256 indexed landId, address indexed verifier);

    event PropertyForSale(uint256 indexed landId, address indexed owner);

    event PropertyPriceSet(
        uint256 indexed landId,
        address indexed owner,
        uint256 priceInWei
    );

    event PropertyPriceUpdated(
        uint256 indexed landId,
        address indexed owner,
        uint256 oldPrice,
        uint256 newPrice
    );

    /**
     * @dev Register new land
     */
    function registerLand(
        string memory ipfsHash,
        string memory location,
        uint256 area,
        string memory surveyNumber,
        uint256 priceInWei
    ) external onlyRegistered whenNotPaused returns (uint256) {
        uint256 landId = nextLandId++;

        landRecords[landId] = LandRecord({
            landId: landId,
            currentOwner: msg.sender,
            ipfsHash: ipfsHash,
            registrationDate: block.timestamp,
            isActive: true,
            location: location,
            area: area,
            surveyNumber: surveyNumber,
            status: PropertyStatus.Pending, // Default status is Pending
            priceInWei: priceInWei,
            lastPriceUpdate: block.timestamp
        });

        ownerLands[msg.sender].push(landId);

        emit LandRegistered(landId, msg.sender, ipfsHash, location);

        if (priceInWei > 0) {
            emit PropertyPriceSet(landId, msg.sender, priceInWei);
        }

        return landId;
    }

    /**
     * @dev Request land transfer
     */
    function requestTransfer(
        uint256 landId,
        address to,
        string memory documentsHash
    ) external onlyRegistered whenNotPaused returns (uint256) {
        require(landRecords[landId].isActive, "Land not active");
        require(
            landRecords[landId].currentOwner == msg.sender,
            "Not land owner"
        );
        require(to != msg.sender, "Cannot transfer to self");
        require(isRegistered[to], "Recipient not registered");
        require(
            landRecords[landId].status == PropertyStatus.ForSale,
            "Property must be marked for sale"
        );

        uint256 requestId = nextRequestId++;

        transferRequests[requestId] = TransferRequest({
            requestId: requestId,
            landId: landId,
            from: msg.sender,
            to: to,
            inspector: address(0),
            status: TransferStatus.Pending,
            documentsHash: documentsHash,
            inspectionReportHash: "",
            requestDate: block.timestamp,
            rejectionReason: ""
        });

        emit TransferRequested(requestId, landId, msg.sender, to);
        return requestId;
    }

    /**
     * @dev Assign inspector to transfer request (admin only)
     */
    function assignInspector(
        uint256 requestId,
        address inspector
    ) external onlyAdmin whenNotPaused {
        require(
            transferRequests[requestId].requestId != 0,
            "Request not found"
        );
        require(userRoles[inspector] == UserRole.Inspector, "Not an inspector");
        require(
            transferRequests[requestId].status == TransferStatus.Pending,
            "Invalid status"
        );

        transferRequests[requestId].inspector = inspector;
        transferRequests[requestId].status = TransferStatus.InspectionScheduled;

        inspectorCases[inspector].push(requestId);

        emit InspectorAssigned(requestId, inspector);
    }

    /**
     * @dev Submit inspection report (inspector only)
     */
    function submitInspectionReport(
        uint256 requestId,
        string memory reportHash
    ) external onlyInspector whenNotPaused {
        require(
            transferRequests[requestId].requestId != 0,
            "Request not found"
        );
        require(
            transferRequests[requestId].inspector == msg.sender,
            "Not assigned inspector"
        );
        require(
            transferRequests[requestId].status ==
                TransferStatus.InspectionScheduled,
            "Invalid status"
        );

        transferRequests[requestId].inspectionReportHash = reportHash;
        transferRequests[requestId].status = TransferStatus.Inspected;

        emit InspectionReportSubmitted(requestId, reportHash);
    }

    /**
     * @dev Approve transfer request (admin only)
     */
    function approveTransfer(
        uint256 requestId
    ) external onlyAdmin whenNotPaused nonReentrant {
        require(
            transferRequests[requestId].requestId != 0,
            "Request not found"
        );
        require(
            transferRequests[requestId].status == TransferStatus.Inspected,
            "Invalid status"
        );

        TransferRequest storage request = transferRequests[requestId];
        LandRecord storage land = landRecords[request.landId];

        // Remove land from current owner
        _removeLandFromOwner(land.currentOwner, request.landId);

        // Transfer ownership
        land.currentOwner = request.to;
        land.status = PropertyStatus.Sold; // Mark property as sold
        ownerLands[request.to].push(request.landId);

        request.status = TransferStatus.Approved;

        emit TransferApproved(requestId, request.landId, request.to);
    }

    /**
     * @dev Reject transfer request (admin only)
     */
    function rejectTransfer(
        uint256 requestId,
        string memory reason
    ) external onlyAdmin whenNotPaused {
        require(
            transferRequests[requestId].requestId != 0,
            "Request not found"
        );
        require(
            transferRequests[requestId].status == TransferStatus.Inspected,
            "Invalid status"
        );

        transferRequests[requestId].status = TransferStatus.Rejected;
        transferRequests[requestId].rejectionReason = reason;

        emit TransferRejected(requestId, reason);
    }

    /**
     * @dev Approve property for verification (admin or inspector only)
     */
    function approveProperty(uint256 landId) external whenNotPaused {
        require(
            userRoles[msg.sender] == UserRole.Admin ||
                userRoles[msg.sender] == UserRole.Inspector,
            "Only admin or inspector can approve"
        );
        require(landRecords[landId].landId != 0, "Land not found");
        require(landRecords[landId].isActive, "Land not active");
        require(
            landRecords[landId].status == PropertyStatus.Pending,
            "Property not in pending status"
        );

        landRecords[landId].status = PropertyStatus.Verified;

        emit PropertyVerified(landId, msg.sender);
    }

    /**
     * @dev Mark property for sale (owner only, property must be verified)
     */
    function markForSale(uint256 landId) external onlyRegistered whenNotPaused {
        require(landRecords[landId].landId != 0, "Land not found");
        require(landRecords[landId].isActive, "Land not active");
        require(
            landRecords[landId].currentOwner == msg.sender,
            "Not the owner"
        );
        require(
            landRecords[landId].status == PropertyStatus.Verified,
            "Property must be verified first"
        );

        landRecords[landId].status = PropertyStatus.ForSale;

        emit PropertyForSale(landId, msg.sender);
    }

    /**
     * @dev Issue digital certificate (admin only)
     */
    function issueCertificate(
        uint256 landId,
        string memory certificateHash
    ) external onlyAdmin whenNotPaused {
        require(landRecords[landId].isActive, "Land not active");

        emit CertificateIssued(landId, certificateHash);
    }

    /**
     * @dev Get land details
     */
    function getLandDetails(
        uint256 landId
    ) external view returns (LandRecord memory) {
        require(landRecords[landId].landId != 0, "Land not found");
        return landRecords[landId];
    }

    /**
     * @dev Get transfer request details
     */
    function getTransferRequest(
        uint256 requestId
    ) external view returns (TransferRequest memory) {
        require(
            transferRequests[requestId].requestId != 0,
            "Request not found"
        );
        return transferRequests[requestId];
    }

    /**
     * @dev Get lands owned by address
     */
    function getOwnerLands(
        address owner
    ) external view returns (uint256[] memory) {
        return ownerLands[owner];
    }

    /**
     * @dev Get cases assigned to inspector
     */
    function getInspectorCases(
        address inspector
    ) external view returns (uint256[] memory) {
        return inspectorCases[inspector];
    }

    /**
     * @dev Get property status
     */
    function getPropertyStatus(
        uint256 landId
    ) external view returns (PropertyStatus) {
        require(landRecords[landId].landId != 0, "Land not found");
        return landRecords[landId].status;
    }

    /**
     * @dev Check if property is available for sale
     */
    function isPropertyForSale(uint256 landId) external view returns (bool) {
        require(landRecords[landId].landId != 0, "Land not found");
        return
            landRecords[landId].status == PropertyStatus.ForSale &&
            landRecords[landId].isActive;
    }

    /**
     * @dev Get all properties with specific status
     */
    function getPropertiesByStatus(
        PropertyStatus status
    ) external view returns (uint256[] memory) {
        uint256 count = 0;

        // First pass: count properties with the specified status
        for (uint256 i = 1; i < nextLandId; i++) {
            if (landRecords[i].isActive && landRecords[i].status == status) {
                count++;
            }
        }

        // Second pass: populate the array
        uint256[] memory properties = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i < nextLandId; i++) {
            if (landRecords[i].isActive && landRecords[i].status == status) {
                properties[index] = i;
                index++;
            }
        }

        return properties;
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function setPropertyPrice(
        uint256 landId,
        uint256 priceInWei
    ) external onlyRegistered whenNotPaused {
        require(landRecords[landId].landId != 0, "Land not found");
        require(landRecords[landId].isActive, "Land not active");
        require(
            landRecords[landId].currentOwner == msg.sender,
            "Not the owner"
        );

        uint256 oldPrice = landRecords[landId].priceInWei;
        landRecords[landId].priceInWei = priceInWei;
        landRecords[landId].lastPriceUpdate = block.timestamp;

        if (oldPrice == 0) {
            emit PropertyPriceSet(landId, msg.sender, priceInWei);
        } else {
            emit PropertyPriceUpdated(landId, msg.sender, oldPrice, priceInWei);
        }
    }

    /**
     * @dev Get property price
     */
    function getPropertyPrice(uint256 landId) external view returns (uint256) {
        require(landRecords[landId].landId != 0, "Land not found");
        return landRecords[landId].priceInWei;
    }

    /**
     * @dev Get property price with last update timestamp
     */
    function getPropertyPriceWithTimestamp(
        uint256 landId
    ) external view returns (uint256 price, uint256 lastUpdate) {
        require(landRecords[landId].landId != 0, "Land not found");
        return (
            landRecords[landId].priceInWei,
            landRecords[landId].lastPriceUpdate
        );
    }

    /**
     * @dev Get properties within price range
     */
    function getPropertiesInPriceRange(
        uint256 minPrice,
        uint256 maxPrice
    ) external view returns (uint256[] memory) {
        uint256 count = 0;

        // First pass: count properties in price range
        for (uint256 i = 1; i < nextLandId; i++) {
            if (
                landRecords[i].isActive &&
                landRecords[i].priceInWei >= minPrice &&
                landRecords[i].priceInWei <= maxPrice &&
                landRecords[i].status == PropertyStatus.ForSale
            ) {
                count++;
            }
        }

        // Second pass: populate the array
        uint256[] memory properties = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i < nextLandId; i++) {
            if (
                landRecords[i].isActive &&
                landRecords[i].priceInWei >= minPrice &&
                landRecords[i].priceInWei <= maxPrice &&
                landRecords[i].status == PropertyStatus.ForSale
            ) {
                properties[index] = i;
                index++;
            }
        }

        return properties;
    }

    /**
     * @dev Get all properties for sale with prices
     */
    function getPropertiesForSale()
        external
        view
        returns (uint256[] memory landIds, uint256[] memory prices)
    {
        uint256 count = 0;

        // First pass: count properties for sale
        for (uint256 i = 1; i < nextLandId; i++) {
            if (
                landRecords[i].isActive &&
                landRecords[i].status == PropertyStatus.ForSale
            ) {
                count++;
            }
        }

        // Second pass: populate the arrays
        landIds = new uint256[](count);
        prices = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i < nextLandId; i++) {
            if (
                landRecords[i].isActive &&
                landRecords[i].status == PropertyStatus.ForSale
            ) {
                landIds[index] = i;
                prices[index] = landRecords[i].priceInWei;
                index++;
            }
        }

        return (landIds, prices);
    }

    // Property tax rate (in basis points, e.g., 200 = 2%)
    uint256 public propertyTaxRate = 200; // 2% tax
    address public taxCollector;

    /**
     * @dev Set property tax rate (admin only)
     */
    function setPropertyTaxRate(uint256 _taxRate) external onlyAdmin {
        require(_taxRate <= 1000, "Tax rate cannot exceed 10%"); // Max 10%
        propertyTaxRate = _taxRate;
    }

    /**
     * @dev Set tax collector address (admin only)
     */
    function setTaxCollector(address _taxCollector) external onlyAdmin {
        require(_taxCollector != address(0), "Invalid tax collector address");
        taxCollector = _taxCollector;
    }

    /**
     * @dev Calculate total cost including taxes
     */
    function calculateTotalCost(uint256 landId) external view returns (uint256 basePrice, uint256 taxAmount, uint256 totalCost) {
        require(landRecords[landId].landId != 0, "Land not found");
        
        basePrice = landRecords[landId].priceInWei;
        taxAmount = (basePrice * propertyTaxRate) / 10000; // Calculate tax
        totalCost = basePrice + taxAmount;
        
        return (basePrice, taxAmount, totalCost);
    }

    /**
     * @dev Purchase property directly with ETH (including taxes)
     */
    function purchaseProperty(uint256 landId) external payable onlyRegistered whenNotPaused nonReentrant {
        require(landRecords[landId].landId != 0, "Land not found");
        require(landRecords[landId].isActive, "Land not active");
        require(landRecords[landId].status == PropertyStatus.ForSale, "Property not for sale");
        require(landRecords[landId].currentOwner != msg.sender, "Cannot buy your own property");
        require(landRecords[landId].priceInWei > 0, "Price not set");

        address previousOwner = landRecords[landId].currentOwner;
        uint256 basePrice = landRecords[landId].priceInWei;
        uint256 taxAmount = (basePrice * propertyTaxRate) / 10000;
        uint256 totalCost = basePrice + taxAmount;

        require(msg.value == totalCost, "Incorrect payment amount (including taxes)");

        // Remove land from current owner
        _removeLandFromOwner(previousOwner, landId);

        // Transfer ownership
        landRecords[landId].currentOwner = msg.sender;
        landRecords[landId].status = PropertyStatus.Sold;
        landRecords[landId].priceInWei = 0; // Reset price after sale
        ownerLands[msg.sender].push(landId);

        // Transfer base price to previous owner
        (bool ownerSuccess, ) = payable(previousOwner).call{value: basePrice}("");
        require(ownerSuccess, "Payment to owner failed");

        // Transfer tax to tax collector (or contract owner if not set)
        address taxRecipient = taxCollector != address(0) ? taxCollector : owner();
        if (taxAmount > 0) {
            (bool taxSuccess, ) = payable(taxRecipient).call{value: taxAmount}("");
            require(taxSuccess, "Tax payment failed");
        }

        emit PropertyPurchased(landId, previousOwner, msg.sender, basePrice, taxAmount, totalCost);
    }

    // New event for direct purchases
    event PropertyPurchased(
        uint256 indexed landId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 basePrice,
        uint256 taxAmount,
        uint256 totalCost
    );

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @dev Remove land from owner's list
     */
    function _removeLandFromOwner(address owner, uint256 landId) private {
        uint256[] storage lands = ownerLands[owner];
        for (uint256 i = 0; i < lands.length; i++) {
            if (lands[i] == landId) {
                lands[i] = lands[lands.length - 1];
                lands.pop();
                break;
            }
        }
    }
}
