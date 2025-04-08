#!/bin/bash

set -e  # Exit on any error

# Check if a circuit name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <circuit_name> [input_file]"
    echo "Example: $0 multiplier"
    echo "Example: $0 mixer inputs/mixer_input.json"
    exit 1
fi

# Set circuit name from arguments
CIRCUIT_NAME="$1"
echo "Using circuit: $CIRCUIT_NAME"

# Set up base paths
CIRCUIT_DIR="circuits"
BUILD_DIR="build/$CIRCUIT_NAME"

# Set derived paths
CIRCUIT_FILE="$CIRCUIT_DIR/$CIRCUIT_NAME.circom"
R1CS_FILE="$BUILD_DIR/$CIRCUIT_NAME.r1cs"
WASM_DIR="$BUILD_DIR/${CIRCUIT_NAME}_js"
WASM_FILE="$WASM_DIR/$CIRCUIT_NAME.wasm"
WITNESS_FILE="$BUILD_DIR/witness.wtns"
PTAU_FILE="build/powersoftau/pot12_final.ptau"
ZKEY_FILE="$BUILD_DIR/${CIRCUIT_NAME}_final.zkey"
VERIFICATION_KEY="$BUILD_DIR/verification_key.json"
PROOF_FILE="$BUILD_DIR/proof.json"
PUBLIC_FILE="$BUILD_DIR/public.json"

# Determine input file
if [ -z "$2" ]; then
    # Default input file path
    if [ "$CIRCUIT_NAME" = "multiplier" ]; then
        # Simple default input for multiplier
        INPUT_FILE="$BUILD_DIR/input.json"
        if [ ! -f "$INPUT_FILE" ]; then
            echo "Default input file not found. Creating sample input..."
            mkdir -p "$BUILD_DIR"
            echo '{"a": 3, "b": 5}' > "$INPUT_FILE"
        fi
    else
        # For other circuits, look in inputs directory
        INPUT_FILE="inputs/${CIRCUIT_NAME}_input.json"
        if [ ! -f "$INPUT_FILE" ]; then
            echo "Error: Input file $INPUT_FILE not found."
            echo "Please create an input file or specify one as a second argument."
            exit 1
        fi
    fi
else
    # Use specified input file
    INPUT_FILE="$2"
    if [ ! -f "$INPUT_FILE" ]; then
        echo "Error: Specified input file $INPUT_FILE not found."
        exit 1
    fi
fi

echo "Using input file: $INPUT_FILE"

# Determine which Solidity verifier to generate
if [ "$CIRCUIT_NAME" = "multiplier" ]; then
    VERIFIER_SOL="contracts/RealMultiplierVerifier.sol"
elif [ "$CIRCUIT_NAME" = "mixer" ]; then
    VERIFIER_SOL="contracts/RealVerifier.sol"
else
    VERIFIER_SOL="contracts/Real${CIRCUIT_NAME^}Verifier.sol"
fi

# Create directories if they don't exist
mkdir -p "$BUILD_DIR"
mkdir -p "$WASM_DIR"
mkdir -p "build/powersoftau"

echo "Current directory: $(pwd)"

# Check if the circuit file exists
if [ ! -f "$CIRCUIT_FILE" ]; then
    echo "Error: Circuit file $CIRCUIT_FILE not found."
    exit 1
fi

# Determine the appropriate Powers of Tau file based on circuit complexity
# For mixer circuit, we need a larger ptau file
if [ "$CIRCUIT_NAME" = "mixer" ]; then
    PTAU_FILE="build/powersoftau/pot15_final.ptau"
else
    PTAU_FILE="build/powersoftau/pot12_final.ptau"
fi

# Check if we need to compile the circuit
if [ ! -f "$R1CS_FILE" ] || [ ! -f "$WASM_FILE" ]; then
    echo "Compiling circuit..."
    # For mixer circuit, we need to include the circomlib path
    if [ "$CIRCUIT_NAME" = "mixer" ]; then
        npx circom "$CIRCUIT_FILE" --r1cs --wasm --sym -l node_modules/circomlib/circuits --output "$BUILD_DIR"
    else
        npx circom "$CIRCUIT_FILE" --r1cs --wasm --sym --output "$BUILD_DIR"
    fi
    echo "Circuit compiled."
    
    # Extract constraint count for information
    CONSTRAINTS=$(grep "non-linear constraints" "$BUILD_DIR/$CIRCUIT_NAME.r1cs.info" | awk '{print $NF}')
    echo "Circuit has $CONSTRAINTS constraints."
fi

# Check if we need to generate the Powers of Tau file
if [ ! -f "$PTAU_FILE" ]; then
    echo "Generating Powers of Tau file (dev only)..."
    # Determine the power based on circuit type
    if [ "$CIRCUIT_NAME" = "mixer" ]; then
        POT_POWER=15
    else
        POT_POWER=12
    fi
    
    echo "Using power of tau with 2^$POT_POWER constraints"
    npx snarkjs powersoftau new bn128 $POT_POWER build/powersoftau/pot${POT_POWER}_0000.ptau -v
    npx snarkjs powersoftau contribute build/powersoftau/pot${POT_POWER}_0000.ptau "$PTAU_FILE" --name="First contribution" -v -e="random dev entropy"
    echo "Powers of Tau file generated."
fi

# Check if we need to generate the zkey file
if [ ! -f "$ZKEY_FILE" ]; then
    echo "Generating zkey file..."
    npx snarkjs groth16 setup "$R1CS_FILE" "$PTAU_FILE" "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey"
    npx snarkjs zkey contribute "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey" "$ZKEY_FILE" --name="Dev contribution" -v -e="more random dev entropy"
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