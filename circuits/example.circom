pragma circom 2.0.0;

/*
 * @title Example Multiplier Circuit
 * @notice A simple circuit that multiplies two inputs
 */
template Multiplier() {
    // Input signals
    signal input a;
    signal input b;
    
    // Output signal
    signal output c;
    
    // Constraint: c = a * b
    c <== a * b;
}

// Main component
component main = Multiplier(); 