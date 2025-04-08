const fs = require("fs");
const snarkjs = require("snarkjs");

async function calculateWitness() {
    const input = JSON.parse(fs.readFileSync("inputs/example_input.json", "utf8"));
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input, 
        "build/example/example_js/example.wasm", 
        "keys/example_final.zkey"
    );
    
    console.log("Proof generated successfully");
    
    fs.writeFileSync("example_proof.json", JSON.stringify(proof, null, 2));
    fs.writeFileSync("example_public.json", JSON.stringify(publicSignals, null, 2));
    
    // Verificar la prueba
    const vkey = JSON.parse(fs.readFileSync("keys/verification_key.json", "utf8"));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    console.log("Verification result:", isValid);
    return isValid;
}

calculateWitness().then(() => {
    console.log("Process completed successfully");
    process.exit(0);
}).catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
