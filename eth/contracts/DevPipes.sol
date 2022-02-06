// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;


// This is the main building block for smart contracts.
contract DevPipes {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    string public name;
    string public symbol;
    uint256 public balance;
    uint256 public numProjects;
    uint256 public numSubProjects;
    uint256 public numApplications;
    uint256 public numPayments;

    struct Payment {
        uint256 id;
        address user;
        uint256 amount;
        uint8 status;
    }

    struct Project {
        uint256 id;
        uint256 parentId;
        address creator;
        string name;
        string description;
        string uri;
        string tags;
        uint256 dueDate;
        uint256 budget;
        uint8 status;
    }

    struct Application {
        uint256 id;
        address applicant;
        uint256 projectID;
        string details1;
        string details2;
        bool accepted;
        uint8 status;
    }

    // An address type variable is used to store ethereum accounts.
    address public owner;

    Project[] projects;
    Application[] applications;
    Payment[] royalties;
    mapping(address => Project[]) userProjects;
    mapping(uint256 => Project[]) subProjects;
    mapping(uint256 => Payment[]) projectRoyalties;
    mapping(uint256 => Application[]) projectApplications;

    function init() public {
        owner = msg.sender;
        name = "Dev Pipes";
        symbol = "PIPES";
        balance = 0;
        numProjects = 0;
        numSubProjects = 0;
        numApplications = 0;
        numPayments = 0;
    }

    function createProject(string memory projectName, string memory description, string memory uri, 
                           string memory tags, uint256 dueDate, uint256 budget) public {

        Project memory project = Project(
            numProjects, 0, msg.sender, projectName, description, uri, tags, dueDate, budget, 0 
        );

        projects.push(project);
        userProjects[msg.sender].push(project);

        numProjects++;
    }

    function createSubProject(uint256 parentId, string memory projectName, string memory description, string memory uri, 
                              string memory tags, uint256 dueDate, uint256 budget) public {

        Project memory project = Project(
            numProjects, parentId, msg.sender, projectName, description, uri, tags, dueDate, budget, 0
        );

        projects.push(project);
        subProjects[parentId].push(project);
        userProjects[msg.sender].push(project);

        numProjects++;
    }

    function applyForProject(address applicant, uint256 projectId, string memory details1, string memory details2) public {
        require(projectId <= numProjects, "error_project_does_not_exist");
        Project memory details = projects[projectId];
        uint256 blockTS = block.timestamp * 1000;
        require(blockTS < details.dueDate, "error_project_expired");
        require(details.status > 0, "");

        Application memory application = Application(
            numApplications, applicant, projectId, details1, details2, false, 0
        );

        applications.push(application);
        projectApplications[projectId].push(application);
        numApplications++;
    }

    function withdrawApplication(uint256 applicationId) public {
        Application storage application = applications[applicationId];
        require(application.applicant == msg.sender, "error_only_application_creator_can_edit");
        application.status = 1;
    }

    function addRoyalty(uint256 projectId, address user, uint256 amount) public {
        require(projectId <= numProjects, "error_project_does_not_exist");
        Project memory proj = projects[projectId];

        require(proj.creator == msg.sender, "error_only_project_creator_can_edit");

        uint256 total = this.getRoyaltiesTotal(projectId);

        require(total + amount <= proj.budget, "error_royalties_exceed_total_available");

        Payment memory payment = Payment(numPayments, user, amount, 0);

        royalties.push(payment);
        projectRoyalties[projectId].push(payment);

        numPayments++;
    }

    function publish(uint256 projectId) public {
        require(projectId <= numProjects, "error_project_does_not_exist");
        Project storage proj = projects[projectId];
        require(proj.creator == msg.sender, "error_only_project_creator_can_edit");
        proj.status = 1;
        for(uint256 i = 0; i < userProjects[msg.sender].length; i++) {
            Project storage userProject = userProjects[msg.sender][i];
            if(userProject.id == projectId) {
                userProject.status = 1;
                break;
            }
        }
    } 

    function getRoyaltiesTotal(uint256 projectId) public view returns(uint256) {
        uint256 total = 0;

        for(uint256 i = 0; i < projectRoyalties[projectId].length; i++) {
            total += projectRoyalties[projectId][i].amount;
        }

        return total;
    }

    function getProjectsForUser(address user) external view returns(Project[] memory) {
        return userProjects[user];
    }
}