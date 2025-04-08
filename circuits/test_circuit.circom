pragma circom 2.0.0;

// Un circuito de prueba simple
template Test() {
    signal input a;
    signal input b;
    signal output c;
    
    c <== a * b;
}

component main = Test(); 