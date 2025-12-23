import "dotenv/config";
import { db } from "../server/db";
import { nodes } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const nodeId = "node_local_1";
    // Address from daemon log
    const operatorAddress = "0x476370AFb80A959Cee73821e04dBB5e71F97A58D";

    console.log(`Updating node ${nodeId} to address ${operatorAddress}...`);

    await db.update(nodes).set({
        operatorAddress,
        isActive: true
    }).where(eq(nodes.id, nodeId));

    console.log("Node updated!");
    process.exit(0);
}

main().catch(console.error);
