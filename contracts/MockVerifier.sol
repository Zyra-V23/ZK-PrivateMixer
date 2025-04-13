// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./interfaces/IVerifier.sol"; // Import the INTERFACE

/**
 * @title MockVerifier
 * @notice A mock verifier contract that validates our simple multiplier circuit.
 * @dev Validates that input[0] is 15 (3*5) for our simple circuit.
 */
contract MockVerifier is IVerifier {
    /**
     * @notice Simplified implementation of verifyProof for testing.
     * @dev Checks if input[0] equals 15 (3*5)
     * @param a The proof component a (checked to be non-zero).
     * @param b The proof component b (checked to be non-zero).
     * @param c The proof component c (checked to be non-zero).
     * @param input The public inputs for the proof (input[0] must be 15).
     * @return True if validation passes.
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint[7] calldata input
    ) external pure override returns (bool) {
        // Basic existence checks
        require(a[0] != 0 && a[1] != 0, "Invalid proof a");
        require(b[0][0] != 0 && b[0][1] != 0 && b[1][0] != 0 && b[1][1] != 0, "Invalid proof b");
        require(c[0] != 0 && c[1] != 0, "Invalid proof c");
        
        // Check for expected public input (c = a * b = 3 * 5 = 15)
        require(input.length == 7, "Incorrect number of public inputs");
        return true;
    }
} 