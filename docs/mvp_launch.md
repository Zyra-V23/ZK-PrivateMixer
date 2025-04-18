# MVP Launch: Cross-chain ETH→Solana/EVM Mixer with ZK and Flexible Withdrawal

## Executive Summary
This document outlines the architecture, flow, and technical steps for the MVP of a cross-chain ZK Mixer. The system enables users to deposit ETH on EVM, mix with ZK privacy, and withdraw on either EVM or Solana, ensuring privacy and interoperability.

---

## High-Level Flow Diagram
```
[User]
   |
   |--(1. Deposit ETH + receive note)--> [ZKMixer.sol (EVM)]
   |
   |--(2. Wait/mix: anonymity set grows)
   |
   |--(3. Generate ZK proof with note & Merkle root)
   |
   |--(4a. Withdraw on EVM)--> [ZKMixer.sol: withdraw()]
   |
   |--(4b. Withdraw on Solana)--> [Relayer/Bridge] --(executes withdrawal)--> [Solana Mixer/Light Protocol]
```

---

## Step-by-Step MVP Flow

### 1. Deposit on EVM
- User connects their wallet and deposits a fixed amount of ETH into the ZKMixer.sol contract.
- The frontend generates a secret note (nullifier, secret), calculates the commitment using Poseidon, and submits it to the contract.
- The contract inserts the commitment into the Merkle tree and emits an event.
- The user receives and backs up their note securely.

### 2. Mixing Phase
- The Merkle tree grows as more users deposit, increasing the anonymity set.
- The Merkle root and nullifiers are exposed via contract view functions for synchronization.

### 3. ZK Proof Generation
- When the user wants to withdraw, they use their note and the latest Merkle root to generate a ZK proof (using Circom/snarkjs in the frontend or backend).
- The proof shows knowledge of a valid commitment in the tree without revealing which one.
- The proof is valid for both EVM and Solana environments (same circuit, same public inputs).

### 4. Withdrawal (Flexible: EVM or Solana)
#### a) Withdraw on EVM
- The user submits the ZK proof and public inputs to the ZKMixer.sol contract.
- The contract verifies the proof and nullifier, marks the nullifier as spent, and transfers ETH to the recipient.

#### b) Withdraw on Solana
- The user submits the ZK proof and public inputs to a relayer/bridge service.
- The relayer synchronizes the Merkle root and nullifiers from EVM to Solana.
- The relayer (or the user, if trustless) submits the withdrawal to the Solana program (using Light Protocol primitives).
- The Solana program verifies the proof, checks the nullifier, and transfers SOL to the recipient.

---

## Infrastructure Validation

### EVM Infrastructure Validation (April 2025)
- Successfully connected to the Sepolia network via Alchemy using TypeScript and the viem library.
- The script `test/test-veim.ts` fetches the latest block in real time, confirming robust connectivity and endpoint reliability.
- The Alchemy dashboard shows 100% request success, no errors or rate limits, and logs all activity from our relayer and scripts.
- This ensures the EVM infrastructure is ready for the MVP and cross-chain integration.

**How to test:**
```bash
npm run viem-test
```
**Example output:**
```
✅ Latest block number: 12345678
✅ Latest block: { ...block data... }
```

### Solana Infrastructure Validation (April 2025)
- Successfully connected and validated the Solana Devnet node using Alchemy and the official `@solana/web3.js` library.
- The script `test/test-solana.ts` fetches the latest slot, block height, and block data in real time, confirming robust connectivity and endpoint reliability.
- The Alchemy dashboard shows 100% success in requests, with no errors or limitations, reflecting the activity of the performed tests.
- This guarantees that the Solana infrastructure is ready for the MVP and for cross-chain ZK integration.

**How to test:**
```bash
npm run test:sol
```
**Example output:**
```
✅ Latest slot number: 374969307
✅ Latest block height: 362945466
✅ Block data: { ...real transactions and rewards... }
```

---

## Implementation Checklist
1. Document architecture and cross-chain MVP flow (this file).
2. Expose Merkle root and nullifiers on EVM and Solana.
3. Implement simple relayer/bridge for synchronization.
4. Enable ZK proof generation and verification in both environments.
5. Implement deposit flow and note backup in frontend.
6. Implement flexible withdrawal flow (ETH or SOL).
7. End-to-end test and documentation of results.

---

## Synchronization & Security Notes
- **Merkle root and nullifiers must be kept in sync** between EVM and Solana. The relayer/bridge is responsible for this in the MVP.
- **ZERO_VALUE and Poseidon hash parameters must be identical** across all stacks (EVM, Circom, JS, Rust/Solana).
- **Proof format and public inputs must match** the expectations of both verifiers (EVM and Solana).
- The MVP bridge can be semi-trusted; full trustless bridging can be implemented later.

---

## References & Context
- See `/docs/sol_implementation.md` for detailed findings, Light Protocol integration, and technical notes.
- See `/tasks/tasks.json` (Task 17) for the full MVP roadmap.
- See `.cursor/rules/` for Merkle, ZK, and cross-stack standards.

---

**This document will be updated as the MVP implementation progresses.** 