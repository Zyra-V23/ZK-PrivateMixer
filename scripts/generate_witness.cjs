const fs = require('fs');
const snarkjs = require('snarkjs');
const path = require('path');

async function main() {
    try {
        // Rutas de archivos
        const wasmPath = path.join(__dirname, '../build/zk/mixer_js/mixer.wasm');
        const inputPath = path.join(__dirname, '../build/zk/input.json');
        const witnessPath = path.join(__dirname, '../build/zk/witness.wtns');
        const zkeyPath = path.join(__dirname, '../keys/proving_key.zkey');
        const proofPath = path.join(__dirname, '../build/zk/proof.json');
        const publicPath = path.join(__dirname, '../build/zk/public.json');
        
        // Leer input
        console.log("Leyendo input desde:", inputPath);
        const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        console.log("Input:", input);
        
        // Calcular witness
        console.log("Calculando witness...");
        const { witness } = await snarkjs.wtns.calculate(input, wasmPath);
        console.log("Witness calculado correctamente");
        
        // Generar prueba
        console.log("Generando prueba...");
        const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, witness);
        console.log("Prueba generada correctamente");
        console.log("Public signals:", publicSignals);
        
        // Guardar prueba y public signals
        fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
        fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));
        
        // Verificar prueba
        console.log("Verificando prueba...");
        const vkey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        console.log("Verificación:", verified ? "CORRECTA ✓" : "FALLIDA ✗");
        
        // Formatear para Solidity
        const formattedProof = {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]],
            ],
            c: [proof.pi_c[0], proof.pi_c[1]],
        };
        
        console.log("Prueba formateada para Solidity:", JSON.stringify(formattedProof, null, 2).slice(0, 200) + "...");
        fs.writeFileSync(
            path.join(__dirname, '../build/zk/solidity_proof.json'), 
            JSON.stringify(formattedProof, null, 2)
        );
        
        console.log("Proceso completado con éxito");
        return { formattedProof, publicSignals };
    } catch (error) {
        console.error("Error en el proceso:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 