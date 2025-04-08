const fs = require('fs');
const snarkjs = require('snarkjs');
const path = require('path');

async function main() {
    try {
        // File paths
        const wasmPath = path.join(__dirname, '../build/multiplier/multiplier_js/multiplier.wasm');
        const inputPath = path.join(__dirname, '../build/multiplier/input.json');
        const witnessPath = path.join(__dirname, '../build/multiplier/witness.wtns');
        const zkeyPath = path.join(__dirname, '../build/multiplier/multiplier_final.zkey');
        const proofPath = path.join(__dirname, '../build/multiplier/proof.json');
        const publicPath = path.join(__dirname, '../build/multiplier/public.json');
        const verificationKeyPath = path.join(__dirname, '../build/multiplier/verification_key.json');
        
        // Create input if it doesn't exist
        const input = { a: 3, b: 5 };
        fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));
        console.log("Input created:", input);
        
        // Calculate witness
        console.log("Calculating witness...");
        const { witness } = await snarkjs.wtns.calculate(input, wasmPath);
        console.log("Witness calculated successfully");
        
        // Generate proof
        console.log("Generating proof...");
        const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);
        console.log("Proof generated successfully");
        console.log("Public signals:", publicSignals);
        
        // Save proof and public signals
        fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
        fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));
        
        // Verify proof
        console.log("Verifying proof...");
        const vkey = JSON.parse(fs.readFileSync(verificationKeyPath, 'utf8'));
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        console.log("Verification:", verified ? "SUCCESSFUL ✓" : "FAILED ✗");
        
        // Format for Solidity
        const formattedProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]],
            ],
            c: [proof.pi_c[0], proof.pi_c[1]],
        };
        
        console.log("Proof formatted for Solidity:", JSON.stringify(formattedProof, null, 2).slice(0, 200) + "...");
        fs.writeFileSync(
            path.join(__dirname, '../build/multiplier/solidity_proof.json'), 
            JSON.stringify(formattedProof, null, 2)
        );
        
        console.log("Process completed successfully");
        return { formattedProof, publicSignals };
    } catch (error) {
        console.error("Error in process:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 