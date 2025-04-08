#!/usr/bin/env node

/**
 * Script to generate valid inputs for the mixer.circom circuit
 * Respects SMT-specific requirements:
 * - Last sibling must be zero
 * - At least one earlier sibling must be non-zero
 * - isOld0 = 1 for inclusion proofs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildPoseidon } = require('circomlibjs');

// Circuit constants
const MERKLE_TREE_HEIGHT = 20;
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// Generate a random bigint less than FIELD_SIZE
function randomFieldElement() {
    // Generate a random 32-byte buffer
    const buf = crypto.randomBytes(32);
    // Convert to BigInt and mod by FIELD_SIZE to ensure it's a valid field element
    const num = BigInt('0x' + buf.toString('hex')) % FIELD_SIZE;
    return num;
}

// Generate a random array of field elements for path indices (0 or 1)
function randomPathIndices(length) {
    return Array(length).fill(0).map(() => Math.floor(Math.random() * 2));
}

// Generate valid SMT path elements with specific requirements
function generateValidSMTPath(length) {
    // Create array with random non-zero values
    const path = Array(length).fill(0).map((_, i) => {
        // Last sibling must be zero
        if (i === length - 1) {
            return BigInt(0);
        }
        // At least make sure the second-to-last sibling is non-zero
        if (i === length - 2) {
            return randomFieldElement();
        }
        // For other positions, randomly decide if they are zero or not
        return Math.random() > 0.3 ? randomFieldElement() : BigInt(0);
    });

    return path;
}

// Calculate Merkle root from commitment and path
async function calculateRoot(commitment, pathElements, pathIndices, poseidon) {
    let currentHash = commitment;
    
    for (let i = 0; i < pathElements.length; i++) {
        // Current level hash based on pathIndex (left or right)
        if (pathIndices[i] === 0) {
            // If going left, current hash is on the left
            currentHash = poseidon.F.toString(
                poseidon([currentHash, pathElements[i]])
            );
        } else {
            // If going right, current hash is on the right
            currentHash = poseidon.F.toString(
                poseidon([pathElements[i], currentHash])
            );
        }
    }
    
    return currentHash;
}

// Main function to generate circuit inputs
async function generateInputs() {
    try {
        // Initialize Poseidon
        const poseidon = await buildPoseidon();
        
        // Generate private inputs
        const secret = randomFieldElement();
        const nullifier = randomFieldElement();
        
        // Generate recipient and chain data
        const recipient = randomFieldElement();
        const relayer = BigInt(0); // No relayer for this example
        const fee = BigInt(0);     // No fee for this example
        const refund = BigInt(0);  // No refund for this example
        const chainId = BigInt(1); // Mainnet Ethereum
        
        // Calculate commitment hash: H(nullifier, secret)
        const commitment = poseidon.F.toString(
            poseidon([nullifier, secret])
        );
        
        // Calculate nullifier hash: H(nullifier, recipient, chainId)
        const nullifierHash = poseidon.F.toString(
            poseidon([nullifier, recipient, chainId])
        );
        
        // Generate path elements and indices
        const pathElements = generateValidSMTPath(MERKLE_TREE_HEIGHT);
        const pathIndices = randomPathIndices(MERKLE_TREE_HEIGHT);
        
        // Calculate Merkle root
        const root = await calculateRoot(commitment, pathElements, pathIndices, poseidon);
        
        // Construct input object
        const input = {
            // Private inputs
            secret: secret.toString(),
            nullifier: nullifier.toString(),
            pathElements: pathElements.map(x => x.toString()),
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
        
        // Write input to file
        const inputsDir = path.join(__dirname, '../inputs');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(inputsDir)) {
            fs.mkdirSync(inputsDir, { recursive: true });
        }
        
        const inputFile = path.join(inputsDir, 'mixer_input.json');
        fs.writeFileSync(inputFile, JSON.stringify(input, null, 2));
        
        console.log(`Successfully generated input file: ${inputFile}`);
        console.log('Input summary:');
        console.log(` - Secret: ${abbreviate(input.secret)}`);
        console.log(` - Nullifier: ${abbreviate(input.nullifier)}`);
        console.log(` - Commitment: ${abbreviate(commitment)}`);
        console.log(` - Root: ${abbreviate(input.root)}`);
        console.log(` - NullifierHash: ${abbreviate(input.nullifierHash)}`);
        
        return input;
    } catch (error) {
        console.error('Error generating inputs:', error);
        process.exit(1);
    }
}

// Utility to abbreviate large numbers for display
function abbreviate(str) {
    if (str.length <= 16) return str;
    return `${str.slice(0, 8)}...${str.slice(-8)}`;
}

// Run the script
generateInputs().catch(err => {
    console.error(err);
    process.exit(1);
}); 