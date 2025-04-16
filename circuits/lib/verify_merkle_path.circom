// Credit Sismo: https://github.com/sismo-core/hydra-s1-zkps/blob/main/circuits/common/verify-merkle-path.circom
// Highly inspired from tornado cash https://github.com/tornadocash/tornado-core/tree/master/circuits

pragma circom 2.0.0;

// Assuming these are correctly resolved via -l flags pointing to node_modules/circomlib/circuits
include "poseidon.circom";
include "comparators.circom"; 

// IMPORTANT: All empty Merkle Tree nodes (pathElements) must use the ZERO_VALUE defined as Poseidon(0,0):
// 0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864
// See: .cursor/rules/merkle_tree_rules.mdc for the project-wide standard and test vectors.

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template PositionSwitcher() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0; // Enforce s is 0 or 1
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

// Verifies that merkle path is correct for a given merkle root and leaf
// pathIndices input is an array of 0/1 selectors telling whether given 
// pathElement is on the left or right side of merkle path
template VerifyMerklePath(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component selectors[levels];
    component hashers[levels];
    signal computedPath[levels]; // To store intermediate computed hashes

    for (var i = 0; i < levels; i++) {
        selectors[i] = PositionSwitcher();
        // If i=0, the left input is the leaf, otherwise it's the hash from the previous level
        selectors[i].in[0] <== i == 0 ? leaf : computedPath[i - 1]; 
        selectors[i].in[1] <== pathElements[i]; // The sibling node
        selectors[i].s <== pathIndices[i]; // The position selector

        hashers[i] = Poseidon(2); // Using Poseidon hash
        hashers[i].inputs[0] <== selectors[i].out[0]; // Hash the correctly ordered pair
        hashers[i].inputs[1] <== selectors[i].out[1];
        
        computedPath[i] <== hashers[i].out; // Store the computed hash for the next level or final check
    }

    // The final computed hash must match the provided root
    root === computedPath[levels - 1];
} 