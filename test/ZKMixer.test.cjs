const { expect } = require("chai");
const { ethers } = require("hardhat");
const { poseidon } = require("circomlibjs"); // Required for calculating hashes
const snarkjs = require("snarkjs");
const path = require("path");
const crypto = require("crypto");
const { MerkleTree } = require("fixed-merkle-tree"); // Assuming this library or similar for Merkle proof generation

// Helper function to generate SNARK proof (simplified)
// Assumes you have proving_key.zkey and mixer.wasm available
// Assumes input format matches circuit definition
async function generateProof(circuitInputs) {
    const wasmPath = path.join(__dirname, "../build/zk/mixer_js/mixer.wasm");
    const zkeyPath = path.join(__dirname, "../keys/proving_key.zkey"); // Adjust path if needed

    try {
        // console.log("Generating witness...");
        const { witness } = await snarkjs.wtns.calculate(circuitInputs, wasmPath);
        // console.log("Witness calculated.");

        // console.log("Generating proof...");
        const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);
        // console.log("Proof generated:", proof);
        // console.log("Public signals:", publicSignals);

        // Format proof for Solidity call
        const formattedProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]],
            ],
            c: [proof.pi_c[0], proof.pi_c[1]],
        };

        return { formattedProof, publicSignals };
    } catch (error) {
        console.error("Error generating proof:", error);
        throw error;
    }
}

describe("ZKMixer Contract with Real Proofs", function () {
    // Constants
    const DENOMINATION_STR = "0.1"; // Deposit amount as string
    const DENOMINATION_WEI = ethers.parseEther(DENOMINATION_STR);
    const MERKLE_TREE_HEIGHT = 20; // Match circuit parameter

    // Test accounts
    let deployer, user1, user2, relayer;

    // Contract instances
    let Verifier; // Factory for the REAL verifier
    let verifier; // Instance of the REAL verifier
    let ZKMixer; // Factory for the mixer
    let zkMixer; // Instance of the mixer

    // ZKP artifacts paths (assuming they exist)
    const verificationKeyPath = path.join(__dirname, "../keys/verification_key.json"); // Adjust if needed
    let vKey; // Verification key JSON

    // Merkle Tree state
    let tree;

    // Deploy contracts before each test
    beforeEach(async function () {
        // Get signers
        [deployer, user1, user2, relayer] = await ethers.getSigners();

        // --- Deploy REAL Verifier ---
        // Generate Verifier.sol using `snarkjs zkey export solidityverifier keys/verification_key.json contracts/Verifier.sol`
        // Ensure Verifier.sol exists in the contracts directory
        try {
            Verifier = await ethers.getContractFactory("Verifier");
            verifier = await Verifier.deploy();
        } catch (e) {
            console.error("Failed to deploy Verifier.sol. Did you generate it using snarkjs?");
            throw e;
        }
        const verifierAddress = await verifier.getAddress();

        // --- Deploy ZKMixer ---
        ZKMixer = await ethers.getContractFactory("ZKMixer");
        zkMixer = await ZKMixer.deploy(verifierAddress); // Use REAL verifier address

        // --- Initialize Merkle Tree ---
        // Use a library to manage the tree state for proof generation
        // Poseidon hash function needs to be compatible with the one used in the circuit
        tree = new MerkleTree(MERKLE_TREE_HEIGHT, [], { hashFunction: (left, right) => poseidon([left, right]), zeroElement: BigInt(0) }); // Adjust zeroElement if needed

        // Optional: Load verification key for client-side verification if needed
        // vKey = require(verificationKeyPath);
    });

    // --- Test Suite ---

    describe("Deployment", function () {
        it("Should deploy with the correct denomination", async function () {
            expect(await zkMixer.DENOMINATION()).to.equal(DENOMINATION_WEI);
        });

        it("Should set the correct verifier address", async function () {
            expect(await zkMixer.verifier()).to.equal(await verifier.getAddress());
        });

         it("Should initialize with the correct root for an empty tree", async function () {
             const expectedEmptyRoot = tree.root; // Get root from JS library
             expect(await zkMixer.knownRoots(expectedEmptyRoot)).to.be.true;
             expect(await zkMixer.nextLeafIndex()).to.equal(0);
         });
    });

    describe("Deposits", function () {
        // Use real secrets for deposits now
        let depositData;

        beforeEach(async function() {
            // Generate deposit secrets
            const nullifier = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
            const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
            const commitment = poseidon([nullifier, secret]);
            const leafIndex = tree.indexOf(commitment, true); // Check if exists, should be -1
            if (leafIndex !== -1) throw new Error("Commitment already exists before deposit");

            const currentLeafIndex = await zkMixer.nextLeafIndex();

            depositData = { nullifier, secret, commitment, leafIndex: currentLeafIndex };

            // Perform deposit
            const depositTx = await zkMixer.connect(user1).deposit(commitment, { value: DENOMINATION_WEI });
            await depositTx.wait();

            // Update local Merkle tree
            tree.insert(commitment);
            // console.log("Inserted commitment:", commitment);
            // console.log("Tree size:", tree.elements.length);
            // console.log("Tree root:", tree.root);

        })

        it("Should accept deposits and update Merkle Tree correctly", async function () {
            expect(await zkMixer.nextLeafIndex()).to.equal(BigInt(depositData.leafIndex) + 1n);
            const leaf = await zkMixer.leaves(depositData.leafIndex);
            expect(leaf).to.equal(depositData.commitment);
            const contractRoot = await zkMixer.calculateMerkleRoot();
            expect(await zkMixer.knownRoots(contractRoot)).to.be.true;
            expect(tree.root).to.equal(contractRoot); // Compare JS tree root with contract root
        });

        it("Should revert deposits with incorrect denomination (less)", async function () {
            const lessAmount = ethers.parseEther("0.09");
            const c = poseidon([1n, 2n]); // Dummy commitment
            await expect(
                zkMixer.connect(user1).deposit(c, { value: lessAmount })
            ).to.be.revertedWith("Deposit amount must match denomination");
        });

        it("Should revert deposits with incorrect denomination (more)", async function () {
            const moreAmount = ethers.parseEther("0.11");
            await expect(
                zkMixer.connect(user1).deposit(depositData.commitment, { value: moreAmount })
            ).to.be.revertedWith("Deposit amount must match denomination");
        });

        it("Should revert deposits with zero commitment", async function () {
             const zeroCommitment = "0x" + "0".repeat(64);
             await expect(
                 zkMixer.connect(user1).deposit(zeroCommitment, { value: DENOMINATION_WEI })
             ).to.be.revertedWith("Commitment cannot be zero");
         });

         it("Should update Merkle Tree root (placeholder) - REMOVED", async function () {
            // This test is now covered by "Should calculate and store the new root..."
            // expect(true).to.be.true; // Placeholder
         });
    });

    describe("Withdrawals with Real Proofs", function () {
        let depositData;
        let merkleProof; // Store proof generated in beforeEach
        let validRoot;

        // Deposit before withdrawal tests
        beforeEach(async function() {
            const nullifier = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
            const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
            const commitment = poseidon([nullifier, secret]);
            const leafIndex = await zkMixer.nextLeafIndex();

            depositData = { nullifier, secret, commitment, leafIndex };

            // Perform deposit
            const depositTx = await zkMixer.connect(user1).deposit(commitment, { value: DENOMINATION_WEI });
            await depositTx.wait();

            // Update local Merkle tree and get proof
            tree.insert(commitment);
            validRoot = tree.root;
            expect(await zkMixer.knownRoots(validRoot)).to.be.true; // Ensure root is known by contract
            merkleProof = tree.path(Number(leafIndex)); // Get proof for the deposited leaf
            // console.log("Generated Merkle proof for index", leafIndex, merkleProof);

        });

        it("Should allow valid withdrawal with correct proof and inputs", async function () {
            const recipient = user2.address;
            const relayerAddr = relayer.address;
            const fee = ethers.parseEther("0.001");

            // Calculate the correct nullifier hash (INCLUDING recipient)
            const nullifierHash = poseidon([depositData.nullifier, recipient]);

            // Prepare circuit inputs
            const circuitInputs = {
                // Private inputs
                secret: depositData.secret,
                nullifier: depositData.nullifier,
                pathElements: merkleProof.pathElements,
                pathIndices: merkleProof.pathIndices, // Path indices might need conversion depending on library
                // Public inputs
                root: validRoot,
                nullifierHash: nullifierHash,
                recipient: BigInt(recipient), // Ensure recipient is BigInt
                // fee: fee, // If fee is part of public inputs
                // relayer: BigInt(relayerAddr) // If relayer is part of public inputs
            };

            // Generate proof
            const { formattedProof, publicSignals } = await generateProof(circuitInputs);

            // Verify public signals match expected
            expect(publicSignals[0]).to.equal(validRoot.toString());
            expect(publicSignals[1]).to.equal(nullifierHash.toString());
            expect(ethers.getAddress("0x" + BigInt(publicSignals[2]).toString(16).padStart(40, '0'))).to.equal(recipient);
            // Add checks for fee/relayer if they are public signals

            // Perform withdrawal
            const recipientInitialBalance = await ethers.provider.getBalance(recipient);
            const tx = await zkMixer.connect(relayer).withdraw(formattedProof, validRoot, nullifierHash, recipient, relayerAddr, fee);
            await tx.wait();

            // Check balance change
            const recipientFinalBalance = await ethers.provider.getBalance(recipient);
            const expectedPayout = DENOMINATION_WEI - fee;
            expect(recipientFinalBalance).to.equal(recipientInitialBalance + expectedPayout);

            // Check nullifier spent
            expect(await zkMixer.nullifiers(nullifierHash)).to.be.true;
        });

        it("Should revert withdrawal with invalid proof (manipulated public input)", async function () {
            const recipient = user2.address;
            const wrongRecipient = user1.address; // Use a different recipient
            const relayerAddr = relayer.address;
            const fee = 0;

            // Calculate the CORRECT nullifier hash for the intended recipient
            const correctNullifierHash = poseidon([depositData.nullifier, recipient]);
            // Calculate the INCORRECT nullifier hash using the wrong recipient
            const wrongNullifierHash = poseidon([depositData.nullifier, wrongRecipient]);

            // Prepare circuit inputs for the CORRECT recipient (this generates a valid proof for recipient user2)
            const circuitInputs = {
                secret: depositData.secret,
                nullifier: depositData.nullifier,
                pathElements: merkleProof.pathElements,
                pathIndices: merkleProof.pathIndices,
                root: validRoot,
                nullifierHash: correctNullifierHash, // Hash corresponding to user2
                recipient: BigInt(recipient)       // user2 address
            };

            // Generate proof (valid for user2)
            const { formattedProof, publicSignals } = await generateProof(circuitInputs);

            // Now, try to withdraw using the valid proof, but provide the WRONG recipient/nullifierHash to the contract
            await expect(zkMixer.connect(relayer).withdraw(
                formattedProof,       // The proof generated for user2
                validRoot,            // Correct root
                wrongNullifierHash,   // <<< Nullifier hash for user1
                wrongRecipient,       // <<< Address of user1
                relayerAddr, fee
            )).to.be.reverted; // Should revert because proof doesn't match public inputs (specifically nullifierHash)
             // The exact revert reason depends on the Verifier.sol implementation
             // It might be a generic revert or "Invalid proof"
        });

        it("Should revert withdrawal with invalid proof (manipulated recipient only)", async function () {
             const recipient = user2.address;
             const wrongRecipient = user1.address; // Use a different recipient
             const relayerAddr = relayer.address;
             const fee = 0;

             // Calculate the CORRECT nullifier hash for the intended recipient
             const correctNullifierHash = poseidon([depositData.nullifier, recipient]);

             // Prepare circuit inputs for the CORRECT recipient (this generates a valid proof for recipient user2)
             const circuitInputs = {
                 secret: depositData.secret,
                 nullifier: depositData.nullifier,
                 pathElements: merkleProof.pathElements,
                 pathIndices: merkleProof.pathIndices,
                 root: validRoot,
                 nullifierHash: correctNullifierHash, // Hash corresponding to user2
                 recipient: BigInt(recipient)       // user2 address
             };

             // Generate proof (valid for user2)
             const { formattedProof, publicSignals } = await generateProof(circuitInputs);

             // Try to withdraw using the valid proof AND the correct nullifierHash,
             // BUT provide the WRONG recipient address in the public arguments.
             // This tests if the contract properly includes recipient in its checks beyond the proof itself.
             await expect(zkMixer.connect(relayer).withdraw(
                 formattedProof,         // Proof for user2
                 validRoot,              // Correct root
                 correctNullifierHash,   // Correct nullifier hash for user2
                 wrongRecipient,         // <<< Address of user1
                 relayerAddr, fee
             )).to.be.reverted; // Should revert, likely in Verifier because publicSignals[2] won't match wrongRecipient
        });

        it("Should revert withdrawals with already spent nullifier", async function () {
            const recipient = user2.address;
            const relayerAddr = relayer.address;
            const fee = 0;
            const nullifierHash = poseidon([depositData.nullifier, recipient]);
            const circuitInputs = { secret: depositData.secret, nullifier: depositData.nullifier, pathElements: merkleProof.pathElements, pathIndices: merkleProof.pathIndices, root: validRoot, nullifierHash: nullifierHash, recipient: BigInt(recipient) };
            const { formattedProof } = await generateProof(circuitInputs);

            // First withdrawal
            await zkMixer.connect(relayer).withdraw(formattedProof, validRoot, nullifierHash, recipient, relayerAddr, fee);

            // Second attempt
            await expect(
                 zkMixer.connect(relayer).withdraw(formattedProof, validRoot, nullifierHash, recipient, relayerAddr, fee)
             ).to.be.revertedWith("Nullifier already spent");
        });

         it("Should revert withdrawals with invalid Merkle root", async function () {
             const recipient = user2.address;
             const relayerAddr = relayer.address;
             const fee = 0;
             const nullifierHash = poseidon([depositData.nullifier, recipient]);
             const invalidRoot = "0x" + "f".repeat(64);
             const circuitInputs = { secret: depositData.secret, nullifier: depositData.nullifier, pathElements: merkleProof.pathElements, pathIndices: merkleProof.pathIndices, root: validRoot, nullifierHash: nullifierHash, recipient: BigInt(recipient) };
             const { formattedProof } = await generateProof(circuitInputs);

             await expect(
                  zkMixer.connect(relayer).withdraw(formattedProof, invalidRoot, nullifierHash, recipient, relayerAddr, fee)
              ).to.be.revertedWith("Merkle root not known");
         });
    });
}); 