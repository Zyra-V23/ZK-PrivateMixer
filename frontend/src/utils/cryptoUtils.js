import { buildPoseidon } from 'circomlibjs'; // Import the specific function

// Singleton promise to ensure Poseidon is built only once
let poseidonPromise = null;

/**
 * Initializes the Poseidon hash function.
 * This is asynchronous and needs to be awaited before using the hash.
 * Uses a singleton pattern to avoid rebuilding.
 * @returns {Promise<Function>} A promise that resolves to the Poseidon hash function.
 */
async function getPoseidon() {
  if (!poseidonPromise) {
    console.log("Building Poseidon...");
    poseidonPromise = buildPoseidon();
    // Check if the promise resolved correctly
    poseidonPromise.then(() => console.log("Poseidon ready.")).catch(err => {
        console.error("Failed to build Poseidon:", err);
        poseidonPromise = null; // Reset promise on failure
    });
  }
  return poseidonPromise;
}

/**
 * Calculates the Poseidon hash of the given inputs.
 * Ensures the Poseidon function is initialized before hashing.
 * @param {Array<bigint | string | number>} inputs An array of inputs (e.g., [nullifier, secret]).
 *                                             circomlibjs expects numbers or BigInts.
 * @returns {Promise<bigint>} A promise that resolves to the BigInt representation of the hash.
 * @throws {Error} If Poseidon initialization fails or hashing fails.
 */
export async function poseidonHash(inputs) {
  try {
    const poseidon = await getPoseidon();
    if (!poseidon) {
        throw new Error("Poseidon hash function not available.");
    }
    // Ensure inputs are suitable for poseidon (BigInt is generally safe)
    const preparedInputs = inputs.map(inp => BigInt(inp));

    // Calculate the hash
    const hashResult = poseidon(preparedInputs);

    // poseidon() returns a BigInt, which is what we want
    // console.log("Poseidon hash calculated:", poseidon.F.toString(hashResult)); // Optional logging
    return hashResult;

  } catch (error) {
    console.error("Error calculating Poseidon hash:", error);
    throw new Error(`Poseidon hashing failed: ${error.message}`);
  }
}

// Optional: Export the getter if direct access is needed elsewhere
// export { getPoseidon };

// IMPORTANT: Merkle Tree ZERO_VALUE (padding for empty nodes) must be Poseidon(0,0):
// 0x2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864
// See: .cursor/rules/merkle_tree_rules.mdc for the project-wide standard and test vectors.
// All Merkle-related code and tests must use this value for empty nodes. 