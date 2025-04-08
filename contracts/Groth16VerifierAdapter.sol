// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol"; // Import the interface

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool);
}

/**
 * @title Groth16VerifierAdapter
 * @notice Adapter for Groth16Verifier to match the IVerifier interface
 */
contract Groth16VerifierAdapter is IVerifier {
    // The actual Groth16Verifier contract address
    address public immutable groth16VerifierAddress;
    
    /**
     * @dev Constructor that accepts the Groth16Verifier address
     * @param _groth16VerifierAddress Address of the Groth16Verifier contract
     */
    constructor(address _groth16VerifierAddress) {
        require(_groth16VerifierAddress != address(0), "Verifier address cannot be zero");
        groth16VerifierAddress = _groth16VerifierAddress;
    }
    
    /**
     * @notice Verifies a ZK-SNARK proof by adapting to the Groth16Verifier format
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
    ) external view override returns (bool) {
        // Convert dynamic array to fixed array of 3 elements for Groth16Verifier
        uint256[3] memory fixedInput;
        
        // Copy values from dynamic array to fixed array
        for (uint i = 0; i < 3 && i < input.length; i++) {
            fixedInput[i] = input[i];
        }
        
        // In snarkjs, the b values are arranged differently - snarkjs swaps the x,y for each b value
        // So we need to correct this before calling the verifier
        uint256[2][2] memory correctedB = [
            [b[0][1], b[0][0]],
            [b[1][1], b[1][0]]
        ];
        
        // Use the interface for a more type-safe call
        try IGroth16Verifier(groth16VerifierAddress).verifyProof(a, correctedB, c, fixedInput) returns (bool result) {
            return result;
        } catch {
            return false; // If the call fails, return false to indicate verification failure
        }
    }
} 