# ZK Mixer - Circuit Analysis & Development Notes

## Overview

This document captures key findings, challenges, and solutions encountered during the development of the ZK Mixer circuit components, particularly focusing on the Sparse Merkle Tree (SMT) implementation and zero-knowledge proof workflow.

## Circuit Architecture

The ZK Mixer core functionality is implemented using Circom 2.0 circuits with the following key components:

1. **Main Mixer Circuit (`mixer.circom`)**: Validates that a user knows the preimage to a commitment in a Merkle tree and generates a nullifier hash correctly, without revealing the commitment or preimage.

2. **Cryptographic Components**:
   - **Poseidon Hash**: Used for commitment and nullifier hash calculations
   - **SMTVerifier**: Used for Sparse Merkle Tree inclusion proofs

3. **Key Circuit Signals**:
   - **Private inputs**: `secret`, `nullifier`, `pathElements`, `pathIndices`
   - **Public inputs**: `root`, `nullifierHash`, `recipient`

## Dual Circuit Implementation Strategy

To manage complexity and ensure reliable ZK proof workflow implementation, we've adopted a dual circuit approach:

1. **Simple Circuit (`example.circom`)**:
   - **Purpose**: Acts as a minimal viable implementation to validate the complete ZK workflow
   - **Implementation**: A basic multiplier circuit (a × b = c) with minimal constraints
   - **Workflow**: Has its own complete build process, inputs, and Solidity verifier
   - **Artifacts**: Dedicated build files in `circuits/build/example_*` and a separate `ExampleVerifier.sol` contract
   - **Inputs**: Simple `example_input.json` with just two values (a and b)

2. **Complex Mixer Circuit (`mixer.circom`)**:
   - **Purpose**: Implements the actual ZK mixer functionality with SMT verification
   - **Implementation**: Full cryptographic implementation using Poseidon and SMTVerifier
   - **Workflow**: More complex build process requiring specific input generation
   - **Artifacts**: Larger build files in `circuits/build/mixer_*` and corresponding verifier contract
   - **Inputs**: Multiple input variants (`simple_input.json`, `debug_input.json`, `input.json`) for different testing scenarios

3. **Benefits of this approach**:
   - **Progressive Testing**: Allows us to verify the entire ZK workflow with a simple circuit before tackling the more complex one
   - **Isolated Debugging**: When issues arise, we can determine if they are related to the ZK workflow itself or to the specific circuit logic
   - **Learning Tool**: Serves as a clear example for understanding the minimal requirements of a functional ZK circuit
   - **Benchmark Comparison**: Provides insight into the constraint and performance differences between simple and complex implementations
   - **Fallback Option**: If the complex circuit encounters persistent issues, we still have a functional ZK workflow to demonstrate the concept

4. **Implementation Note**: Both circuits follow the same workflow steps (compilation, setup, proof generation, verification) but with different complexity levels, allowing for focused troubleshooting of each step in the process.

## SMTVerifier Analysis

### Core Requirements

The `SMTVerifier` component, which is central to our Merkle tree proof validation, has specific requirements that must be followed:

1. **Path Structure Requirements**:
   - The **last sibling** in the path array **MUST be zero** (`pathElements[nLevels-1] === 0`)
   - At least one **earlier sibling** (typically the second-to-last) **must be non-zero**
   - This is enforced by assertion in line 92 of `SMTVerifier.circom`

2. **Key Relationships**:
   - For inclusion proofs where the key was not previously in the tree, set `isOld0 = 1`
   - For other operations, ensure the relationship between `key`, `oldKey`, and `isOld0` follows the expected pattern
   - Errors in these relationships can cause constraint failures in line 92 of `SMTVerifier.circom`

### Common Issues

1. **Witness Generation Failures**:
   - Most common error: `Assert Failed. Error in template SMTVerifier_157 line: 92`
   - Caused by invalid path construction, especially when all siblings are zero or the last sibling is non-zero
   - Also happens when the nullifierHash doesn't match the actual Poseidon hash of nullifier and recipient

2. **Hash Consistency**:
   - The nullifierHash must be calculated using the same Poseidon implementation in both:
     - The circuit (internal constraint: `nullifierHash === nullifierHasher.out`)
     - The input generation script
   - Any mismatch will cause constraint failures

## Input Generation Strategy

After extensive testing, we've developed a robust strategy for generating valid inputs:

```javascript
// Key components of a proper input generation script:
async function generateInputs() {
    // 1. Initialize cryptographic functions
    const poseidon = await buildPoseidon();
    const poseidonHash = (inputs) => { /* implementation */ };
    
    // 2. Generate random values
    const nullifier = generateRandomBigInt();
    const secret = generateRandomBigInt();
    
    // 3. Calculate commitment
    const commitment = poseidonHash([nullifier, secret]);
    
    // 4. Create valid SMT path:
    // - Last sibling MUST be zero
    // - At least one earlier sibling must be non-zero
    const siblings = new Array(MERKLE_TREE_HEIGHT).fill(BigInt(0));
    siblings[MERKLE_TREE_HEIGHT - 2] = generateRandomBigInt(); // Make second-to-last non-zero
    
    // 5. Calculate root based on commitment and path
    let currentHash = commitment;
    for (let i = MERKLE_TREE_HEIGHT - 1; i >= 0; i--) {
        currentHash = poseidonHash([currentHash, siblings[i]]);
    }
    const root = currentHash;
    
    // 6. Calculate nullifierHash using EXACTLY the same logic as in the circuit
    const recipient = generateRandomBigInt();
    const nullifierHash = poseidonHash([nullifier, recipient]);
    
    // 7. Format and save inputs
    const circuitInputs = {
        // Private inputs
        secret: secret.toString(),
        nullifier: nullifier.toString(),
        pathElements: siblings.map(s => s.toString()),
        pathIndices: new Array(MERKLE_TREE_HEIGHT).fill("0"),
        
        // Public inputs
        root: root.toString(),
        nullifierHash: nullifierHash.toString(),
        recipient: recipient.toString()
    };
    
    return circuitInputs;
}
```

## Workflow Recommendations

1. **Progressive Testing**:
   - Start with a simple circuit (e.g., a basic multiplier) before tackling the full mixer
   - Verify each step in the ZK workflow independently
   - Use small, easily traceable values for initial testing

2. **File Organization**:
   - Store all circuit inputs in the `/inputs` directory
   - Use descriptive filenames: `simple_input.json`, `debug_input.json`, `production_input.json`, etc.
   - Add sensitive inputs to `.gitignore` to prevent accidental exposure

3. **Debugging Techniques**:
   - Use the `.sym` file to map constraint failures to specific lines in the circuit
   - Add detailed console logging in input generation scripts
   - Try simplifying the circuit temporarily to isolate issues

## Powers of Tau File Analysis

The Powers of Tau file (`powersOfTau28_hez_final_15.ptau`) used in our setup:

- **Expected size**: ~36 MB for 2^15 constraints
- **Source**: Should be downloaded from trusted sources (Hermez ceremony)
- **Security**: Never generate Powers of Tau files locally for production use

## Lessons Learned & Best Practices

1. **Circuit Development**:
   - Always start with the simplest implementation and add complexity incrementally
   - Maintain separation between cryptographic and business logic when possible
   - Test each component individually before integration

2. **Input Generation**:
   - Always calculate hashes using the actual implementation, not placeholder values
   - Ensure cryptographic consistency between all components of the input
   - Pay special attention to special requirements like the SMT sibling pattern

3. **Workflow Automation**:
   - Create script files for each major step in the ZK workflow
   - Maintain separate scripts for development, testing, and production
   - Document command parameters clearly

## Next Steps

1. **Circuit Optimization**:
   - Review constraint count and optimize where possible
   - Consider replacing complex components with more efficient implementations
   
2. **Testing Expansion**:
   - Develop comprehensive test cases covering edge scenarios
   - Implement automated testing for the entire proof workflow

3. **Integration**:
   - Complete integration with the ZKMixer.sol contract
   - Develop frontend components for generating and submitting proofs

## References

- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Repository](https://github.com/iden3/snarkjs)
- [Circom Library (circomlib)](https://github.com/iden3/circomlib)