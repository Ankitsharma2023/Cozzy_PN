import "dotenv/config";
import { PlatformClient } from "./platform-client";
import { WireGuardService } from "./wireguard";
import os from "os";
import { ethers } from "ethers";

const WG_INTERFACE = process.env.WG_INTERFACE || "wg0";
const WG_PORT = parseInt(process.env.WG_PORT || "51820");
const WG_IP = process.env.WG_IP || "10.8.0.1/24";

async function main() {
    console.log("🚀 Starting X4PN Node Daemon...");
    console.log(`OS: ${os.platform()} ${os.release()}`);

    console.log(`OS: ${os.platform()} ${os.release()}`);

    // Auto-switch to simulation mode on non-Linux platforms
    if (os.platform() !== "linux" && process.env.SIMULATION !== "true") {
        console.warn("⚠️  Non-Linux platform detected. WireGuard kernel modules are unavailable.");
        console.warn("   Switching to SIMULATION mode for development.");
        return runSimulation();
    }

    if (process.env.SIMULATION === "true") {
        return runSimulation();
    }

    try {
        // 1. Initialize WireGuard Keys (Kernel Mode)
        console.log("🔒 Initializing WireGuard Kernel Interface...");
        let keys: { privateKey: string; publicKey: string };
        try {
            keys = await WireGuardService.generateKeys();
        } catch (e) {
            console.warn("⚠️  WireGuard key generation failed. Falling back to SIMULATION mode.");
            return runSimulation();
        }
        console.log("🔑 Generated WireGuard Identity");
        console.log(`   Public Key: ${keys.publicKey}`);

        // 2. Start WireGuard Service
        const wg = new WireGuardService({
            interfaceName: WG_INTERFACE,
            port: WG_PORT,
            privateKey: keys.privateKey,
            address: WG_IP
        });

        try {
            await wg.up();
        } catch (e) {
            console.error("❌ Failed to initialize network interface. Are you root?");
            console.error(e);
            process.exit(1);
        }

        // 3. Connect to Platform
        console.log("📡 Connecting to Platform API...");
        const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:5000";
        const NODE_ID = process.env.NODE_ID || "node_123";

        // Auth Setup
        let privateKey = process.env.NODE_PRIVATE_KEY;
        if (!privateKey) {
            console.warn("⚠️  NODE_PRIVATE_KEY not found in env. Generating temporary key...");
            const wallet = ethers.Wallet.createRandom();
            privateKey = wallet.privateKey;
            console.warn(`   Generated Private Key: ${privateKey}`);
            console.warn(`   Operator Address: ${wallet.address}`);
            console.warn("   Action: Register this address in the Platform Dashboard.");
        } else {
            const wallet = new ethers.Wallet(privateKey);
            console.log(`✅ Loaded Private Key. Address: ${wallet.address}`);
        }

        const platform = new PlatformClient(PLATFORM_URL, NODE_ID, privateKey, async (data) => {
            console.log(`[Daemon] Adding peer for session ${data.sessionId}`);

            // In a real system, we would generate a unique IP or pull from a pool
            // For prototype, we mock the IP assignment logic
            // data.userPublicKey comes from the handshake in a real implementation

            // This is where we would call:
            // await wg.addPeer({
            //    publicKey: data.userPublicKey, 
            //    allowedIps: "10.8.0.x/32"
            // });

            console.log(`[Daemon] Peer added successfully for user ${data.userAddress}`);
        });

        // 4. Teardown on exit
        const stop = async () => {
            console.log("\nStopping Node...");
            await wg.down();
            // Platform client disconnect logic (handled by process exit usually)
            process.exit(0);
        };
        process.on("SIGINT", stop);
        process.on("SIGTERM", stop);

        // Keep alive & Heartbeat
        setInterval(async () => {
            try {
                const stats = await wg.getStats();
                console.log(`[Heartbeat] Active Peers: ${stats.length}`);
                // TODO: Send heartbeat to platform via platform.socket.emit(...)
            } catch (e) {
                // Ignore errors in loop
            }
        }, 10000);

    } catch (error) {
        console.error("Fatal Error:", error);
        process.exit(1);
    }
}

function runSimulation() {
    console.log("------------ SIMULATION MODE ------------");
    console.log("Real WireGuard interfaces require Linux kernel modules.");
    console.log("Simulating Daemon behavior for development...");

    // Simulate Platform Connection
    const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:5000";
    const NODE_ID = process.env.NODE_ID || "node_sim_1";

    let privateKey = process.env.NODE_PRIVATE_KEY;
    if (!privateKey) {
        console.warn("⚠️  NODE_PRIVATE_KEY not found. Generating temporary key...");
        const wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        console.warn(`   Operator Address: ${wallet.address}`);
    } else {
        const wallet = new ethers.Wallet(privateKey);
        console.log(`✅ [Sim] Loaded Private Key. Address: ${wallet.address}`);
    }

    console.log(`[Sim] Connecting to ${PLATFORM_URL}...`);
    const platform = new PlatformClient(PLATFORM_URL, NODE_ID, privateKey, async (data) => {
        console.log(`[Sim] 📩 Received session request for user: ${data.userAddress}`);
        console.log(`[Sim] 🟢 Mocking WireGuard peer addition...`);
        console.log(`[Sim] ✅ Peer added (simulated).`);
    });

    setInterval(() => {
        console.log("[Sim] Heartbeat sent. Active Peers: 0");
    }, 5000);
}

main().catch(console.error);
