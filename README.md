# 🌿 BioData Citizen Science App

Welcome to BioData, a decentralized, token-incentivized platform for citizen scientists to report biodiversity data! This Web3 project tackles the real-world problem of biodiversity loss by enabling global communities to collect, verify, and share data on species, ecosystems, and environmental changes. Using the Stacks blockchain and Clarity smart contracts, participants earn tokens for contributing verified data, fostering community-driven science while ensuring data integrity through consensus mechanisms.

## ✨ Features

🔍 Submit biodiversity reports with evidence (e.g., photo hashes, GPS data)
🤝 Community verification via consensus voting
💰 Earn tokens for validated contributions and verifications
🏆 Reputation system to reward reliable participants
📊 Immutable on-chain storage of verified data
⚖️ Governance for community-led improvements
🚫 Dispute resolution for contested reports
🌍 Open access to aggregated biodiversity insights

## 🛠 How It Works

**For Contributors (Citizen Scientists)**

- Register your profile to start participating.
- Submit a report with details like species observed, location, timestamp, and a hash of supporting evidence (e.g., uploaded to IPFS).
- Your report enters a verification pool where community members vote on its accuracy.
- If consensus is reached (e.g., majority approval), you earn tokens based on the report's value and your reputation.

**For Verifiers**

- Stake tokens to join verification pools and vote on pending reports.
- Provide feedback or evidence during voting.
- Earn rewards for accurate verifications that align with final consensus.
- Challenge reports if needed, triggering dispute resolution.

**For Researchers and Users**

- Query verified data for insights on biodiversity trends.
- Participate in governance to vote on token economics or verification rules.

Data is stored immutably on-chain, with hashes linking to off-chain evidence for scalability. Tokens incentivize high-quality contributions, solving the engagement gap in traditional citizen science.

## 📜 Smart Contracts

This project is built with 7 modular Clarity smart contracts on the Stacks blockchain for security and decentralization:

1. **BiodiversityToken.clar**: Manages the fungible token (BIO) used for incentives, including minting, burning, and transfers.
2. **UserRegistry.clar**: Handles user registration, profiles, and reputation scores based on contribution history.
3. **DataReport.clar**: Allows submission of biodiversity reports, storing metadata like species, location, timestamp, and evidence hashes.
4. **VerificationPool.clar**: Manages pools of pending reports, assigning them to verifiers and tracking submission status.
5. **ConsensusVoting.clar**: Implements voting logic for community consensus, including stake-weighted votes and thresholds for approval.
6. **RewardManager.clar**: Calculates and distributes token rewards to contributors and verifiers based on verified outcomes and reputation.
7. **GovernanceDAO.clar**: Enables token holders to propose and vote on changes, such as reward rates or verification parameters.

These contracts interact seamlessly: e.g., a successful vote in ConsensusVoting triggers rewards via RewardManager.

## 🚀 Getting Started

- Install the Stacks wallet and acquire STX for gas fees.
- Deploy the contracts using the Clarity dev tools.
- Integrate with a frontend (e.g., React) to interact via Hiro Wallet.
- Test on the Stacks testnet before mainnet launch.

Join the revolution in citizen science—protect biodiversity one verified report at a time!