# ZK-PrivateMixer (Uzumaki/U-ZK Void)

## Project Summary
A cross-chain Zero-Knowledge Mixer enabling private deposits and withdrawals on Ethereum (EVM) and Solana, leveraging Circom circuits, Solidity, custom EVM stack, Light Protocol for SOL stack, and robust frontend tooling. The project ensures privacy, security, and interoperability between EVM and Solana using ZK proofs and Merkle tree consistency.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Installation & Quickstart](#installation--quickstart)
5. [Infrastructure Validation](#infrastructure-validation)
6. [Testing & Development Workflow](#testing--development-workflow)
7. [Light Protocol & Bridge Integration](#light-protocol--bridge-integration)
8. [Roadmap & Next Steps](#roadmap--next-steps)
9. [References & Documentation](#references--documentation)

---

## Architecture Overview

**High-Level Flow:**
```
[User]
   |
   |--(1. Deposit + receive note)--> [ZKMixer.sol (EVM)]
   |
   |--(2. Wait/mix: anonymity set grows)
   |
   |--(3. Generate ZK proof with note & Merkle root)
   |
   |--(4a. Withdraw on EVM)--> [ZKMixer.sol: withdraw()]
   |
   |--(4b. Withdraw on Solana)--> [Relayer/Bridge] --(executes withdrawal)--> [Solana Mixer/Light Protocol]
```

- **EVM:** Solidity contracts, Circom circuits, ZK proof generation, and event-driven relayer.
- **Solana:** Light Protocol primitives, Rust/JS bridges, and Merkle/UTXO logic.
- **Frontend:** React app for user interaction, note management, and proof generation.

---

## Technology Stack

### EVM
- **Smart Contracts:** Solidity (`ZKMixer.sol`, `Verifier.sol`, `PoseidonT3.sol`, `SMTVerifierLib.sol`)
- **ZK Circuits:** Circom 2.x, Groth16 (snarkjs)
- **Node/Relayer:** TypeScript, [viem](https://viem.sh/), [ethers.js](https://docs.ethers.org/)
- **Merkle Tree:** [@zk-kit/incremental-merkle-tree](https://github.com/privacy-scaling-explorations/zk-kit)
- **Testing:** Hardhat, Mocha/Chai

### Solana
- **ZK Integration:** Light Protocol (Rust, JS bridges)
- **Node/SDK:** [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
- **Merkle/UTXO:** Light Protocol primitives, Merkle bridges
- **Testing:** Rust, JS/TS integration scripts

### Frontend
- **Framework:** React
- **Crypto Utils:** [circomlibjs](https://github.com/iden3/circomlibjs), custom note management
- **UI:** User flows for deposit, withdrawal, and note backup

---

## Folder Structure

```
/contracts        # Solidity contracts (ZKMixer, Verifier, libraries)
/circuits         # Circom circuits, libraries, and build outputs
/scripts          # Automation scripts (proofs, inputs, deployment)
/test             # Node/TS test scripts (EVM & Solana validation, integration)
/frontend         # React frontend app (src, components, utils)
/external         # Light Protocol integration, bridges, and SDKs
/tasks            # Task management and workflow files
/docs             # Documentation (MVP, implementation, research)
/keys, /inputs    # ZK keys, test vectors, and circuit inputs
```

---

## Installation & Quickstart

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ZK-PrivateMixer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and set your Alchemy endpoints for EVM and Solana:
     ```
     EVM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-evm-key>
     SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/<your-sol-key>
     ```
4. **Run EVM node validation:**
   ```bash
   npm run viem-test
   ```
5. **Run Solana node validation:**
   ```bash
   npm run test:sol
   ```

---

## Infrastructure Validation

### EVM (Sepolia via Alchemy)
- Script: `test/test-veim.ts`
- Validates real-time block fetching and node connectivity.
- Example output:
  ```
  ✅ Latest block number: 12345678
  ✅ Latest block: { ...block data... }
  ```

### Solana (Devnet via Alchemy)
- Script: `test/test-solana.ts`
- Fetches latest slot, block height, and block data.
- Example output:
  ```
  ✅ Latest slot number: 374969307
  ✅ Latest block height: 362945466
  ✅ Block data: { ...real transactions and rewards... }
  ```

---

## Testing & Development Workflow

- **Contracts:**
  ```bash
  npm run compile      # Compile Solidity contracts
  npm run test         # Run Hardhat contract tests
  ```
- **Circuits:**
  - Use scripts in `/scripts` for compiling, generating proofs, and witness calculation.
- **Integration:**
  - Use test scripts in `/test` for EVM and Solana node validation.
- **Frontend:**
  - See `/frontend/README.md` for UI setup and development.
- **Task Management:**
  - Tasks and workflow tracked in `/tasks` and `tasks.json`.

---

## Light Protocol & Bridge Integration

- **Bridges:** `/external/light-protocol/bridge/merkle_bridge.rs` and `merkle_bridge.js` expose Merkle and Poseidon logic for cross-stack verification.
- **Consistency:** Test vectors and proofs are exported and verified across Circom, Solidity, and Light Protocol to ensure cryptographic alignment.
- **Next steps:** Integrate Light Protocol flows for ZK proofs and withdrawals on Solana.

---

## Roadmap & Next Steps
- Finalize bridge between EVM - SOL to validate both verifications.
- Expand frontend for Solana/EVM flows and cross-chain UX. (UX will be always as simple as possible)
- Add more integration tests and CI/CD automation.
- Document advanced ZK and Merkle logic for contributors.

---

## References & Documentation
- `.cursor/rules/` — Project rules for Solidity, Circom, Merkle, Web3, and ZK workflow
- `/docs/mvp_launch.md` — MVP architecture, flow, and implementation notes
- `/external/light-protocol/` — Light Protocol SDKs, bridges, and documentation
- [Alchemy Solana API Quickstart](https://docs.alchemy.com/reference/solana-api-quickstart)
- [Light Protocol](https://lightprotocol.com/)

## Project Status (April 2025)

- **All core features are complete and aligned:**
  - Solidity contracts, Circom circuits, JavaScript utilities, and the full React UI are implemented and fully integrated.
  - Merkle Tree and ZERO_VALUE logic is aligned across the stack, using the real Poseidon(0,0) value:
    - `0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864`
  - No dummy logic remains; all tests run with real, production-aligned code.
  - The UI is fully functional, supporting deposit, withdrawal, note management, and privacy education.
  - All documentation and code reference the [merkle_tree_rules.mdc](.cursor/rules/merkle_tree_rules.mdc) for standards and test vectors.

- **Testing:**
  - Integration and unit tests verify Merkle root consistency and ZK proof validity across Solidity, Circom, JS, and the UI.
  - No mocks or dummies are used for Merkle or Poseidon logic.
  - Test vectors for Poseidon(0,0), Poseidon(1,2), and initial Merkle roots are documented and checked.

## Technical Consistency

- **Solidity:**
  - Contracts (`ZKMixer.sol`, `SMTVerifierLib.sol`) use the correct ZERO_VALUE and reference the PoseidonT3 library.
- **Circom:**
  - Circuits (`mixer.circom`, `lib/verify_merkle_path.circom`) are documented to require the same ZERO_VALUE for all Merkle path elements.
- **JavaScript & UI:**
  - Utilities, tests, and the React frontend (`frontend/src/utils/cryptoUtils.js`, `test/ZKMixer.test.cjs`, UI components) use `circomlibjs` and the correct ZERO_VALUE.
- **Documentation:**
  - The [merkle_tree_rules.mdc](.cursor/rules/merkle_tree_rules.mdc) file centralizes the Merkle Tree standard, ZERO_VALUE definition, and cross-stack requirements.

## Architecture Overview

- **Smart Contracts:** Solidity (Hardhat)
- **ZK Circuits:** Circom 2.x
- **Frontend:** React + ethers.js + circomlibjs
- **Testing:** Hardhat, Mocha/Chai, integration tests for deposit/withdrawal/proof
- **Rules:** Project-specific `.mdc` files for Solidity, Circom, Web3 integration, and Merkle Trees

## Next Steps: Solana Integration

The next phase of development is to implement a Solana-compatible version of the ZK Mixer. This will involve:
- Researching Solana's cryptographic primitives and ZK support
- Adapting the Merkle Tree and Poseidon logic to Solana's environment
- Designing and implementing smart contracts, circuits, and UI compatible with Solana
- Ensuring cross-chain consistency and security

**Status:** The Ethereum-based mixer is feature-complete and stable. Research and planning for Solana integration is underway. Updates will be documented in the repository as progress is made.

### Integration Workflow: Light Protocol First, then dKit by El Dorito

- **Step 1: Implement and experiment with Light Protocol**
  - Focus first on integrating Light Protocol to enable ZK circuits, proofs, and verifiers natively on Solana.
  - Ensure that the core privacy and proof workflow is functional and stable in the Solana environment.
  - Leverage Light Protocol's SDKs, primitives, and documentation to accelerate ZK development.

- **Step 2: Integrate dKit by El Dorito for cross-chain swaps (optional, complementary)**
  - Once the ZK workflow is working, consider integrating dKit to enable seamless cross-chain swaps and liquidity (e.g., deposit in Solana, withdraw in EVM, or vice versa).
  - dKit abstracts the complexity of cross-chain swaps and supports multiple wallets and chains, improving UX.
  - Note: dKit is not a ZK solution, but a liquidity and swap layer that can complement our ZK mixer.

**Rationale:**
- The privacy and ZK proof workflow is the core of the mixer; it must be robust and secure before adding cross-chain features.
- dKit can be layered on top to provide a unified, multi-chain user experience once the ZK foundation is in place.

### Bridge Files for Light Protocol ↔ Voragine Integration

To facilitate cross-stack integration and testing, bridge files have been created in `/external/light-protocol/bridge/`:
- `merkle_bridge.rs`: exposes Light Protocol's Merkle and Poseidon functions for use from other Rust modules or FFI.
- `merkle_bridge.js`: JS wrapper to consume Light Protocol's Merkle logic from JS scripts/tests.

These files allow comparing roots, proofs and hashes between stacks and accelerate cross-chain integration.

## Light Protocol Integration & Merkle Bridges (2025)

- **Light Protocol's Merkle tree logic is now integrated into the project.**
- Rust and JS bridge files have been created and tested, exposing Merkle and Poseidon logic for cross-stack use.
- Merkle inclusion proofs are exported as JSON (`test_vectors_light.json`), ready for verification in Circom and Solidity.
- Project `.mdc` rules have been updated to enforce cross-stack standards for Merkle logic, serialization, and test vectors.
- Next steps: Cross-verify exported proofs in Circom (`verify_merkle_path.circom`) and Solidity (`SMTVerifierLib.sol`) to ensure full compatibility and robustness.

---

For technical details, see the `/contracts`, `/circuits`, `/frontend`, and `/tasks` directories, as well as the `.cursor/rules` folder for project rules and standards.

## Solana Infrastructure Validation (April 2025)

- Successfully connected and validated the Solana Devnet node using Alchemy and the official `@solana/web3.js` library.
- The script `test/test-solana.ts` fetches the latest slot, block height, and block data in real time, confirming robust connectivity and endpoint reliability.
- The Alchemy dashboard shows 100% success in requests, with no errors or limitations, reflecting the activity of the performed tests.
- This guarantees that the Solana infrastructure is ready for the MVP and for cross-chain ZK integration.

**Stack:**
- TypeScript
- @solana/web3.js
- Alchemy Devnet endpoint (from `.env` as `SOLANA_RPC_URL`)

**How to test:**
```bash
npm run test:sol
```

**Example output:**
```
✅ Latest slot number: 374969307
✅ Latest block height: 362945466
✅ Block data: { ...transacciones y recompensas reales... }
```

**Next step:**
- Integrate Light Protocol and ZK logic for Solana.
- Document and test cross-chain flows.

## EVM Infrastructure Validation (April 2025)

### ✅ Node Connection & Real-Time Block Fetching
- Successfully connected to the Sepolia network via Alchemy using TypeScript and the viem library.
- The script `test-veim.ts` fetches the latest block in real time, confirming robust connectivity and endpoint reliability.
- The Alchemy dashboard shows 100% request success, no errors or rate limits, and logs all activity from our relayer and scripts.
- This ensures the EVM infrastructure is ready for the MVP and cross-chain integration.

**Evidence:**
- Screenshot of the Alchemy dashboard with green metrics and successful requests.
- Reference scripts (`test-veim.ts`) running and validated.

### 🛠️ EVM Technology Stack
- **Smart Contracts:** Solidity (`ZKMixer.sol`, `Verifier.sol`, `PoseidonT3.sol`)
- **ZK Circuits:** Circom 2.x (for proof generation and verification)
- **Frontend/Relayer:**
  - TypeScript + Node.js
  - [viem](https://viem.sh/) (modern EVM client for TypeScript)
  - [ethers.js](https://docs.ethers.org/) (for contract interaction and event listening)
- **Proof Generation:** [snarkjs](https://github.com/iden3/snarkjs) (Groth16)
- **Merkle Tree Logic:** [@zk-kit/incremental-merkle-tree](https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/incremental-merkle-tree)
- **Infrastructure:** Alchemy (RPC node provider for Sepolia/Ethereum)
- **Testing:** Hardhat, Mocha/Chai, integration tests for deposit/withdrawal/proof
- **Scripts:**
  - `test-veim.ts`: Fetches latest block and validates node connectivity
  - Relayer scripts for event indexing and nullifier tracking

### 🔗 Next Step
- Set up a new app in Alchemy for Solana and validate the SOL node connectivity, preparing the environment for Light Protocol integration and cross-chain ZK flow.

---

## Step-by-Step Guide: How to Test the EVM Stack Yourself

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ZK-PrivateMixer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your Alchemy Sepolia endpoint:**
   - Create an app in [Alchemy](https://dashboard.alchemy.com/), select Sepolia, and copy your HTTP endpoint.
   - Replace the endpoint in `test-veim.ts` with your own, or set it as an environment variable if supported.
4. **Run the EVM node test script:**
   ```bash
   npm run viem-test
   ```
   - This will fetch and print the latest block from Sepolia, confirming node connectivity.
5. **Check the Alchemy dashboard:**
   - Go to your app in Alchemy and verify that requests appear in the metrics/logs.
6. **(Optional) Run contract and integration tests:**
   ```bash
   npm run test
   ```
   - This will run Hardhat tests for the smart contracts and ZK logic.
7. **Explore and modify the relayer scripts:**
   - Scripts for event indexing, nullifier tracking, and Merkle root fetching are available for further testing and development.

---

## Future Plan: Migration to TypeScript for Wormhole/Relayer

Currently, the cross-chain relayer and Wormhole integration scripts are implemented in JavaScript (`.js`) for rapid prototyping and ease of testing. Once the MVP is validated and the cross-chain workflow is stable, we plan to migrate these scripts to TypeScript (`.ts`).

**Motivation:**
- Type safety for complex message structures (VAAs, Merkle roots, nullifiers)
- Better maintainability and developer experience
- Improved autocompletion and error detection
- Alignment with best practices for production systems

**Scope:**
- All files in `/wormhole` (core, relayer, connectors, types)
- Future relayer and bridge logic

**Status:**
- Planned (to be tracked as a dedicated task in `tasks.json`)

See also: [tasks.json](tasks/tasks.json) for the migration task and progress.

---
