# ZK-PrivateMixer: Architecture & Goals

## Project Vision

ZK-PrivateMixer aims to provide a privacy-focused transaction layer on Ethereum that allows users to break the on-chain link between sender and recipient addresses, using zero-knowledge proofs to ensure cryptographic privacy while maintaining security.

## Core Objectives

1. **Transaction Privacy**: Enable users to make private transactions without revealing the link between deposits and withdrawals
2. **Security**: Ensure cryptographic guarantees without trusted third parties
3. **User Accessibility**: Provide a simple UX for non-technical users to utilize ZK technology
4. **Gas Efficiency**: Optimize smart contract interactions for minimal gas usage
5. **Educational Value**: Serve as a reference implementation for ZK applications

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Frontend    │     │  Smart Contract │     │   ZK Circuit    │
│    (React.js)   │◄────┤  (Solidity)     │◄────┤   (Circom)      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Web3 Context   │     │ Merkle Tree     │     │ ZK Proof Gen    │
│  (JavaScript)   │     │ Implementation  │     │ (snarkjs)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Components

### Smart Contracts
- **ZKMixer.sol**: Core contract handling deposits, verifying proofs, and processing withdrawals
- **IVerifier.sol**: Interface for ZK proof verification
- **Groth16VerifierAdapter.sol**: Adapter connecting auto-generated verifier to the interface

### ZK Infrastructure
- **Circuits**: Circom circuits defining what properties to prove (multiplier.circom, mixer.circom)
- **Proofs**: Generated using Groth16 proving system with snarkjs
- **Verification**: On-chain verification of ZK proofs to authorize withdrawals

### Frontend (In Development)
- **Deposit Flow**: Wallet connection, denomination selection, commitment generation
- **Withdrawal Flow**: Proof generation, nullifier handling, recipient specification
- **Educational Elements**: Visual explanations of how privacy is achieved

## Technical Workflow

1. **Deposit**: 
   - User deposits ETH with fixed denomination
   - A commitment (hash of secret values) is stored in a Merkle tree

2. **Anonymity Pool**:
   - All funds are mixed in the contract
   - Merkle tree structure ensures efficient verification

3. **Withdrawal**:
   - User generates a ZK proof showing they know a preimage to a commitment in the tree
   - Contract verifies proof without learning which deposit is being withdrawn
   - Funds are sent to the specified recipient address (can be different from deposit address)

## Current Implementation Status

- ✅ Complete ZK workflow with real cryptographic proofs
- ✅ Smart contract implementation with Merkle tree
- ✅ Test suite with 100% coverage
- ✅ Automated proof generation and verification
- 🔄 In development: Enhanced mixer circuit with Sparse Merkle Tree verification
- 🔄 In development: Frontend implementation

## Security Considerations

- Nullifier uniqueness to prevent double-spending
- Chain ID validation to prevent cross-chain replay attacks
- Economic security measures against relayer attacks
- No trusted setup requirements 