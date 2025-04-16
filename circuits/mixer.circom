pragma circom 2.0.0;

// Includes will be resolved via -l flag pointing to node_modules/circomlib/circuits and circuits/
include "poseidon.circom"; // From circomlib
include "comparators.circom"; // From circomlib
include "lib/verify_merkle_path.circom"; // Our new local library file

/*
 * @title Mixer Circuit
 * @notice Verifies that a user knows the preimage to a commitment in a Merkle tree,
 *         and generates a nullifier hash correctly, without revealing the commitment or preimage.
 * @param levels The number of levels in the Merkle tree (tree height).
 */
template Mixer(levels) {
    // --- Private Inputs ---
    // Preimage of the commitment
    signal input secret; // Private random value
    signal input nullifier; // Private nullifier
    
    // Merkle proof
    signal input pathElements[levels]; // Path elements (siblings) from leaf to root
    signal input pathIndices[levels];  // Path indices (0/1)

    // --- Public Inputs ---
    signal input root;             // Known Merkle root the proof is against
    signal input nullifierHash;    // Public nullifier hash to prevent double spending
    signal input recipient;        // Address of the recipient 
    signal input relayer;         // Address of the relayer (can be zero if no relayer)
    signal input fee;             // Fee for the relayer (can be zero if no relayer)
    signal input chainId;         // Chain ID to prevent cross-chain replay attacks
    signal input refund;          // Refund amount (can be zero if no refund)

    // --- Output ---
    // The circuit doesn't explicitly output signals in the same way functions return values.
    // Its validity is proven by satisfying all constraints.

    // --- Ensure private inputs are not zero (mitigates specific attacks) ---
    component nullifierNonZero = IsZero();
    nullifierNonZero.in <== nullifier;
    signal nullifierIsValid <== 1 - nullifierNonZero.out;
    nullifierIsValid === 1; // Constraint: nullifier cannot be zero

    component secretNonZero = IsZero();
    secretNonZero.in <== secret;
    signal secretIsValid <== 1 - secretNonZero.out;
    secretIsValid === 1; // Constraint: secret cannot be zero

    // --- Calculate and verify commitment ---
    // Calculate commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    signal commitment <== commitmentHasher.out;

    // --- Calculate and verify nullifier hash ---
    // Changed to Poseidon(2) using nullifier and chainId for compatibility with PoseidonT3.sol
    component nullifierHasher = Poseidon(2); 
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== chainId;
    
    // --- Constraints ---
    // 1. Verify the calculated nullifier hash matches the public input
    nullifierHash === nullifierHasher.out;

    // 2. Verify fee is valid (prevents economic attacks where fee > refund)
    component feeValid = LessThan(64); // 64 bits should be enough for fee comparison
    feeValid.in[0] <== fee;
    feeValid.in[1] <== refund + 1; // fee must be <= refund
    feeValid.out === 1;

    // 3. Check Merkle Proof: Verify the commitment is part of the tree identified by root using VerifyMerklePath
    component merkleProof = VerifyMerklePath(levels);
    merkleProof.leaf <== commitment; // Use the calculated commitment as the leaf
    merkleProof.root <== root;       // Public root
    for (var i = 0; i < levels; i++) {
        merkleProof.pathElements[i] <== pathElements[i]; // Siblings
        merkleProof.pathIndices[i] <== pathIndices[i];   // Path direction (0 or 1)
    }
    // VerifyMerklePath enforces the root constraint internally, no need for .out === 1 here.

    // Future enhancement: Add range proofs for the relayer fee to ensure it's within reasonable bounds
}

// Instantiate the template for our specific tree height
// The MERKLE_TREE_HEIGHT from Solidity was 20
component main {public [root, nullifierHash, recipient, relayer, fee, chainId, refund]} = Mixer(20);

// IMPORTANT: All Merkle Tree pathElements (empty nodes) must use the ZERO_VALUE defined as Poseidon(0,0):
// 0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864
// See: .cursor/rules/merkle_tree_rules.mdc for the project-wide standard and test vectors. 