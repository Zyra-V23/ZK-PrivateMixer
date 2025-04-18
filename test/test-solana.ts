import "dotenv/config";
import { Connection } from "@solana/web3.js";

const SOL_RPC = process.env.SOLANA_RPC_URL!;

async function main() {
  const connection = new Connection(SOL_RPC, "confirmed");
  try {
    const slot = await connection.getSlot();
    console.log("✅ Latest slot number:", slot);

    const blockHeight = await connection.getBlockHeight();
    console.log("✅ Latest block height:", blockHeight);

    // Fetch a recent block with robust config
    const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 });
    console.log("✅ Block data:", block);
  } catch (err) {
    console.error("❌ Error connecting to Solana node:", err);
  }
}

main();