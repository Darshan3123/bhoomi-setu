import { expect } from "chai";
import { ethers } from "hardhat";
import { AccessControl } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AccessControl", function () {
  let accessControl: AccessControl;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let inspector: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, inspector] = await ethers.getSigners();
    
    const AccessControlFactory = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControlFactory.deploy();
    await accessControl.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await accessControl.userRoles(owner.address)).to.equal(2); // Admin = 2
      expect(await accessControl.isRegistered(owner.address)).to.be.true;
    });
  });

  describe("User Registration", function () {
    it("Should allow new users to register", async function () {
      await accessControl.connect(user1).registerUser();
      
      expect(await accessControl.isRegistered(user1.address)).to.be.true;
      expect(await accessControl.userRoles(user1.address)).to.equal(0); // User = 0
    });

    it("Should not allow double registration", async function () {
      await accessControl.connect(user1).registerUser();
      
      await expect(
        accessControl.connect(user1).registerUser()
      ).to.be.revertedWith("User already registered");
    });

    it("Should emit events on registration", async function () {
      await expect(accessControl.connect(user1).registerUser())
        .to.emit(accessControl, "UserRegistered")
        .withArgs(user1.address)
        .and.to.emit(accessControl, "RoleAssigned")
        .withArgs(user1.address, 0);
    });
  });

  describe("Role Management", function () {
    beforeEach(async function () {
      await accessControl.connect(user1).registerUser();
    });

    it("Should allow admin to assign roles", async function () {
      await accessControl.connect(owner).assignRole(user1.address, 1); // Inspector = 1
      
      expect(await accessControl.userRoles(user1.address)).to.equal(1);
    });

    it("Should not allow non-admin to assign roles", async function () {
      await expect(
        accessControl.connect(user1).assignRole(user2.address, 1)
      ).to.be.revertedWith("Admin access required");
    });

    it("Should not allow role assignment to unregistered users", async function () {
      await expect(
        accessControl.connect(owner).assignRole(user2.address, 1)
      ).to.be.revertedWith("User not registered");
    });

    it("Should emit RoleAssigned event", async function () {
      await expect(accessControl.connect(owner).assignRole(user1.address, 1))
        .to.emit(accessControl, "RoleAssigned")
        .withArgs(user1.address, 1);
    });
  });

  describe("Role Checking", function () {
    beforeEach(async function () {
      await accessControl.connect(user1).registerUser();
      await accessControl.connect(inspector).registerUser();
      await accessControl.connect(owner).assignRole(inspector.address, 1); // Inspector
    });

    it("Should return correct user role", async function () {
      expect(await accessControl.getUserRole(user1.address)).to.equal(0); // User
      expect(await accessControl.getUserRole(inspector.address)).to.equal(1); // Inspector
      expect(await accessControl.getUserRole(owner.address)).to.equal(2); // Admin
    });

    it("Should check role correctly", async function () {
      expect(await accessControl.hasRole(user1.address, 0)).to.be.true; // User
      expect(await accessControl.hasRole(inspector.address, 1)).to.be.true; // Inspector
      expect(await accessControl.hasRole(owner.address, 2)).to.be.true; // Admin
      
      expect(await accessControl.hasRole(user1.address, 1)).to.be.false;
    });
  });

  describe("Access Control Modifiers", function () {
    beforeEach(async function () {
      await accessControl.connect(user1).registerUser();
    });

    it("Should enforce admin-only access", async function () {
      await expect(
        accessControl.connect(user1).assignRole(user1.address, 1)
      ).to.be.revertedWith("Admin access required");
    });

    it("Should allow admin access", async function () {
      await expect(
        accessControl.connect(owner).assignRole(user1.address, 1)
      ).to.not.be.reverted;
    });
  });
});