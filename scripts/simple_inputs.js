// A simplified script that generates minimal but valid inputs for the mixer.circom circuit
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPoseidon } from 'circomlibjs';

// Get directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSimpleInputs() {
    try {
        // 0. Initialize the real Poseidon hash function (crucial for correct nullifierHash)
        const poseidon = await buildPoseidon();
        const F = poseidon.F;
        
        // Create a wrapper for the poseidon hash function
        const poseidonHash = (inputs) => {
            const hash = poseidon(inputs.map(x => F.e(x)));
            return F.toObject(hash);
        };
        
        // 1. Use simple values for testing
        const MERKLE_TREE_HEIGHT = 20;
        const nullifier = BigInt(2);  // Simple value
        const secret = BigInt(1);     // Simple value
        const recipient = BigInt(5);  // Simple value
        
        // 2. Calculate commitment and nullifierHash using the REAL hash function
        const commitment = poseidonHash([nullifier, secret]);
        const nullifierHash = poseidonHash([nullifier, recipient]);
        
        // 3. Create a simplistic but valid SMT root and path
        // All path elements are 0 except one (to satisfy SMTLevIns)
        const pathElements = new Array(MERKLE_TREE_HEIGHT).fill("0");
        const pathIndices = new Array(MERKLE_TREE_HEIGHT).fill("0");
        
        // Critical: the second-to-last element must be non-zero for SMTLevIns to work
        pathElements[MERKLE_TREE_HEIGHT - 2] = "7";
        
        // Calculate a valid root value by hashing up from the commitment
        let currentHash = commitment;
        for (let i = MERKLE_TREE_HEIGHT - 1; i >= 0; i--) {
            // Build the root by hashing our commitment with the path elements
            currentHash = poseidonHash([currentHash, BigInt(pathElements[i])]);
        }
        const root = currentHash;
        
        // 4. Create the input.json object
        const circuitInputs = {
            // Private inputs
            secret: secret.toString(),
            nullifier: nullifier.toString(),
            pathElements: pathElements,
            pathIndices: pathIndices,
            
            // Public inputs
            root: root.toString(),
            nullifierHash: nullifierHash.toString(),
            recipient: recipient.toString()
        };
        
        // 5. Write to simple_input.json file in the inputs directory
        const inputsDir = path.join(__dirname, '..', 'inputs');
        
        // Ensure the inputs directory exists
        if (!fs.existsSync(inputsDir)) {
            fs.mkdirSync(inputsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(inputsDir, 'simple_input.json'), 
            JSON.stringify(circuitInputs, null, 2)
        );
        
        console.log("Successfully generated inputs/simple_input.json with minimal valid inputs!");
        console.log("Using simple values:");
        console.log("- nullifier:", nullifier.toString());
        console.log("- secret:", secret.toString());
        console.log("- recipient:", recipient.toString());
        console.log("Calculated values (using real Poseidon hash):");
        console.log("- commitment:", commitment.toString());
        console.log("- nullifierHash:", nullifierHash.toString()); 
        console.log("- root:", root.toString());
        
    } catch (error) {
        console.error("Error generating inputs:", error);
    }
}

// Execute the function
generateSimpleInputs().catch(console.error);

/*
IMPORTANT:
This script generates minimal but cryptographically correct inputs for the mixer.circom circuit.
The key insight is that we use simple inputs (1, 2, 5) but calculate the hashes correctly
using the actual Poseidon hash function.

The calculated nullifierHash MUST be the actual result of Poseidon([nullifier, recipient]),
not an arbitrary value, or the circuit's integrity check on line 49 will fail.
*/ 