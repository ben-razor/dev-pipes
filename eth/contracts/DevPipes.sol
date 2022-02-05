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
    uint256 internal numProjects = 0;

    struct Payment {
        address user;
        uint256 amount;
    }

    struct Project {
        uint256 id;
        uint256 parentID;
        address creator;
        string name;
        string description;
        string uri;
        uint256 dueDate;
        uint256 budget;
        bool published;
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
            numProjects, 0, msg.sender, projectName, description, uri, dueDate, payment, false
        );

        projects.push(project);
        userProjects[msg.sender].push(project);

        numProjects++;
    }

    function addRoyalty(uint256 projectId, address user, uint256 amount) public {
        Project memory proj = projects[projectId];

        require(proj.creator == msg.sender, "error_only_project_creator_can_edit");
        require(!proj.published, "error_project_cannot_be_modified_after_publication");

        uint256 total = this.getRoyaltiesTotal(projectId);

        require(total + amount <= proj.payment, "error_royalties_exceed_total_available");

        Payment memory payment = Payment(user, amount);

        royalties[projectId].push(payment);
    }

    function publish(uint256 projectId) public {
        Project storage proj = projects[projectId];
        require(proj.creator == msg.sender, "error_only_project_creator_can_edit");
        proj.published = true;
    } 

    function getRoyaltiesTotal(uint256 projectId) public view returns(uint256) {
        uint256 total = 0;

        for(uint256 i = 0; i < royalties[projectId].length; i++) {
            total += royalties[projectId][i].amount;
        }

        return total;
    }

    function getProjectsForUser(address user) external view returns(Project[] memory) {
        return userProjects[user];
    }
}