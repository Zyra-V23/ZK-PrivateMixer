pragma circom 0.5.0;

// Includes will be resolved via -l flag pointing to node_modules/circomlib/circuits
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/smt/smtverifier.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Mixer Circuit
 * Verifies that a user knows the preimage to a commitment in a Merkle tree,
 * and generates a nullifier hash correctly, without revealing the commitment or preimage.
 * levels: The number of levels in the Merkle tree (tree height).
 */
template Mixer(levels) {
    // --- Private Inputs ---
    // Preimage of the commitment
    signal private input secret; // Private random value
    signal private input nullifier; // Private nullifier
    
    // Merkle proof
    signal private input pathElements[levels]; // Path elements (siblings) from leaf to root
    signal private input pathIndices[levels];  // Path indices (0 for left, 1 for right)

    // --- Public Inputs ---
    signal input root;             // Known Merkle root the proof is against
    signal input nullifierHash;    // Public nullifier hash to prevent double spending
    signal input recipient;        // Address of the recipient 
    signal input relayer;          // Address of the relayer (can be zero if no relayer)
    signal input fee;              // Fee for the relayer (can be zero if no relayer)
    signal input chainId;          // Chain ID to prevent cross-chain replay attacks
    signal input refund;           // Refund amount (can be zero if no refund)

    // --- Output ---
    signal output result;  // A dummy output that is always 1 if constraints pass

    // --- Ensure private inputs are not zero (mitigates specific attacks) ---
    component nullifierNonZero = IsZero();
    nullifierNonZero.in <== nullifier;
    signal nullifierIsValid;
    nullifierIsValid <== 1 - nullifierNonZero.out;
    nullifierIsValid === 1; // Constraint: nullifier cannot be zero

    component secretNonZero = IsZero();
    secretNonZero.in <== secret;
    signal secretIsValid;
    secretIsValid <== 1 - secretNonZero.out;
    secretIsValid === 1; // Constraint: secret cannot be zero

    // --- Calculate and verify commitment ---
    // Calculate commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    signal commitment;
    commitment <== commitmentHasher.out;

    // --- Calculate and verify nullifier hash ---
    // Enhanced nullifierHash = Poseidon(nullifier, recipient, chainId)
    // Including recipient and chainId prevents replay attacks across recipients and chains
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== recipient;
    nullifierHasher.inputs[2] <== chainId;
    
    // --- Constraints ---
    // 1. Verify the calculated nullifier hash matches the public input
    nullifierHash === nullifierHasher.out;

    // 2. Verify fee is valid (prevents economic attacks where fee > refund)
    component feeValid = LessThan(64); // 64 bits should be enough for fee comparison
    feeValid.in[0] <== fee;
    feeValid.in[1] <== refund + 1; // fee must be <= refund
    feeValid.out === 1;

    // 3. Check Merkle Proof: Verify the commitment is part of the tree identified by root
    component merkleProof = SMTVerifier(levels);
    merkleProof.enabled <== 1;       // Enable the verifier
    merkleProof.fnc <== 0;           // Function code 0 for inclusion proof
    merkleProof.root <== root;       // Public root
    merkleProof.key <== commitment;  // The leaf (commitment) we are proving inclusion for
    merkleProof.value <== 1;         // Assuming value 1 indicates inclusion
    merkleProof.oldKey <== 0;        // Dummy value for inclusion proof
    merkleProof.oldValue <== 0;      // Dummy value for inclusion proof
    merkleProof.isOld0 <== 1;        // Indicates the old leaf was 0 (necessary for inclusion proof logic in SMT)
    
    for (var i = 0; i < levels; i++) {
        merkleProof.siblings[i] <== pathElements[i]; // Map pathElements to siblings
    }

    // Set the result output to 1 to indicate all constraints have passed
    result <== 1;
}

// Instantiate the template for our specific tree height (20 levels)
component main = Mixer(20); 