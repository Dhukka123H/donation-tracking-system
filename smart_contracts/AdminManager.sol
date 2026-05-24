// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDonationCore {
    function getNGOCount() external view returns(uint);
    function getNGOFund(uint ngoId) external view returns(uint);
    function getBalance() external view returns(uint);
    function deductFund(uint ngoId, uint amount) external;
    function transferToAdmin(address to, uint amount) external;
}

contract AdminManager {

    struct WithdrawalRecord {
        uint amount;
        uint ngoId;
        string purpose;
        uint timestamp;
        address initiator;
        uint approvalCount;
        bool executed;
        uint unlockTime;
    }

    struct WithdrawalProposal {
        uint id;
        uint ngoId;
        uint amount;
        string purpose;
        address proposer;
        uint approvalCount;
        bool executed;
        bool cancelled;
        uint createdAt;
        uint unlockTime;
    }

    struct Usage {
        uint ngoId;
        string purpose;
        uint amount;
        uint timestamp;
    }

    WithdrawalRecord[] public withdrawals;
    Usage[] public usages;

    uint public proposalCount;
    mapping(uint => WithdrawalProposal) public proposals;
    mapping(uint => mapping(address => bool)) public proposalApprovals;
    
    mapping(address => bool) public approvers;
    address[] public approverList;
    uint public requiredApprovals;
    
    address public owner;
    IDonationCore public donationCore;
    
    uint public constant MIN_WITHDRAWAL = 0.0001 ether;
    uint public constant WITHDRAWAL_DELAY = 24 hours;
    uint public dailyWithdrawalLimit = 10 ether;
    uint public dailyWithdrawn;
    uint public lastWithdrawalDay;

    event WithdrawalProposed(uint indexed proposalId, uint ngoId, uint amount, string purpose, address proposer);
    event WithdrawalApproved(uint indexed proposalId, address approver);
    event WithdrawalExecuted(uint indexed proposalId, uint amount, uint ngoId, string purpose);
    event WithdrawalCancelled(uint indexed proposalId);
    event ApproverAdded(address approver);
    event ApproverRemoved(address approver);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event UsageRecorded(uint ngoId, string purpose, uint amount);
    event DailyLimitUpdated(uint newLimit);
    event RequiredApprovalsUpdated(uint newRequired);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyApprover() {
        require(approvers[msg.sender] || msg.sender == owner, "Not approver");
        _;
    }

    constructor(address _donationCore) {
        owner = msg.sender;
        donationCore = IDonationCore(_donationCore);
        approvers[msg.sender] = true;
        approverList.push(msg.sender);
        requiredApprovals = 1;
    }

    function proposeWithdrawal(uint ngoId, uint amount, string memory purpose) public onlyApprover returns(uint) {
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        require(amount >= MIN_WITHDRAWAL, "Below minimum");
        require(bytes(purpose).length > 0, "Purpose required");
        require(amount <= donationCore.getNGOFund(ngoId), "Exceeds NGO fund");
        
        proposalCount++;
        WithdrawalProposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.ngoId = ngoId;
        proposal.amount = amount;
        proposal.purpose = purpose;
        proposal.proposer = msg.sender;
        proposal.approvalCount = 0;
        proposal.executed = false;
        proposal.cancelled = false;
        proposal.createdAt = block.timestamp;
        proposal.unlockTime = block.timestamp + WITHDRAWAL_DELAY;
        
        emit WithdrawalProposed(proposalCount, ngoId, amount, purpose, msg.sender);
        return proposalCount;
    }

    function approveWithdrawal(uint proposalId) public onlyApprover {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Cancelled");
        require(!proposalApprovals[proposalId][msg.sender], "Already approved");
        
        proposalApprovals[proposalId][msg.sender] = true;
        proposal.approvalCount++;
        
        emit WithdrawalApproved(proposalId, msg.sender);
    }

    function executeWithdrawal(uint proposalId) public onlyApprover {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Cancelled");
        require(proposal.approvalCount >= requiredApprovals, "Not enough approvals");
        require(block.timestamp >= proposal.unlockTime, "Still locked");
        
        uint currentDay = block.timestamp / 1 days;
        if (currentDay != lastWithdrawalDay) {
            dailyWithdrawn = 0;
            lastWithdrawalDay = currentDay;
        }
        require(dailyWithdrawn + proposal.amount <= dailyWithdrawalLimit, "Daily limit exceeded");
        
        require(proposal.amount <= donationCore.getNGOFund(proposal.ngoId), "Exceeds NGO fund");
        require(proposal.amount <= donationCore.getBalance(), "Insufficient balance");
        
        proposal.executed = true;
        dailyWithdrawn += proposal.amount;
        
        donationCore.deductFund(proposal.ngoId, proposal.amount);
        
        withdrawals.push(WithdrawalRecord(
            proposal.amount,
            proposal.ngoId,
            proposal.purpose,
            block.timestamp,
            proposal.proposer,
            proposal.approvalCount,
            true,
            proposal.unlockTime
        ));
        
        donationCore.transferToAdmin(owner, proposal.amount);
        
        emit WithdrawalExecuted(proposalId, proposal.amount, proposal.ngoId, proposal.purpose);
    }

    function cancelProposal(uint proposalId) public onlyOwner {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");
        
        proposal.cancelled = true;
        emit WithdrawalCancelled(proposalId);
    }

    function withdraw(uint ngoId, uint amount, string memory purpose) public onlyOwner {
        require(requiredApprovals == 1, "Use proposal system");
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        require(amount >= MIN_WITHDRAWAL, "Below minimum");
        require(bytes(purpose).length > 0, "Purpose required");
        require(amount <= donationCore.getNGOFund(ngoId), "Exceeds NGO fund");
        require(amount <= donationCore.getBalance(), "Insufficient balance");

        uint currentDay = block.timestamp / 1 days;
        if (currentDay != lastWithdrawalDay) {
            dailyWithdrawn = 0;
            lastWithdrawalDay = currentDay;
        }
        require(dailyWithdrawn + amount <= dailyWithdrawalLimit, "Daily limit exceeded");

        dailyWithdrawn += amount;
        donationCore.deductFund(ngoId, amount);
        
        withdrawals.push(WithdrawalRecord(
            amount, 
            ngoId, 
            purpose, 
            block.timestamp,
            msg.sender,
            1,
            true,
            block.timestamp
        ));

        donationCore.transferToAdmin(owner, amount);
        
        emit WithdrawalExecuted(0, amount, ngoId, purpose);
    }

    function addUsage(uint ngoId, string memory purpose, uint amount) public onlyOwner {
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        require(bytes(purpose).length > 0, "Purpose required");
        require(amount > 0, "Amount must be > 0");
        
        usages.push(Usage(ngoId, purpose, amount, block.timestamp));
        emit UsageRecorded(ngoId, purpose, amount);
    }

    function addApprover(address approver) public onlyOwner {
        require(approver != address(0), "Zero address");
        require(!approvers[approver], "Already approver");
        approvers[approver] = true;
        approverList.push(approver);
        emit ApproverAdded(approver);
    }

    function removeApprover(address approver) public onlyOwner {
        require(approvers[approver], "Not approver");
        require(approver != owner, "Cannot remove owner");
        require(approverList.length > requiredApprovals, "Would break quorum");
        
        approvers[approver] = false;
        
        for (uint i = 0; i < approverList.length; i++) {
            if (approverList[i] == approver) {
                approverList[i] = approverList[approverList.length - 1];
                approverList.pop();
                break;
            }
        }
        
        emit ApproverRemoved(approver);
    }

    function setRequiredApprovals(uint required) public onlyOwner {
        require(required > 0, "Must be > 0");
        require(required <= approverList.length, "Exceeds approver count");
        requiredApprovals = required;
        emit RequiredApprovalsUpdated(required);
    }

    function setDailyWithdrawalLimit(uint limit) public onlyOwner {
        require(limit >= MIN_WITHDRAWAL, "Below minimum");
        dailyWithdrawalLimit = limit;
        emit DailyLimitUpdated(limit);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        
        if (!approvers[newOwner]) {
            approvers[newOwner] = true;
            approverList.push(newOwner);
        }
        
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function getWithdrawalsCount() public view returns(uint) {
        return withdrawals.length;
    }

    function getUsagesCount() public view returns(uint) {
        return usages.length;
    }

    function getApproversCount() public view returns(uint) {
        return approverList.length;
    }

    function getApprover(uint index) public view returns(address) {
        require(index < approverList.length, "Invalid index");
        return approverList[index];
    }

    function getTotalWithdrawals() public view returns(uint) {
        uint total = 0;
        for(uint i = 0; i < withdrawals.length; i++) {
            total += withdrawals[i].amount;
        }
        return total;
    }

    function getProposalApproved(uint proposalId, address approver) public view returns(bool) {
        return proposalApprovals[proposalId][approver];
    }

    function getMinWithdrawal() public pure returns(uint) {
        return MIN_WITHDRAWAL;
    }

    function getRemainingDailyLimit() public view returns(uint) {
        uint currentDay = block.timestamp / 1 days;
        if (currentDay != lastWithdrawalDay) {
            return dailyWithdrawalLimit;
        }
        if (dailyWithdrawn >= dailyWithdrawalLimit) {
            return 0;
        }
        return dailyWithdrawalLimit - dailyWithdrawn;
    }

    function getPendingProposals() public view returns(uint[] memory) {
        uint count = 0;
        for (uint i = 1; i <= proposalCount; i++) {
            if (!proposals[i].executed && !proposals[i].cancelled) {
                count++;
            }
        }
        
        uint[] memory pending = new uint[](count);
        uint j = 0;
        for (uint i = 1; i <= proposalCount; i++) {
            if (!proposals[i].executed && !proposals[i].cancelled) {
                pending[j] = i;
                j++;
            }
        }
        return pending;
    }

    function getProposalDetails(uint proposalId) public view returns(
        uint id,
        uint ngoId,
        uint amount,
        string memory purpose,
        address proposer,
        uint approvalCount,
        bool executed,
        bool cancelled,
        uint createdAt,
        uint unlockTime
    ) {
        WithdrawalProposal storage p = proposals[proposalId];
        return (
            p.id,
            p.ngoId,
            p.amount,
            p.purpose,
            p.proposer,
            p.approvalCount,
            p.executed,
            p.cancelled,
            p.createdAt,
            p.unlockTime
        );
    }
}