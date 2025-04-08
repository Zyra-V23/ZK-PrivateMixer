pragma circom 2.0.0;

/*
 * Simple multiplier circuit
 * Computes c = a * b
 * This is used for basic ZK proof verification testing
 */
template Multiplier() {
    signal input a;
    signal input b;
    signal output c;
    
    c <== a * b;
}

component main {public [c]} = Multiplier(); 