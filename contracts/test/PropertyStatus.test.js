const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Property Status System", function () {
  let landRegistry;
  let accessControl;
  let owner, admin, inspector, buyer;
  let landId;

  beforeEach(async function () {
    [admin, owner, inspector, buyer] = await ethers.getSigners();

    // Deploy LandRegistry contract (it inherits from AccessControl)
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.connect(admin).deploy();
    await landRegistry.waitForDeployment();

    // The deployer (admin) is automatically registered as admin
    // Register other users
    await landRegistry.connect(owner).registerUser(); // User
    await landRegistry.connect(inspector).registerUser(); // User initially
    await landRegistry.connect(buyer).registerUser(); // User

    // Assign inspector role
    await landRegistry.connect(admin).assignRole(inspector.address, 1); // Inspector role

    // Register a property
    const tx = await landRegistry.connect(owner).registerLand(
      "QmTestHash123",
      "Test Location",
      1000,
      "Survey123"
    );
    const receipt = await tx.wait();
    landId = 1; // First land ID
  });

  describe("Property Registration", function () {
    it("Should register property with Pending status", async function () {
      const land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(0); // PropertyStatus.Pending
    });

    it("Should emit LandRegistered event", async function () {
      await expect(
        landRegistry.connect(owner).registerLand(
          "QmTestHash456",
          "Another Location",
          2000,
          "Survey456"
        )
      ).to.emit(landRegistry, "LandRegistered");
    });
  });

  describe("Property Approval", function () {
    it("Should allow admin to approve property", async function () {
      await landRegistry.connect(admin).approveProperty(landId);
      
      const land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(1); // PropertyStatus.Verified
    });

    it("Should allow inspector to approve property", async function () {
      await landRegistry.connect(inspector).approveProperty(landId);
      
      const land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(1); // PropertyStatus.Verified
    });

    it("Should emit PropertyVerified event", async function () {
      await expect(
        landRegistry.connect(admin).approveProperty(landId)
      ).to.emit(landRegistry, "PropertyVerified")
       .withArgs(landId, admin.address);
    });

    it("Should reject approval from non-admin/non-inspector", async function () {
      await expect(
        landRegistry.connect(owner).approveProperty(landId)
      ).to.be.revertedWith("Only admin or inspector can approve");
    });

    it("Should reject approval of non-pending property", async function () {
      await landRegistry.connect(admin).approveProperty(landId);
      
      await expect(
        landRegistry.connect(admin).approveProperty(landId)
      ).to.be.revertedWith("Property not in pending status");
    });
  });

  describe("Mark For Sale", function () {
    beforeEach(async function () {
      // Approve property first
      await landRegistry.connect(admin).approveProperty(landId);
    });

    it("Should allow owner to mark verified property for sale", async function () {
      await landRegistry.connect(owner).markForSale(landId);
      
      const land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(2); // PropertyStatus.ForSale
    });

    it("Should emit PropertyForSale event", async function () {
      await expect(
        landRegistry.connect(owner).markForSale(landId)
      ).to.emit(landRegistry, "PropertyForSale")
       .withArgs(landId, owner.address);
    });

    it("Should reject marking by non-owner", async function () {
      await expect(
        landRegistry.connect(buyer).markForSale(landId)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should reject marking unverified property", async function () {
      // Register new property (will be Pending)
      await landRegistry.connect(owner).registerLand(
        "QmTestHash789",
        "New Location",
        1500,
        "Survey789"
      );
      
      await expect(
        landRegistry.connect(owner).markForSale(2) // landId 2
      ).to.be.revertedWith("Property must be verified first");
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should reject transfer of non-ForSale property", async function () {
      // Property is still Pending
      await expect(
        landRegistry.connect(owner).requestTransfer(landId, buyer.address, "QmDocsHash")
      ).to.be.revertedWith("Property must be marked for sale");
    });

    it("Should reject transfer of Verified but not ForSale property", async function () {
      await landRegistry.connect(admin).approveProperty(landId);
      
      await expect(
        landRegistry.connect(owner).requestTransfer(landId, buyer.address, "QmDocsHash")
      ).to.be.revertedWith("Property must be marked for sale");
    });

    it("Should allow transfer of ForSale property", async function () {
      await landRegistry.connect(admin).approveProperty(landId);
      await landRegistry.connect(owner).markForSale(landId);
      
      await expect(
        landRegistry.connect(owner).requestTransfer(landId, buyer.address, "QmDocsHash")
      ).to.emit(landRegistry, "TransferRequested");
    });
  });

  describe("Status Query Functions", function () {
    beforeEach(async function () {
      await landRegistry.connect(admin).approveProperty(landId);
      await landRegistry.connect(owner).markForSale(landId);
    });

    it("Should return correct property status", async function () {
      const status = await landRegistry.getPropertyStatus(landId);
      expect(status).to.equal(2); // PropertyStatus.ForSale
    });

    it("Should correctly identify ForSale properties", async function () {
      const isForSale = await landRegistry.isPropertyForSale(landId);
      expect(isForSale).to.be.true;
    });

    it("Should return properties by status", async function () {
      // Register another property and approve it
      await landRegistry.connect(owner).registerLand(
        "QmTestHash999",
        "Another Location",
        3000,
        "Survey999"
      );
      await landRegistry.connect(admin).approveProperty(2);
      
      const verifiedProperties = await landRegistry.getPropertiesByStatus(1); // Verified
      expect(verifiedProperties.length).to.equal(1);
      expect(verifiedProperties[0]).to.equal(2);
      
      const forSaleProperties = await landRegistry.getPropertiesByStatus(2); // ForSale
      expect(forSaleProperties.length).to.equal(1);
      expect(forSaleProperties[0]).to.equal(1);
    });
  });

  describe("Complete Transfer Workflow", function () {
    it("Should complete full property lifecycle", async function () {
      // 1. Property starts as Pending
      let land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(0); // Pending
      
      // 2. Admin approves property
      await landRegistry.connect(admin).approveProperty(landId);
      land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(1); // Verified
      
      // 3. Owner marks for sale
      await landRegistry.connect(owner).markForSale(landId);
      land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(2); // ForSale
      
      // 4. Transfer request
      const transferTx = await landRegistry.connect(owner).requestTransfer(
        landId, 
        buyer.address, 
        "QmDocsHash"
      );
      const transferReceipt = await transferTx.wait();
      const requestId = 1;
      
      // 5. Assign inspector
      await landRegistry.connect(admin).assignInspector(requestId, inspector.address);
      
      // 6. Submit inspection report
      await landRegistry.connect(inspector).submitInspectionReport(requestId, "QmReportHash");
      
      // 7. Approve transfer
      await landRegistry.connect(admin).approveTransfer(requestId);
      
      // 8. Property should now be Sold and owned by buyer
      land = await landRegistry.getLandDetails(landId);
      expect(land.status).to.equal(3); // Sold
      expect(land.currentOwner).to.equal(buyer.address);
    });
  });
});