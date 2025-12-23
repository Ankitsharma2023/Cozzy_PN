import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { storage } from "./storage";
import { ethers } from "ethers";
import crypto from "crypto";

interface NodeAuth {
    nodeId: string;
    operatorAddress: string;
}

export function setupSocketServer(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        path: "/api/socket",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Store pending challenges: socketId -> { nodeId, operatorAddress, nonce }
    const pendingChallenges = new Map<string, { nodeId: string; operatorAddress: string; nonce: string; }>();

    io.on("connection", (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        let connectedNodeId: string | null = null;

        // 1. Node Identity Handshake - Step 1: Identification
        socket.on("node:identify", async (auth: NodeAuth) => {
            try {
                const node = await storage.getNode(auth.nodeId);

                if (!node) {
                    console.warn(`[Socket] Unknown node attempted connection: ${auth.nodeId}`);
                    socket.emit("error", { message: "Node not found. Please register first." });
                    return;
                }

                // Generate Challenge
                const nonce = crypto.randomBytes(32).toString("hex");
                pendingChallenges.set(socket.id, {
                    nodeId: node.id,
                    operatorAddress: node.operatorAddress,
                    nonce
                });

                // Send Challenge to Node
                socket.emit("node:challenge", { nonce });
                console.log(`[Socket] Challenge sent to node ${node.id}`);

            } catch (err) {
                console.error("Error identifying node:", err);
                socket.emit("error", { message: "Internal Server Error during identification" });
            }
        });

        // 1. Node Identity Handshake - Step 2: Verification
        socket.on("node:verify", async (data: { signature: string }) => {
            const challenge = pendingChallenges.get(socket.id);
            if (!challenge) {
                socket.emit("error", { message: "No pending challenge. Please identify first." });
                return;
            }

            try {
                // Verify Signature
                const recoveredAddress = ethers.verifyMessage(challenge.nonce, data.signature);

                if (recoveredAddress.toLowerCase() !== challenge.operatorAddress.toLowerCase()) {
                    console.warn(`[Socket] Auth failed. Recovered: ${recoveredAddress}, Expected: ${challenge.operatorAddress}`);
                    socket.emit("error", { message: "Authentication Failed: Invalid Signature" });
                    return;
                }

                // Authenticated!
                console.log(`[Socket] Node verified: ${challenge.nodeId}`);

                // Cleanup
                pendingChallenges.delete(socket.id);

                // Mark node as active
                await storage.updateNode(challenge.nodeId, { isActive: true });
                connectedNodeId = challenge.nodeId;

                // Join room
                socket.join(`node:${challenge.nodeId}`);

                // Update status
                socket.emit("node:ready", { status: "active" });

            } catch (err) {
                console.error("[Socket] Verification Error:", err);
                socket.emit("error", { message: "Verification Error" });
            }
        });

        // 2. Node Heartbeat (Load & Status)
        socket.on("node:heartbeat", async (data: { nodeId: string; load: number; activePeers: number }) => {
            // In a real database, we would update the 'last_seen' timestamp here
            // await storage.updateNodeHeartbeat(data.nodeId, ...);
        });

        // 3. Handle Disconnect
        socket.on("disconnect", async () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
            pendingChallenges.delete(socket.id);

            if (connectedNodeId) {
                console.log(`[Socket] Node disconnected: ${connectedNodeId}`);
                await storage.updateNode(connectedNodeId, { isActive: false });
            }
        });
    });

    return io;
}
