// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol"; // Import the interface

/**
 * @title MockVerifier
 * @notice A mock verifier contract for testing purposes.
 * @dev Always returns true for verifyProof, ignoring the actual proof data.
 */
contract MockVerifier is IVerifier {
    /**
     * @notice Mock implementation of verifyProof.
     * @dev Always returns true, regardless of input.
     * @param a The proof component a (ignored).
     * @param b The proof component b (ignored).
     * @param c The proof component c (ignored).
     * @param input The public inputs for the proof (ignored).
     * @return Always true.
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) external pure override returns (bool) {
        // Ignore all inputs and always return true for testing
        a; b; c; input; // Suppress unused variable warnings
        return true;
    }
} 