#!/bin/bash

set -e  # Exit on any error

# Set up paths
BUILD_DIR="build/multiplier"
CIRCUIT_DIR="circuits"
INPUT_FILE="$BUILD_DIR/input.json"
CIRCUIT_FILE="$CIRCUIT_DIR/multiplier.circom"
R1CS_FILE="$BUILD_DIR/multiplier.r1cs"
WASM_DIR="$BUILD_DIR/multiplier_js"
WASM_FILE="$WASM_DIR/multiplier.wasm"
WITNESS_FILE="$BUILD_DIR/witness.wtns"
PTAU_FILE="build/powersoftau/pot12_final.ptau"
ZKEY_FILE="$BUILD_DIR/multiplier_final.zkey"
VERIFICATION_KEY="$BUILD_DIR/verification_key.json"
PROOF_FILE="$BUILD_DIR/proof.json"
PUBLIC_FILE="$BUILD_DIR/public.json"
VERIFIER_SOL="contracts/RealMultiplierVerifier.sol"

# Create directories if they don't exist
mkdir -p "$BUILD_DIR"
mkdir -p "$WASM_DIR"
mkdir -p "build/powersoftau"

echo "Current directory: $(pwd)"
echo "Checking for input file at: $INPUT_FILE"
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file not found. Creating sample input..."
    echo '{"a": 3, "b": 5}' > "$INPUT_FILE"
fi

# Check if the circuit file exists
if [ ! -f "$CIRCUIT_FILE" ]; then
    echo "Circuit file not found. Creating simple multiplier circuit..."
    mkdir -p "$CIRCUIT_DIR"
    cat > "$CIRCUIT_FILE" << EOL
pragma circom 2.0.0;

template Multiplier() {
    signal input a;
    signal input b;
    signal output c;

    c <== a * b;
}

component main = Multiplier();
EOL
    echo "Created simple multiplier circuit at $CIRCUIT_FILE"
fi

# Check if we need to compile the circuit
if [ ! -f "$R1CS_FILE" ] || [ ! -f "$WASM_FILE" ]; then
    echo "Compiling circuit..."
    npx circom "$CIRCUIT_FILE" --r1cs --wasm --sym --output "$BUILD_DIR"
    echo "Circuit compiled."
fi

# Check if we need to generate the Powers of Tau file
if [ ! -f "$PTAU_FILE" ]; then
    echo "Generating Powers of Tau file (dev only)..."
    npx snarkjs powersoftau new bn128 12 build/powersoftau/pot12_0000.ptau -v
    npx snarkjs powersoftau contribute build/powersoftau/pot12_0000.ptau "$PTAU_FILE" --name="First contribution" -v -e="random dev entropy"
    echo "Powers of Tau file generated."
fi

# Check if we need to generate the zkey file
if [ ! -f "$ZKEY_FILE" ]; then
    echo "Generating zkey file..."
    npx snarkjs groth16 setup "$R1CS_FILE" "$PTAU_FILE" "$BUILD_DIR/multiplier_0000.zkey"
    npx snarkjs zkey contribute "$BUILD_DIR/multiplier_0000.zkey" "$ZKEY_FILE" --name="Dev contribution" -v -e="more random dev entropy"
    echo "zkey file generated."
    
    # Export verification key
    npx snarkjs zkey export verificationkey "$ZKEY_FILE" "$VERIFICATION_KEY"
    echo "Verification key exported."
    
    # Export verifier contract
    npx snarkjs zkey export solidityverifier "$ZKEY_FILE" "$VERIFIER_SOL"
    echo "Solidity verifier exported to $VERIFIER_SOL"
fi

# Generate witness
echo "Generating witness..."
node "$WASM_DIR/generate_witness.js" "$WASM_FILE" "$INPUT_FILE" "$WITNESS_FILE"
echo "Witness generated."

# Generate proof
echo "Generating proof..."
npx snarkjs groth16 prove "$ZKEY_FILE" "$WITNESS_FILE" "$PROOF_FILE" "$PUBLIC_FILE"
echo "Proof generated."

# Verify proof (for sanity check)
echo "Verifying proof..."
if npx snarkjs groth16 verify "$VERIFICATION_KEY" "$PUBLIC_FILE" "$PROOF_FILE"; then
    echo "Proof verified successfully!"
else
    echo "Proof verification failed!"
    exit 1
fi

# Generate calldata for on-chain verification
echo "Generating calldata..."
npx snarkjs zkey export soliditycalldata "$PUBLIC_FILE" "$PROOF_FILE" > "$BUILD_DIR/calldata.txt"
echo "Calldata exported to $BUILD_DIR/calldata.txt"

echo "Done! Proof and public signals are ready for testing." 