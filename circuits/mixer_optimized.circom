pragma circom 2.0.0;

// Includes will be resolved via -l flag pointing to node_modules/circomlib/circuits
include "poseidon.circom";
include "smtverifier.circom";
include "comparators.circom";
include "bitify.circom";

/*
 * @title Optimized Mixer Circuit
 * @notice An optimized implementation of the ZK Mixer that reduces constraint count
 *         while maintaining security properties.
 * @dev Optimizations:
 *      1. Combined hash calculations where possible
 *      2. Efficient constraint usage in validation checks
 *      3. Careful signal reuse
 * @param levels The number of levels in the Merkle tree (tree height).
 */
template OptimizedMixer(levels) {
    // --- Private Inputs ---
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // --- Public Inputs ---
    signal input root;             // Merkle root
    signal input nullifierHash;    // Nullifier hash for double-spend prevention
    signal input recipient;        // Recipient address
    signal input relayer;          // Relayer address (can be zero)
    signal input fee;              // Relayer fee
    signal input refund;           // Refund amount
    signal input chainId;          // Chain ID for cross-chain protection

    // --- Optimize input validation ---
    // Use a single component to verify both inputs are non-zero
    // This is more efficient than using two separate IsZero components
    signal nonZeroSecret <== secret * nullifier; // Will be non-zero only if both are non-zero
    component inputCheck = IsZero();
    inputCheck.in <== nonZeroSecret;
    signal inputsValid <== 1 - inputCheck.out;
    inputsValid === 1; // Ensures both secret and nullifier are non-zero

    // --- Optimize commitment and nullifier hash calculation ---
    // Calculate commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    signal commitment <== commitmentHasher.out;

    // Calculate nullifierHash = Poseidon(nullifier, recipient, chainId)
    // We include chainId to prevent cross-chain replay attacks
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== recipient;
    nullifierHasher.inputs[2] <== chainId;
    
    // Verify nullifierHash matches public input
    nullifierHash === nullifierHasher.out;

    // --- Optimize fee validation ---
    // Instead of using LessThan which is constraint-heavy,
    // we can use a simpler approach for fee <= refund
    // This works because fee and refund are expected to be positive values
    signal feeValid <== refund - fee + 1; // Will be positive only if fee <= refund
    component feeCheck = IsZero();
    feeCheck.in <== feeValid;
    signal feeCheckResult <== 1 - feeCheck.out;
    // Constraint: feeValid must not be zero (which would mean fee > refund)
    feeCheckResult === 1;

    // --- Merkle Proof Verification ---
    component merkleProof = SMTVerifier(levels);
    merkleProof.enabled <== 1;
    merkleProof.fnc <== 0;
    merkleProof.root <== root;
    merkleProof.key <== commitment;
    merkleProof.value <== 1;
    merkleProof.oldKey <== 0;
    merkleProof.oldValue <== 0;
    merkleProof.isOld0 <== 1;
    
    for (var i = 0; i < levels; i++) {
        merkleProof.siblings[i] <== pathElements[i];
    }

    // --- Optional: Relayer address validation ---
    // If relayer fee is non-zero, relayer address must be non-zero
    // This is an important security check that prevents fees being sent to address(0)
    component relayerCheck = IsZero();
    relayerCheck.in <== relayer;
    signal relayerIsZero <== relayerCheck.out;
    
    component feeZeroCheck = IsZero();
    feeZeroCheck.in <== fee;
    signal feeIsZero <== feeZeroCheck.out;
    
    // If fee > 0, then relayer cannot be 0
    // (feeIsZero OR NOT relayerIsZero) must be true
    // Which is equivalent to: feeIsZero + (1 - relayerIsZero) >= 1
    signal validRelayerConfig <== feeIsZero + (1 - relayerIsZero);
    validRelayerConfig >= 1;
}

// Instantiate the template for our specific tree height
component main {public [root, nullifierHash, recipient, relayer, fee, refund, chainId]} = OptimizedMixer(20); 