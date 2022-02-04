// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;


// This is the main building block for smart contracts.
contract DevPipes {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    string public name = "Dev Pipes";
    string public symbol = "PIPES";
    uint256 public balance = 0;
    uint256 internal numProjects = 1;

    struct Payment {
        address user;
        uint256 amount;
        Project parent;
    }

    struct Project {
        uint256 id;
        uint256 parentID;
        address creator;
        string name;
        string description;
        string uri;
        uint256 dueDate;
        uint256 payment;
    }

    struct Application {
        address applicant;
        int256 projectID;
        bool accepted;
    }

    // An address type variable is used to store ethereum accounts.
    address public owner;

    Project[] projects;
    mapping(address => Project[]) userProjects;
    mapping(uint256 => Payment[]) royalties;
    mapping(uint256 => Project[]) subProjects;

    constructor() {
        // The totalSupply is assigned to transaction sender, which is the account
        // that is deploying the contract.
        owner = msg.sender;
    }

    function createProject(string memory projectName, string memory description, string memory uri, 
                           uint256 dueDate, uint256 payment) public {

        Project memory project = Project(
            numProjects, 0, msg.sender, projectName, description, uri, dueDate, payment
        );

        projects.push(project);
        userProjects[msg.sender].push(project);
    }

    function getProjectsForUser(address user) external view returns(Project[] memory) {
        return userProjects[user];
    }
}