// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice Interface for the ZK proof verifier contract.
 */
interface IVerifier {
    /**
     * @notice Verifies a ZK-SNARK proof.
     * @param a The proof component a.
     * @param b The proof component b.
     * @param c The proof component c.
     * @param input The public inputs for the proof.
     * @return True if the proof is valid, false otherwise.
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) external view returns (bool);
} 