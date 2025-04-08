#!/usr/bin/env node

/**
 * Script to generate simple but cryptographically valid test inputs 
 * for the mixer.circom circuit
 */

const fs = require('fs');
const path = require('path');
const { buildPoseidon } = require('circomlibjs');

async function generateSimpleInputs() {
  try {
    // Initialize Poseidon
    const poseidon = await buildPoseidon();
    
    // Use simple values for testing
    const secret = BigInt(1);
    const nullifier = BigInt(2);
    const recipient = BigInt(3);
    const relayer = BigInt(0);
    const fee = BigInt(0);
    const refund = BigInt(0);
    const chainId = BigInt(1);
    
    // Calculate commitment hash: H(nullifier, secret)
    const commitment = poseidon.F.toString(
      poseidon([nullifier, secret])
    );
    
    // Calculate nullifier hash: H(nullifier, recipient, chainId)
    const nullifierHash = poseidon.F.toString(
      poseidon([nullifier, recipient, chainId])
    );
    
    // For simple testing, create a valid but simple Merkle path
    // All nodes are 0 except the penultimate one
    const levels = 20;
    const pathElements = Array(levels).fill("0");
    pathElements[levels - 2] = "123456789"; // Non-zero penultimate element
    
    // Simple path indices (all left)
    const pathIndices = Array(levels).fill(0);
    
    // Calculate a simple but valid root
    // For testing, we'll manually calculate a consistent root
    let currentHash = commitment;
    for (let i = levels - 1; i >= 0; i--) {
      const sibling = pathElements[i] === "0" ? BigInt(0) : BigInt(pathElements[i]);
      
      // Current level hash based on pathIndex (all left in this case)
      if (pathIndices[i] === 0) {
        // Current hash on left, sibling on right
        currentHash = poseidon.F.toString(
          poseidon([currentHash, sibling])
        );
      } else {
        // Current hash on right, sibling on left
        currentHash = poseidon.F.toString(
          poseidon([sibling, currentHash])
        );
      }
    }
    
    const root = currentHash;
    
    // Construct input object
    const input = {
      // Private inputs
      secret: secret.toString(),
      nullifier: nullifier.toString(),
      pathElements: pathElements,
      pathIndices: pathIndices,
      
      // Public inputs
      root,
      nullifierHash,
      recipient: recipient.toString(),
      relayer: relayer.toString(),
      fee: fee.toString(),
      refund: refund.toString(),
      chainId: chainId.toString(),
    };
    
    // Write to file
    const outputFile = path.join(__dirname, '../inputs/simple_mixer_input.json');
    fs.writeFileSync(outputFile, JSON.stringify(input, null, 2));
    
    console.log(`Generated simple test input: ${outputFile}`);
    console.log('Key values:');
    console.log(` - Secret: ${input.secret}`);
    console.log(` - Nullifier: ${input.nullifier}`);
    console.log(` - Commitment: ${commitment}`);
    console.log(` - NullifierHash: ${nullifierHash}`);
    console.log(` - Root: ${root}`);
    
    return input;
  } catch (error) {
    console.error('Error generating inputs:', error);
    process.exit(1);
  }
}

// Run the script
generateSimpleInputs().catch(err => {
  console.error(err);
  process.exit(1);
}); 