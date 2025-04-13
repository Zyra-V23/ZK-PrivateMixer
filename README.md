<!-- GitAds-Verify: LDJ4DEKYGCAIVRBREAXJBJB2QJPE29R3 -->
# U-ZK Void Mixer

A privacy-focused Ethereum mixer using zero-knowledge proofs (ZK-SNARKs Groth16) for confidential transactions.

## Overview

ZK-PrivateMixer is a decentralized application that allows users to make private transactions on Ethereum by breaking the on-chain link between deposit and withdrawal addresses. It uses zero-knowledge proofs to enable withdrawals without revealing which deposit they're linked to.

## Features

- **Fixed Denomination**: Currently supports deposits of 0.1 ETH.
- **Complete Privacy**: Uses Groth16 ZK-SNARKs with Poseidon hashing and standard Merkle tree verification.
- **Publicly Verifiable Setup**: Relies on the Perpetual Powers of Tau ceremony.
- **Gas Efficient**: Optimized for minimal gas usage during deposit and withdrawal operations (using Poseidon).
- **Relayer Support**: Enables gas-less withdrawals to new addresses via relayers.

## Project Structure

- `/circuits`: Circom circuit definitions for ZK proofs.
  - `mixer.circom`: Main mixer circuit implementing standard Merkle path verification using Poseidon.
  - `/lib/verify_merkle_path.circom`: Local copy of the standard Merkle path verifier template.
- `/contracts`: Solidity smart contracts.
  - `ZKMixer.sol`: Main mixer contract handling deposits/withdrawals, using Poseidon hash.
  - `/interfaces/IVerifier.sol`: Interface for the ZK proof verifier.
  - `Verifier.sol`: Auto-generated Groth16 verifier contract (implementing IVerifier).
  - `/libraries/PoseidonT3.sol`: Local copy of the Poseidon hash library for Solidity.
- `/scripts`: Utility scripts (e.g., for witness/proof generation, input handling - if any).
- `/test`: Test suite.
  - `ZKMixer.test.cjs`: Integration tests using Hardhat, ethers.js, Poseidon JS (`circomlibjs`), standard Merkle tree JS (`@zk-kit/incremental-merkle-tree`), and real ZK proofs.
- `/build/zk`: Output directory for compiled circuits, keys, proofs.
- `/keys`: Contains the Powers of Tau file (`.ptau`).
- `/tasks`: Task management files (using `task-master`).

## Technical Details

### Zero-Knowledge Proof Workflow

1.  **Circuit Compilation**: `mixer.circom` (using `VerifyMerklePath` and Poseidon) is compiled to R1CS and WASM using `circom` (Rust compiler v2.2+).
2.  **Trusted Setup**: Proving/verification keys generated using `snarkjs groth16` commands and a Perpetual Powers of Tau `.ptau` file.
3.  **Verifier Contract Generation**: `Verifier.sol` generated using `snarkjs zkey export solidityverifier`.
4.  **Deposit**: User deposits ETH, calculates commitment `H(nullifier, secret)` using Poseidon JS.
5.  **Merkle Tree (Off-chain)**: Commitment is added to a JS Merkle tree (`@zk-kit/incremental-merkle-tree` using Poseidon JS).
6.  **Proof Generation**: User generates a Merkle proof (`pathElements`, `pathIndices`) using the JS tree. The *contract-calculated* Merkle root is fetched. A Groth16 proof is generated using `snarkjs` with private inputs (secret, nullifier, pathElements, pathIndices) and public inputs (contract-calculated root, nullifierHash, recipient, etc.).
7.  **Withdrawal**: User (or relayer) calls `ZKMixer.withdraw`, providing the proof and public inputs (including the contract-calculated root). The contract verifies `knownRoots`, calls `Verifier.sol` (which uses `Groth16Verifier` logic) to check the ZK proof, marks the nullifier, and transfers funds.

### Current Implementation Status (Task 3 Completed)

- ✅ Core architecture setup (Contracts, Circuits, Tests).
- ✅ Web3 Wallet Integration foundations.
- ✅ Refactored ZK Core:
    - Switched from SMT to Standard Merkle Tree verification (`VerifyMerklePath`).
    - Integrated consistent Poseidon hashing (local Solidity lib, `circomlibjs`).
    - Updated circuit inputs/outputs.
    - Completed Circom compilation and Groth16 setup.
    - **Successfully implemented and passed integration tests (`ZKMixer.test.cjs`) using real ZK proofs**, employing the contract's Merkle root as the source of truth.
- ⏳ Next steps involve Task 4 (Key Management), Task 5 (UI), etc.

## Getting Started

### Prerequisites

- Node.js v18+ and npm
- Hardhat
- Circom v2.2+ (Rust compiler, ensure it's in PATH)
- snarkjs v0.7.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ZK-PrivateMixer

# Install dependencies
npm install
```

### Compiling Contracts & Circuit

Contracts are compiled automatically by Hardhat when running tests or using `npx hardhat compile`.

**Generating ZK Artifacts (Required for Tests/Frontend)**

Since build artifacts (`build/zk/`) are not committed to Git, you need to generate them locally after cloning or pulling changes to the circuits:

1.  **Download Powers of Tau File:** Obtain a suitable Perpetual Powers of Tau file (e.g., `powersOfTau28_hez_final_16.ptau`). Ensure it matches or exceeds the constraints of `circuits/mixer.circom`. Place it in the `/keys` directory.

2.  **Compile Circuit:** This creates the R1CS, WASM, and SYM files.
    ```bash
    # Ensure you are in the project root directory
    # Make sure circom compiler (v2.2+) is installed and in your PATH
    circom circuits/mixer.circom --r1cs --wasm --sym -o build/zk -l node_modules/circomlib/circuits -l circuits
    ```

3.  **Groth16 Trusted Setup (Phase 2):** This generates the proving key (`.zkey`) and verification key (`verification_key.json`). **Replace `<your_ptau_file>.ptau`** with the actual filename you downloaded.
    ```bash
    # Create final proving key (.zkey)
    npx snarkjs groth16 setup build/zk/mixer.r1cs keys/<your_ptau_file>.ptau build/zk/mixer_0000.zkey
    npx snarkjs zkey contribute build/zk/mixer_0000.zkey build/zk/mixer_final.zkey --name="Dev Contrib" -v -e="$(openssl rand -base64 20)"
    # Export verification key (JSON format, committed to Git)
    npx snarkjs zkey export verificationkey build/zk/mixer_final.zkey build/zk/verification_key.json
    ```
    *Note: `verification_key.json` IS typically committed as it's needed for verification.* 
    *Protect `mixer_final.zkey` - it should NOT be committed if generated for production.* 
    *(For development, committing `mixer_final.zkey` might be acceptable if the entropy source is known/trivial, but it's bad practice for real deployments).* 

4.  **Generate Verifier Contract:** Creates `contracts/Verifier.sol` from the `.zkey`.
    ```bash
    npx snarkjs zkey export solidityverifier build/zk/mixer_final.zkey contracts/Verifier.sol
    # IMPORTANT: Manually edit contracts/Verifier.sol after generation:
    # - Add: import "../interfaces/IVerifier.sol";
    # - Change: contract Verifier ---> contract Verifier is IVerifier
    # - Add 'override' keyword to the verifyProof function definition.
    ```


### Running Tests

Tests require the circuit to be compiled and keys generated (as above).

```bash
# Run all tests 
npx hardhat test

# Run specific test file
npx hardhat test test/ZKMixer.test.cjs 
```

## Security Considerations

- Ensure the `.ptau` file used is from a trusted, widely participated ceremony.
- Protect the `mixer_final.zkey` file - it must remain private.
- Code relies on cryptographic libraries (`circomlib`, `@zk-kit`, `poseidon-solidity`); their security underpins the project.
- Nullifier generation and hashing are critical to prevent double-spending.
- Public inputs to the circuit must include sufficient context (`chainId`, `recipient`, etc.) to prevent replay attacks.
- The contracts (`ZKMixer.sol`, copied `PoseidonT3.sol`) have **not** been professionally audited.

## Development Roadmap (Snapshot)

*   Task 1: Setup Core Architecture: `done`
*   Task 2: Implement Web3 Wallet Integration: `done`
*   **Task 3: Refactor ZK Core:** `done`
*   Task 4: Implement Key Management: `pending`
*   Task 5: Design and Implement UI: `pending`
*   Task 6: Implement Relayer Service: `pending`
*   ...

(See `tasks/tasks.json` or run `task-master list` for full details)

## Technology Stack

*   **Smart Contracts:** Solidity, Hardhat, Ethers.js
*   **ZK Circuits:** Circom, SnarkJS (Groth16), Poseidon
*   **Merkle Trees:** `@zk-kit/incremental-merkle-tree` (JS), Custom logic (Solidity), `VerifyMerklePath` (Circom)
*   **Testing:** Chai, Mocha
*   **Task Management:** `task-master`

## Contributing

Please follow the established coding standards and rules defined in `.cursor/rules`.

## License

MIT License with Commons Clause (See LICENSE file).

## Acknowledgements

- `iden3/circom`, `iden3/snarkjs`, `iden3/circomlib`
- `@zk-kit/incremental-merkle-tree`
- `poseidon-solidity` (Code copied locally)
- `thor314/circuit-examples` (Source for `VerifyMerklePath` template)
- Tornado Cash, Semaphore, Sismo for concepts and inspiration.
<!-- GitAds-Verify: LDJ4DEKYGCAIVRBREAXJBJB2QJPE29R3 -->
