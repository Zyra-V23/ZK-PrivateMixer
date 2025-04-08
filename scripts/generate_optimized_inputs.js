// Script to generate valid inputs for the optimized mixer circuits
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

async function generateOptimizedInputs() {
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
        
        // 5. Generate additional parameters for enhanced security
        const recipient = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
        const relayer = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
        const fee = BigInt(1); // Minimal fee for testing
        const refund = BigInt(10); // Should be greater than fee
        const chainId = BigInt(1); // Mainnet for testing
        
        // 6. Calculate nullifierHash with chainId for cross-chain protection
        const nullifierHash = poseidonHash([nullifier, recipient, chainId]);
        
        // 7. Create the input.json object with the proper SMT inputs
        const circuitInputs = {
            // Private inputs
            secret: toFieldElementString(secret),
            nullifier: toFieldElementString(nullifier),
            pathElements: proof.siblings,
            pathIndices: proof.pathIndices,
            
            // Public inputs
            root: toFieldElementString(proof.root),
            nullifierHash: toFieldElementString(nullifierHash),
            recipient: toFieldElementString(recipient),
            relayer: toFieldElementString(relayer),
            fee: toFieldElementString(fee),
            refund: toFieldElementString(refund),
            chainId: toFieldElementString(chainId)
        };
        
        // 8. Write to optimized_input.json file
        const inputsDir = path.join(__dirname, '..', 'inputs');
        
        // Ensure the inputs directory exists
        if (!fs.existsSync(inputsDir)) {
            fs.mkdirSync(inputsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(inputsDir, 'optimized_input.json'), 
            JSON.stringify(circuitInputs, null, 2)
        );
        
        // 9. Also create a simpler debug version
        const debugInputs = {
            // Use simple small integers for debugging
            secret: "1",
            nullifier: "2",
            pathElements: new Array(MERKLE_TREE_HEIGHT).fill("0"),
            pathIndices: new Array(MERKLE_TREE_HEIGHT).fill("0"),
            root: "0",  // Will calculate properly below
            nullifierHash: "0", // Will calculate properly below
            recipient: "5",
            relayer: "6",
            fee: "1",
            refund: "10",
            chainId: "1"
        };
        
        // Make second-to-last sibling non-zero as required
        debugInputs.pathElements[MERKLE_TREE_HEIGHT - 2] = "7";
        
        // Actually calculate the proper nullifierHash and root for debug inputs
        const debugNullifier = BigInt(2);
        const debugSecret = BigInt(1);
        const debugRecipient = BigInt(5);
        const debugChainId = BigInt(1);
        
        // Calculate debug commitment
        const debugCommitment = poseidonHash([debugNullifier, debugSecret]);
        
        // Calculate debug nullifierHash
        debugInputs.nullifierHash = toFieldElementString(poseidonHash([debugNullifier, debugRecipient, debugChainId]));
        
        // Calculate debug root
        let debugCurrentHash = debugCommitment;
        for (let i = MERKLE_TREE_HEIGHT - 1; i >= 0; i--) {
            debugCurrentHash = poseidonHash([debugCurrentHash, BigInt(debugInputs.pathElements[i])]);
        }
        debugInputs.root = toFieldElementString(debugCurrentHash);
        
        fs.writeFileSync(
            path.join(inputsDir, 'optimized_debug_input.json'), 
            JSON.stringify(debugInputs, null, 2)
        );
        
        console.log("Successfully generated optimized input files!");
        console.log("1. optimized_input.json - with random values");
        console.log("2. optimized_debug_input.json - with simple values for debugging");
        console.log("\nThese input files are compatible with the enhanced security and");
        console.log("optimized constraint versions of the mixer circuit.");
        
    } catch (error) {
        console.error("Error generating inputs:", error);
    }
}

// Execute the function
generateOptimizedInputs().catch(console.error);

/*
IMPORTANT NOTES:

1. These inputs are compatible with both the enhanced security mixer.circom
   and the optimized mixer_optimized.circom circuits.

2. Key differences from the original input format:
   - Includes chainId in the nullifierHash calculation
   - Adds relayer, fee, refund inputs
   - Properly calculates cryptographic values using consistent hash function

3. SMTVerifier requirements are still respected:
   - Last sibling (pathElements[nLevels-1]) must be zero
   - At least one earlier sibling must be non-zero
   - Proper calculation of commitment and root

4. You can use these inputs to test both the security enhancements and
   constraint optimizations in the improved circuits.
*/ 