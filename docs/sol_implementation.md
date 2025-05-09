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

4. **light-hash-set** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Hash set implementation for Solana accounts
   - **Dependencies**: solana-program, thiserror, num-bigint, num-traits
   - **Notes**: Compila con múltiples warnings sobre `default-features` y un patch no utilizado, pero sin errores funcionales

5. **light-indexed-merkle-tree** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Indexed Merkle tree implementation for efficient state proofs
   - **Dependencies**: light-bounded-vec, light-indexed-array, light-utils
   - **Notes**: Compila con múltiples warnings sobre `default-features` y un patch no utilizado, pero sin errores funcionales

6. **light-batched-merkle-tree** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Batched Merkle tree implementation for efficient batch updates
   - **Dependencies**: light-hasher, light-account-checks, light-compressed-account, light-merkle-tree-metadata
   - **Notes**: Compila con múltiples warnings sobre `default-features` y un patch no utilizado, pero sin errores funcionales. Tiempo de compilación: ~1m 50s

7. **light-merkle-tree-metadata** (2024-06-28)
   - **Status**: ✅ Compiles successfully
   - **Purpose**: Metadata management for Merkle trees in Light Protocol
   - **Dependencies**: ark-ff, ark-bn254, light-hasher, light-compressed-account
   - **Notes**: Compila con múltiples warnings sobre `default-features` y un patch no utilizado, pero sin errores funcionales. Tiempo de compilación: ~25s

### In-Progress Testing

All priority crates tested. Next steps: test additional crates as needed or proceed to integration/benchmarking.

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

3. **Tested crate:** light-hash-set (2024-06-28)
   - Multiple warnings about `default-features` ignored for dependencies (see terminal output)
   - Patch `solana-rpc v1.18.22` not used in the crate graph

4. **Tested crate:** light-indexed-merkle-tree (2024-06-28)
   - Multiple warnings about `default-features` ignored for dependencies (see terminal output)
   - Patch `solana-rpc v1.18.22` not used in the crate graph

5. **Tested crate:** light-batched-merkle-tree (2024-06-28)
   - Multiple warnings about `default-features` ignored for dependencies (see terminal output)
   - Patch `solana-rpc v1.18.22` not used in the crate graph

6. **Tested crate:** light-merkle-tree-metadata (2024-06-28)
   - Multiple warnings about `default-features` ignored for dependencies (see terminal output)
   - Patch `solana-rpc v1.18.22` not used in the crate graph

These warnings do not affect functionality but indicate potential improvements for workspace configuration consistency. If these warnings become errors in future Rust/Cargo versions, they may need to be addressed. 

---

## Findings and Adaptation of Merkle Logic (Light Protocol vs Voragine)

### Summary of Merkle Logic in Light Protocol
- Concurrent and zero-copy Merkle trees, optimized for Solana (Rust/Anchor).
- Use of Poseidon as hash function, with parameters aligned to ZK standards (Poseidon(0,0) as ZERO_VALUE).
- Efficient root management: multiple valid roots, changelog and efficient verification.
- Audited primitives and documented test vectors.

### Comparison with our current logic (EVM/Circom/JS)
- Our logic in Solidity and Circom uses the same ZERO_VALUE (Poseidon(0,0)), and the initial root is aligned (see [merkle_tree_rules.mdc]).
- Root calculation and proof verification in Solidity, Circom and JS are aligned, but don't implement concurrency or zero-copy.
- Root management in our stack is simpler (only one known root at a time), without changelog or multiple valid roots.

### Adaptation proposals
- **Import Light Protocol's concurrent Merkle logic** as reference for future Solana implementations and, if possible, port concepts to JS/Solidity (e.g., update batching, root changelog).
- **Create bridge files** in `/external/light-protocol/bridge/` to expose Light Protocol's Merkle and Poseidon logic to our Voragine stack:
  - `merkle_bridge.rs` (Rust): exposes Merkle and hashing functions to be called from other modules or FFI.
  - `merkle_bridge.js` (JS): wrapper to consume Light Protocol's Merkle logic from JS scripts/tests.
  - Document in the README the existence and usage of these bridge files.
- **Align and document test vectors** (ZERO_VALUE, initial roots, inclusion proofs) between both stacks.
- **Update documentation** to reflect integration and extension/adaptation points.

### Next steps
- Implement bridge files and wrappers.
- Test root and proof consistency between both stacks.
- Document any differences or incompatibilities found.

---

## New Goal: Maximum Robustness and Cross-Stack Inclusion Proofs

### Objective
Ensure maximum robustness and compatibility between stacks by generating Merkle inclusion proofs in Light Protocol (Rust) and verifying them in Circom and Solidity.

### Action plan
1. **Generate inclusion proofs in Rust (Light Protocol):**
   - Use crates and bridges to create Merkle trees, insert leaves and generate inclusion proofs (leaf, root, pathElements, pathIndices).
   - Export proof inputs to a JSON file (e.g., `test_vectors_light.json`).
2. **Verify proof in Circom:**
   - Use `verify_merkle_path.circom` circuit with the same inputs exported from Rust.
   - Confirm that the proof is valid and root matches.
3. **Verify proof in Solidity:**
   - Use `verifyProof` function from `SMTVerifierLib.sol` with the same data.
   - Confirm that verification is successful.
4. **Document results and differences:**
   - If everything matches, record in documentation and `.mdc` rules.
   - If there are differences, analyze and document the cause (encoding, padding, etc.).

### Next steps
- Implement Rust test and export vectors.
- Prepare scripts/circuits for Circom and Solidity verification.
- Document flow and results in this file and corresponding rules.

---

## Light Protocol Merkle Logic Integration – Progress & Status

### Summary of Progress
- Light Protocol's Merkle tree logic is now integrated into the workspace.
- All required crates (`concurrent-merkle-tree`, `light-hasher`, etc.) are included and build without errors.
- A Rust example (`merkle_vectors`) was created that:
  - Instantiates a Merkle tree.
  - Inserts a leaf.
  - Reconstructs the Merkle inclusion proof (for a single-leaf tree, all siblings are ZERO_VALUE).
  - Exports the proof as a JSON file (`test_vectors_light.json`) in a format compatible with Circom and Solidity.
- The bridges for Merkle logic are in place and tested: the Rust code compiles and runs, producing the expected output.
- The `.mdc` rules for Merkle trees have been updated to reflect cross-stack standards, serialization, and test vector requirements.

### What's left for Merkle logic
- (Optional, for robustness) Export and test multi-leaf Merkle proofs (with real siblings, not just ZERO_VALUE).
- Use the exported JSON as input for Circom (`verify_merkle_path.circom`) and Solidity (`SMTVerifierLib.sol`) to confirm cross-stack proof verification.
- Document any encoding, padding, or root mismatches found in these cross-stack tests.
- Finalize documentation and mark all related tasks as done once cross-verification is confirmed.

---

## Next Steps for Task 16: Light Protocol Integration (Merkle Logic)

To complete Task 16 and its subtasks, the following actions remain:

1. **(Optional, for robustness) Export and test multi-leaf Merkle proofs**
   - Insert multiple leaves into the Merkle tree in Rust.
   - Export inclusion proofs for leaves that have real siblings (not just ZERO_VALUE).
   - Ensure the exported JSON format matches the single-leaf case.

2. **Cross-stack verification in Circom**
   - Use the exported JSON as input for the `verify_merkle_path.circom` circuit.
   - Confirm that the proof is valid and the root matches.
   - Document any issues with encoding, padding, or root calculation.

3. **Cross-stack verification in Solidity**
   - Use the same JSON vectors as input for a Solidity test using `SMTVerifierLib.sol`.
   - Confirm that the proof is accepted and the root matches.
   - Document any issues with encoding, padding, or root calculation.

4. **Documentation and finalization**
   - Record all findings, mismatches, and resolutions in this file and the relevant `.mdc` rules.
   - Once cross-verification is confirmed, mark all related subtasks (16.7–16.12) as done in the task tracker.
   - Summarize the completed workflow and any lessons learned for future cross-stack ZK integrations.

**With these steps, the Merkle logic integration for Light Protocol will be fully robust, cross-verified, and ready for further ZK workflow development.**

--- 