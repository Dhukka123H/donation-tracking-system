// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IDonationCore {
    function getNGOCount() external view returns(uint);
    function getNGOFund(uint ngoId) external view returns(uint);
    function addFund(uint ngoId, uint amount) external;
    function deductFund(uint ngoId, uint amount) external;
    function refundDonor(address donor, uint amount) external;
    function donateForCampaign(address originalDonor, uint ngoId, uint campaignId, string memory message, bool anonymous) external payable;
}

contract CampaignManager {

    struct Campaign {
        uint id;
        uint ngoId;
        string title;
        string description;
        uint goalAmount;
        uint raisedAmount;
        uint deadline;
        bool active;
        bool refundEnabled;
        bool goalReached;
        uint createdAt;
    }

    struct MatchingPool {
        uint id;
        address sponsor;
        uint ngoId;
        uint matchRatio;
        uint maxMatch;
        uint matchedAmount;
        uint deadline;
        bool active;
    }

    struct ImpactMetric {
        uint ngoId;
        string metricName;
        uint value;
        uint timestamp;
        string proofHash;
    }

    struct MilestoneUpdate {
        uint campaignId;
        string title;
        string description;
        uint fundingMilestone;
        uint timestamp;
        string proofHash;
    }

    Campaign[] public campaigns;
    MatchingPool[] public matchingPools;
    ImpactMetric[] public impactMetrics;
    MilestoneUpdate[] public milestoneUpdates;

    mapping(uint => mapping(address => uint)) public campaignDonations;

    address public owner;
    IDonationCore public donationCore;

    event CampaignCreated(uint indexed campaignId, uint ngoId, string title, uint goalAmount, uint deadline);
    event CampaignEnded(uint indexed campaignId, bool successful, uint raisedAmount);
    event CampaignGoalReached(uint indexed campaignId, uint raisedAmount);
    event CampaignDonation(uint indexed campaignId, address donor, uint amount);
    event RefundIssued(uint indexed campaignId, address donor, uint amount);
    event MatchingPoolCreated(uint indexed poolId, address sponsor, uint ngoId, uint maxMatch);
    event DonationMatched(uint indexed poolId, address donor, uint matchedAmount);
    event ImpactMetricRecorded(uint ngoId, string metricName, uint value);
    event MilestoneReached(uint campaignId, string title, uint fundingMilestone);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _donationCore) {
        owner = msg.sender;
        donationCore = IDonationCore(_donationCore);
    }

    function createCampaign(
        uint ngoId,
        string memory title,
        string memory description,
        uint goalAmount,
        uint durationDays,
        bool refundEnabled
    ) public onlyOwner {
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        require(goalAmount > 0, "Goal must be > 0");
        require(durationDays > 0, "Duration must be > 0");
        
        uint deadline = block.timestamp + (durationDays * 1 days);
        
        campaigns.push(Campaign(
            campaigns.length,
            ngoId,
            title,
            description,
            goalAmount,
            0,
            deadline,
            true,
            refundEnabled,
            false,
            block.timestamp
        ));
        
        emit CampaignCreated(campaigns.length - 1, ngoId, title, goalAmount, deadline);
    }

    function donateToCampaign(uint campaignId, string memory message, bool anonymous) public payable {
        require(campaignId < campaigns.length, "Invalid campaign ID");
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Campaign not active");
        require(block.timestamp <= campaign.deadline, "Campaign ended");
        require(!campaign.goalReached, "Campaign goal already reached");
        require(msg.value > 0, "Amount must be > 0");
        
        campaign.raisedAmount += msg.value;
        campaignDonations[campaignId][msg.sender] += msg.value;
        
        donationCore.donateForCampaign{value: msg.value}(
            msg.sender,
            campaign.ngoId, 
            campaignId, 
            message, 
            anonymous
        );
        
        _processMatching(campaign.ngoId, msg.sender, msg.value);
        
        emit CampaignDonation(campaignId, msg.sender, msg.value);
        
        if (campaign.raisedAmount >= campaign.goalAmount) {
            campaign.goalReached = true;
            emit CampaignGoalReached(campaignId, campaign.raisedAmount);
        }
    }

    function _processMatching(uint ngoId, address donor, uint amount) internal {
        for (uint i = 0; i < matchingPools.length; i++) {
            MatchingPool storage pool = matchingPools[i];
            if (pool.active && pool.ngoId == ngoId && block.timestamp <= pool.deadline) {
                uint matchAmount = (amount * pool.matchRatio) / 100;
                uint remainingMatch = pool.maxMatch - pool.matchedAmount;
                
                if (matchAmount > remainingMatch) {
                    matchAmount = remainingMatch;
                }
                
                if (matchAmount > 0 && matchAmount <= address(this).balance) {
                    pool.matchedAmount += matchAmount;
                    
                    donationCore.donateForCampaign{value: matchAmount}(
                        pool.sponsor,
                        ngoId,
                        0,
                        "Matching donation",
                        false
                    );
                    
                    emit DonationMatched(i, donor, matchAmount);
                    
                    if (pool.matchedAmount >= pool.maxMatch) {
                        pool.active = false;
                    }
                }
            }
        }
    }

    function endCampaign(uint campaignId) public onlyOwner {
        require(campaignId < campaigns.length, "Invalid campaign ID");
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Already ended");
        
        campaign.active = false;
        bool successful = campaign.raisedAmount >= campaign.goalAmount;
        
        emit CampaignEnded(campaignId, successful, campaign.raisedAmount);
    }

    function claimRefund(uint campaignId) public {
        require(campaignId < campaigns.length, "Invalid campaign ID");
        Campaign storage campaign = campaigns[campaignId];
        
        require(!campaign.active, "Campaign still active");
        require(campaign.refundEnabled, "Refunds not enabled");
        require(campaign.raisedAmount < campaign.goalAmount, "Campaign successful");
        
        uint donorAmount = campaignDonations[campaignId][msg.sender];
        require(donorAmount > 0, "No donation to refund");
        
        campaignDonations[campaignId][msg.sender] = 0;
        donationCore.deductFund(campaign.ngoId, donorAmount);
        donationCore.refundDonor(msg.sender, donorAmount);
        
        emit RefundIssued(campaignId, msg.sender, donorAmount);
    }

    function createMatchingPool(
        uint ngoId,
        uint matchRatio,
        uint durationDays
    ) public payable {
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        require(msg.value > 0, "Must fund pool");
        require(matchRatio > 0 && matchRatio <= 500, "Ratio must be 1-500%");
        require(durationDays > 0, "Duration must be > 0");
        
        matchingPools.push(MatchingPool(
            matchingPools.length,
            msg.sender,
            ngoId,
            matchRatio,
            msg.value,
            0,
            block.timestamp + (durationDays * 1 days),
            true
        ));
        
        emit MatchingPoolCreated(matchingPools.length - 1, msg.sender, ngoId, msg.value);
    }

    function recordImpactMetric(
        uint ngoId,
        string memory metricName,
        uint value,
        string memory proofHash
    ) public onlyOwner {
        require(ngoId < donationCore.getNGOCount(), "Invalid NGO ID");
        
        impactMetrics.push(ImpactMetric(
            ngoId,
            metricName,
            value,
            block.timestamp,
            proofHash
        ));
        
        emit ImpactMetricRecorded(ngoId, metricName, value);
    }

    function addMilestoneUpdate(
        uint campaignId,
        string memory title,
        string memory description,
        uint fundingMilestone,
        string memory proofHash
    ) public onlyOwner {
        require(campaignId < campaigns.length, "Invalid campaign ID");
        
        milestoneUpdates.push(MilestoneUpdate(
            campaignId,
            title,
            description,
            fundingMilestone,
            block.timestamp,
            proofHash
        ));
        
        emit MilestoneReached(campaignId, title, fundingMilestone);
    }

    function getCampaignsCount() public view returns(uint) {
        return campaigns.length;
    }

    function getMatchingPoolsCount() public view returns(uint) {
        return matchingPools.length;
    }

    function getImpactMetricsCount() public view returns(uint) {
        return impactMetrics.length;
    }

    function getMilestoneUpdatesCount() public view returns(uint) {
        return milestoneUpdates.length;
    }

    function getCampaignDonation(uint campaignId, address donor) public view returns(uint) {
        return campaignDonations[campaignId][donor];
    }

    function getMatchingPoolBalance() public view returns(uint) {
        return address(this).balance;
    }

    function isCampaignAcceptingDonations(uint campaignId) public view returns(bool) {
        if (campaignId >= campaigns.length) return false;
        Campaign storage campaign = campaigns[campaignId];
        return campaign.active && !campaign.goalReached && block.timestamp <= campaign.deadline;
    }

    receive() external payable {}
}