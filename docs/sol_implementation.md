# Solana Implementation: Findings & Roadmap

## Context
This document collects and analyzes all findings, recommendations, and technical challenges for implementing a ZK Mixer (or similar ZK dApp) on Solana, with a special focus on the integration and benchmarking of **Light Protocol** as the reference framework.

---

## Key Points & Opportunities

- **Ecosystem & Momentum:**  
  The ZK space on Solana is maturing rapidly, with Light Protocol leading the way in ZK proof integration, account compression, and stateless execution.
- **Light Protocol as Reference:**  
  - Provides concurrent Merkle trees, state compression, UTXO/ownership notes, and integrated ZK proofs.
  - Offers SDKs, setup scripts, tooling, and examples in Rust, Anchor, JS, and Go.
  - Circuits and verifiers are audited and formally verified.
- **Compatibility & Migration:**  
  - Light Protocol's Merkle logic, ZK proof system, and UTXO model can be adapted or integrated into our stack.
  - The development environment (Rust, Anchor, WASM) is already verified and functional.
- **Differences with EVM:**  
  - ZK development on Solana requires adapting circuits and proof logic to Rust/WASM, leveraging primitives like zero-copy and account compression.
  - There is not yet a zkDSL as mature as Circom/Noir for Solana, but Light Protocol covers most practical needs.

---

## Integration Workflow & Roadmap

- **Step 1: Integrate and experiment with Light Protocol**
  - Priority: enable native ZK circuits, proofs, and verifiers on Solana using Light Protocol.
  - Document and adapt Merkle logic, ZK proofs, UTXO, and account compression.
  - Maintain cross-stack consistency (hashes, roots, public inputs) and document test vectors.
  - Use and adapt the new `solana_workflow.mdc` rule to standardize the workflow.

- **Step 2: Benchmarking and adaptation**
  - Compare performance, security, and developer experience between our stack and Light Protocol.
  - Identify synergies and possible cross-pollination (e.g., porting tooling, improving documentation, etc.).

- **Step 3: (Optional) dKit integration for cross-chain swaps**
  - Once the ZK workflow is robust, consider integrating dKit for swaps and liquidity between Solana and EVM.

---

## Findings & Blockers (updated)

- **Findings:**
  - Light Protocol's environment is robust and well documented.
  - Merkle and compression logic is more efficient than in EVM.
  - The UTXO and ownership note model is flexible and extensible.
  - ZK proof integration and on-chain verification are solved and audited.
- **Current blockers:**  
  - No critical blockers found so far.
  - The main challenge will be adapting proof and circuit logic to Rust/WASM for maximum integration.

---

## Next Steps

- [x] Clone and prepare the Light Protocol environment.
- [x] Build and run example tests/circuits.
- [x] Draft and adapt the `solana_workflow.mdc` rule.
- [ ] Deep dive into Merkle, ZK, and UTXO logic for adaptation or porting to our stack.
- [ ] Document benchmarks and comparisons.
- [ ] Update this file as integration progresses.

---

## Crate Compatibility Testing

We've conducted a systematic testing of individual Light Protocol crates to identify which components can be used directly in our project without modification. This helps us understand the maturity and structure of the codebase, as well as potential integration points.

### Successfully Compiled Crates

1. **light-account-checks** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Account validation and permission checks for compressed accounts
   - **Dependencies**: solana-program, thiserror, borsh
   - **Notes**: Several warnings about `default-features` flag in workspace dependencies, but no functional issues

2. **light-hasher** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Hash function abstractions and implementations (including Poseidon)
   - **Dependencies**: ark-bn254, ark-ff, ark-std, light-poseidon, solana-program
   - **Notes**: Compilation takes approximately 1m 19s due to cryptographic dependencies

3. **light-concurrent-merkle-tree** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Efficient concurrent Merkle tree implementation for Solana
   - **Dependencies**: light-bounded-vec, light-hasher, light-utils, solana-program, memoffset
   - **Notes**: Compilation takes about 29s; depends on light-bounded-vec, which is correctly resolved within Light Protocol's workspace

### In-Progress Testing

Remaining crates to test (in priority order):
- light-hash-set
- light-indexed-merkle-tree
- light-batched-merkle-tree
- light-merkle-tree-metadata

---

## References

- [Light Protocol GitHub](https://github.com/Lightprotocol/light-protocol)
- [Light Protocol Docs](https://github.com/Lightprotocol/developer-content/tree/main/docs)
- [solana_workflow.mdc](../.cursor/rules/solana_workflow.mdc)
- [ZK Mixer README](../README.md)

---

## Expert Analysis & Commentary

*To be expanded as more information is processed and contrasted with the latest ZKP and Solana best practices.* 

---

## Relevant Projects: Light Protocol (ZK for Solana)

- **Light Protocol** ([GitHub](https://github.com/Lightprotocol/light-protocol)) is a leading open-source ZK protocol purpose-built for Solana.
    - **What it offers:**
        - ZK Compression Protocol for Solana: enables stateless program execution and reduces on-chain state costs using ZK proofs.
        - Provides primitives for building zk-applications on Solana, such as zk-coprocessors, zk-identity, and offchain orderbooks.
        - Includes audited and formally verified circuits, and a modular architecture with Rust, WASM, and Anchor.
        - Offers a development environment, CLI tools, and SDKs for integration.
    - **How it could help us:**
        - We can study or reuse their approach to ZK verifiers and stateless execution on Solana, which is a major technical hurdle for any ZK mixer.
        - Their circuits, prover infrastructure, and compression logic could serve as a reference or even be adapted for our use case.
        - Their documentation and modular codebase (see [docs](https://github.com/Lightprotocol/developer-content/tree/main/docs)) can accelerate our learning curve for Solana ZK development.
        - If our use case fits, we could consider building on top of Light Protocol or integrating with their primitives, rather than starting from scratch.
    - **Key Takeaway:**
        - Light Protocol is the most advanced, production-grade ZK framework for Solana to date. Leveraging their work—either by direct integration or by adapting their architecture—could save us months of R&D and help us avoid common pitfalls in Solana ZK development.

---

## Integration Workflow & Roadmap

- **Step 1: Light Protocol for ZK on Solana**
    - The first priority is to implement and experiment with Light Protocol to enable ZK circuits, proofs, and verifiers natively on Solana.
    - The goal is to have a robust, privacy-preserving workflow running on Solana before adding cross-chain features.
    - All research, prototyping, and development should focus on understanding and leveraging Light Protocol's primitives, SDKs, and documentation.

- **Step 2: dKit by El Dorito for Cross-Chain Swaps (Optional, Complementary)**
    - Once the ZK workflow is functional, we can consider integrating dKit to enable seamless cross-chain swaps and liquidity (e.g., deposit in Solana, withdraw in EVM, or vice versa).
    - dKit is not a ZK solution, but a liquidity and swap layer that can complement our ZK mixer and improve UX.

**Rationale:**
- The privacy and ZK proof workflow is the core of the mixer; it must be robust and secure before adding cross-chain features.
- dKit can be layered on top to provide a unified, multi-chain user experience once the ZK foundation is in place.

See the README for the latest summary of this workflow and rationale.

---

## Annexes

### Annex 1: Compilation Warnings in Light Protocol

The following warnings were observed during the compilation of Light Protocol crates:

1. **Workspace Dependencies Warnings**:
   - Unused manifest key: `workspace.dependencies.spl-token-2022.no-default-features`
   - Multiple `default-features` ignored for various dependencies because they were not specified in workspace dependencies:
     - light-account-checks, light-batched-merkle-tree, light-compressed-account, light-hasher, light-indexed-merkle-tree, light-macros, light-merkle-tree-metadata, light-verifier, groth16-solana, thiserror

2. **Patch Warnings**:
   - Patch `solana-rpc v1.18.22` was not used in the crate graph. This might be due to version compatibility issues or optional dependencies not being enabled.

These warnings do not affect functionality but indicate potential improvements for workspace configuration consistency. If these warnings become errors in future Rust/Cargo versions, they may need to be addressed. 