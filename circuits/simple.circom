template T() {
    signal private input a;
    signal output b;
    b <== a * a;
}
component main = T();
