<!-- GitAds-Verify: LDJ4DEKYGCAIVRBREAXJBJB2QJPE29R3 -->
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

### Archivos puente para integración Light Protocol ↔ Voragine

Para facilitar la integración y pruebas cruzadas entre stacks, se han creado archivos puente en `/external/light-protocol/bridge/`:
- `merkle_bridge.rs`: expone funciones Merkle y Poseidon de Light Protocol para uso desde otros módulos Rust o FFI.
- `merkle_bridge.js`: wrapper JS para consumir la lógica Merkle de Light Protocol desde scripts/tests JS.

Estos archivos permiten comparar raíces, pruebas y hashes entre stacks y acelerar la integración cross-chain.

## Light Protocol Integration & Merkle Bridges (2025)

- **Light Protocol's Merkle tree logic is now integrated into the project.**
- Rust and JS bridge files have been created and tested, exposing Merkle and Poseidon logic for cross-stack use.
- Merkle inclusion proofs are exported as JSON (`test_vectors_light.json`), ready for verification in Circom and Solidity.
- Project `.mdc` rules have been updated to enforce cross-stack standards for Merkle logic, serialization, and test vectors.
- Next steps: Cross-verify exported proofs in Circom (`verify_merkle_path.circom`) and Solidity (`SMTVerifierLib.sol`) to ensure full compatibility and robustness.

---

For technical details, see the `/contracts`, `/circuits`, `/frontend`, and `/tasks` directories, as well as the `.cursor/rules` folder for project rules and standards.
