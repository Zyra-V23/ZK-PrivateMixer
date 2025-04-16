// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PoseidonT3.sol";

/**
 * @title SMTVerifierLib
 * @notice Library for verifying Sparse Merkle Tree inclusion proofs.
 * @dev Adapted from concepts in attestate/indexed-sparse-merkle-tree, modified for PoseidonT3 and index-based path derivation.
 */
library SMTVerifierLib {

    // Using the Poseidon(0,0) hash as ZERO_VALUE, matching ZKMixer.sol and the project-wide Merkle Tree rule.
    // See: .cursor/rules/merkle_tree_rules.mdc
    bytes32 constant ZERO_VALUE = 0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864;

    /**
     * @notice Verifies a Sparse Merkle Tree proof.
     * @param _depth The depth of the tree (e.g., MERKLE_TREE_HEIGHT).
     * @param _root The expected root hash of the tree.
     * @param _leaf The leaf value being verified.
     * @param _index The index of the leaf in the tree.
     * @param _siblings The sibling nodes along the path from the leaf to the root (pathElements).
     * @return True if the proof is valid, false otherwise.
     */
    function verifyProof(
        uint256 _depth,
        bytes32 _root,
        bytes32 _leaf,
        uint256 _index, // Path is now derived from _index
        bytes32[] memory _siblings
        // uint256 _pathIndices // Removed: Path derived from _index
    ) internal pure returns (bool) {
        require(_siblings.length == _depth, "SMTVerifierLib: Incorrect number of siblings");

        bytes32 computedHash = _leaf;
        uint256 currentIndex = _index; // Use a mutable variable for the index traversal

        for (uint256 d = 0; d < _depth; d++) {
            bytes32 sibling = _siblings[d];

            // Determine if the current node is the left (0) or right (1) child
            // based on the least significant bit of the current index for this level
            if (currentIndex & 1 == 0) { 
                // Current node is left child (index is even), sibling is right
                computedHash = _hashPair(computedHash, sibling);
            } else {
                // Current node is right child (index is odd), sibling is left
                computedHash = _hashPair(sibling, computedHash);
            }
            
            // Move to the next level by dividing the index by 2 (integer division)
            currentIndex = currentIndex >> 1; 
        }

        return computedHash == _root;
    }

    /**
     * @notice Internal function to hash a pair of nodes using PoseidonT3.
     * @dev Converts bytes32 to uint256 for PoseidonT3 and back to bytes32.
     */
    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        uint256[2] memory inputs;
        inputs[0] = uint256(a);
        inputs[1] = uint256(b);
        
        // Handle the case where both inputs are zero to avoid unnecessary hash calls
        // if the hash of (0,0) is known or defined differently.
        // Assuming ZERO_VALUE corresponds to uint256(0) for Poseidon inputs.
        if (inputs[0] == 0 && inputs[1] == 0) {
             // If the spec defines hash(0,0) == 0, return 0.
             // Otherwise, if hash(0,0) is non-zero, we MUST call PoseidonT3.hash.
             // Assuming for now we want hash(0,0) == 0 for SMT efficiency.
             // This needs to match the circuit's ZERO_VALUE definition.
            return ZERO_VALUE; 
        }

        uint256 result = PoseidonT3.hash(inputs);
        return bytes32(result);
    }
} 