# ZK Mixer Prototype

A simple prototype demonstrating a Zero-Knowledge (ZK) cryptocurrency mixer using Solidity, Circom, and React.

## Project Goal

The goal is to create a Minimum Viable Product (MVP) demonstrating core ZK privacy features for mixing assets on a blockchain (e.g., Ethereum or a compatible testnet). The focus is on simplicity, user-friendliness, and leveraging existing ZK proof systems.

## Core Components

* **Smart Contracts (`/contracts`):** 
  * `ZKMixer.sol`: Main contract for deposits and withdrawals using ZK proofs
  * `Verifier.sol`: Interface for ZK proof verification
  * `MockVerifier.sol`: Mock implementation for testing

* **ZK Circuits (`/circuits`):** 
  * `mixer.circom`: Main Circom circuit for proof generation
  * Various utility circuits for Merkle tree verification, hashing, etc.

* **Frontend (`/frontend`):** 
  * React-based web interface
  * Web3 integration for wallet connection
  * Simulated deposit and withdrawal functionality
  * Educational components about ZK mixers

## Project Structure

```
├── contracts/           # Solidity smart contracts
├── circuits/            # Circom circuits and related files
├── frontend/            # React web application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Context providers for state management
│   │   ├── utils/       # Utility functions
│   │   └── abis/        # Contract ABIs
├── test/                # Smart contract tests
├── scripts/             # Deployment and utility scripts
├── tasks/               # Task definitions for development workflow
└── .cursor/rules/       # Project rules and guidelines
```

## Getting Started

### Prerequisites

* Node.js (v16.0 or later)
* npm or yarn
* A web browser with MetaMask extension

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zk-mixer-prototype
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running Locally

1. **Start the Hardhat node:**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts to the local node (in a separate terminal):**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Start the frontend application:**
   ```bash
   cd frontend
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. Connect MetaMask to the local Hardhat network (usually `http://localhost:8545` with Chain ID 31337)

## Using the ZK Mixer

1. **Deposit:**
   * Connect your wallet using the "Connect Wallet" button
   * Select a denomination amount (0.01, 0.1, or 1.0 ETH)
   * Click "Deposit" and confirm the transaction in your wallet
   * Save the generated note securely - this is required for withdrawal!

2. **Withdraw:**
   * Navigate to the "Withdraw" tab
   * Enter your saved note
   * Provide a recipient address (can be different from your deposit address for privacy)
   * Click "Withdraw Funds" and confirm the transaction

## Testing

Run the smart contract tests using Hardhat:

```bash
npx hardhat test
```

## Development Workflow

This project uses [Task Master](https://github.com/eyaltoledano/task-master) for managing development tasks:

* View the current task list: `npx task-master list`
* See the next task to work on: `npx task-master next`
* Mark a task as complete: `npx task-master set-status --id=<id> --status=done`

## Project Rules

Development follows specific guidelines for each aspect of the project:

* Solidity development - See `.cursor/rules/solidity_rules.mdc`
* Circom circuit development - See `.cursor/rules/circom_rules.mdc`
* Frontend development - See `.cursor/rules/frontend_rules.mdc`
* Web3 integration - See `.cursor/rules/web3_integration_rules.mdc`
* Project architecture - See `.cursor/rules/architecture.mdc`

## License

[MIT](LICENSE) or specify your license

## Disclaimer

This is a proof-of-concept prototype for educational purposes only. It has not been audited and should not be used in production with real assets.