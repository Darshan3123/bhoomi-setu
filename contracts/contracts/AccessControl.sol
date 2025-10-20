// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccessControl
 * @dev Manages role-based access control for the land registry system
 */
contract AccessControl is Ownable {
    enum UserRole {
        User,
        Inspector,
        Admin
    }

    mapping(address => UserRole) public userRoles;
    mapping(address => bool) public isRegistered;

    event RoleAssigned(address indexed user, UserRole role);
    event UserRegistered(address indexed user);

    constructor() Ownable(msg.sender) {
        // Set deployer as admin
        userRoles[msg.sender] = UserRole.Admin;
        isRegistered[msg.sender] = true;
        emit RoleAssigned(msg.sender, UserRole.Admin);
        emit UserRegistered(msg.sender);
    }

    modifier onlyAdmin() {
        require(
            userRoles[msg.sender] == UserRole.Admin,
            "Admin access required"
        );
        _;
    }

    modifier onlyInspector() {
        require(
            userRoles[msg.sender] == UserRole.Inspector,
            "Inspector access required"
        );
        _;
    }

    modifier onlyUser() {
        require(userRoles[msg.sender] == UserRole.User, "User access required");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }

    modifier onlyAdminOrInspector() {
        require(
            userRoles[msg.sender] == UserRole.Admin ||
                userRoles[msg.sender] == UserRole.Inspector,
            "Admin or Inspector access required"
        );
        _;
    }

    /**
     * @dev Register a new user with default User role
     */
    function registerUser() external {
        require(!isRegistered[msg.sender], "User already registered");

        userRoles[msg.sender] = UserRole.User;
        isRegistered[msg.sender] = true;

        emit UserRegistered(msg.sender);
        emit RoleAssigned(msg.sender, UserRole.User);
    }

    /**
     * @dev Assign role to a user (only admin)
     */
    function assignRole(address user, UserRole role) external onlyAdmin {
        require(isRegistered[user], "User not registered");

        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    /**
     * @dev Get user role
     */
    function getUserRole(address user) external view returns (UserRole) {
        return userRoles[user];
    }

    /**
     * @dev Check if user has specific role
     */
    function hasRole(address user, UserRole role) external view returns (bool) {
        return userRoles[user] == role;
    }
}
