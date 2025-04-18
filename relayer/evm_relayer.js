// EVM Relayer MVP: Fetch Merkle root and nullifiers from ZKMixer.sol
// Requires: npm install ethers

const { ethers } = require('ethers');
const fs = require('fs');

// Load ABI (adjust path as needed)
const ZKMixerABI = require('../artifacts/contracts/ZKMixer.sol/ZKMixer.json').abi;

// Config
const EVM_RPC_URL = process.env.EVM_RPC_URL || 'https://your-evm-rpc-url';
const MIXER_ADDRESS = process.env.MIXER_ADDRESS || '0x...';
const POLL_INTERVAL_MS = 10000; // 10s

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(EVM_RPC_URL);
const mixer = new ethers.Contract(MIXER_ADDRESS, ZKMixerABI, provider);

// In-memory state
let currentRoot = null;
const spentNullifiers = new Set();

// Fetch Merkle root periodically
async function pollMerkleRoot() {
  try {
    const root = await mixer.calculateMerkleRoot();
    if (root !== currentRoot) {
      console.log(`[Relayer] New Merkle root: ${root}`);
      currentRoot = root;
      // TODO: Push root to Solana or other chains here
    }
  } catch (err) {
    console.error('[Relayer] Error fetching Merkle root:', err);
  }
}

// Listen to Withdrawal events to index spent nullifiers
function listenWithdrawals() {
  mixer.on('Withdrawal', (to, nullifierHash, relayer, fee, event) => {
    spentNullifiers.add(nullifierHash);
    console.log(`[Relayer] Withdrawal: nullifier spent: ${nullifierHash}`);
    // Optionally persist to DB or push to Solana
  });
}

// Check if a nullifier is spent (on-chain)
async function isNullifierSpent(nullifierHash) {
  try {
    const spent = await mixer.nullifiers(nullifierHash);
    return spent;
  } catch (err) {
    console.error('[Relayer] Error checking nullifier:', err);
    return false;
  }
}

// Main loop
async function main() {
  console.log('[Relayer] Starting EVM relayer...');
  listenWithdrawals();
  setInterval(pollMerkleRoot, POLL_INTERVAL_MS);
  // Example usage: check a nullifier
  // const spent = await isNullifierSpent('0x...');
}

main();

// Export functions for integration/testing
module.exports = {
  pollMerkleRoot,
  isNullifierSpent,
  spentNullifiers,
  getCurrentRoot: () => currentRoot,
}; 