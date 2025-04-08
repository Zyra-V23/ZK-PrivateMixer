include "../node_modules/circomlib/circuits/comparators.circom";

template T() {
    signal private input a;
    signal private input b;
    signal output c;
    component comp = IsZero();
    comp.in <== a - b;
    c <== comp.out;
}
component main = T();
