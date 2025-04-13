// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier Interface
 * @notice Interface for a Groth16 zk-SNARK verifier contract.
 */
interface IVerifier {
    /**
     * @notice Verifies a Groth16 proof.
     * @param _pA The proof component A (G1 point).
     * @param _pB The proof component B (G2 point).
     * @param _pC The proof component C (G1 point).
     * @param _pubSignals The public inputs used for the proof. The size must match the circuit definition.
     * @return True if the proof is valid, false otherwise.
     */
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[7] calldata _pubSignals // Matches the Verifier.sol signature
    ) external view returns (bool);
} 