// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract DonationCore {

    struct NGO {
        uint id;
        string name;
        uint totalFund;
        bool verified;
        uint createdAt;
    }

    struct Donation {
        address donor;
        uint amount;
        uint ngoId;
        uint campaignId;
        uint timestamp;
        string message;
        bool isAnonymous;
    }

    struct RecurringDonation {
        address donor;
        uint ngoId;
        uint amount;
        uint interval;
        uint lastExecuted;
        bool active;
    }

    NGO[] public ngos;
    Donation[] public donations;
    RecurringDonation[] public recurringDonations;

    mapping(address => uint) public donorTotalDonations;
    mapping(address => bool) public anonymousDonors;

    address public owner;
    address public campaignManager;
    address public adminManager;

    event DonationReceived(address indexed donor, uint amount, uint ngoId, uint campaignId, uint timestamp, bool isAnonymous);
    event RecurringDonationCreated(uint indexed id, address donor, uint ngoId, uint amount, uint interval);
    event RecurringDonationExecuted(uint indexed id, address donor, uint amount);
    event RecurringDonationCancelled(uint indexed id);
    event NGOAdded(uint indexed ngoId, string name);
    event NGOVerified(uint indexed ngoId);
    event ManagersSet(address campaignMgr, address adminMgr);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || 
            msg.sender == campaignManager || 
            msg.sender == adminManager,
            "Not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        ngos.push(NGO(0, "HelpCare NGO", 0, true, block.timestamp));
        ngos.push(NGO(1, "Education NGO", 0, true, block.timestamp));
    }

    function setManagers(address _campaignManager, address _adminManager) external onlyOwner {
        campaignManager = _campaignManager;
        adminManager = _adminManager;
        emit ManagersSet(_campaignManager, _adminManager);
    }

    function donate(uint ngoId) public payable {
        _donate(msg.sender, ngoId, 0, "", false);
    }

    function donateWithMessage(uint ngoId, string memory message, bool anonymous) public payable {
        _donate(msg.sender, ngoId, 0, message, anonymous);
    }

    function donateForCampaign(
        address originalDonor,
        uint ngoId, 
        uint campaignId, 
        string memory message, 
        bool anonymous
    ) external payable {
        require(msg.sender == campaignManager, "Only campaign manager");
        _donate(originalDonor, ngoId, campaignId, message, anonymous);
    }

    function _donate(
        address donor,
        uint ngoId, 
        uint campaignId, 
        string memory message, 
        bool anonymous
    ) internal {
        require(msg.value > 0, "Amount must be > 0");
        require(ngoId < ngos.length, "Invalid NGO ID");
        
        donations.push(Donation(
            donor,
            msg.value,
            ngoId,
            campaignId,
            block.timestamp,
            message,
            anonymous
        ));
        
        ngos[ngoId].totalFund += msg.value;
        donorTotalDonations[donor] += msg.value;
        
        if (anonymous) {
            anonymousDonors[donor] = true;
        }
        
        emit DonationReceived(donor, msg.value, ngoId, campaignId, block.timestamp, anonymous);
    }

    function createRecurringDonation(uint ngoId, uint amount, uint interval) public {
        require(ngoId < ngos.length, "Invalid NGO ID");
        require(amount > 0, "Amount must be > 0");
        require(interval >= 1 days, "Interval must be >= 1 day");
        
        recurringDonations.push(RecurringDonation(
            msg.sender,
            ngoId,
            amount,
            interval,
            0,
            true
        ));
        
        emit RecurringDonationCreated(recurringDonations.length - 1, msg.sender, ngoId, amount, interval);
    }

    function executeRecurringDonation(uint recurringId) public payable {
        require(recurringId < recurringDonations.length, "Invalid ID");
        RecurringDonation storage rd = recurringDonations[recurringId];
        
        require(rd.active, "Not active");
        require(msg.sender == rd.donor, "Only donor");
        require(block.timestamp >= rd.lastExecuted + rd.interval, "Too early");
        require(msg.value == rd.amount, "Incorrect amount");
        
        rd.lastExecuted = block.timestamp;
        
        donations.push(Donation(
            rd.donor,
            rd.amount,
            rd.ngoId,
            0,
            block.timestamp,
            "Recurring donation",
            false
        ));
        
        ngos[rd.ngoId].totalFund += rd.amount;
        donorTotalDonations[rd.donor] += rd.amount;
        
        emit RecurringDonationExecuted(recurringId, rd.donor, rd.amount);
    }

    function cancelRecurringDonation(uint recurringId) public {
        require(recurringId < recurringDonations.length, "Invalid ID");
        RecurringDonation storage rd = recurringDonations[recurringId];
        require(msg.sender == rd.donor, "Only donor");
        
        rd.active = false;
        emit RecurringDonationCancelled(recurringId);
    }

    function addNGO(string memory name) public onlyOwner {
        ngos.push(NGO(ngos.length, name, 0, false, block.timestamp));
        emit NGOAdded(ngos.length - 1, name);
    }

    function verifyNGO(uint ngoId) public onlyOwner {
        require(ngoId < ngos.length, "Invalid NGO ID");
        ngos[ngoId].verified = true;
        emit NGOVerified(ngoId);
    }

    function deductFund(uint ngoId, uint amount) external onlyAuthorized {
        require(ngoId < ngos.length, "Invalid NGO ID");
        require(ngos[ngoId].totalFund >= amount, "Insufficient fund");
        ngos[ngoId].totalFund -= amount;
    }

    function addFund(uint ngoId, uint amount) external onlyAuthorized {
        require(ngoId < ngos.length, "Invalid NGO ID");
        ngos[ngoId].totalFund += amount;
    }

    function transferToAdmin(address to, uint amount) external {
        require(msg.sender == adminManager, "Only admin manager");
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function refundDonor(address donor, uint amount) external {
        require(msg.sender == campaignManager, "Only campaign manager");
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(donor).call{value: amount}("");
        require(success, "Refund failed");
    }

    function getDonationsCount() public view returns(uint) {
        return donations.length;
    }

    function getNGOFund(uint ngoId) public view returns(uint) {
        require(ngoId < ngos.length, "Invalid NGO ID");
        return ngos[ngoId].totalFund;
    }
    
    function getNGOCount() public view returns(uint) {
        return ngos.length;
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function getRecurringDonationsCount() public view returns(uint) {
        return recurringDonations.length;
    }

    function getDonorTotal(address donor) public view returns(uint) {
        return donorTotalDonations[donor];
    }

    function getTotalDonations() public view returns(uint) {
        uint total = 0;
        for(uint i = 0; i < donations.length; i++) {
            total += donations[i].amount;
        }
        return total;
    }

    function getDonationsByDonor(address donor) public view returns(uint[] memory) {
        uint count = 0;
        for(uint i = 0; i < donations.length; i++) {
            if(donations[i].donor == donor) {
                count++;
            }
        }
        
        uint[] memory indices = new uint[](count);
        uint j = 0;
        for(uint i = 0; i < donations.length; i++) {
            if(donations[i].donor == donor) {
                indices[j] = i;
                j++;
            }
        }
        return indices;
    }

    receive() external payable {
        if (msg.sender != campaignManager) {
            revert("Use donate function");
        }
    }
}