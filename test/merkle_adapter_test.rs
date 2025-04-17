// Test for MerkleAdapter (Rust wrapper for Light Protocol's Merkle tree)
use rust_merkle_adapter::{MerkleAdapter, TREE_HEIGHT};

// Poseidon(0,0) para nuestro stack (hex):
const ZERO_VALUE: [u8; 32] = hex_literal::hex!("2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864");

#[test]
fn test_empty_tree_root() {
    let adapter = MerkleAdapter::new();
    let root = adapter.root();
    // Aquí deberías poner el valor esperado de la raíz vacía para un árbol de altura 20
    // calculado con Poseidon(0,0) y la misma lógica que en JS/Solidity
    // Por ejemplo:
    // let expected_root = hex_literal::hex!("...");
    // assert_eq!(root, expected_root, "Empty tree root mismatch");
    println!("Empty tree root: 0x{}", hex::encode(root));
}

#[test]
fn test_single_leaf_root() {
    let mut adapter = MerkleAdapter::new();
    // Usar una hoja conocida (por ejemplo, Poseidon(1,2) en bytes)
    let leaf = hex_literal::hex!("115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a");
    adapter.append_leaf(leaf);
    let root = adapter.root();
    // let expected_root = hex_literal::hex!("...");
    // assert_eq!(root, expected_root, "Single leaf root mismatch");
    println!("Single leaf root: 0x{}", hex::encode(root));
} 