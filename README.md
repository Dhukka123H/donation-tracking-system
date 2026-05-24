# 💰 GiveChain — Transparent Blockchain Donations

[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia%20Testnet-orange?style=flat-square&logo=ethereum)](https://sepolia.etherscan.io/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.4-blue?style=flat-square&logo=solidity)](https://docs.soliditylang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

A **decentralized donation tracking platform** built on **Ethereum**. Users can donate ETH directly to registered NGOs through MetaMask, and every transaction is permanently recorded on-chain. The admin panel allows fund managers to log usage of donated funds and withdraw ETH — all transparently visible on the blockchain.

## 📸 Features

✨ **Core Functionality**
- 🔗 **MetaMask Wallet Integration** — Connect your Ethereum wallet seamlessly
- 💸 **Direct ETH Donations** — Donate to your chosen NGO directly on-chain
- 📊 **Live Progress Tracking** — Visual fundraising progress toward targets
- 🌍 **NGO Management** — Per-NGO fund totals with transaction history
- 📜 **Donation History** — Complete searchable transaction history
- 📋 **Fund Usage Tracking** — Transparent withdrawal and fund usage logs
- 🧑‍💼 **Admin Dashboard** — Manage contracts, withdraw funds, verify NGOs

🎯 **Advanced Features**
- 📈 **Stats Dashboard** — Real-time analytics (total donations, withdrawals, balance, count)
- 📥 **CSV Export** — Download donation and usage history
- 🔍 **Search & Filter** — Filter by NGO, donor address, purpose, and more
- 🌙 **Dark / Light Theme** — Toggle between dark and light mode
- 🏅 **Achievement System** — Earn badges for donation milestones
- 📱 **Fully Responsive** — Seamless experience on desktop, tablet, and mobile
- ⚡ **Real-time Updates** — Auto-refreshing data with 15-second polling

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Blockchain** | Ethereum — Sepolia Testnet |
| **Smart Contracts** | Solidity ^0.8.4 |
| **Web3 Library** | ethers.js v5.7.2 |
| **Wallet** | MetaMask |
| **Contract IDE** | Remix IDE |
| **Export** | jsPDF, CSV |

## 📁 Project Structure

```
donation-tracking-system/
├── README.md                          # Project documentation
├── frontend/                          # Frontend application
│   ├── index.html                    # Main HTML file
│   ├── js/
│   │   └── app.js                    # Complete application logic
│   └── assets/
│       └── documents/                # Supporting documents
└── smart_contracts/                   # Solidity smart contracts
    ├── DonationCore.sol              # Core donation contract
    ├── CampaignManager.sol           # Campaign management logic
    └── AdminManager.sol              # Admin/fund withdrawal logic
```

## 🚀 Getting Started

### Prerequisites

Before running this project, ensure you have:

1. **MetaMask Browser Extension** — [Download MetaMask](https://metamask.io/)
2. **Sepolia Testnet ETH** — Get free testnet ETH from:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
3. **Modern Web Browser** — Chrome, Firefox, Edge, or Safari (latest versions)
4. **Code Editor** (optional) — VS Code or any text editor

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Dhukka123H/donation-tracking-system.git
cd donation-tracking-system
```

#### 2. Configure MetaMask
- Open MetaMask and switch to **Sepolia Testnet**
- Import or create a new wallet account
- Request test ETH from the faucet (linked above)

#### 3. Deploy Smart Contracts (Optional)
If you want to deploy your own contracts:

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create new files and paste the contents of:
   - `DonationCore.sol`
   - `CampaignManager.sol`
   - `AdminManager.sol`
3. Compile and deploy each contract
4. Update the contract addresses in `frontend/js/app.js`:
   ```javascript
   const DONATION_CORE_ADDRESS = "YOUR_CONTRACT_ADDRESS";
   const CAMPAIGN_MANAGER_ADDRESS = "YOUR_CONTRACT_ADDRESS";
   const ADMIN_MANAGER_ADDRESS = "YOUR_CONTRACT_ADDRESS";
   ```

#### 4. Run the Application
Simply open `frontend/index.html` in your browser:
- **Option A:** Double-click the file
- **Option B:** Use a local server
  ```bash
  # Using Python 3
  python -m http.server 8000
  # Then visit http://localhost:8000
  ```
- **Option C:** Use VS Code Live Server extension

### 5. Connect Your Wallet
1. Click **"Connect MetaMask"** button
2. Approve the connection in MetaMask popup
3. Switch to Sepolia Testnet if prompted

## 📋 Smart Contract Documentation

### DonationCore.sol
Main contract handling donations and NGO management.

**Key Functions:**
- `addNGO(string name)` — Register a new NGO
- `donateToNGO(uint ngoId)` — Make a donation to an NGO
- `getNGOCount()` — Get total number of NGOs
- `getDonationCount()` — Get total donation count
- `getDonation(uint index)` — Retrieve donation details

**Events:**
- `DonationReceived` — Emitted when a donation is made
- `NGOAdded` — Emitted when an NGO is registered
- `NGOVerified` — Emitted when an NGO is verified

### CampaignManager.sol
Manages fundraising campaigns for NGOs.

**Key Functions:**
- `createCampaign()` — Create a new campaign
- `getCampaignDetails()` — Retrieve campaign information
- `getCampaignCount()` — Get total campaigns

### AdminManager.sol
Handles admin functions and fund withdrawals.

**Key Functions:**
- `withdrawFunds(uint amount, string purpose)` — Withdraw funds with purpose logging
- `getWithdrawalHistory()` — Retrieve all fund withdrawals
- `getContractBalance()` — Check contract balance

## 🎯 Usage Guide

### For Donors

1. **Connect Wallet** — Click "Connect MetaMask" and approve
2. **Select NGO** — Choose an NGO from the available cards
3. **Enter Amount** — Specify donation amount in ETH (min: 0.001 ETH)
4. **Confirm Donation** — Approve the transaction in MetaMask
5. **View History** — See your donation in the history table instantly

### For Administrators

1. **Connect Admin Wallet** — The admin wallet used during deployment
2. **Access Admin Panel** — Admin features appear automatically
3. **Check Balance** — View current contract balance
4. **Withdraw Funds** — Input withdrawal amount and purpose
5. **View Usage History** — See all withdrawals and purposes
6. **Export Data** — Download history as CSV for records

## 📊 Contract Addresses (Sepolia Testnet)

```
DonationCore:      0x90526037C47d406F1F6e6681262E068F57Fd774c
CampaignManager:   0x010371D52f3B03F1f6c7DF6285e8079fb96D9F50
AdminManager:      0x8f1c67B5A519728e76B482e44a10E1Ee95F330Eb
```

**View on Etherscan:** [GiveChain on Etherscan](https://sepolia.etherscan.io/)

## 🔒 Security Considerations

- ✅ All transactions are on-chain and immutable
- ✅ MetaMask handles wallet security
- ✅ Contracts use access control modifiers
- ✅ Admin functions are restricted to authorized addresses
- ⚠️ **Testnet Only:** This is deployed on Sepolia Testnet, NOT mainnet
- ⚠️ Always verify contract addresses before transactions

## 🐛 Testing

To test the application:

1. **Test Donations:**
   - Connect multiple MetaMask accounts
   - Make donations of varying amounts
   - Verify donations appear in history

2. **Test Admin Functions:**
   - Switch to admin account
   - Test withdrawal with different amounts
   - Verify fund usage logs

3. **Test UI Features:**
   - Toggle dark/light theme
   - Test search and filter functionality
   - Export data to CSV
   - Test on mobile devices

## 📝 Environment Variables

Currently, this project uses hardcoded addresses. To make it more flexible, create a `.env` file:

```plaintext
VITE_DONATION_CORE_ADDRESS=0x90526037C47d406F1F6e6681262E068F57Fd774c
VITE_CAMPAIGN_MANAGER_ADDRESS=0x010371D52f3B03F1f6c7DF6285e8079fb96D9F50
VITE_ADMIN_MANAGER_ADDRESS=0x8f1c67B5A519728e76B482e44a10E1Ee95F330Eb
```

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

## 🎓 Learning Resources

- [Ethereum Documentation](https://ethereum.org/en/developers/)
- [Solidity Docs](https://docs.soliditylang.org/)
- [ethers.js Documentation](https://docs.ethers.io/v5/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [Sepolia Testnet Guide](https://goerli.etherscan.io/)

## 📞 Support & Contact

If you have questions or issues:
- 💬 Open an issue on GitHub
- 📧 Contact: [hdhukka323@gmail.com]
- 🔗 GitHub: [Dhukka123H](https://github.com/Dhukka123H/)

## 🙏 Acknowledgments

- **Ethereum Foundation** — Blockchain infrastructure
- **MetaMask** — Wallet integration
- **Sepolia Testnet** — Testing environment
- **ethers.js** — Web3 library
- Open-source community for tools and libraries

---

**Made with ❤️ by the GiveChain Team**

---