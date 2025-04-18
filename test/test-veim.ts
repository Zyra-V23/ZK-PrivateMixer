import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(process.env.EVM_RPC_URL!),
  });

  try {
    const blockNumber = await client.getBlockNumber();
    console.log("Último número de bloque:", blockNumber);
    const block = await client.getBlock({ blockNumber });
    console.log("Último bloque:", block);
  } catch (error) {
    console.error("Error al consultar el nodo:", error);
  }
}

main().catch((err) => {
  console.error("Error general en la ejecución:", err);
}); 