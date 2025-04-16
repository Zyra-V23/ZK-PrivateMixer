# ZK-PrivateMixer (Uzumaki/U-ZK Void)

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

---

For technical details, see the `/contracts`, `/circuits`, `/frontend`, and `/tasks` directories, as well as the `.cursor/rules` folder for project rules and standards.
