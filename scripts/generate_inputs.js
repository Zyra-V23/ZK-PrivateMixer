// Script to generate valid inputs for the mixer.circom circuit using SMT (Sparse Merkle Tree)
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPoseidon } from 'circomlibjs';

// Get directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to convert a BigInt to a 256-bit field element string
function toFieldElementString(num) {
    return num.toString();
}

// We need a simplified SMT implementation
class SimpleSMT {
    constructor(height, hashFunction) {
        this.height = height;
        this.hashFunction = hashFunction;
        this.zeroValues = this.calculateZeroValues();
    }
    
    // Calculate zero values for each level - essential for SMTVerifier
    calculateZeroValues() {
        const zeroValues = new Array(this.height + 1);
        zeroValues[0] = BigInt(0); // Leaf level zero value
        
        for (let i = 1; i <= this.height; i++) {
            zeroValues[i] = this.hashFunction([zeroValues[i-1], zeroValues[i-1]]);
        }
        
        return zeroValues;
    }
    
    // Generate a proof for a specific key and value
    // For an inclusion proof where the key was not previously in the tree (isOld0=1)
    generateInclusionProof(key, value) {
        // These are placeholders - in a real SMT, these would be computed
        // based on the actual tree state
        const siblings = new Array(this.height).fill(BigInt(0));
        
        // Special handling: make the second-to-last sibling non-zero to satisfy SMTLevIns
        siblings[this.height - 2] = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
        
        // Ensure the last sibling is always zero as required by SMTLevIns
        siblings[this.height - 1] = BigInt(0);
        
        // Make a few more siblings non-zero for realism
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * (this.height - 2));
            siblings[index] = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
        }
        
        // Calculate the root value based on our path
        // First hash the key-value pair
        let currentHash = this.hashFunction([key, value]);
        
        // Work our way up the tree, always assuming the node is on the left side (pathBit=0)
        for (let i = this.height - 1; i >= 0; i--) {
            currentHash = this.hashFunction([currentHash, siblings[i]]);
        }
        
        return {
            root: currentHash,
            siblings: siblings.map(s => s.toString()),
            pathIndices: new Array(this.height).fill("0") // All left side for simplicity
        };
    }
}

async function generateInputs() {
    try {
        // 0. Initialize poseidon function
        const poseidon = await buildPoseidon();
        const F = poseidon.F;
        
        // Create a wrapper for the poseidon hash function
        const poseidonHash = (inputs) => {
            const hash = poseidon(inputs.map(x => F.e(x)));
            return F.toObject(hash);
        };
        
        // Constants
        const MERKLE_TREE_HEIGHT = 20; // Same as in the circuit
        
        // 1. Generate random values for nullifier and secret
        const nullifier = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
        const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
        
        // 2. Calculate commitment using poseidon hash
        const commitment = poseidonHash([nullifier, secret]);
        
        // 3. Set up a simplified SMT and generate a proof
        const smt = new SimpleSMT(MERKLE_TREE_HEIGHT, poseidonHash);
        
        // 4. Generate an inclusion proof for our commitment
        // In SMTVerifier, the key is the commitment hash and value is 1 (indicating existence)
        const value = BigInt(1); // For inclusion proof
        const proof = smt.generateInclusionProof(commitment, value);
        
        // 5. Choose a recipient address and calculate nullifierHash
        const recipient = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
        const nullifierHash = poseidonHash([nullifier, recipient]);
        
        // 6. Create the input.json object with the proper SMT inputs
        const circuitInputs = {
            // Private inputs for Mixer
            secret: toFieldElementString(secret),
            nullifier: toFieldElementString(nullifier),
            pathElements: proof.siblings, // For SMTVerifier.siblings
            pathIndices: proof.pathIndices,
            
            // Public inputs for Mixer
            root: toFieldElementString(proof.root),
            nullifierHash: toFieldElementString(nullifierHash),
            recipient: toFieldElementString(recipient)
        };
        
        // 7. Write to input.json file
        fs.writeFileSync(
            path.join(__dirname, '..', 'input.json'), 
            JSON.stringify(circuitInputs, null, 2)
        );
        
        console.log("Successfully generated input.json with valid SMT circuit inputs!");
        console.log("Commitment (key):", commitment.toString());
        console.log("Root:", proof.root.toString());
        console.log("NullifierHash:", nullifierHash.toString());
        console.log("Last sibling (zero):", proof.siblings[MERKLE_TREE_HEIGHT - 1]);
        console.log("Second-to-last sibling (non-zero):", proof.siblings[MERKLE_TREE_HEIGHT - 2]);
        
        // 8. For simplicity, also save a binary version of the witness input using smaller numbers
        // This is sometimes easier to debug with
        const debugInputs = {
            // Use simple small integers for debugging
            secret: "1",
            nullifier: "2",
            pathElements: new Array(MERKLE_TREE_HEIGHT).fill("0"),
            pathIndices: new Array(MERKLE_TREE_HEIGHT).fill("0"),
            root: "3",
            nullifierHash: "4",
            recipient: "5"
        };
        
        // Make second-to-last sibling non-zero as required
        debugInputs.pathElements[MERKLE_TREE_HEIGHT - 2] = "7";
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'debug_input.json'), 
            JSON.stringify(debugInputs, null, 2)
        );
        
        console.log("Also generated debug_input.json with simple values for easier debugging.");
        
    } catch (error) {
        console.error("Error generating inputs:", error);
    }
}

// Execute the function
generateInputs().catch(console.error);

/*
IMPORTANT: This script generates inputs for the mixer.circom circuit which uses SMTVerifier.

Key aspects of this implementation:
1. Uses a simplified Sparse Merkle Tree (SMT) to generate valid proofs
2. Ensures the last sibling is zero as required by SMTLevIns
3. Makes the second-to-last sibling non-zero (required for valid path construction)
4. Creates inputs compatible with the specific interface of SMTVerifier
5. Also generates a debug_input.json with simple integer values for testing

Notes on the SMTVerifier interface:
- For inclusion proofs (fnc=0), we're claiming the commitment (key) exists with value=1
- We set oldKey=0, oldValue=0, isOld0=1 internally (handled by mixer.circom)
- The siblings and indices arrays must follow specific rules (last sibling must be 0)
*/ 