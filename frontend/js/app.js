// ============================================
// GIVECHAIN - CONSOLIDATED APPLICATION
// ============================================
// All JavaScript functionality in one file
// ============================================

// ============================================
// SECTION 1: GLOBAL VARIABLES & CONFIGURATION
// ============================================
// Contract addresses (Sepolia testnet)
const DONATION_CORE_ADDRESS = "0x90526037C47d406F1F6e6681262E068F57Fd774c";
const CAMPAIGN_MANAGER_ADDRESS = "0x010371D52f3B03F1f6c7DF6285e8079fb96D9F50";
const ADMIN_MANAGER_ADDRESS = "0x8f1c67B5A519728e76B482e44a10E1Ee95F330Eb";
// NGO names
const NGO_NAMES = ["HelpCare NGO", "Education NGO"];
// Constants
const MONTHLY_GOAL = 1; // 1 ETH for monthly streak goal
const MIN_PERSONAL_GOAL = 0.001; // 0.0010 ETH minimum personal goal
const POLLING_INTERVAL = 15000; // 15 seconds
const COMMUNITY_CHALLENGE_GOAL = 5; // 5 ETH community challenge goal
// Web3 variables
let provider, signer;
let donationCoreContract, campaignManagerContract, adminManagerContract;
let connectedAddress = "";
let isAdmin = false;
// Data storage
let myDonations = [];
let campaignsData = [];
let usageData = [];
let donationData = [];
let cancelledRecurringData = [];
let countdownIntervals = [];
let communityDonations = []; // Track community challenge donations
// Polling
let pollingInterval = null;
let lastKnownDonationCount = 0;
// User preferences
let userPrefs = {
  favorites: [],
  goal: MIN_PERSONAL_GOAL,
  theme: 'dark',
  referralCode: null,
  badges: [], // Store earned badges
  communityContributions: {} // Track contributions by month
};
// Achievement definitions - 19 badges (added Wave Rider)
const achievements = [
  { id: 'first_donation', name: 'First Step', desc: 'Make your first donation', icon: '🌱', requirement: 1 },
  { id: 'three_donations', name: 'Committed', desc: 'Make 3 donations', icon: '🌿', requirement: 3 },
  { id: 'five_donations', name: 'Regular Giver', desc: 'Make 5 donations', icon: '⭐', requirement: 5 },
  { id: 'ten_donations', name: 'Dedicated Donor', desc: 'Make 10 donations', icon: '🌟', requirement: 10 },
  { id: 'twenty_donations', name: 'Super Donor', desc: 'Make 20 donations', icon: '💫', requirement: 20 },
  { id: 'fifty_donations', name: 'Legend', desc: 'Make 50 donations', icon: '👑', requirement: 50 },
  { id: 'eth_01', name: 'Contributor', desc: 'Donate 0.1 ETH total', icon: '💵', requirement: 0.1 },
  { id: 'eth_05', name: 'Supporter', desc: 'Donate 0.5 ETH total', icon: '💰', requirement: 0.5 },
  { id: 'eth_milestone', name: 'Big Spender', desc: 'Donate 1 ETH total', icon: '💎', requirement: 1 },
  { id: 'eth_5', name: 'Philanthropist', desc: 'Donate 5 ETH total', icon: '🏆', requirement: 5 },
  { id: 'streak_2', name: 'Getting Started', desc: '2 week donation streak', icon: '🔥', requirement: 2 },
  { id: 'streak_3', name: 'Streak Starter', desc: '3 week donation streak', icon: '🔥', requirement: 3 },
  { id: 'streak_5', name: 'Consistent', desc: '5 week donation streak', icon: '🏃', requirement: 5 },
  { id: 'streak_10', name: 'On Fire', desc: '10 week donation streak', icon: '🏅', requirement: 10 },
  { id: 'all_ngos', name: 'Diversified', desc: 'Donate to all NGOs', icon: '🌍', requirement: 2 },
  { id: 'campaign_donor', name: 'Campaign Hero', desc: 'Donate to a campaign', icon: '🎯', requirement: 1 },
  { id: 'early_bird', name: 'Early Bird', desc: 'Donate in the first week', icon: '🐦', requirement: 1 },
  { id: 'night_owl', name: 'Night Owl', desc: 'Donate after 10 PM', icon: '🦉', requirement: 1 },
  { id: 'wave_rider', name: 'Wave Rider', desc: 'Participate in a community challenge', icon: '🏄', requirement: 1 }
];
// Community Challenge configuration
let communityChallenge = {
  id: getCurrentMonthKey(),
  name: getMonthName() + ' Giving Wave',
  goal: COMMUNITY_CHALLENGE_GOAL,
  raised: 0,
  participants: new Set(),
  isCompleted: false,
  startDate: getMonthStartTimestamp(),
  endDate: getMonthEndTimestamp()
};

// NGO Documents configuration
const ngoDocuments = {
  helpcare: {
    registration: {
      title: 'Registration Certificate',
      filename: 'helpcare-registration.pdf',
      path: 'assets/documents/helpcare-registration.pdf',
      description: 'Official NGO registration certificate issued by the regulatory authority.'
    },
    'annual-report': {
      title: 'Annual Report 2025',
      filename: 'helpcare-annual-report.pdf',
      path: 'assets/documents/helpcare-annual-report.pdf',
      description: 'Comprehensive annual report detailing activities, finances, and impact.'
    },
    audit: {
      title: 'Audit Report',
      filename: 'helpcare-audit.pdf',
      path: 'assets/documents/helpcare-audit.pdf',
      description: 'Independent financial audit report for transparency.'
    },
    impact: {
      title: 'Impact Assessment',
      filename: 'helpcare-impact.pdf',
      path: 'assets/documents/helpcare-impact.pdf',
      description: 'Detailed impact assessment report showing outcomes and metrics.'
    }
  },
  education: {
    registration: {
      title: 'Registration Certificate',
      filename: 'education-registration.pdf',
      path: 'assets/documents/education-registration.pdf',
      description: 'Official NGO registration certificate issued by the regulatory authority.'
    },
    'annual-report': {
      title: 'Annual Report 2025',
      filename: 'education-annual-report.pdf',
      path: 'assets/documents/education-annual-report.pdf',
      description: 'Comprehensive annual report detailing activities, finances, and impact.'
    },
    audit: {
      title: 'Audit Report',
      filename: 'education-audit.pdf',
      path: 'assets/documents/education-audit.pdf',
      description: 'Independent financial audit report for transparency.'
    },
    impact: {
      title: 'Impact Assessment',
      filename: 'education-impact.pdf',
      path: 'assets/documents/education-impact.pdf',
      description: 'Detailed impact assessment report showing outcomes and metrics.'
    }
  }
};
function openDocumentPreview(ngoKey, docKey) {
  const doc = ngoDocuments[ngoKey]?.[docKey];
  if (!doc) {
    showNotification("Document not found", 'error');
    return;
  }
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('documentPreviewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'documentPreviewModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 800px; max-height: 90vh;">
        <div class="modal-header">
          <h3 class="modal-title" id="docPreviewTitle">Document Preview</h3>
          <button class="modal-close" id="closeDocPreviewModal">×</button>
        </div>
        <div class="modal-body" style="padding: 0;">
          <div id="docPreviewContent" style="min-height: 400px; display: flex; flex-direction: column;">
            <!-- Content will be injected here -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add close event
    document.getElementById('closeDocPreviewModal').addEventListener('click', closeDocumentPreview);
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeDocumentPreview();
    });
  }
  
  // Update modal content
  document.getElementById('docPreviewTitle').innerText = doc.title;
  
  const ngoName = ngoKey === 'education' ? 'Education NGO' : 'HelpCare NGO';
  
  const contentEl = document.getElementById('docPreviewContent');
  contentEl.innerHTML = `
    <div style="padding: 24px; border-bottom: 1px solid var(--border);">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
          📄
        </div>
        <div>
          <h4 style="font-size: 18px; color: var(--text-primary); margin-bottom: 4px;">${doc.title}</h4>
          <p style="font-size: 13px; color: var(--text-muted);">${ngoName}</p>
        </div>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
        ${doc.description}
      </p>
    </div>
    
    <div style="flex: 1; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; min-height: 300px;">
      <div id="docPreviewFrame" style="width: 100%; height: 100%; min-height: 300px;">
        <iframe 
          src="${doc.path}" 
          style="width: 100%; height: 400px; border: none;"
          id="docIframe"
          onload="document.getElementById('docLoadingState').style.display='none'"
          onerror="showDocumentError()"
        ></iframe>
        <div id="docLoadingState" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
          <p style="color: var(--text-muted);">Loading document...</p>
        </div>
        <div id="docErrorState" style="display: none; text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
          <h4 style="color: var(--text-primary); margin-bottom: 8px;">Preview Unavailable</h4>
          <p style="color: var(--text-muted); margin-bottom: 16px;">
            The document preview couldn't be loaded. You can still download the file.
          </p>
        </div>
      </div>
    </div>
    
    <div style="padding: 20px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
      <div style="font-size: 12px; color: var(--text-muted);">
        <span>📁 ${doc.filename}</span>
      </div>
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary btn-sm" onclick="closeDocumentPreview()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="downloadDocument('${ngoKey}', '${docKey}')">
          📥 Download PDF
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}
function showDocumentError() {
  const loadingState = document.getElementById('docLoadingState');
  const errorState = document.getElementById('docErrorState');
  const iframe = document.getElementById('docIframe');
  
  if (loadingState) loadingState.style.display = 'none';
  if (iframe) iframe.style.display = 'none';
  if (errorState) errorState.style.display = 'block';
}
function closeDocumentPreview() {
  const modal = document.getElementById('documentPreviewModal');
  if (modal) {
    modal.classList.remove('active');
  }
}
function downloadDocument(ngoKey, docKey) {
  const doc = ngoDocuments[ngoKey]?.[docKey];
  if (!doc) {
    showNotification("Document not found", 'error');
    return;
  }
  
  // Create download link
  const link = document.createElement('a');
  link.href = doc.path;
  link.download = doc.filename;
  link.target = '_blank';
  
  // For demo purposes, if file doesn't exist, create a placeholder
  fetch(doc.path)
    .then(response => {
      if (response.ok) {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Downloading ${doc.filename}...`, 'success');
      } else {
        // File doesn't exist, generate placeholder PDF
        generatePlaceholderPDF(ngoKey, docKey, doc);
      }
    })
    .catch(() => {
      // Generate placeholder PDF
      generatePlaceholderPDF(ngoKey, docKey, doc);
    });
}
function generatePlaceholderPDF(ngoKey, docKey, doc) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  const ngoName = ngoKey === 'helpcare' ? 'HelpCare NGO' : 'Education NGO';
  
  // Header
  pdf.setFontSize(24);
  pdf.setTextColor(16, 185, 129);
  pdf.text(doc.title, 105, 30, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(100, 116, 139);
  pdf.text(ngoName, 105, 42, { align: 'center' });
  
  // Line
  pdf.setDrawColor(16, 185, 129);
  pdf.setLineWidth(0.5);
  pdf.line(20, 50, 190, 50);
  
  // Content
  pdf.setFontSize(12);
  pdf.setTextColor(60, 60, 60);
  
  let y = 70;
  pdf.text('Document Information', 20, y);
  y += 15;
  
  pdf.setFontSize(10);
  pdf.text(`Title: ${doc.title}`, 25, y);
  y += 10;
  pdf.text(`Organization: ${ngoName}`, 25, y);
  y += 10;
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 25, y);
  y += 20;
  
  pdf.setFontSize(11);
  const descLines = pdf.splitTextToSize(doc.description, 160);
  descLines.forEach(line => {
    pdf.text(line, 25, y);
    y += 7;
  });
  
  y += 20;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text('This is a placeholder document for demonstration purposes.', 105, y, { align: 'center' });
  y += 7;
  pdf.text('Actual NGO documentation would be uploaded by administrators.', 105, y, { align: 'center' });
  
  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Generated by GiveChain - Transparent Blockchain Donations', 105, 280, { align: 'center' });
  
  pdf.save(doc.filename);
  showNotification(`Downloaded ${doc.filename}`, 'success');
  closeDocumentPreview();
}

// ============================================
// SECTION 2: CONTRACT ABIs
// ============================================

const donationCoreABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"ngoId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"},{"indexed":false,"internalType":"bool","name":"isAnonymous","type":"bool"}],"name":"DonationReceived","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"}],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"message","type":"string"},{"internalType":"bool","name":"anonymous","type":"bool"}],"name":"donateWithMessage","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"originalDonor","type":"address"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"campaignId","type":"uint256"},{"internalType":"string","name":"message","type":"string"},{"internalType":"bool","name":"anonymous","type":"bool"}],"name":"donateForCampaign","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interval","type":"uint256"}],"name":"createRecurringDonation","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"recurringId","type":"uint256"}],"name":"executeRecurringDonation","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"recurringId","type":"uint256"}],"name":"cancelRecurringDonation","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getDonationsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"}],"name":"getNGOFund","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getNGOCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getRecurringDonationsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"donor","type":"address"}],"name":"getDonorTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getTotalDonations","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"donations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"campaignId","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"message","type":"string"},{"internalType":"bool","name":"isAnonymous","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"recurringDonations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interval","type":"uint256"},{"internalType":"uint256","name":"lastExecuted","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"stateMutability":"payable","type":"receive"}
];

const campaignManagerABI = [
  {"inputs":[{"internalType":"address","name":"_donationCore","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"durationDays","type":"uint256"},{"internalType":"bool","name":"refundEnabled","type":"bool"}],"name":"createCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"},{"internalType":"string","name":"message","type":"string"},{"internalType":"bool","name":"anonymous","type":"bool"}],"name":"donateToCampaign","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"matchRatio","type":"uint256"},{"internalType":"uint256","name":"durationDays","type":"uint256"}],"name":"createMatchingPool","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"metricName","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"string","name":"proofHash","type":"string"}],"name":"recordImpactMetric","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getCampaignsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getMatchingPoolsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getImpactMetricsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getMilestoneUpdatesCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"isCampaignAcceptingDonations","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"campaigns","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"raisedAmount","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"bool","name":"refundEnabled","type":"bool"},{"internalType":"bool","name":"goalReached","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"matchingPools","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"sponsor","type":"address"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"matchRatio","type":"uint256"},{"internalType":"uint256","name":"maxMatch","type":"uint256"},{"internalType":"uint256","name":"matchedAmount","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"impactMetrics","outputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"metricName","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"proofHash","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"milestoneUpdates","outputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"fundingMilestone","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"proofHash","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"stateMutability":"payable","type":"receive"}
];

const adminManagerABI = [
  {"inputs":[{"internalType":"address","name":"_donationCore","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"purpose","type":"string"}],"name":"proposeWithdrawal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"approveWithdrawal","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"executeWithdrawal","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"purpose","type":"string"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getWithdrawalsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getTotalWithdrawals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"},{"internalType":"address","name":"approver","type":"address"}],"name":"getProposalApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getRemainingDailyLimit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getPendingProposals","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"proposalId","type":"uint256"}],"name":"getProposalDetails","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"purpose","type":"string"},{"internalType":"address","name":"proposer","type":"address"},{"internalType":"uint256","name":"approvalCount","type":"uint256"},{"internalType":"bool","name":"executed","type":"bool"},{"internalType":"bool","name":"cancelled","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"unlockTime","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"withdrawals","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"purpose","type":"string"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"address","name":"initiator","type":"address"},{"internalType":"uint256","name":"approvalCount","type":"uint256"},{"internalType":"bool","name":"executed","type":"bool"},{"internalType":"uint256","name":"unlockTime","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"requiredApprovals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"dailyWithdrawalLimit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"approvers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"usages","outputs":[{"internalType":"uint256","name":"ngoId","type":"uint256"},{"internalType":"string","name":"purpose","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// ============================================
// SECTION 3: UTILITY FUNCTIONS
// ============================================

function formatDateTime(timestamp) {
  if (!timestamp || timestamp === 0) return "—";
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatDateShort(timestamp) {
  if (!timestamp || timestamp === 0) return "—";
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatNextPayment(lastExecuted, interval) {
  const nextPayment = (parseInt(lastExecuted) + parseInt(interval)) * 1000;
  const now = Date.now();
  
  if (lastExecuted === 0) return "Ready now";
  if (nextPayment <= now) return "Ready now";
  
  const date = new Date(nextPayment);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (interval == 86400) return `Tomorrow at ${timeStr}`;
  if (interval == 604800) return `${dayName} at ${timeStr}`;
  return `${dateStr} at ${timeStr}`;
}

function getIntervalText(interval) {
  if (interval == 86400) return "Daily";
  if (interval == 604800) return "Weekly";
  if (interval == 2592000) return "Monthly (30 days)";
  return `Every ${Math.floor(interval / 86400)} days`;
}

function shortAddress(addr) {
  if (!addr) return "—";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getCountdownString(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;
  
  if (remaining <= 0) return null;
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  
  return { days, hours, minutes, seconds, total: remaining };
}

function setButtonLoading(btnId, loading, text = null) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading"></span> ' + (text || 'Processing...');
  } else {
    btn.disabled = false;
    btn.innerHTML = text || btn.dataset.originalText || 'Submit';
  }
}

function showSyncIndicator(show) {
  const indicator = document.getElementById('syncIndicator');
  if (indicator) {
    indicator.classList.toggle('active', show);
  }
}

function resetForm(formIds) {
  formIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = false;
      } else {
        el.value = '';
      }
    }
  });
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// User preferences
function loadUserPrefs() {
  const stored = localStorage.getItem('givechain_user_prefs');
  if (stored) {
    userPrefs = { ...userPrefs, ...JSON.parse(stored) };
  }
  if (userPrefs.goal < MIN_PERSONAL_GOAL) {
    userPrefs.goal = MIN_PERSONAL_GOAL;
  }
}

function saveUserPrefs() {
  localStorage.setItem('givechain_user_prefs', JSON.stringify(userPrefs));
}

// Cancelled recurring storage
function loadCancelledRecurringFromStorage() {
  const stored = localStorage.getItem('givechain_cancelled_recurring');
  if (stored) {
    cancelledRecurringData = JSON.parse(stored);
  }
}

function saveCancelledRecurringToStorage() {
  localStorage.setItem('givechain_cancelled_recurring', JSON.stringify(cancelledRecurringData));
}

// Cross-tab sync
function broadcastUpdate(type) {
  const update = { type, timestamp: Date.now() };
  localStorage.setItem('givechain_data_update', JSON.stringify(update));
}
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function getMonthName() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[new Date().getMonth()];
}
function getMonthStartTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
}
function getMonthEndTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000;
}
// ============================================
// WALLET CONNECTION CHECK WRAPPER
// ============================================
function requireWalletConnection(actionName = "this action") {
  if (!connectedAddress || !donationCoreContract) {
    showNotification(`Please connect your wallet to ${actionName}`, 'warning');
    highlightConnectButton();
    return false;
  }
  return true;
}
function highlightConnectButton() {
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.classList.add('highlight-pulse');
    setTimeout(() => connectBtn.classList.remove('highlight-pulse'), 2000);
  }
}
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="notification-message">${message}</span>
  `;
  
  // Add to page
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(container);
  }
  
  container.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ============================================
// SECTION 4: THEME & NAVIGATION
// ============================================

function toggleTheme() {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  document.getElementById("themeIcon").textContent = isLight ? "🌙" : "☀️";
  userPrefs.theme = isLight ? 'light' : 'dark';
  saveUserPrefs();
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
  
  const tabElement = document.getElementById('tab-' + tabName);
  if (tabElement) {
    tabElement.classList.add('active');
  }
  
  document.querySelectorAll(`.nav-tab[data-tab="${tabName}"]`).forEach(btn => btn.classList.add('active'));
  document.querySelectorAll(`.mobile-nav-item[data-tab="${tabName}"]`).forEach(btn => btn.classList.add('active'));
}

// ============================================
// SECTION 5: WALLET CONNECTION
// ============================================

async function connectWallet() {
  try {
    if (!window.ethereum) {
      showNotification("Please install MetaMask!", 'error');
      return;
    }
    setButtonLoading('connectBtn', true, 'Connecting...');
    
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    signer = provider.getSigner();
    connectedAddress = await signer.getAddress();
    
    // Update UI
    document.getElementById("walletStatus").style.display = "block";
    document.getElementById("walletPrompt").style.display = "none";
    document.getElementById("walletAddressFull").innerText = connectedAddress;
    
    const connectBtn = document.getElementById("connectBtn");
    connectBtn.classList.add("connected");
    connectBtn.innerHTML = `<span class="wallet-indicator"></span> ${shortAddress(connectedAddress)}`;
    
    // Initialize contracts
    donationCoreContract = new ethers.Contract(DONATION_CORE_ADDRESS, donationCoreABI, signer);
    campaignManagerContract = new ethers.Contract(CAMPAIGN_MANAGER_ADDRESS, campaignManagerABI, signer);
    adminManagerContract = new ethers.Contract(ADMIN_MANAGER_ADDRESS, adminManagerABI, signer);
    
    // Set referral code
    if (!userPrefs.referralCode) {
      userPrefs.referralCode = connectedAddress.slice(2, 10).toUpperCase();
      saveUserPrefs();
    }
    document.getElementById('referralLink').value = `givechain.io/donate?ref=${userPrefs.referralCode}`;
    
    // Setup event listeners
    setupContractEventListeners();
    
    // Handle account changes
    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', () => window.location.reload());
    
    // Check admin status and refresh data
    await checkAdminStatus();
    await refreshAllData();
    
    // Enable action buttons
    enableActionsAfterConnect();
    
    showNotification("Wallet connected successfully!", 'success');
    
  } catch(err) {
    console.error("Connect error:", err);
    setButtonLoading('connectBtn', false, 'Connect Wallet');
    showNotification(err.message, 'error');
  }
}

async function handleAccountChange(accounts) {
  if (accounts.length === 0) {
    connectedAddress = "";
    document.getElementById("walletStatus").style.display = "none";
    document.getElementById("walletPrompt").style.display = "block";
    document.getElementById("connectBtn").classList.remove("connected");
    document.getElementById("connectBtn").innerHTML = "Connect Wallet";
    isAdmin = false;
    updateAdminUI();
  } else {
    connectedAddress = accounts[0];
    document.getElementById("walletAddressFull").innerText = connectedAddress;
    document.getElementById("connectBtn").innerHTML = `<span class="wallet-indicator"></span> ${shortAddress(connectedAddress)}`;
    await checkAdminStatus();
    await refreshAllData();
  }
}

function copyWalletAddress() {
  if (connectedAddress) {
    navigator.clipboard.writeText(connectedAddress).then(() => {
      alert("✅ Address copied!");
    });
  }
}

// ============================================
// SECTION 6: ADMIN STATUS & UI
// ============================================

async function checkAdminStatus() {
  if (!adminManagerContract || !connectedAddress) {
    isAdmin = false;
    return;
  }
  
  try {
    const [owner, isApprover] = await Promise.all([
      adminManagerContract.owner(),
      adminManagerContract.approvers(connectedAddress)
    ]);
    
    isAdmin = owner.toLowerCase() === connectedAddress.toLowerCase() || isApprover;
  } catch(err) {
    console.error("Admin check error:", err);
    isAdmin = false;
  }
  
  updateAdminUI();
}

function updateAdminUI() {
  const desktopAdminTab = document.querySelector('.nav-tabs .nav-tab[data-tab="admin"]');
  const mobileAdminTab = document.querySelector('.mobile-nav-item[data-tab="admin"]');
  
  if (isAdmin) {
    // Create admin tab if it doesn't exist
    if (!desktopAdminTab) {
      const navTabs = document.querySelector('.nav-tabs');
      if (navTabs) {
        const adminTab = document.createElement('button');
        adminTab.className = 'nav-tab admin-tab visible';
        adminTab.dataset.tab = 'admin';
        adminTab.innerHTML = '🔐 Admin';
        adminTab.addEventListener('click', () => showTab('admin'));
        navTabs.appendChild(adminTab);
      }
    } else {
      desktopAdminTab.classList.add('visible');
    }
    
    if (!mobileAdminTab) {
      const mobileNav = document.querySelector('.mobile-nav-items');
      if (mobileNav) {
        const mobileAdminTab = document.createElement('button');
        mobileAdminTab.className = 'mobile-nav-item admin-tab visible';
        mobileAdminTab.dataset.tab = 'admin';
        mobileAdminTab.innerHTML = '<span class="icon">🔐</span>Admin';
        mobileAdminTab.addEventListener('click', () => showTab('admin'));
        mobileNav.appendChild(mobileAdminTab);
      }
    } else {
      mobileAdminTab.classList.add('visible');
    }
    
    // Add admin badge
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn && !connectBtn.querySelector('.admin-badge')) {
      const badge = document.createElement('span');
      badge.className = 'admin-badge';
      badge.textContent = 'Admin';
      connectBtn.appendChild(badge);
    }
  } else {
    // Remove admin tabs and badge
    if (desktopAdminTab) desktopAdminTab.classList.remove('visible');
    if (mobileAdminTab) mobileAdminTab.classList.remove('visible');
    
    const badge = document.querySelector('.admin-badge');
    if (badge) badge.remove();
    
    // Switch away from admin tab if currently on it
    const adminTabContent = document.getElementById('tab-admin');
    if (adminTabContent && adminTabContent.classList.contains('active')) {
      showTab('dashboard');
    }
  }
}

// ============================================
// SECTION 7: DATA LOADING & REFRESH
// ============================================

async function refreshAllData() {
  if (!donationCoreContract) return;
  
  showSyncIndicator(true);
  try {
    await Promise.all([
      loadBalance(),
      updateNGOFunds(),
      updateMonthlyProgress(),
      loadDashboard(),
      loadUsageHistory(),
      loadDonationHistory(),
      updateStats(),
      loadCampaigns(),
      loadLeaderboard(),
      loadImpactMetrics(),
      loadMyDonations(),
      loadRecurringDonations(),
      loadMatchingPools(),
      loadPendingProposals(),
      loadAdminInfo(),
      updateWithdrawNgoFund(),
      updateCommunityChallenge()
    ]);
    
    updateGoalProgress();
    updateAchievements();
    updateFavorites();
    updateStreak();
    
  } catch(err) {
    console.error("Refresh error:", err);
  } finally {
    showSyncIndicator(false);
  }
}

async function loadBalance() {
  try {
    const b = await donationCoreContract.getBalance();
    const balance = parseFloat(ethers.utils.formatEther(b)).toFixed(4);
    document.getElementById("balance").innerText = balance + " ETH";
    document.getElementById("statContractBalance").innerText = balance + " ETH";
  } catch(err) {
    console.error("Load balance error:", err);
  }
}

async function loadAdminInfo() {
  try {
    if (!adminManagerContract) return;
    
    const [requiredApprovals, remainingLimit] = await Promise.all([
      adminManagerContract.requiredApprovals(),
      adminManagerContract.getRemainingDailyLimit()
    ]);
    
    document.getElementById("requiredApprovalsDisplay").innerText = requiredApprovals.toString();
    document.getElementById("dailyLimitDisplay").innerText = parseFloat(ethers.utils.formatEther(remainingLimit)).toFixed(4) + " ETH";
  } catch(err) {
    console.error("Load admin info error:", err);
  }
}

async function updateStats() {
  try {
    const [totalDonations, totalWithdrawals, campaignCount] = await Promise.all([
      donationCoreContract.getTotalDonations(),
      adminManagerContract.getTotalWithdrawals(),
      campaignManagerContract.getCampaignsCount()
    ]);
    
    let activeCampaignCount = 0;
    const total = parseInt(campaignCount);
    if (total > 0) {
      const campaignPromises = [];
      for (let i = 0; i < total; i++) {
        campaignPromises.push(campaignManagerContract.campaigns(i));
      }
      const campaigns = await Promise.all(campaignPromises);
      
      campaigns.forEach(c => {
        const isExpired = Date.now() / 1000 > parseInt(c.deadline);
        if (c.active && !c.goalReached && !isExpired) activeCampaignCount++;
      });
    }
    
    document.getElementById("statTotalDonations").innerText = parseFloat(ethers.utils.formatEther(totalDonations)).toFixed(4) + " ETH";
    document.getElementById("statTotalWithdrawals").innerText = parseFloat(ethers.utils.formatEther(totalWithdrawals)).toFixed(4) + " ETH";
    document.getElementById("statActiveCampaigns").innerText = activeCampaignCount;
    
  } catch(err) {
    console.error("Update stats error:", err);
  }
}

async function updateNGOFunds() {
  try {
    const [count, fund0, fund1] = await Promise.all([
      donationCoreContract.getDonationsCount(),
      donationCoreContract.getNGOFund(0),
      donationCoreContract.getNGOFund(1)
    ]);
    
    lastKnownDonationCount = parseInt(count);
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    let ngo0Donations = [];
    let ngo1Donations = [];
    
    donations.forEach((d, i) => {
      const donationData = {
        amount: parseFloat(ethers.utils.formatEther(d.amount)),
        timestamp: parseInt(d.timestamp),
        date: formatDateTime(parseInt(d.timestamp)),
        anonymous: d.isAnonymous,
        donor: d.donor
      };
      
      if (parseInt(d.ngoId) === 0) {
        ngo0Donations.push(donationData);
      } else if (parseInt(d.ngoId) === 1) {
        ngo1Donations.push(donationData);
      }
    });
    
    ngo0Donations.sort((a, b) => a.timestamp - b.timestamp);
    ngo1Donations.sort((a, b) => a.timestamp - b.timestamp);
    ngo0Donations.forEach((d, idx) => { d.index = idx + 1; });
    ngo1Donations.forEach((d, idx) => { d.index = idx + 1; });
    
    const ngo0Display = [...ngo0Donations].reverse().slice(0, 5);
    const ngo1Display = [...ngo1Donations].reverse().slice(0, 5);
    
    document.getElementById("fund0").innerText = parseFloat(ethers.utils.formatEther(fund0)).toFixed(4) + " ETH";
    document.getElementById("fund1").innerText = parseFloat(ethers.utils.formatEther(fund1)).toFixed(4) + " ETH";
    document.getElementById("donationCount0").innerText = ngo0Donations.length;
    document.getElementById("donationCount1").innerText = ngo1Donations.length;
    
    document.getElementById("txList0").innerHTML = renderTxList(ngo0Display);
    document.getElementById("txList1").innerHTML = renderTxList(ngo1Display);
    
  } catch(err) {
    console.error("Update NGO funds error:", err);
  }
}

function renderTxList(txs) {
  if (txs.length === 0) return '<p style="color: var(--text-muted); text-align: center; padding: 16px;">No transactions yet</p>';
  
  return txs.map(tx => `
    <div class="tx-item">
      <div>
        <span style="color: var(--primary); font-weight: 600;">#${tx.index}</span>
        ${tx.anonymous ? '<span style="color: var(--text-muted); font-size: 10px;"> (Anon)</span>' : ''}
        <div class="tx-donor">${tx.anonymous ? 'Anonymous' : shortAddress(tx.donor)}</div>
        <div class="tx-date">${tx.date}</div>
      </div>
      <div class="tx-amount">+${tx.amount.toFixed(4)} ETH</div>
    </div>
  `).join("");
}

async function updateMonthlyProgress() {
  try {
    const count = await donationCoreContract.getDonationsCount();
    const currentMonthKey = getCurrentMonthKey();
    let monthlyTotals = {};
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    donations.forEach(d => {
      const amount = parseFloat(ethers.utils.formatEther(d.amount));
      const timestamp = parseInt(d.timestamp);
      const date = new Date(timestamp * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = 0;
      monthlyTotals[monthKey] += amount;
    });
    
    const currentMonthTotal = monthlyTotals[currentMonthKey] || 0;
    const percent = Math.min((currentMonthTotal / MONTHLY_GOAL) * 100, 100);
    
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressText").innerText = currentMonthTotal.toFixed(4) + " ETH raised (" + percent.toFixed(1) + "%)";
    document.getElementById("currentMonthLabel").innerText = getMonthLabel(currentMonthKey);
    
    document.getElementById("challengeProgress").innerText = currentMonthTotal.toFixed(2) + " ETH";
    document.getElementById("challengeBar").style.width = Math.min((currentMonthTotal / 5) * 100, 100) + "%";
    
  } catch(err) {
    console.error("Update monthly progress error:", err);
  }
}

async function loadDashboard() {
  try {
    if (!signer) return;
    
    const user = await signer.getAddress();
    const total = await donationCoreContract.getDonorTotal(user);
    document.getElementById("userTotalDonated").innerText = parseFloat(ethers.utils.formatEther(total)).toFixed(4) + " ETH";
  } catch(err) {
    console.error("Load dashboard error:", err);
  }
}

// ============================================
// SECTION 8: DONATION FUNCTIONS
// ============================================

async function quickDonate() {
  if (!requireWalletConnection("make a donation")) return;
  
  const amount = document.getElementById("quickAmount").value;
  const ngoId = document.getElementById("quickNgo").value;
  
  if (!amount || parseFloat(amount) <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  try {
    setButtonLoading('quickDonateBtn', true, 'Donating...');
    
    const valueInWei = ethers.utils.parseEther(amount.toString());
    const tx = await donationCoreContract.donate(parseInt(ngoId), { value: valueInWei });
    await tx.wait();
    
    setButtonLoading('quickDonateBtn', false, 'Donate Now');
    showNotification("Donation Successful!", 'success');
    resetForm(['quickAmount']);
    broadcastUpdate('donation');
    await refreshAllData();
  } catch(err) {
    console.error("Quick donate error:", err);
    setButtonLoading('quickDonateBtn', false, 'Donate Now');
    showNotification(err.reason || err.message, 'error');
  }
}
async function donate() {
  if (!requireWalletConnection("make a donation")) return;
  
  const ngoId = parseInt(document.getElementById("donateNgo").value);
  const amountETH = parseFloat(document.getElementById("donateAmount").value);
  const message = document.getElementById("donateMessage").value || "";
  const anonymous = document.getElementById("donateAnonymous").checked;
  
  if (!amountETH || amountETH <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  try {
    setButtonLoading('donateBtn', true, 'Donating...');
    
    const valueInWei = ethers.utils.parseEther(amountETH.toString());
    
    let tx;
    if (message || anonymous) {
      tx = await donationCoreContract.donateWithMessage(ngoId, message, anonymous, { value: valueInWei });
    } else {
      tx = await donationCoreContract.donate(ngoId, { value: valueInWei });
    }
    await tx.wait();
    
    setButtonLoading('donateBtn', false, 'Donate');
    showNotification("Donation Successful!", 'success');
    resetForm(['donateAmount', 'donateMessage', 'donateAnonymous']);
    document.getElementById("donationPreviewBox").style.display = "none";
    broadcastUpdate('donation');
    await refreshAllData();
  } catch(err) {
    console.error("Donate error:", err);
    setButtonLoading('donateBtn', false, 'Donate');
    showNotification(err.reason || err.message, 'error');
  }
}
// ============================================
// COMMUNITY CHALLENGE - COMPLETE IMPLEMENTATION
// ============================================
async function communityDonate() {
  if (!requireWalletConnection("contribute to the community challenge")) return;
  
  const amount = document.getElementById("communityDonateAmount").value;
  
  if (!amount || parseFloat(amount) <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  // Check if challenge is already completed
  if (communityChallenge.isCompleted) {
    showNotification("This month's challenge is already completed! 🎉", 'info');
    return;
  }
  
  try {
    setButtonLoading('communityDonateBtn', true, 'Contributing...');
    
    const valueInWei = ethers.utils.parseEther(amount.toString());
    // Track this user's participation
    const monthKey = getCurrentMonthKey();

    // Community donations go to the contract/admin pool (NGO ID 0 as default, but marked as community)
    // You might want to create a separate function in your smart contract for community donations
    // For now, we'll use a special message to mark it as community donation
    const tx = await donationCoreContract.donateWithMessage(
      0, // Goes to first NGO or admin pool
      `[COMMUNITY_CHALLENGE:${getCurrentMonthKey()}]`, // Special marker
      false, // Not anonymous for community tracking
      { value: valueInWei }
    );
    await tx.wait();
    
    if (!userPrefs.communityContributions[monthKey]) {
      userPrefs.communityContributions[monthKey] = 0;
    }
    userPrefs.communityContributions[monthKey] += parseFloat(amount);
    
    // Award Wave Rider badge if first community contribution
    if (!userPrefs.badges.includes('wave_rider')) {
      userPrefs.badges.push('wave_rider');
      showNotification("🏄 You earned the Wave Rider badge!", 'success');
    }
    
    saveUserPrefs();
    
    setButtonLoading('communityDonateBtn', false, 'Donate to Challenge');
    showNotification("Thank you for contributing to the community challenge!", 'success');
    resetForm(['communityDonateAmount']);
    
    broadcastUpdate('donation');
    await refreshAllData();
    await updateCommunityChallenge();
    
  } catch(err) {
    console.error("Community donate error:", err);
    setButtonLoading('communityDonateBtn', false, 'Donate to Challenge');
    showNotification(err.reason || err.message, 'error');
  }
}
async function updateCommunityChallenge() {
  if (!donationCoreContract) return;
  
  try {
    const count = await donationCoreContract.getDonationsCount();
    const monthKey = getCurrentMonthKey();
    const monthStart = getMonthStartTimestamp();
    const monthEnd = getMonthEndTimestamp();
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    let totalRaised = 0;
    const participants = new Set();
    const participantsList = [];
    
    donations.forEach(d => {
      const timestamp = parseInt(d.timestamp);
      const message = d.message || '';
      
      // Check for community challenge donations
      if (message.includes(`[COMMUNITY_CHALLENGE:${monthKey}]`)) {
        const amount = parseFloat(ethers.utils.formatEther(d.amount));
        totalRaised += amount;
        
        const donorLower = d.donor.toLowerCase();
        if (!participants.has(donorLower)) {
          participants.add(donorLower);
          participantsList.push({
            address: d.donor,
            amount: amount,
            timestamp: timestamp
          });
        } else {
          // Update existing participant's total
          const existing = participantsList.find(p => p.address.toLowerCase() === donorLower);
          if (existing) existing.amount += amount;
        }
      }
    });
    
    communityChallenge.raised = totalRaised;
    communityChallenge.participants = participants;
    communityChallenge.participantsList = participantsList;
    communityChallenge.isCompleted = totalRaised >= communityChallenge.goal;
    
    // Update UI
    updateCommunityUI();
    
    // Award badges to all participants if challenge completed
    if (communityChallenge.isCompleted) {
      await handleChallengeCompletion();
    }
    
    // Update days left
    updateChallengeDaysLeft();
    
  } catch(err) {
    console.error("Update community challenge error:", err);
  }
}
async function updateChallengeDaysLeft() {
  const now = Date.now() / 1000;
  const endDate = communityChallenge.endDate;
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / 86400));
  
  const daysLeftEl = document.getElementById("challengeDaysLeft");
  if (daysLeftEl) {
    daysLeftEl.innerText = daysLeft;
  }
}
async function updateCommunityUI() {
  const raised = communityChallenge.raised;
  const goal = communityChallenge.goal;
  const percent = Math.min((raised / goal) * 100, 100);
  const isCompleted = communityChallenge.isCompleted;
  
  // Update progress display
  const progressEl = document.getElementById("challengeProgress");
  if (progressEl) {
    progressEl.innerText = raised.toFixed(2) + " ETH";
  }
  
  const barEl = document.getElementById("challengeBar");
  if (barEl) {
    barEl.style.width = percent + "%";
    if (isCompleted) {
      barEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    }
  }
  
  // Update challenge card status
  const challengeCard = document.getElementById('challengeCard');
  if (challengeCard) {
    if (isCompleted) {
      challengeCard.classList.add('completed');
      challengeCard.classList.remove('active');
    }
  }
  
  // Update badge display
  const badges = document.querySelectorAll('.challenge-badge');
  badges.forEach(badgeEl => {
    if (isCompleted) {
      badgeEl.textContent = '🎉 COMPLETED';
      badgeEl.classList.remove('active');
      badgeEl.classList.add('completed');
    }
  });
  
  // Update participant count
  const participantEl = document.getElementById("challengeParticipants");
  if (participantEl) {
    participantEl.innerText = communityChallenge.participants.size;
  }
  
  // Update donate button state
  const donateBtn = document.getElementById("communityDonateBtn");
  if (donateBtn) {
    if (isCompleted) {
      donateBtn.disabled = true;
      donateBtn.innerHTML = "🎉 Goal Reached!";
      donateBtn.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else {
      donateBtn.disabled = false;
      donateBtn.innerHTML = "Donate to Challenge";
      donateBtn.style.background = '';
    }
  }
  
  // Show completion message if goal reached
  const completionMsgEl = document.getElementById("challengeCompletionMsg");
  if (completionMsgEl) {
    if (isCompleted) {
      completionMsgEl.style.display = 'block';
      completionMsgEl.innerHTML = `
        <div class="completion-celebration">
          <span class="celebration-icon">🎉</span>
          <h4>Challenge Completed!</h4>
          <p>The community raised ${raised.toFixed(2)} ETH this month!</p>
          <p class="participant-thanks">Thank you to all ${communityChallenge.participants.size} participants!</p>
          <p style="font-size: 11px; color: var(--primary); margin-top: 8px;">
            🏄 All participants received the "Wave Rider" badge!
          </p>
        </div>
      `;
    } else {
      completionMsgEl.style.display = 'none';
    }
  }
}
async function handleChallengeCompletion() {
  // Award Wave Rider badge to current user if they participated
  if (connectedAddress && communityChallenge.participants.has(connectedAddress.toLowerCase())) {
    if (!userPrefs.badges.includes('wave_rider')) {
      userPrefs.badges.push('wave_rider');
      saveUserPrefs();
      showNotification("🏄 Congratulations! You earned the Wave Rider badge for participating in the community challenge!", 'success');
    }
  }
  
  // Show celebration
  showCelebration();
  
  // Update achievements display
  updateAchievements();
}
async function showCelebration() {
  // Prevent multiple celebrations
  if (document.querySelector('.confetti-container')) return;
  
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  
  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
  
  confettiContainer.innerHTML = Array(60).fill(0).map(() => 
    `<div class="confetti" style="
      left: ${Math.random() * 100}%; 
      animation-delay: ${Math.random() * 2}s; 
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      transform: rotate(${Math.random() * 360}deg);
    "></div>`
  ).join('');
  
  document.body.appendChild(confettiContainer);
  
  setTimeout(() => confettiContainer.remove(), 5000);
}
// Check if user has participated in current challenge
function hasParticipatedInChallenge() {
  const monthKey = getCurrentMonthKey();
  return userPrefs.communityContributions[monthKey] && userPrefs.communityContributions[monthKey] > 0;
}
function getUserChallengeContribution() {
  const monthKey = getCurrentMonthKey();
  return userPrefs.communityContributions[monthKey] || 0;
}
function updateDonationPreview() {
  const amount = document.getElementById("donateAmount").value;
  const ngoId = document.getElementById("donateNgo").value;
  const message = document.getElementById("donateMessage").value;
  const anonymous = document.getElementById("donateAnonymous").checked;
  const previewBox = document.getElementById("donationPreviewBox");
  
  if (amount && parseFloat(amount) > 0) {
    previewBox.style.display = "block";
    document.getElementById("previewAmount").innerText = parseFloat(amount).toFixed(4) + " ETH";
    document.getElementById("previewNgo").innerText = NGO_NAMES[parseInt(ngoId)];
    document.getElementById("previewType").innerText = anonymous ? "Anonymous" : "Public";
    
    const messageRow = document.getElementById("previewMessageRow");
    if (message.trim()) {
      messageRow.style.display = "flex";
      document.getElementById("previewMessage").innerText = message.length > 30 ? message.substring(0, 30) + "..." : message;
    } else {
      messageRow.style.display = "none";
    }
  } else {
    previewBox.style.display = "none";
  }
}

// ============================================
// SECTION 9: RECURRING DONATIONS
// ============================================

async function createRecurringDonation() {
  if (!requireWalletConnection("set up recurring donations")) return;
  
  const ngoId = parseInt(document.getElementById("recurringNgo").value);
  const amountETH = parseFloat(document.getElementById("recurringAmount").value);
  const interval = parseInt(document.getElementById("recurringInterval").value);
  
  if (!amountETH || amountETH <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  try {
    setButtonLoading('recurringBtn', true, 'Setting up...');
    
    const amountInWei = ethers.utils.parseEther(amountETH.toString());
    const tx = await donationCoreContract.createRecurringDonation(ngoId, amountInWei, interval);
    await tx.wait();
    
    setButtonLoading('recurringBtn', false, 'Set Up Recurring');
    showNotification("Recurring donation set up!", 'success');
    resetForm(['recurringAmount']);
    broadcastUpdate('recurring');
    await refreshAllData();
  } catch(err) {
    console.error("Create recurring error:", err);
    setButtonLoading('recurringBtn', false, 'Set Up Recurring');
    showNotification(err.reason || err.message, 'error');
  }
}
async function loadRecurringDonations() {
  if (!donationCoreContract || !signer) return;
  
  try {
    const user = await signer.getAddress();
    const count = await donationCoreContract.getRecurringDonationsCount();
    
    const recurringPromises = [];
    for (let i = 0; i < count; i++) {
      recurringPromises.push(donationCoreContract.recurringDonations(i));
    }
    const recurringDonations = await Promise.all(recurringPromises);
    
    let html = "";
    
    recurringDonations.forEach((rd, i) => {
      if (rd.donor.toLowerCase() === user.toLowerCase()) {
        const amount = parseFloat(ethers.utils.formatEther(rd.amount));
        const interval = parseInt(rd.interval);
        const lastExecuted = parseInt(rd.lastExecuted);
        const active = rd.active;
        const ngoId = parseInt(rd.ngoId);
        const intervalText = getIntervalText(interval);
        const nextPayment = formatNextPayment(lastExecuted, interval);
        const canExecute = active && (lastExecuted === 0 || Date.now() >= (lastExecuted + interval) * 1000);
        
        if (active) {
          html += `
            <div class="recurring-item">
              <div class="recurring-header">
                <div>
                  <span class="recurring-amount">${amount.toFixed(4)} ETH</span>
                  <span class="recurring-frequency">/ ${intervalText}</span>
                </div>
                <span class="status-badge active">Active</span>
              </div>
              <div class="recurring-details">📍 ${NGO_NAMES[ngoId]}</div>
              <div class="recurring-next">
                <span class="recurring-next-icon">⏰</span>
                <span>Next payment: <strong>${nextPayment}</strong></span>
              </div>
              <div class="recurring-actions">
                ${canExecute ? `<button class="btn-execute" onclick="executeRecurring(${i}, '${amount}')">⚡ Pay Now</button>` : ''}
                <button class="btn-cancel" onclick="cancelRecurring(${i}, ${ngoId}, ${amount}, ${interval})">✕ Cancel</button>
              </div>
            </div>
          `;
        }
      }
    });
    
    // Add cancelled recurring donations
    cancelledRecurringData.forEach((item, index) => {
      if (item.donor.toLowerCase() === user.toLowerCase()) {
        const intervalText = getIntervalText(item.interval);
        html += `
          <div class="recurring-item">
            <div class="recurring-header">
              <div>
                <span class="recurring-amount">${item.amount.toFixed(4)} ETH</span>
                <span class="recurring-frequency">/ ${intervalText}</span>
              </div>
              <span class="status-badge empty">Cancelled</span>
            </div>
            <div class="recurring-details">📍 ${NGO_NAMES[item.ngoId]}</div>
            <div class="recurring-actions">
              <button class="btn-delete" onclick="deleteCancelledRecurring(${index})">🗑️ Delete</button>
              <button class="btn-repeat" onclick="repeatCancelledRecurring(${index})">🔄 Repeat</button>
            </div>
          </div>
        `;
      }
    });
    
    document.getElementById("recurringList").innerHTML = html || '<p style="color: var(--text-muted); font-size: 13px;">No recurring donations set up</p>';
    
  } catch(err) {
    console.error("Load recurring error:", err);
  }
}
async function executeRecurring(recurringId, amount) {
  if (!requireWalletConnection("execute recurring donation")) return;
  
  try {
    const valueInWei = ethers.utils.parseEther(amount);
    const tx = await donationCoreContract.executeRecurringDonation(recurringId, { value: valueInWei });
    await tx.wait();
    
    showNotification("Recurring donation executed!", 'success');
    broadcastUpdate('donation');
    await refreshAllData();
    
  } catch(err) {
    console.error("Execute recurring error:", err);
    showNotification(err.reason || err.message, 'error');
  }
}
async function cancelRecurring(recurringId, ngoId, amount, interval) {
  if (!requireWalletConnection("cancel recurring donation")) return;
  
  if (!confirm("Are you sure you want to cancel this recurring donation?")) return;
  
  try {
    const user = await signer.getAddress();
    cancelledRecurringData.push({
      donor: user,
      ngoId: ngoId,
      amount: amount,
      interval: interval,
      cancelledAt: Date.now()
    });
    saveCancelledRecurringToStorage();
    
    const tx = await donationCoreContract.cancelRecurringDonation(recurringId);
    await tx.wait();
    
    showNotification("Recurring donation cancelled!", 'success');
    broadcastUpdate('recurring');
    await refreshAllData();
    
  } catch(err) {
    console.error("Cancel recurring error:", err);
    showNotification(err.reason || err.message, 'error');
  }
}

function deleteCancelledRecurring(index) {
  if (!confirm("Are you sure you want to permanently delete this cancelled recurring donation record?")) {
    return;
  }
  cancelledRecurringData.splice(index, 1);
  saveCancelledRecurringToStorage();
  loadRecurringDonations();
  broadcastUpdate('recurring');
}

async function repeatCancelledRecurring(index) {
  if (!requireWalletConnection("recreate recurring donation")) return;
  
  const item = cancelledRecurringData[index];
  if (!item) return;
  
  try {
    const amountInWei = ethers.utils.parseEther(item.amount.toString());
    const tx = await donationCoreContract.createRecurringDonation(item.ngoId, amountInWei, item.interval);
    await tx.wait();
    
    cancelledRecurringData.splice(index, 1);
    saveCancelledRecurringToStorage();
    
    showNotification("Recurring donation recreated!", 'success');
    broadcastUpdate('recurring');
    await refreshAllData();
  } catch(err) {
    console.error("Repeat recurring error:", err);
    showNotification(err.reason || err.message, 'error');
  }
}

// ============================================
// SECTION 10: MY DONATIONS
// ============================================

async function loadMyDonations() {
  try {
    if (!donationCoreContract || !signer) return;
    
    const user = await signer.getAddress();
    const count = await donationCoreContract.getDonationsCount();
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    myDonations = [];
    let html = "";
    let myDonationNumber = 0;
    
    donations.forEach((d, i) => {
      if (d.donor.toLowerCase() === user.toLowerCase()) {
        myDonationNumber++;
        const donation = {
          index: i,
          myIndex: myDonationNumber,
          globalIndex: i + 1,
          amount: parseFloat(ethers.utils.formatEther(d.amount)),
          ngoId: parseInt(d.ngoId),
          timestamp: parseInt(d.timestamp),
          message: d.message,
          anonymous: d.isAnonymous,
          campaignId: parseInt(d.campaignId)
        };
        myDonations.push(donation);
        
        html += `
          <div class="tx-item">
            <div>
              <span style="color: var(--accent); font-weight: 600;">#${myDonationNumber}</span>
              <span style="color: var(--primary); font-weight: 600;"> ${donation.amount.toFixed(4)} ETH</span>
              <span style="color: var(--text-muted);"> → ${NGO_NAMES[donation.ngoId]}</span>
              <div class="tx-date">${formatDateTime(donation.timestamp)}</div>
            </div>
          </div>
        `;
      }
    });
    
    document.getElementById("myDonationsList").innerHTML = html || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No donations yet</p></div>';
    
    // Update receipt select
    const select = document.getElementById("receiptDonationSelect");
    select.innerHTML = '<option value="">Select a donation...</option>';
    myDonations.forEach((d, i) => {
      select.innerHTML += `<option value="${i}">#${d.myIndex} - ${d.amount.toFixed(4)} ETH - ${NGO_NAMES[d.ngoId]} - ${formatDateShort(d.timestamp)}</option>`;
    });
    
  } catch(err) {
    console.error("Load my donations error:", err);
  }
}

// ============================================
// SECTION 11: CAMPAIGNS
// ============================================

async function loadCampaigns() {
  try {
    if (!campaignManagerContract) return;
    
    const count = await campaignManagerContract.getCampaignsCount();
    
    const campaignPromises = [];
    for (let i = 0; i < count; i++) {
      campaignPromises.push(campaignManagerContract.campaigns(i));
    }
    const campaigns = await Promise.all(campaignPromises);
    
    campaignsData = [];
    let activeCampaigns = [];
    let successfulCampaigns = [];
    let failedCampaigns = [];
    let selectHtml = '<option value="">Select a campaign...</option>';
    
    campaigns.forEach((c, i) => {
      const campaign = {
        id: parseInt(c.id),
        idx: i,
        ngoId: parseInt(c.ngoId),
        title: c.title,
        description: c.description,
        goalAmount: parseFloat(ethers.utils.formatEther(c.goalAmount)),
        raisedAmount: parseFloat(ethers.utils.formatEther(c.raisedAmount)),
        deadline: parseInt(c.deadline),
        active: c.active,
        refundEnabled: c.refundEnabled,
        goalReached: c.goalReached
      };
      campaignsData.push(campaign);
      
      const isExpired = Date.now() / 1000 > campaign.deadline;
      
      if (campaign.goalReached) {
        successfulCampaigns.push(campaign);
      } else if (isExpired || !campaign.active) {
        failedCampaigns.push(campaign);
      } else {
        activeCampaigns.push(campaign);
        selectHtml += `<option value="${i}">${campaign.title} (${NGO_NAMES[campaign.ngoId]})</option>`;
      }
    });
    
    document.getElementById("activeCampaignsList").innerHTML = renderCampaignCards(activeCampaigns, 'active') || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No active campaigns</p></div>';
    document.getElementById("successfulCampaignsList").innerHTML = renderCampaignCards(successfulCampaigns, 'success') || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No successful campaigns yet</p></div>';
    document.getElementById("failedCampaignsList").innerHTML = renderCampaignCards(failedCampaigns, 'failed') || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No expired campaigns</p></div>';
    
    document.getElementById("activeCampaignsCount").innerText = activeCampaigns.length;
    document.getElementById("successfulCampaignsCount").innerText = successfulCampaigns.length;
    document.getElementById("failedCampaignsCount").innerText = failedCampaigns.length;
    
    document.getElementById("campaignSelect").innerHTML = selectHtml;
    
    startCountdownTimers();
    
  } catch(err) {
    console.error("Load campaigns error:", err);
  }
}

function renderCountdown(deadline, elementId) {
  const countdown = getCountdownString(deadline);
  if (!countdown) return '';
  
  const isUrgent = countdown.total < 86400;
  
  return `
    <div class="campaign-countdown ${isUrgent ? 'urgent' : ''}" id="${elementId}">
      <span class="countdown-icon">⏰</span>
      <div class="countdown-unit">
        <span class="countdown-value">${countdown.days}</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${countdown.hours}</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${countdown.minutes}</span>
        <span class="countdown-label">Min</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${countdown.seconds}</span>
        <span class="countdown-label">Sec</span>
      </div>
    </div>
  `;
}

function startCountdownTimers() {
  countdownIntervals.forEach(interval => clearInterval(interval));
  countdownIntervals = [];
  
  campaignsData.forEach((campaign, idx) => {
    const isExpired = Date.now() / 1000 > campaign.deadline;
    if (campaign.active && !campaign.goalReached && !isExpired) {
      const interval = setInterval(() => {
        const el = document.getElementById(`countdown-${idx}`);
        if (el) {
          const countdown = getCountdownString(campaign.deadline);
          if (countdown) {
            const isUrgent = countdown.total < 86400;
            el.className = `campaign-countdown ${isUrgent ? 'urgent' : ''}`;
            el.innerHTML = `
              <span class="countdown-icon">⏰</span>
              <div class="countdown-unit">
                <span class="countdown-value">${countdown.days}</span>
                <span class="countdown-label">Days</span>
              </div>
              <div class="countdown-unit">
                <span class="countdown-value">${countdown.hours}</span>
                <span class="countdown-label">Hours</span>
              </div>
              <div class="countdown-unit">
                <span class="countdown-value">${countdown.minutes}</span>
                <span class="countdown-label">Min</span>
              </div>
              <div class="countdown-unit">
                <span class="countdown-value">${countdown.seconds}</span>
                <span class="countdown-label">Sec</span>
              </div>
            `;
          } else {
            clearInterval(interval);
            loadCampaigns();
          }
        }
      }, 1000);
      countdownIntervals.push(interval);
    }
  });
}

function renderCampaignCards(campaigns, type) {
  if (campaigns.length === 0) return '';
  
  return campaigns.map(campaign => {
    const percent = (campaign.raisedAmount / campaign.goalAmount) * 100;
    let cardClass = '';
    let badgeClass = '';
    let badgeText = '';
    let progressStyle = '';
    
    if (type === 'success') {
      cardClass = 'goal-reached';
      badgeClass = 'goal-reached';
      badgeText = '🎉 Goal Reached!';
    } else if (type === 'failed') {
      cardClass = 'failed';
      badgeClass = 'failed';
      badgeText = 'Expired';
      progressStyle = 'background: linear-gradient(90deg, var(--danger), #dc2626);';
    } else {
      badgeClass = 'active';
      badgeText = 'Active';
    }
    
    return `
      <div class="campaign-card ${cardClass}">
        <div class="campaign-header">
          <h4 class="campaign-title">${campaign.title}</h4>
          <span class="campaign-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="campaign-desc">${campaign.description}</p>
        ${type === 'active' ? renderCountdown(campaign.deadline, `countdown-${campaign.idx}`) : ''}
        <div class="campaign-stats">
          <div class="campaign-stat">
            <div class="campaign-stat-value">${campaign.raisedAmount.toFixed(4)} ETH</div>
            <div class="campaign-stat-label">Raised</div>
          </div>
          <div class="campaign-stat">
            <div class="campaign-stat-value">${campaign.goalAmount.toFixed(4)} ETH</div>
            <div class="campaign-stat-label">Goal</div>
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-header">
            <span>${percent.toFixed(1)}% Complete</span>
            <span>${type === 'active' ? 'Deadline' : 'Ended'}: ${formatDateShort(campaign.deadline)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(percent, 100)}%; ${progressStyle}"></div>
          </div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
          NGO: ${NGO_NAMES[campaign.ngoId]} ${campaign.refundEnabled ? '• Refunds ' + (type === 'failed' ? 'available' : 'enabled') : ''}
        </div>
      </div>
    `;
  }).join('');
}

function updateCampaignInfo() {
  const campaignId = document.getElementById("campaignSelect").value;
  if (campaignId === "" || !campaignsData[campaignId]) {
    document.getElementById("campaignInfo").style.display = "none";
    document.getElementById("campaignDonateForm").style.display = "block";
    document.getElementById("campaignGoalReachedMsg").style.display = "none";
    return;
  }
  
  const campaign = campaignsData[campaignId];
  const percent = (campaign.raisedAmount / campaign.goalAmount) * 100;
  
  document.getElementById("selectedCampaignTitle").innerText = campaign.title;
  document.getElementById("selectedCampaignRaised").innerText = campaign.raisedAmount.toFixed(4) + " ETH raised";
  document.getElementById("selectedCampaignGoal").innerText = "Goal: " + campaign.goalAmount.toFixed(4) + " ETH";
  document.getElementById("selectedCampaignBar").style.width = Math.min(percent, 100) + "%";
  document.getElementById("campaignInfo").style.display = "block";
  
  const countdownContainer = document.getElementById("selectedCampaignCountdown");
  const countdown = getCountdownString(campaign.deadline);
  if (countdown && !campaign.goalReached) {
    countdownContainer.innerHTML = renderCountdown(campaign.deadline, `selected-countdown`);
  } else {
    countdownContainer.innerHTML = '';
  }
  
  const badge = document.getElementById("selectedCampaignBadge");
  if (campaign.goalReached) {
    badge.className = "campaign-badge goal-reached";
    badge.innerText = "Goal Reached!";
    document.getElementById("campaignDonateForm").style.display = "none";
    document.getElementById("campaignGoalReachedMsg").style.display = "block";
  } else {
    badge.className = "campaign-badge active";
    badge.innerText = "Active";
    document.getElementById("campaignDonateForm").style.display = "block";
    document.getElementById("campaignGoalReachedMsg").style.display = "none";
  }
}

async function donateToCampaign() {
  if (!requireWalletConnection("donate to campaign")) return;
  
  const campaignId = parseInt(document.getElementById("campaignSelect").value);
  const amountETH = parseFloat(document.getElementById("campaignDonateAmount").value);
  const message = document.getElementById("campaignDonateMessage").value || "";
  const anonymous = document.getElementById("campaignDonateAnonymous").checked;
  
  if (isNaN(campaignId)) {
    showNotification("Select a campaign", 'error');
    return;
  }
  
  if (!amountETH || amountETH <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  try {
    const isAccepting = await campaignManagerContract.isCampaignAcceptingDonations(campaignId);
    if (!isAccepting) {
      showNotification("This campaign is no longer accepting donations", 'error');
      return;
    }
    
    setButtonLoading('campaignDonateBtn', true, 'Donating...');
    
    const valueInWei = ethers.utils.parseEther(amountETH.toString());
    const tx = await campaignManagerContract.donateToCampaign(campaignId, message, anonymous, { value: valueInWei });
    await tx.wait();
    
    setButtonLoading('campaignDonateBtn', false, 'Donate to Campaign');
    showNotification("Campaign Donation Successful!", 'success');
    resetForm(['campaignDonateAmount', 'campaignDonateMessage', 'campaignDonateAnonymous']);
    document.getElementById("campaignSelect").value = "";
    document.getElementById("campaignInfo").style.display = "none";
    
    broadcastUpdate('donation');
    await refreshAllData();
  } catch(err) {
    console.error("Campaign donate error:", err);
    setButtonLoading('campaignDonateBtn', false, 'Donate to Campaign');
    showNotification(err.reason || err.message, 'error');
  }
}

// ============================================
// SECTION 12: MATCHING POOLS
// ============================================

async function loadMatchingPools() {
  try {
    if (!campaignManagerContract) return;
    
    const count = await campaignManagerContract.getMatchingPoolsCount();
    
    const poolPromises = [];
    for (let i = 0; i < count; i++) {
      poolPromises.push(campaignManagerContract.matchingPools(i));
    }
    const pools = await Promise.all(poolPromises);
    
    let html = "";
    
    pools.forEach(mp => {
      if (mp.active) {
        const maxMatch = parseFloat(ethers.utils.formatEther(mp.maxMatch));
        const matched = parseFloat(ethers.utils.formatEther(mp.matchedAmount));
        const ratio = parseInt(mp.matchRatio);
        const deadline = parseInt(mp.deadline);
        
        html += `
          <div class="campaign-card">
            <div class="campaign-header">
              <h4 class="campaign-title">${NGO_NAMES[parseInt(mp.ngoId)]} Matching</h4>
              <span class="campaign-badge active">${ratio}% Match</span>
            </div>
            <div class="campaign-stats">
              <div class="campaign-stat">
                <div class="campaign-stat-value">${matched.toFixed(4)} ETH</div>
                <div class="campaign-stat-label">Matched</div>
              </div>
              <div class="campaign-stat">
                <div class="campaign-stat-value">${maxMatch.toFixed(4)} ETH</div>
                <div class="campaign-stat-label">Pool Size</div>
              </div>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(matched/maxMatch)*100}%"></div>
              </div>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
              Ends: ${formatDateShort(deadline)}
            </div>
          </div>
        `;
      }
    });
    
    document.getElementById("matchingPoolsList").innerHTML = html || '<div class="empty-state" style="padding: 24px;"><p class="empty-state-icon">🤝</p><p style="color: var(--text-muted);">No active matching pools</p></div>';
    
  } catch(err) {
    console.error("Load matching pools error:", err);
  }
}

// ============================================
// SECTION 13: COMMUNITY & LEADERBOARD
// ============================================

async function loadLeaderboard() {
  try {
    if (!donationCoreContract) return;
    
    const count = await donationCoreContract.getDonationsCount();
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    let donorTotals = {};
    
    donations.forEach(d => {
      const donor = d.donor;
      const amount = parseFloat(ethers.utils.formatEther(d.amount));
      const anonymous = d.isAnonymous;
      
      if (!anonymous) {
        if (!donorTotals[donor]) donorTotals[donor] = 0;
        donorTotals[donor] += amount;
      }
    });
    
    const sorted = Object.entries(donorTotals).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    let html = "";
    sorted.forEach((entry, index) => {
      const rankClass = index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "normal";
      html += `
        <div class="leaderboard-item">
          <div class="rank-badge ${rankClass}">${index + 1}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-address">${shortAddress(entry[0])}</div>
          </div>
          <div class="leaderboard-amount">${entry[1].toFixed(4)} ETH</div>
        </div>
      `;
    });
    
    document.getElementById("leaderboardList").innerHTML = html || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No donors yet</p></div>';
    
    // Update donor stats
    if (signer) {
      const user = await signer.getAddress();
      const myTotal = donorTotals[user] || 0;
      const myRank = sorted.findIndex(e => e[0].toLowerCase() === user.toLowerCase()) + 1;
      
      document.getElementById("donorStats").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="impact-card">
            <div class="impact-value">${myTotal.toFixed(4)}</div>
            <div class="impact-label">Total Donated (ETH)</div>
          </div>
          <div class="impact-card">
            <div class="impact-value">${myRank || '-'}</div>
            <div class="impact-label">Your Rank</div>
          </div>
        </div>
        <p style="margin-top: 15px; font-size: 12px; color: var(--text-muted); text-align: center;">
          ${myDonations.length} total donations made
        </p>
      `;
    }
    
  } catch(err) {
    console.error("Load leaderboard error:", err);
  }
}

// ============================================
// SECTION 14: USER STATS & ACHIEVEMENTS
// ============================================

function updateGoalProgress() {
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  const goal = userPrefs.goal || MIN_PERSONAL_GOAL;
  const percent = Math.min((totalDonated / goal) * 100, 100);
  
  document.getElementById("goalCurrentValue").innerText = totalDonated.toFixed(4);
  document.getElementById("goalTargetDisplay").innerText = goal.toFixed(4);
  document.getElementById("goalPercentage").innerText = percent.toFixed(0);
  
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percent / 100) * circumference;
  document.getElementById("goalProgress").style.strokeDashoffset = offset;
  
  document.getElementById("shareAmount").innerText = totalDonated.toFixed(4) + " ETH";
  
  // Check if goal exceeded
  const goalExceededBox = document.getElementById("goalExceededBox");
  if (goalExceededBox) {
    if (totalDonated > goal) {
      goalExceededBox.style.display = "block";
    } else {
      goalExceededBox.style.display = "none";
    }
  }
}

function updateAchievements() {
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  const donationCount = myDonations.length;
  const uniqueNgos = new Set(myDonations.map(d => d.ngoId)).size;
  const campaignDonations = myDonations.filter(d => d.campaignId > 0).length;
  const streak = calculateStreak();
  
  const hasEarlyBirdDonation = myDonations.some(d => {
    const date = new Date(d.timestamp * 1000);
    const dayOfMonth = date.getDate();
    return dayOfMonth <= 7;
  });
  
  const hasNightOwlDonation = myDonations.some(d => {
    const date = new Date(d.timestamp * 1000);
    const hour = date.getHours();
    return hour >= 22 || hour < 6;
  });
  
  const hasWaveRider = hasParticipatedInChallenge() || userPrefs.badges.includes('wave_rider');
  
  const unlocked = [];
  
  achievements.forEach(a => {
    let isUnlocked = false;
    switch(a.id) {
      case 'first_donation': isUnlocked = donationCount >= 1; break;
      case 'three_donations': isUnlocked = donationCount >= 3; break;
      case 'five_donations': isUnlocked = donationCount >= 5; break;
      case 'ten_donations': isUnlocked = donationCount >= 10; break;
      case 'twenty_donations': isUnlocked = donationCount >= 20; break;
      case 'fifty_donations': isUnlocked = donationCount >= 50; break;
      case 'eth_01': isUnlocked = totalDonated >= 0.1; break;
      case 'eth_05': isUnlocked = totalDonated >= 0.5; break;
      case 'eth_milestone': isUnlocked = totalDonated >= 1; break;
      case 'eth_5': isUnlocked = totalDonated >= 5; break;
      case 'streak_2': isUnlocked = streak >= 2; break;
      case 'streak_3': isUnlocked = streak >= 3; break;
      case 'streak_5': isUnlocked = streak >= 5; break;
      case 'streak_10': isUnlocked = streak >= 10; break;
      case 'all_ngos': isUnlocked = uniqueNgos >= 2; break;
      case 'campaign_donor': isUnlocked = campaignDonations >= 1; break;
      case 'early_bird': isUnlocked = hasEarlyBirdDonation; break;
      case 'night_owl': isUnlocked = hasNightOwlDonation; break;
      case 'wave_rider': isUnlocked = hasWaveRider; break;
    }
    if (isUnlocked) unlocked.push(a.id);
  });
  
  // Update stored badges
  unlocked.forEach(badgeId => {
    if (!userPrefs.badges.includes(badgeId)) {
      userPrefs.badges.push(badgeId);
    }
  });
  saveUserPrefs();
  
  let html = "";
  achievements.forEach(a => {
    const isUnlocked = unlocked.includes(a.id);
    html += `
      <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${a.icon}</div>
        <div class="badge-name">${a.name}</div>
        <div class="badge-desc">${a.desc}</div>
      </div>
    `;
  });
  
  document.getElementById("achievementGrid").innerHTML = html;
  document.getElementById("unlockedBadgeCount").innerText = unlocked.length;
}

function calculateStreak() {
  if (myDonations.length === 0) return 0;
  
  const weeks = new Set();
  myDonations.forEach(d => {
    const date = new Date(d.timestamp * 1000);
    const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
    weeks.add(weekNum);
  });
  
  const sortedWeeks = Array.from(weeks).sort((a, b) => b - a);
  const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  
  let streak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (sortedWeeks[i] === currentWeek - i) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function updateStreak() {
  const streak = calculateStreak();
  document.getElementById("streakCount").innerText = streak;
}

function toggleFavorite(ngoId) {
  const idx = userPrefs.favorites.indexOf(ngoId);
  if (idx > -1) {
    userPrefs.favorites.splice(idx, 1);
  } else {
    userPrefs.favorites.push(ngoId);
  }
  saveUserPrefs();
  updateFavorites();
}

function updateFavorites() {
  const favBtns = ['favBtn0', 'favBtn1'];
  favBtns.forEach((btnId, idx) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.innerText = userPrefs.favorites.includes(idx) ? '❤️' : '🤍';
    }
  });
  
  const ngoCard0 = document.getElementById('ngoCard0');
  const ngoCard1 = document.getElementById('ngoCard1');
  if (ngoCard0) ngoCard0.classList.toggle('favorited', userPrefs.favorites.includes(0));
  if (ngoCard1) ngoCard1.classList.toggle('favorited', userPrefs.favorites.includes(1));
}

// ============================================
// SECTION 15: SHARING FUNCTIONS
// ============================================

function shareOnTwitter() {
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  const text = encodeURIComponent(`I've donated ${totalDonated.toFixed(4)} ETH through GiveChain! 💎 Join me in making a difference. #BlockchainForGood #GiveChain`);
  const url = encodeURIComponent('https://givechain.io');
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnLinkedIn() {
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  const url = encodeURIComponent('https://givechain.io');
  const title = encodeURIComponent('My GiveChain Impact');
  const summary = encodeURIComponent(`I've donated ${totalDonated.toFixed(4)} ETH through GiveChain, a transparent blockchain donation platform.`);
  window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`, '_blank');
}

function copyShareLink() {
  const link = `https://givechain.io/donate?ref=${userPrefs.referralCode}` || 'share';
  navigator.clipboard.writeText(link).then(() => {
    alert("✅ Link copied to clipboard!");
  });
}

function downloadShareCard() {
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  
  const shareText = `
🎉 GiveChain Impact Report 🎉
━━━━━━━━━━━━━━━━━━━━
💎 Total Donated: ${totalDonated.toFixed(4)} ETH
📊 Donations Made: ${myDonations.length}
🏆 Achievements: ${document.getElementById('unlockedBadgeCount').innerText}/18
━━━━━━━━━━━━━━━━━━━━
Join me at givechain.io
#BlockchainForGood #GiveChain
  `;
  
  const blob = new Blob([shareText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'givechain-impact.txt';
  link.click();
}

function copyReferralLink() {
  const link = document.getElementById("referralLink").value;
  navigator.clipboard.writeText(link).then(() => {
    alert("✅ Referral link copied!");
  });
}

// ============================================
// SECTION 16: ADMIN FUNCTIONS
// ============================================

async function updateWithdrawNgoFund() {
  if (!donationCoreContract) return;
  
  const ngoId = parseInt(document.getElementById("withdrawNgo").value);
  try {
    const fund = await donationCoreContract.getNGOFund(ngoId);
    const fundEth = parseFloat(ethers.utils.formatEther(fund));
    document.getElementById("withdrawNgoFundValue").innerText = fundEth.toFixed(4) + " ETH";
  } catch(err) {
    console.error("Error fetching NGO fund:", err);
    document.getElementById("withdrawNgoFundValue").innerText = "0.0000 ETH";
  }
}

async function proposeWithdrawal() {
  if (!requireWalletConnection("propose withdrawal")) return;
  
  if (!isAdmin) {
    showNotification("Admin access required", 'error');
    return;
  }
  
  const ngoId = parseInt(document.getElementById("withdrawNgo").value);
  const amountStr = document.getElementById("withdrawAmount").value.trim();
  const purpose = document.getElementById("withdrawPurpose").value.trim();
  
  if (!amountStr || !purpose) {
    showNotification("Fill all fields!", 'error');
    return;
  }
  
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0.0001) {
    showNotification("Minimum: 0.0001 ETH", 'error');
    return;
  }
  
  try {
    const ngoFund = parseFloat(ethers.utils.formatEther(await donationCoreContract.getNGOFund(ngoId)));
    if (amount > ngoFund) {
      showNotification(`Exceeds ${NGO_NAMES[ngoId]} fund (${ngoFund.toFixed(4)} ETH)`, 'error');
      return;
    }
    
    setButtonLoading('withdrawBtn', true, 'Processing...');
    
    const amountWei = ethers.utils.parseEther(amount.toString());
    const requiredApprovals = parseInt(await adminManagerContract.requiredApprovals());
    
    let tx;
    if (requiredApprovals > 1) {
      tx = await adminManagerContract.proposeWithdrawal(ngoId, amountWei, purpose);
      await tx.wait();
      showNotification("Proposal submitted! Waiting for approvals.", 'success');
    } else {
      tx = await adminManagerContract.withdraw(ngoId, amountWei, purpose);
      await tx.wait();
      showNotification("Withdrawal Successful!", 'success');
    }
    
    setButtonLoading('withdrawBtn', false, 'Propose Withdrawal');
    resetForm(['withdrawAmount', 'withdrawPurpose']);
    broadcastUpdate('withdrawal');
    await refreshAllData();
  } catch(err) {
    console.error("Withdrawal error:", err);
    setButtonLoading('withdrawBtn', false, 'Propose Withdrawal');
    showNotification(err.reason || err.message, 'error');
  }
}

async function loadPendingProposals() {
  try {
    if (!adminManagerContract) return;
    
    const pendingIds = await adminManagerContract.getPendingProposals();
    
    if (pendingIds.length === 0) {
      document.getElementById("proposalsList").innerHTML = '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No pending proposals</p></div>';
      document.getElementById("publicProposalsList").innerHTML = '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No pending proposals</p></div>';
      return;
    }
    
    const requiredApprovals = parseInt(await adminManagerContract.requiredApprovals());
    const currentUser = connectedAddress ? connectedAddress.toLowerCase() : "";
    
    const proposalPromises = pendingIds.map(id => adminManagerContract.getProposalDetails(id));
    const approvalPromises = currentUser ? pendingIds.map(id => adminManagerContract.getProposalApproved(id, currentUser)) : [];
    
    const [proposals, approvals] = await Promise.all([
      Promise.all(proposalPromises),
      currentUser ? Promise.all(approvalPromises) : []
    ]);
    
    let adminHtml = "";
    let publicHtml = "";
    
    proposals.forEach((p, idx) => {
      const amount = parseFloat(ethers.utils.formatEther(p.amount));
      const unlockTime = parseInt(p.unlockTime);
      const isUnlocked = Date.now() / 1000 >= unlockTime;
      const canExecute = p.approvalCount >= requiredApprovals && isUnlocked;
      const hasApproved = approvals[idx] || false;
      
      // Public view
      publicHtml += `
        <div class="transparency-card">
          <div class="transparency-header">
            <div class="transparency-title">Proposal #${p.id}</div>
            <span class="transparency-badge pending">${p.approvalCount}/${requiredApprovals} Approvals</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; font-size: 12px;">
            <div>
              <div style="color: var(--text-muted);">NGO</div>
              <div style="color: var(--text-primary); font-weight: 500;">${NGO_NAMES[parseInt(p.ngoId)]}</div>
            </div>
            <div>
              <div style="color: var(--text-muted);">Amount</div>
              <div style="color: var(--danger); font-weight: 600;">${amount.toFixed(4)} ETH</div>
            </div>
          </div>
          <div style="margin-top: 12px; font-size: 12px;">
            <div style="color: var(--text-muted);">Purpose</div>
            <div style="color: var(--text-primary);">${p.purpose}</div>
          </div>
          <div style="margin-top: 12px; font-size: 11px; color: var(--text-muted);">
            Unlocks: ${formatDateTime(unlockTime)}
          </div>
        </div>
      `;
      
      // Admin view
      if (isAdmin) {
        adminHtml += `
          <div class="proposal-card">
            <div class="proposal-header">
              <span class="proposal-id">Proposal #${p.id}</span>
              <span class="status-badge pending">${p.approvalCount}/${requiredApprovals}</span>
            </div>
            <div class="proposal-info">
              <div class="proposal-field">
                <div class="proposal-field-label">NGO</div>
                <div class="proposal-field-value">${NGO_NAMES[parseInt(p.ngoId)]}</div>
              </div>
              <div class="proposal-field">
                <div class="proposal-field-label">Amount</div>
                <div class="proposal-field-value" style="color: var(--danger);">${amount.toFixed(4)} ETH</div>
              </div>
              <div class="proposal-field">
                <div class="proposal-field-label">Purpose</div>
                <div class="proposal-field-value">${p.purpose}</div>
              </div>
              <div class="proposal-field">
                <div class="proposal-field-label">Unlock Time</div>
                <div class="proposal-field-value">${formatDateTime(unlockTime)}</div>
              </div>
            </div>
            <div class="proposal-actions">
              ${!hasApproved ? `<button class="btn btn-secondary btn-sm" onclick="approveProposal(${p.id})">✓ Approve</button>` : '<span style="color: var(--primary); font-size: 12px;">✓ You approved</span>'}
              ${canExecute ? `<button class="btn btn-primary btn-sm" onclick="executeProposal(${p.id})">⚡ Execute</button>` : ''}
            </div>
          </div>
        `;
      }
    });
    
    document.getElementById("publicProposalsList").innerHTML = publicHtml;
    if (isAdmin) {
      document.getElementById("proposalsList").innerHTML = adminHtml;
    }
    
  } catch(err) {
    console.error("Load pending proposals error:", err);
  }
}

async function approveProposal(proposalId) {
  try {
    if (!adminManagerContract) {
      alert("❌ Connect wallet first!");
      return;
    }
    
    const tx = await adminManagerContract.approveWithdrawal(proposalId);
    await tx.wait();
    
    alert("✅ Proposal approved!");
    await refreshAllData();
    
  } catch(err) {
    console.error("Approve proposal error:", err);
    alert("❌ " + (err.reason || err.message));
  }
}

async function executeProposal(proposalId) {
  try {
    if (!adminManagerContract) {
      alert("❌ Connect wallet first!");
      return;
    }
    
    const tx = await adminManagerContract.executeWithdrawal(proposalId);
    await tx.wait();
    
    alert("✅ Withdrawal executed!");
    broadcastUpdate('withdrawal');
    await refreshAllData();
    
  } catch(err) {
    console.error("Execute proposal error:", err);
    alert("❌ " + (err.reason || err.message));
  }
}

async function createCampaign() {
  if (!requireWalletConnection("create campaign")) return;
  
  if (!isAdmin) {
    showNotification("Admin access required", 'error');
    return;
  }
  
  const title = document.getElementById("campaignTitle").value.trim();
  const description = document.getElementById("campaignDesc").value.trim();
  const ngoId = parseInt(document.getElementById("campaignNgo").value);
  const goalETH = parseFloat(document.getElementById("campaignGoal").value);
  const durationDays = parseInt(document.getElementById("campaignDuration").value);
  const refundEnabled = document.getElementById("campaignRefund").checked;
  
  if (!title || !goalETH || !durationDays) {
    showNotification("Fill required fields!", 'error');
    return;
  }
  
  try {
    setButtonLoading('createCampaignBtn', true, 'Creating...');
    
    const goalWei = ethers.utils.parseEther(goalETH.toString());
    const tx = await campaignManagerContract.createCampaign(ngoId, title, description, goalWei, durationDays, refundEnabled);
    await tx.wait();
    
    setButtonLoading('createCampaignBtn', false, 'Create Campaign');
    showNotification("Campaign created!", 'success');
    resetForm(['campaignTitle', 'campaignDesc', 'campaignGoal', 'campaignDuration', 'campaignRefund']);
    broadcastUpdate('campaign');
    await refreshAllData();
  } catch(err) {
    console.error("Create campaign error:", err);
    setButtonLoading('createCampaignBtn', false, 'Create Campaign');
    showNotification(err.reason || err.message, 'error');
  }
}
async function recordImpact() {
  if (!requireWalletConnection("record impact")) return;
  
  if (!isAdmin) {
    showNotification("Admin access required", 'error');
    return;
  }
  
  const ngoId = parseInt(document.getElementById("impactNgo").value);
  const metricSelect = document.getElementById("impactMetricName");
  let metricName = metricSelect.value;
  
  if (metricName === 'custom') {
    metricName = document.getElementById("impactMetricCustom").value.trim();
    if (!metricName) {
      showNotification("Enter a custom metric name", 'error');
      return;
    }
  }
  
  const value = parseInt(document.getElementById("impactValue").value);
  const proofHash = document.getElementById("impactProofHash").value.trim() || "";
  
  if (!value || value <= 0) {
    showNotification("Enter a valid value", 'error');
    return;
  }
  
  try {
    setButtonLoading('recordImpactBtn', true, 'Recording...');
    
    const tx = await campaignManagerContract.recordImpactMetric(ngoId, metricName, value, proofHash);
    await tx.wait();
    
    setButtonLoading('recordImpactBtn', false, 'Record Impact');
    showNotification("Impact metric recorded!", 'success');
    resetForm(['impactValue', 'impactProofHash', 'impactMetricCustom']);
    document.getElementById("impactMetricName").value = "Meals Served";
    document.getElementById("impactMetricCustom").style.display = "none";
    
    await refreshAllData();
  } catch(err) {
    console.error("Record impact error:", err);
    setButtonLoading('recordImpactBtn', false, 'Record Impact');
    showNotification(err.reason || err.message, 'error');
  }
}
async function createMatchingPool() {
  if (!requireWalletConnection("create matching pool")) return;
  
  if (!isAdmin) {
    showNotification("Admin access required", 'error');
    return;
  }
  
  const ngoId = parseInt(document.getElementById("matchNgo").value);
  const amountETH = parseFloat(document.getElementById("matchAmount").value);
  const ratio = parseInt(document.getElementById("matchRatio").value);
  const durationDays = parseInt(document.getElementById("matchDuration").value);
  
  if (!amountETH || amountETH <= 0) {
    showNotification("Enter a valid amount", 'error');
    return;
  }
  
  if (!durationDays || durationDays <= 0) {
    showNotification("Enter a valid duration", 'error');
    return;
  }
  
  try {
    setButtonLoading('createMatchBtn', true, 'Creating...');
    
    const valueInWei = ethers.utils.parseEther(amountETH.toString());
    const tx = await campaignManagerContract.createMatchingPool(ngoId, ratio, durationDays, { value: valueInWei });
    await tx.wait();
    
    setButtonLoading('createMatchBtn', false, 'Create Matching Pool');
    showNotification("Matching pool created!", 'success');
    resetForm(['matchAmount', 'matchDuration']);
    await refreshAllData();
  } catch(err) {
    console.error("Create matching pool error:", err);
    setButtonLoading('createMatchBtn', false, 'Create Matching Pool');
    showNotification(err.reason || err.message, 'error');
  }
}

// ============================================
// SECTION 17: HISTORY & TABLES
// ============================================

async function loadUsageHistory() {
  try {
    if (!adminManagerContract) return;

    const count = await adminManagerContract.getWithdrawalsCount();
    const tbody = document.getElementById("usageTableBody");
    usageData = [];

    if (parseInt(count) === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No usage records yet</td></tr>';
      return;
    }

    const withdrawalPromises = [];
    for (let i = 0; i < count; i++) {
      withdrawalPromises.push(adminManagerContract.withdrawals(i));
    }
    const withdrawals = await Promise.all(withdrawalPromises);

    let rows = "";
    withdrawals.forEach((w, i) => {
      const amount = ethers.utils.formatEther(w.amount);
      const ngoId = parseInt(w.ngoId);
      const purpose = w.purpose;
      const ts = parseInt(w.timestamp);
      const date = formatDateTime(ts);
      const ngoName = NGO_NAMES[ngoId] || "Unknown";

      usageData.push({ index: i + 1, date, ngoName, purpose, amount: parseFloat(amount) });

      rows += `<tr>
        <td style="font-weight: 600;">${i + 1}</td>
        <td>${date}</td>
        <td style="color: var(--accent);">${ngoName}</td>
        <td>${purpose}</td>
        <td style="color: var(--danger); font-weight: 600;">-${parseFloat(amount).toFixed(4)} ETH</td>
      </tr>`;
    });

    tbody.innerHTML = rows;

  } catch(err) {
    console.error("Load usage history error:", err);
  }
}

async function loadDonationHistory() {
  try {
    if (!donationCoreContract) return;

    const count = await donationCoreContract.getDonationsCount();
    const tbody = document.getElementById("donationTableBody");
    donationData = [];

    if (parseInt(count) === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No donations yet</td></tr>';
      return;
    }

    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);

    let rows = "";
    donations.forEach((d, i) => {
      const donor = d.donor;
      const amount = ethers.utils.formatEther(d.amount);
      const ngoId = parseInt(d.ngoId);
      const ts = parseInt(d.timestamp);
      const anonymous = d.isAnonymous;
      const date = formatDateTime(ts);
      const ngoName = NGO_NAMES[ngoId] || "Unknown";
      const displayDonor = anonymous ? "Anonymous" : shortAddress(donor);

      donationData.push({ index: i + 1, date, ngoName, donor, shortDonor: displayDonor, amount: parseFloat(amount), anonymous });

      rows += `<tr>
        <td style="font-weight: 600;">${i + 1}</td>
        <td>${date}</td>
        <td style="color: var(--accent);">${ngoName}</td>
        <td title="${anonymous ? 'Anonymous' : donor}">${displayDonor}</td>
        <td style="color: var(--primary); font-weight: 600;">+${parseFloat(amount).toFixed(4)} ETH</td>
      </tr>`;
    });

    tbody.innerHTML = rows;

  } catch(err) {
    console.error("Load donation history error:", err);
  }
}

function filterUsageTable() {
  const searchTerm = document.getElementById("usageSearch").value.toLowerCase();
  const tbody = document.getElementById("usageTableBody");
  
  if (usageData.length === 0) return;
  
  const filtered = usageData.filter(item => 
    item.purpose.toLowerCase().includes(searchTerm) ||
    item.ngoName.toLowerCase().includes(searchTerm) ||
    item.date.toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching records</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(item => `<tr>
    <td style="font-weight: 600;">${item.index}</td>
    <td>${item.date}</td>
    <td style="color: var(--accent);">${item.ngoName}</td>
    <td>${item.purpose}</td>
    <td style="color: var(--danger); font-weight: 600;">-${item.amount.toFixed(4)} ETH</td>
  </tr>`).join("");
}

function filterDonationTable() {
  const searchTerm = document.getElementById("donationSearch").value.toLowerCase();
  const tbody = document.getElementById("donationTableBody");
  
  if (donationData.length === 0) return;
  
  const filtered = donationData.filter(item => 
    item.ngoName.toLowerCase().includes(searchTerm) ||
    item.donor.toLowerCase().includes(searchTerm) ||
    item.date.toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching records</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(item => `<tr>
    <td style="font-weight: 600;">${item.index}</td>
    <td>${item.date}</td>
    <td style="color: var(--accent);">${item.ngoName}</td>
    <td title="${item.anonymous ? 'Anonymous' : item.donor}">${item.shortDonor}</td>
    <td style="color: var(--primary); font-weight: 600;">+${item.amount.toFixed(4)} ETH</td>
  </tr>`).join("");
}

function exportUsageCSV() {
  if (usageData.length === 0) {
    alert("No data to export");
    return;
  }
  
  let csv = "Sr No,Date & Time,NGO,Purpose,Amount (ETH)\n";
  usageData.forEach(item => {
    csv += `${item.index},"${item.date}","${item.ngoName}","${item.purpose}",-${item.amount.toFixed(4)}\n`;
  });
  
  downloadCSV(csv, "fund_usage_history.csv");
}

function exportDonationCSV() {
  if (donationData.length === 0) {
    alert("No data to export");
    return;
  }
  
  let csv = "Sr No,Date & Time,NGO,Donor,Amount (ETH)\n";
  donationData.forEach(item => {
    csv += `${item.index},"${item.date}","${item.ngoName}","${item.donor}",${item.amount.toFixed(4)}\n`;
  });
  
  downloadCSV(csv, "donation_history.csv");
}

function exportMyDonationsCSV() {
  if (myDonations.length === 0) {
    alert("No data to export");
    return;
  }
  
  let csv = "Date,NGO,Amount (ETH)\n";
  myDonations.forEach(d => {
    csv += `"${formatDateTime(d.timestamp)}","${NGO_NAMES[d.ngoId]}",${d.amount.toFixed(4)}\n`;
  });
  
  downloadCSV(csv, "my_donations.csv");
}

// ============================================
// SECTION 18: IMPACT METRICS
// ============================================

async function loadImpactMetrics() {
  try {
    if (!campaignManagerContract) return;
    
    const [impactCount, msCount] = await Promise.all([
      campaignManagerContract.getImpactMetricsCount(),
      campaignManagerContract.getMilestoneUpdatesCount()
    ]);
    
    const impactPromises = [];
    for (let i = 0; i < impactCount; i++) {
      impactPromises.push(campaignManagerContract.impactMetrics(i));
    }
    
    const msPromises = [];
    for (let i = 0; i < msCount; i++) {
      msPromises.push(campaignManagerContract.milestoneUpdates(i));
    }
    
    const [impactMetrics, milestones] = await Promise.all([
      Promise.all(impactPromises),
      Promise.all(msPromises)
    ]);
    
    let metrics = {
      "Meals Served": 0,
      "Students Helped": 0,
      "Medical Checkups": 0,
      "Families Supported": 0
    };
    
    let allMetrics = [];
    
    impactMetrics.forEach(m => {
      const name = m.metricName;
      const value = parseInt(m.value);
      
      if (metrics.hasOwnProperty(name)) {
        metrics[name] += value;
      }
      
      allMetrics.push({
        name,
        value,
        timestamp: parseInt(m.timestamp),
        ngoId: parseInt(m.ngoId),
        proofHash: m.proofHash,
        type: 'impact'
      });
    });
    
    document.getElementById("impactMeals").innerText = metrics["Meals Served"].toLocaleString();
    document.getElementById("impactStudents").innerText = metrics["Students Helped"].toLocaleString();
    document.getElementById("impactMedical").innerText = metrics["Medical Checkups"].toLocaleString();
    document.getElementById("impactFamilies").innerText = metrics["Families Supported"].toLocaleString();
    
    milestones.forEach(ms => {
      allMetrics.push({
        title: ms.title,
        description: ms.description,
        value: parseFloat(ethers.utils.formatEther(ms.fundingMilestone)),
        timestamp: parseInt(ms.timestamp),
        campaignId: parseInt(ms.campaignId),
        proofHash: ms.proofHash,
        type: 'milestone'
      });
    });
    
    allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    
    let msHtml = "";
    allMetrics.slice(0, 10).forEach(item => {
      if (item.type === 'impact') {
        msHtml += `
          <div class="milestone-item">
            <div class="milestone-header">
              <div class="milestone-title">📊 ${item.name}</div>
              <div class="milestone-value">+${item.value.toLocaleString()}</div>
            </div>
            <div class="milestone-desc">Impact recorded for ${NGO_NAMES[item.ngoId]}</div>
            <div class="milestone-meta">
              <span>${formatDateShort(item.timestamp)}</span>
              ${item.proofHash ? `<span title="${item.proofHash}">🔗 Verified</span>` : ''}
            </div>
          </div>
        `;
      } else {
        msHtml += `
          <div class="milestone-item">
            <div class="milestone-header">
              <div class="milestone-title">🏆 ${item.title}</div>
              <div class="milestone-value">${item.value.toFixed(4)} ETH</div>
            </div>
            <div class="milestone-desc">${item.description}</div>
            <div class="milestone-meta">
              <span>${formatDateShort(item.timestamp)}</span>
              ${item.proofHash ? `<span title="${item.proofHash}">🔗 Verified</span>` : ''}
            </div>
          </div>
        `;
      }
    });
    
    document.getElementById("milestonesList").innerHTML = msHtml || '<div class="empty-state" style="padding: 24px;"><p style="color: var(--text-muted);">No updates recorded yet</p></div>';
    
  } catch(err) {
    console.error("Load impact metrics error:", err);
  }
}

// ============================================
// SECTION 19: MODAL FUNCTIONS
// ============================================

function openReceiptModal() {
  if (!requireWalletConnection("generate receipt")) return;
  
  if (myDonations.length === 0) {
    showNotification("No donations to generate receipt for", 'error');
    return;
  }
  document.getElementById("receiptModal").classList.add("active");
}
function openGoalModal() {
  if (!requireWalletConnection("set personal goal")) return;
  
  document.getElementById("goalAmountInput").value = userPrefs.goal || MIN_PERSONAL_GOAL;
  document.getElementById("goalModal").classList.add("active");
}

function closeReceiptModal() {
  document.getElementById("receiptModal").classList.remove("active");
}

function updateReceiptPreview() {
  const index = document.getElementById("receiptDonationSelect").value;
  if (index === "" || !myDonations[index]) {
    document.getElementById("receiptPreviewContainer").style.display = "none";
    return;
  }
  
  const donation = myDonations[index];
  
  document.getElementById("receiptNumber").innerText = "#" + String(donation.index + 1).padStart(4, '0');
  document.getElementById("receiptDate").innerText = formatDateTime(donation.timestamp);
  document.getElementById("receiptNgo").innerText = NGO_NAMES[donation.ngoId];
  document.getElementById("receiptDonor").innerText = shortAddress(connectedAddress);
  document.getElementById("receiptAmount").innerText = donation.amount.toFixed(4) + " ETH";
  
  document.getElementById("receiptPreviewContainer").style.display = "block";
}

function downloadReceipt() {
  const index = document.getElementById("receiptDonationSelect").value;
  if (index === "" || !myDonations[index]) return;
  
  const donation = myDonations[index];
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(40);
  doc.text("💎", 105, 35, { align: "center" });
  
  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129);
  doc.text("DONATION RECEIPT", 105, 65, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("GiveChain - Blockchain Verified", 105, 73, { align: "center" });
  
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(20, 80, 190, 80);
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  
  let y = 95;
  const addRow = (label, value) => {
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 25, y);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(value, 185, y, { align: "right" });
    y += 12;
  };
  
  addRow("Receipt Number:", "#" + String(donation.index + 1).padStart(4, '0'));
  addRow("Date & Time:", formatDateTime(donation.timestamp));
  addRow("NGO:", NGO_NAMES[donation.ngoId]);
  addRow("Donor Address:", shortAddress(connectedAddress));
  
  y += 10;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, y, 170, 30, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("DONATION AMOUNT", 105, y + 10, { align: "center" });
  
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text(donation.amount.toFixed(4) + " ETH", 105, y + 23, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("This receipt was generated from blockchain records.", 105, 270, { align: "center" });
  doc.text("Contract: " + DONATION_CORE_ADDRESS, 105, 278, { align: "center" });
  
  doc.save("donation_receipt_" + (donation.index + 1) + ".pdf");
}

function openGoalModal() {
  document.getElementById("goalAmountInput").value = userPrefs.goal || MIN_PERSONAL_GOAL;
  document.getElementById("goalModal").classList.add("active");
}

function closeGoalModal() {
  document.getElementById("goalModal").classList.remove("active");
}

function saveGoal() {
  const goal = parseFloat(document.getElementById("goalAmountInput").value);
  if (goal && goal >= MIN_PERSONAL_GOAL) {
    userPrefs.goal = goal;
    saveUserPrefs();
    updateGoalProgress();
    closeGoalModal();
  } else {
    alert(`❌ Minimum goal is ${MIN_PERSONAL_GOAL} ETH`);
  }
}

function increaseGoal() {
  const currentGoal = userPrefs.goal || MIN_PERSONAL_GOAL;
  openGoalModal();
  saveUserPrefs();
  updateGoalProgress();
}

// ============================================
// SECTION 20: DOCUMENT DOWNLOADS
// ============================================

function downloadNgoDocument(ngoKey, docKey) {
  const doc = ngoDocuments[ngoKey]?.[docKey];
  if (!doc) {
    alert("Document not found");
    return;
  }
  
  // Create and trigger download link
  const link = document.createElement('a');
  link.href = doc.path;
  link.download = doc.filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function viewOnExplorer() {
  window.open(`https://sepolia.etherscan.io/address/${DONATION_CORE_ADDRESS}`, '_blank');
}

// ============================================
// DOCUMENTATION PDF - FIXED HEADER ALIGNMENT
// ============================================
function downloadDocumentation() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let y = 20;
  const pageHeight = 300;
  const margin = 20;
  const lineHeight = 6;
  const headerHeight = 20;
  const footerHeight = 25;
  let pageNumber = 1;
  
  function addHeader() {
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text("ðŸ’Ž GiveChain", 95, 20, { align: "center" });
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.line(margin, headerHeight + 8, 190, headerHeight + 8);
  }

  function addFooter() {
    const footerY = 285;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 8, 190, footerY - 8);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont(undefined, 'normal');
    doc.text("Built with Solidity, ethers.js and MetaMask on Ethereum Sepolia Testnet", 105, footerY - 3, { align: "center" });
    doc.text("Â© 2026 GiveChain. All rights reserved. | Page " + pageNumber, 105, footerY + 2, { align: "center" });
  }
  
  function checkPageBreak(neededSpace) {
    if (y + neededSpace > pageHeight - footerHeight) {
      addFooter();
      doc.addPage();
      pageNumber++;
      addHeader();
      y = headerHeight + 15;
    }
  }
  
  function addTitle(text) {
    y += 10;
    checkPageBreak(20);
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text(text, 105, y, { align: "center" });
  }
  
  function addSubtitle(text) {
    y += 7;
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'normal');
    doc.text(text, 105, y, { align: "center" });
    y += 5;
  }
  
  function addHeading(text) {
    checkPageBreak(20);
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, y);
    y += 8;
  }

  function addSubHeading(text) {
    checkPageBreak(12);
    y += 3;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, y);
    y += 7;
  }
  
  function addParagraph(text) {
    checkPageBreak(lineHeight * 3);
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(text, 170);
    lines.forEach(line => {
      checkPageBreak(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    });
    y += 2;
  }
  
  function addBullet(text) {
    checkPageBreak(lineHeight * 2);
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.setFont(undefined, 'normal');
    doc.text("â€¢", margin + 2, y);
    const lines = doc.splitTextToSize(text, 160);
    lines.forEach((line, i) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin + 8, y);
      y += lineHeight;
    });
  }
  
  function addTableRow(col1, col2, isHeader = false) {
    checkPageBreak(8);
    if (isHeader) {
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y - 4, 170, 8, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFont(undefined, 'bold');
    } else {
      doc.setTextColor(75, 85, 99);
      doc.setFont(undefined, 'normal');
    }
    doc.setFontSize(9);
    doc.text(col1, margin + 2, y);
    doc.text(col2, margin + 60, y);
    y += 7;
  }
  
  function addLine() {
    checkPageBreak(5);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.line(margin, y, 190, y);
    y += 5;
  }
  
  // First page header
  addHeader();
  y = headerHeight + 10;
  
  // Document content
  addTitle("GiveChain Documentation");
  addSubtitle("Transparent Blockchain Donations Platform");
  addLine();
  
  addHeading("Overview");
  addParagraph("GiveChain is a decentralized donation tracking platform built on Ethereum Sepolia testnet. Users can donate ETH directly to registered NGOs through MetaMask, and every transaction is permanently recorded on-chain for full transparency.");
  
  addHeading("Contract Addresses");
  addTableRow("Contract", "Address", true);
  addTableRow("DonationCore", donationCoreAddress);
  addTableRow("CampaignManager", campaignManagerAddress);
  addTableRow("AdminManager", adminManagerAddress);
  
  addHeading("Core Features");
  addBullet("MetaMask Wallet Integration - Connect your Ethereum wallet in one click");
  addBullet("ETH Donations - Donate to your chosen NGO directly on-chain");
  addBullet("Live Progress Bar - Visual monthly fundraising progress toward the target");
  addBullet("NGO Cards - Per-NGO fund totals with transaction history");
  addBullet("Donation History Table - Searchable table with donor address, NGO, amount & timestamp");
  addBullet("Fund Usage History Table - Track all withdrawals with purpose and amount");
  addBullet("PDF Receipt Generation - Download blockchain-verified donation receipts");
  
  addHeading("Campaign Features");
  addBullet("Campaign Creation - Create fundraising campaigns with goals and deadlines");
  addBullet("Live Countdown Timer - Real-time countdown showing time remaining");
  addBullet("Recurring Donations - Set up daily, weekly, or monthly recurring donations");
  addBullet("Donation Matching - Corporate sponsors can create matching pools");
  addBullet("Impact Metrics - Record and display real-world impact data");
  
  addHeading("Admin Features");
  addBullet("Admin Panel - Check contract balance, propose withdrawals");
  addBullet("Multi-Signature Withdrawals - Require multiple approvals for large withdrawals");
  addBullet("24-Hour Time Lock - Withdrawals have a delay for security");
  addBullet("Daily Limits - Configurable daily withdrawal limits");
  
  addHeading("Technology Stack");
  addTableRow("Layer", "Technology", true);
  addTableRow("Frontend", "HTML, CSS, Vanilla JavaScript");
  addTableRow("Blockchain", "Ethereum - Sepolia Testnet");
  addTableRow("Smart Contract", "Solidity ^0.8.4");
  addTableRow("Web3 Library", "ethers.js v5.7.2");
  addTableRow("PDF Generation", "jsPDF");
  addTableRow("Wallet", "MetaMask");
  
  addHeading("Registered NGOs");
  addTableRow("ID", "Name & Focus", true);
  addTableRow("0", "HelpCare NGO - Food & Healthcare");
  addTableRow("1", "Education NGO - Children's Education");
  
  addHeading("Smart Contract Functions");
  addSubHeading("DonationCore");
  addBullet("donate(ngoId) - Donate ETH to a specific NGO");
  addBullet("donateWithMessage(ngoId, message, anonymous) - Donate with optional message");
  addBullet("createRecurringDonation(ngoId, amount, interval) - Set up recurring donation");
  addBullet("executeRecurringDonation(recurringId) - Execute a pending recurring donation");
  addBullet("cancelRecurringDonation(recurringId) - Cancel a recurring donation");
  
  addSubHeading("CampaignManager");
  addBullet("createCampaign(...) - Create a new fundraising campaign");
  addBullet("donateToCampaign(campaignId, message, anonymous) - Donate to a specific campaign");
  addBullet("createMatchingPool(ngoId, ratio, duration) - Create a donation matching pool");
  addBullet("recordImpactMetric(ngoId, name, value, proof) - Record impact metrics");
  
  addSubHeading("AdminManager");
  addBullet("proposeWithdrawal(ngoId, amount, purpose) - Propose a withdrawal");
  addBullet("approveWithdrawal(proposalId) - Approve a pending proposal");
  addBullet("executeWithdrawal(proposalId) - Execute an approved withdrawal");
  addBullet("withdraw(ngoId, amount, purpose) - Direct withdrawal (single-sig mode)");
  
  addHeading("Quick Start Guide");
  addSubHeading("Prerequisites");
  addBullet("Install MetaMask browser extension from metamask.io");
  addBullet("Switch to Sepolia test network in MetaMask");
  addBullet("Get test ETH from a Sepolia faucet (sepoliafaucet.com)");
  
  addSubHeading("Using the DApp");
  addBullet("Open the application in your browser");
  addBullet("Click 'Connect Wallet' to connect MetaMask");
  addBullet("Enter an amount and select an NGO");
  addBullet("Click 'Donate' and confirm in MetaMask");
  addBullet("View your donation in the history tables");
  
  addHeading("Security Features");
  addBullet("Multi-Signature Withdrawals - Configurable approval requirements");
  addBullet("24-Hour Time Lock - Withdrawal proposals have a delay");
  addBullet("Daily Withdrawal Limits - Prevents rapid fund drainage");
  addBullet("Role-Based Access - Owner and approver permissions");
  addBullet("On-Chain Transparency - All transactions are publicly verifiable");
  
  addHeading("License");
  addParagraph("This project is open source and available under the MIT License.");
  
  // Add footer to the last page
  addFooter();
  
  doc.save("GiveChain_Documentation.pdf");
}

// ============================================
// SECTION 21: POLLING & EVENT LISTENERS
// ============================================

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  pollingInterval = setInterval(async () => {
    await checkForUpdates();
  }, POLLING_INTERVAL);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function checkForUpdates() {
  try {
    if (!donationCoreContract) return;
    
    const currentCount = await donationCoreContract.getDonationsCount();
    const count = parseInt(currentCount);
    
    if (count !== lastKnownDonationCount && lastKnownDonationCount > 0) {
      showSyncIndicator(true);
      await refreshAllData();
      showSyncIndicator(false);
    }
    lastKnownDonationCount = count;
  } catch (err) {
    console.error("Polling error:", err);
  }
}

function setupContractEventListeners() {
  if (!donationCoreContract) return;
  
  donationCoreContract.on("DonationReceived", async (donor, amount, ngoId, campaignId, timestamp, isAnonymous) => {
    console.log("New donation received:", ethers.utils.formatEther(amount), "ETH");
    broadcastUpdate('donation');
    await refreshAllData();
  });
}

// Cross-tab sync handler
window.addEventListener('storage', function(e) {
  if (e.key === 'givechain_data_update') {
    const update = JSON.parse(e.newValue);
    if (update && update.timestamp) {
      showSyncIndicator(true);
      refreshAllData().then(() => {
        showSyncIndicator(false);
      });
    }
  }
});

// ============================================
// SECTION 22: UI EVENT LISTENERS
// ============================================

function setupUIEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-tab, .mobile-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Wallet connection
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectWallet);
  }
  
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', () => {
      if (!requireWalletConnection("copy address")) return;
      copyWalletAddress();
    });
  }
  
  // Quick donate - with wallet check
  const quickDonateBtn = document.getElementById('quickDonateBtn');
  if (quickDonateBtn) {
    quickDonateBtn.addEventListener('click', () => {
      if (!requireWalletConnection("quick donate")) return;
      quickDonate();
    });
  }
  
  // One-time donation
  const donateAmount = document.getElementById('donateAmount');
  if (donateAmount) {
    donateAmount.addEventListener('input', () => {
      if (!requireWalletConnection("one-time donation")) return;
      updateDonationPreview();
    });
  }
  
  const donateNgo = document.getElementById('donateNgo');
  if (donateNgo) {
    donateNgo.addEventListener('change', () => {
      if (!requireWalletConnection("one-time donation")) return;
      updateDonationPreview();
    });
  }
  
  const donateMessage = document.getElementById('donateMessage');
  if (donateMessage) {
    donateMessage.addEventListener('input', () => {
      if (!requireWalletConnection("one-time donation")) return;
      updateDonationPreview();
    });
  }
  
  const donateAnonymous = document.getElementById('donateAnonymous');
  if (donateAnonymous) {
    donateAnonymous.addEventListener('change', () => {
      if (!requireWalletConnection("one-time donation")) return;
      updateDonationPreview();
    });
  }
  
  const donateBtn = document.getElementById('donateBtn');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      if (!requireWalletConnection("one-time donation")) return;
      donate();
    });
  }
  
  // Recurring donation
  const recurringBtn = document.getElementById('recurringBtn');
  if (recurringBtn) {
    recurringBtn.addEventListener('click', () => {
      if (!requireWalletConnection("recurring donation")) return;
      createRecurringDonation();
    });
  }
  
  // Campaign donation
  const campaignSelect = document.getElementById('campaignSelect');
  if (campaignSelect) {
    campaignSelect.addEventListener('change', () => {
      if (!requireWalletConnection("campaign donation")) return;
      updateCampaignInfo();
    });
  }
  
  const campaignDonateBtn = document.getElementById('campaignDonateBtn');
  if (campaignDonateBtn) {
    campaignDonateBtn.addEventListener('click', () => {
      if (!requireWalletConnection("campaign donation")) return;
      donateToCampaign();
    });
  }
  
  // Community donation
  const communityDonateBtn = document.getElementById('communityDonateBtn');
  if (communityDonateBtn) {
    communityDonateBtn.addEventListener('click', () => {
      if (!requireWalletConnection("community donation")) return;
      communityDonate();
    });
  }
  
  // Favorites - with wallet check
  const favBtn0 = document.getElementById('favBtn0');
  if (favBtn0) {
    favBtn0.addEventListener('click', () => {
      if (!requireWalletConnection("add favorites")) return;
      toggleFavorite(0);
    });
  }
  
  const favBtn1 = document.getElementById('favBtn1');
  if (favBtn1) {
    favBtn1.addEventListener('click', () => {
      if (!requireWalletConnection("add favorites")) return;
      toggleFavorite(1);
    });
  }
  
  // Goal
  const editGoalBtn = document.getElementById('editGoalBtn');
  if (editGoalBtn) {
    editGoalBtn.addEventListener('click', () => {
      if (!requireWalletConnection("edit goal")) return;
      openGoalModal();
    });
  }
  
  const closeGoalModalBtn = document.getElementById('closeGoalModal');
  if (closeGoalModalBtn) {
    closeGoalModalBtn.addEventListener('click', () => {
      if (!requireWalletConnection("close goal modal")) return;
      closeGoalModal();
    });
  }
  
  const saveGoalBtn = document.getElementById('saveGoalBtn');
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', () => {
      if (!requireWalletConnection("save goal")) return;
      saveGoal();
    });
  }
  
  const increaseGoalBtn = document.getElementById('increaseGoalBtn');
  if (increaseGoalBtn) {
    increaseGoalBtn.addEventListener('click', () => {
      if (!requireWalletConnection("increase goal")) return;
      increaseGoal();
    });
  }
  
  // Receipt
  const openReceiptBtn = document.getElementById('openReceiptBtn');
  if (openReceiptBtn) {
    openReceiptBtn.addEventListener('click', () => {
      if (!requireWalletConnection("open receipt modal")) return;
      openReceiptModal();
    });
  }
  
  const closeReceiptModalBtn = document.getElementById('closeReceiptModal');
  if (closeReceiptModalBtn) {
    closeReceiptModalBtn.addEventListener('click', () => {
      if (!requireWalletConnection("close receipt modal")) return;
      closeReceiptModal();
    });
  }
  
  const receiptDonationSelect = document.getElementById('receiptDonationSelect');
  if (receiptDonationSelect) {
    receiptDonationSelect.addEventListener('change', updateReceiptPreview);
  }
  
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', () => {
      if (!requireWalletConnection("download receipt")) return;
      downloadReceipt();
    });
  }
  
  // Export buttons - with wallet check
  const exportMyDonationsBtn = document.getElementById('exportMyDonationsBtn');
  if (exportMyDonationsBtn) {
    exportMyDonationsBtn.addEventListener('click', () => {
      if (!requireWalletConnection("export donations")) return;
      exportMyDonationsCSV();
    });
  }
  
  const exportUsageBtn = document.getElementById('exportUsageBtn');
  if (exportUsageBtn) {
    exportUsageBtn.addEventListener('click', () => {
      if (!requireWalletConnection("export Usage")) return;
      exportDonationsCSV();
    });
  }
  
  const exportDonationBtn = document.getElementById('exportDonationBtn');
  if (exportDonationBtn) {
    exportDonationBtn.addEventListener('click', () => {
      if (!requireWalletConnection("export Donation")) return;
      exportDonationCSV();
    });
  }
  
  // Search
  const usageSearch = document.getElementById('usageSearch');
  if (usageSearch) {
    usageSearch.addEventListener('input', () => {
      if (!requireWalletConnection("search usage")) return;
      filterUsageTable();
    });
  }
  
  const donationSearch = document.getElementById('donationSearch');
  if (donationSearch) {
    donationSearch.addEventListener('input', () => {
      if (!requireWalletConnection("search donations")) return;
      filterDonationTable();
    });
  }
  
  // Sharing - all with wallet check
  const shareTwitterBtn = document.getElementById('shareTwitterBtn');
  if (shareTwitterBtn) {
    shareTwitterBtn.addEventListener('click', () => {
      if (!requireWalletConnection("share on Twitter")) return;
      shareOnTwitter();
    });
  }
  
  const shareLinkedInBtn = document.getElementById('shareLinkedInBtn');
  if (shareLinkedInBtn) {
    shareLinkedInBtn.addEventListener('click', () => {
      if (!requireWalletConnection("share on LinkedIn")) return;
      shareOnLinkedIn();
    });
  }
  
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener('click', () => {
      if (!requireWalletConnection("copy share link")) return;
      copyShareLink();
    });
  }
  
  // Updated: Download share card as image
  const downloadShareBtn = document.getElementById('downloadShareBtn');
  if (downloadShareBtn) {
    downloadShareBtn.addEventListener('click', () => {
      if (!requireWalletConnection("download share card")) return;
      downloadShareCardAsImage();
    });
  }
  
  const copyReferralBtn = document.getElementById('copyReferralBtn');
  if (copyReferralBtn) {
    copyReferralBtn.addEventListener('click', () => {
      if (!requireWalletConnection("copy referral link")) return;
      copyReferralLink();
    });
  }
  
  // Transparency
  const viewExplorerBtn = document.getElementById('viewExplorerBtn');
  if (viewExplorerBtn) {
    viewExplorerBtn.addEventListener('click', () => {
      if (!requireWalletConnection("view on explorer")) return;
      viewOnExplorer();
    });
  }
  
  const downloadDocsBtn = document.getElementById('downloadDocsBtn');
  if (downloadDocsBtn) {
    downloadDocsBtn.addEventListener('click', () => {
      if (!requireWalletConnection("download documentation")) return;
      downloadDocumentation();
    });
  }
  
  // Footer links
  const footerViewContract = document.getElementById('footerViewContract');
  if (footerViewContract) {
    footerViewContract.addEventListener('click', (e) => {
      if (!requireWalletConnection("download documentation")) return;
      e.preventDefault();
      viewOnExplorer();
    });
  }
  
  const footerDownloadDocs = document.getElementById('footerDownloadDocs');
  if (footerDownloadDocs) {
    footerDownloadDocs.addEventListener('click', (e) => {
      if (!requireWalletConnection("download documentation")) return;
      e.preventDefault();
      downloadDocumentation();
    });
  }
  
  // Admin functions
  const withdrawNgo = document.getElementById('withdrawNgo');
  if (withdrawNgo) {
    withdrawNgo.addEventListener('change', updateWithdrawNgoFund);
  }
  
  const withdrawBtn = document.getElementById('withdrawBtn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', proposeWithdrawal);
  }
  
  const createCampaignBtn = document.getElementById('createCampaignBtn');
  if (createCampaignBtn) {
    createCampaignBtn.addEventListener('click', createCampaign);
  }
  
  const impactMetricName = document.getElementById('impactMetricName');
  if (impactMetricName) {
    impactMetricName.addEventListener('change', function() {
      const customInput = document.getElementById('impactMetricCustom');
      if (this.value === 'custom') {
        customInput.style.display = 'block';
      } else {
        customInput.style.display = 'none';
        customInput.value = '';
      }
    });
  }
  
  const recordImpactBtn = document.getElementById('recordImpactBtn');
  if (recordImpactBtn) {
    recordImpactBtn.addEventListener('click', recordImpact);
  }
  
  const createMatchBtn = document.getElementById('createMatchBtn');
  if (createMatchBtn) {
    createMatchBtn.addEventListener('click', createMatchingPool);
  }
  
  // NGO document buttons - Updated to use preview modal
  document.querySelectorAll('.ngo-doc-item').forEach(item => {
    const btn = item.querySelector('.doc-download-btn');
    if (btn) {
      // Change button text from Download to Open
      btn.innerHTML = '📂 Open';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ngo = item.dataset.ngo;
        const doc = item.dataset.doc;
        openDocumentPreview(ngo, doc);
      });
    }
    
    // Also make the whole item clickable
    item.addEventListener('click', () => {
      const ngo = item.dataset.ngo;
      const doc = item.dataset.doc;
      openDocumentPreview(ngo, doc);
    });
  });
  
  // Modal close on outside click
  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal) {
    receiptModal.addEventListener('click', function(e) {
      if (e.target === this) closeReceiptModal();
    });
  }
  
  const goalModal = document.getElementById('goalModal');
  if (goalModal) {
    goalModal.addEventListener('click', function(e) {
      if (e.target === this) closeGoalModal();
    });
  }
}
// ============================================
// SECTION 23: INITIALIZATION
// ============================================

window.addEventListener('load', function() {
  // Set contract address display
  const contractDisplay = document.getElementById("contractAddressDisplay");
  if (contractDisplay) {
    contractDisplay.innerText = DONATION_CORE_ADDRESS;
  }
  
  const monthlyGoalDisplay = document.getElementById("monthlyGoalDisplay");
  if (monthlyGoalDisplay) {
    monthlyGoalDisplay.innerText = MONTHLY_GOAL;
  }
  
  const currentMonthLabel = document.getElementById("currentMonthLabel");
  if (currentMonthLabel) {
    currentMonthLabel.innerText = getMonthLabel(getCurrentMonthKey());
  }
  
  // Update challenge name
  const challengeName = document.getElementById("challengeName");
  if (challengeName) {
    challengeName.innerText = getMonthName() + ' Giving Wave';
  }
  
  // Load user preferences
  loadUserPrefs();
  loadCancelledRecurringFromStorage();
  
  // Apply theme
  if (userPrefs.theme === 'light') {
    document.body.classList.add('light');
    const themeIcon = document.getElementById("themeIcon");
    if (themeIcon) {
      themeIcon.textContent = "🌙";
    }
  }
  
  // Update UI
  updateFavorites();
  updateAchievements();
  updateCommunityUI();
  
  // Setup event listeners
  setupUIEventListeners();
  
  // Start polling
  startPolling();
  
  // Disable action buttons until wallet connected
  disableActionsUntilConnected();
});
// Updated requireWalletConnection with better UI feedback
function requireWalletConnection(actionName = "this action") {
  if (!connectedAddress || !donationCoreContract) {
    showNotification(`Please connect your wallet to ${actionName}`, 'warning');
    highlightConnectButton();
    // Scroll to top to show connect button
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  }
  return true;
}
function highlightConnectButton() {
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.classList.add('highlight-pulse');
    connectBtn.style.animation = 'pulse 0.5s ease infinite';
    setTimeout(() => {
      connectBtn.classList.remove('highlight-pulse');
      connectBtn.style.animation = '';
    }, 3000);
  }
}
// Disable all action buttons until wallet connected
function disableActionsUntilConnected() {
  const actionButtons = [
    'quickDonateBtn',
    'donateBtn',
    'recurringBtn',
    'exportUsageBtn',
    'exportDonationBtn',
    'campaignDonateBtn',
    'communityDonateBtn',
    'openReceiptBtn',
    'editGoalBtn',
    'shareTwitterBtn',
    'shareLinkedInBtn',
    'copyShareLinkBtn',
    'downloadShareBtn',
    'copyReferralBtn',
    'exportMyDonationsBtn'
  ];
  
  // Also disable favorite buttons
  const favButtons = document.querySelectorAll('.favorite-btn');
  favButtons.forEach(btn => {
    btn.classList.add('requires-wallet');
    btn.title = 'Connect wallet to use this feature';
  });
  
  actionButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn && !connectedAddress) {
      btn.classList.add('requires-wallet');
      btn.title = 'Connect wallet to use this feature';
    }
  });
}
function enableActionsAfterConnect() {
  const actionButtons = document.querySelectorAll('.requires-wallet');
  actionButtons.forEach(btn => {
    btn.classList.remove('requires-wallet');
    btn.title = '';
  });
}
// ============================================
// SECTION 24: SHARE IMPACT CARD AS IMAGE
// ============================================
async function downloadShareCardAsImage() {
  if (!requireWalletConnection("download share card")) return;
  
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0);
  const badgeCount = document.getElementById('unlockedBadgeCount')?.innerText || '0';
  
  // Create a canvas-based share card
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 600;
  canvas.height = 400;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#10b981');
  gradient.addColorStop(1, '#6366f1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add overlay pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.fillRect(i, 0, 1, canvas.height);
  }
  
  // Add text
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '24px Inter, Arial, sans-serif';
  ctx.fillText("I've donated", canvas.width / 2, 100);
  
  // Main amount
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Inter, Arial, sans-serif';
  ctx.fillText(`${totalDonated.toFixed(4)} ETH`, canvas.width / 2, 190);
  
  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '20px Inter, Arial, sans-serif';
  ctx.fillText('through GiveChain 💎', canvas.width / 2, 240);
  
  // Stats
  ctx.font = '16px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`${myDonations.length} donations • ${badgeCount} badges earned`, canvas.width / 2, 290);
  
  // Footer
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('givechain.io • Transparent Blockchain Donations', canvas.width / 2, 360);
  
  // Add decorative elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(50, 50, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width - 50, canvas.height - 50, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // Download
  const link = document.createElement('a');
  link.download = `givechain-impact-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  showNotification('Share card downloaded!', 'success');
}
// ============================================
// SECTION 25: UPDATED YOUR STATS DISPLAY (2 ROWS)
// ============================================
async function updateDonorStats() {
  if (!signer || !donationCoreContract) return;
  
  try {
    const user = await signer.getAddress();
    const count = await donationCoreContract.getDonationsCount();
    
    const donationPromises = [];
    for (let i = 0; i < count; i++) {
      donationPromises.push(donationCoreContract.donations(i));
    }
    const donations = await Promise.all(donationPromises);
    
    let donorTotals = {};
    
    donations.forEach(d => {
      const donor = d.donor;
      const amount = parseFloat(ethers.utils.formatEther(d.amount));
      const anonymous = d.isAnonymous;
      
      if (!anonymous) {
        if (!donorTotals[donor]) donorTotals[donor] = 0;
        donorTotals[donor] += amount;
      }
    });
    
    const sorted = Object.entries(donorTotals).sort((a, b) => b[1] - a[1]);
    const myTotal = donorTotals[user] || 0;
    const myRank = sorted.findIndex(e => e[0].toLowerCase() === user.toLowerCase()) + 1;
    
    // Calculate additional stats
    const uniqueNgos = new Set(myDonations.map(d => d.ngoId)).size;
    const campaignDonations = myDonations.filter(d => d.campaignId > 0).length;
    const streak = calculateStreak();
    const badgeCount = userPrefs.badges?.length || 0;
    
    document.getElementById("donorStats").innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div class="impact-card" style="padding: 16px;">
          <div class="impact-value" style="font-size: 24px;">${myTotal.toFixed(4)}</div>
          <div class="impact-label">Total Donated (ETH)</div>
        </div>
        <div class="impact-card" style="padding: 16px;">
          <div class="impact-value" style="font-size: 24px;">${myRank || '-'}</div>
          <div class="impact-label">Leaderboard Rank</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="impact-card" style="padding: 16px;">
          <div class="impact-value" style="font-size: 24px;">${myDonations.length}</div>
          <div class="impact-label">Total Donations</div>
        </div>
        <div class="impact-card" style="padding: 16px;">
          <div class="impact-value" style="font-size: 24px;">${streak}</div>
          <div class="impact-label">Week Streak 🔥</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 12px;">
        <div style="text-align: center; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${uniqueNgos}</div>
          <div style="font-size: 10px; color: var(--text-muted);">NGOs Supported</div>
        </div>
        <div style="text-align: center; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: var(--warning);">${campaignDonations}</div>
          <div style="font-size: 10px; color: var(--text-muted);">Campaign Donations</div>
        </div>
        <div style="text-align: center; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: var(--gold);">${badgeCount}</div>
          <div style="font-size: 10px; color: var(--text-muted);">Badges Earned</div>
        </div>
      </div>
    `;
    
  } catch(err) {
    console.error("Update donor stats error:", err);
  }
}