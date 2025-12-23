import "dotenv/config";
import { db } from "../server/db";
import { nodes } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const nodeId = "node_local_1";
    // Address generated in previous step
    const operatorAddress = "0x476370AFb80A9558Dee73821e04dBB5e71F97A5";

    console.log("Seeding node...");
    try {
        const existing = await db.select().from(nodes).where(eq(nodes.id, nodeId));
        if (existing.length > 0) {
            console.log("Node already exists, updating...");
            await db.update(nodes).set({
                operatorAddress,
                isActive: true
            }).where(eq(nodes.id, nodeId));
            console.log("Node updated.");
        } else {
            await db.insert(nodes).values({
                id: nodeId,
                operatorAddress,
                name: "Local Simulation Node",
                location: "Home Base",
                country: "Localhost",
                countryCode: "LO",
                ipAddress: "127.0.0.1",
                port: 51820,
                ratePerMinute: 0.1,
                isActive: true,
            });
            console.log("Node seeded!");
        }
    } catch (e) {
        console.error("Error seeding node:", e);
        process.exit(1);
    }
    process.exit(0);
}

main().catch(console.error);
