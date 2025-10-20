import { expect } from "chai";
import { ethers } from "hardhat";
import { LandRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LandRegistry", function () {
  let landRegistry: LandRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let inspector: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, inspector] = await ethers.getSigners();
    
    const LandRegistryFactory = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistryFactory.deploy();
    await landRegistry.waitForDeployment();

    // Register users
    await landRegistry.connect(user1).registerUser();
    await landRegistry.connect(user2).registerUser();
    await landRegistry.connect(inspector).registerUser();
    
    // Assign inspector role
    await landRegistry.connect(owner).assignRole(inspector.address, 1); // Inspector = 1
  });

  describe("Land Registration", function () {
    it("Should register new land", async function () {
      const ipfsHash = "QmTestHash123";
      const location = "Mumbai, Maharashtra";
      const area = 1000;
      const surveyNumber = "123/4A";

      await expect(
        landRegistry.connect(user1).registerLand(ipfsHash, location, area, surveyNumber)
      ).to.emit(landRegistry, "LandRegistered")
        .withArgs(1, user1.address, ipfsHash, location);

      const landDetails = await landRegistry.getLandDetails(1);
      expect(landDetails.currentOwner).to.equal(user1.address);
      expect(landDetails.ipfsHash).to.equal(ipfsHash);
      expect(landDetails.location).to.equal(location);
      expect(landDetails.area).to.equal(area);
      expect(landDetails.surveyNumber).to.equal(surveyNumber);
      expect(landDetails.isActive).to.be.true;
    });

    it("Should add land to owner's list", async function () {
      await landRegistry.connect(user1).registerLand("QmHash1", "Location1", 1000, "123/1");
      await landRegistry.connect(user1).registerLand("QmHash2", "Location2", 2000, "123/2");

      const ownerLands = await landRegistry.getOwnerLands(user1.address);
      expect(ownerLands.length).to.equal(2);
      expect(ownerLands[0]).to.equal(1);
      expect(ownerLands[1]).to.equal(2);
    });

    it("Should not allow unregistered users to register land", async function () {
      const [, , , , unregistered] = await ethers.getSigners();
      
      await expect(
        landRegistry.connect(unregistered).registerLand("QmHash", "Location", 1000, "123")
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Transfer Requests", function () {
    let landId: number;

    beforeEach(async function () {
      // Register a land first
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");
      landId = 1;
    });

    it("Should create transfer request", async function () {
      const documentsHash = "QmTransferDocs";

      await expect(
        landRegistry.connect(user1).requestTransfer(landId, user2.address, documentsHash)
      ).to.emit(landRegistry, "TransferRequested")
        .withArgs(1, landId, user1.address, user2.address);

      const request = await landRegistry.getTransferRequest(1);
      expect(request.landId).to.equal(landId);
      expect(request.from).to.equal(user1.address);
      expect(request.to).to.equal(user2.address);
      expect(request.documentsHash).to.equal(documentsHash);
      expect(request.status).to.equal(0); // Pending
    });

    it("Should not allow non-owner to request transfer", async function () {
      await expect(
        landRegistry.connect(user2).requestTransfer(landId, user1.address, "QmDocs")
      ).to.be.revertedWith("Not land owner");
    });

    it("Should not allow transfer to self", async function () {
      await expect(
        landRegistry.connect(user1).requestTransfer(landId, user1.address, "QmDocs")
      ).to.be.revertedWith("Cannot transfer to self");
    });

    it("Should not allow transfer to unregistered user", async function () {
      const [, , , , , unregistered] = await ethers.getSigners();
      
      await expect(
        landRegistry.connect(user1).requestTransfer(landId, unregistered.address, "QmDocs")
      ).to.be.revertedWith("Recipient not registered");
    });
  });

  describe("Inspector Assignment", function () {
    let requestId: number;

    beforeEach(async function () {
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");
      await landRegistry.connect(user1).requestTransfer(1, user2.address, "QmDocs");
      requestId = 1;
    });

    it("Should allow admin to assign inspector", async function () {
      await expect(
        landRegistry.connect(owner).assignInspector(requestId, inspector.address)
      ).to.emit(landRegistry, "InspectorAssigned")
        .withArgs(requestId, inspector.address);

      const request = await landRegistry.getTransferRequest(requestId);
      expect(request.inspector).to.equal(inspector.address);
      expect(request.status).to.equal(1); // InspectionScheduled

      const inspectorCases = await landRegistry.getInspectorCases(inspector.address);
      expect(inspectorCases.length).to.equal(1);
      expect(inspectorCases[0]).to.equal(requestId);
    });

    it("Should not allow non-admin to assign inspector", async function () {
      await expect(
        landRegistry.connect(user1).assignInspector(requestId, inspector.address)
      ).to.be.revertedWith("Admin access required");
    });

    it("Should not assign non-inspector as inspector", async function () {
      await expect(
        landRegistry.connect(owner).assignInspector(requestId, user1.address)
      ).to.be.revertedWith("Not an inspector");
    });
  });

  describe("Inspection Reports", function () {
    let requestId: number;

    beforeEach(async function () {
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");
      await landRegistry.connect(user1).requestTransfer(1, user2.address, "QmDocs");
      await landRegistry.connect(owner).assignInspector(1, inspector.address);
      requestId = 1;
    });

    it("Should allow assigned inspector to submit report", async function () {
      const reportHash = "QmInspectionReport";

      await expect(
        landRegistry.connect(inspector).submitInspectionReport(requestId, reportHash)
      ).to.emit(landRegistry, "InspectionReportSubmitted")
        .withArgs(requestId, reportHash);

      const request = await landRegistry.getTransferRequest(requestId);
      expect(request.inspectionReportHash).to.equal(reportHash);
      expect(request.status).to.equal(2); // Inspected
    });

    it("Should not allow non-assigned inspector to submit report", async function () {
      // Create another inspector
      const [, , , , anotherInspector] = await ethers.getSigners();
      await landRegistry.connect(anotherInspector).registerUser();
      await landRegistry.connect(owner).assignRole(anotherInspector.address, 1);

      await expect(
        landRegistry.connect(anotherInspector).submitInspectionReport(requestId, "QmReport")
      ).to.be.revertedWith("Not assigned inspector");
    });
  });

  describe("Transfer Approval", function () {
    let requestId: number;
    let landId: number;

    beforeEach(async function () {
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");
      await landRegistry.connect(user1).requestTransfer(1, user2.address, "QmDocs");
      await landRegistry.connect(owner).assignInspector(1, inspector.address);
      await landRegistry.connect(inspector).submitInspectionReport(1, "QmReport");
      requestId = 1;
      landId = 1;
    });

    it("Should allow admin to approve transfer", async function () {
      await expect(
        landRegistry.connect(owner).approveTransfer(requestId)
      ).to.emit(landRegistry, "TransferApproved")
        .withArgs(requestId, landId, user2.address);

      const request = await landRegistry.getTransferRequest(requestId);
      expect(request.status).to.equal(3); // Approved

      const landDetails = await landRegistry.getLandDetails(landId);
      expect(landDetails.currentOwner).to.equal(user2.address);

      // Check ownership lists
      const user1Lands = await landRegistry.getOwnerLands(user1.address);
      const user2Lands = await landRegistry.getOwnerLands(user2.address);
      
      expect(user1Lands.length).to.equal(0);
      expect(user2Lands.length).to.equal(1);
      expect(user2Lands[0]).to.equal(landId);
    });

    it("Should allow admin to reject transfer", async function () {
      const reason = "Invalid documents";

      await expect(
        landRegistry.connect(owner).rejectTransfer(requestId, reason)
      ).to.emit(landRegistry, "TransferRejected")
        .withArgs(requestId, reason);

      const request = await landRegistry.getTransferRequest(requestId);
      expect(request.status).to.equal(4); // Rejected
      expect(request.rejectionReason).to.equal(reason);

      // Land should remain with original owner
      const landDetails = await landRegistry.getLandDetails(landId);
      expect(landDetails.currentOwner).to.equal(user1.address);
    });

    it("Should not allow non-admin to approve transfer", async function () {
      await expect(
        landRegistry.connect(user1).approveTransfer(requestId)
      ).to.be.revertedWith("Admin access required");
    });
  });

  describe("Certificate Issuance", function () {
    it("Should allow admin to issue certificate", async function () {
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");
      const certificateHash = "QmCertificate";

      await expect(
        landRegistry.connect(owner).issueCertificate(1, certificateHash)
      ).to.emit(landRegistry, "CertificateIssued")
        .withArgs(1, certificateHash);
    });

    it("Should not allow non-admin to issue certificate", async function () {
      await landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123");

      await expect(
        landRegistry.connect(user1).issueCertificate(1, "QmCert")
      ).to.be.revertedWith("Admin access required");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause and unpause", async function () {
      await landRegistry.connect(owner).pause();
      
      await expect(
        landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123")
      ).to.be.revertedWithCustomError(landRegistry, "EnforcedPause");

      await landRegistry.connect(owner).unpause();
      
      await expect(
        landRegistry.connect(user1).registerLand("QmHash", "Location", 1000, "123")
      ).to.not.be.reverted;
    });
  });
});