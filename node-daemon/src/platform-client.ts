import { io, Socket } from "socket.io-client";
import { ethers } from "ethers";

export class PlatformClient {
    private socket: Socket;
    private nodeId: string;
    private operatorAddress: string;
    private wallet: ethers.Wallet;
    private onSessionStartCallback?: (data: any) => Promise<void>;

    constructor(
        platformUrl: string,
        nodeId: string,
        privateKey: string,
        onSessionStart?: (data: any) => Promise<void>
    ) {
        this.nodeId = nodeId;
        // Initialize wallet from private key
        this.wallet = new ethers.Wallet(privateKey);
        this.operatorAddress = this.wallet.address;
        this.onSessionStartCallback = onSessionStart;

        console.log(`[Platform] Initializing connection to ${platformUrl}`);
        console.log(`[Platform] Operator Address: ${this.operatorAddress}`);

        this.socket = io(platformUrl, {
            path: "/api/socket",
            reconnectionDelay: 1000,
            reconnection: true,
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.socket.on("connect", () => {
            console.log(`[Platform] Connected with ID: ${this.socket.id}`);
            this.identify();
        });

        this.socket.on("connect_error", (err) => {
            console.warn(`[Platform] Connection Error: ${err.message}`);
        });

        // Handle Challenge from Server
        this.socket.on("node:challenge", this.handleChallenge.bind(this));

        this.socket.on("node:ready", (data) => {
            console.log(`[Platform] ✅ Authenticated successfully. Status: ${data.status}`);
        });

        this.socket.on("error", (err) => {
            console.error(`[Platform] ❌ Server Error: ${err.message}`);
        });

        // Use this to listen for incoming session requests
        this.socket.on("session:start", this.handleSessionStart.bind(this));
    }

    private identify() {
        console.log("[Platform] Sending identity...");
        this.socket.emit("node:identify", {
            nodeId: this.nodeId,
            operatorAddress: this.operatorAddress
        });
    }

    private async handleChallenge(data: { nonce: string }) {
        try {
            console.log(`[Platform] Received challenge. Signing...`);
            const signature = await this.wallet.signMessage(data.nonce);
            this.socket.emit("node:verify", { signature });
        } catch (error: any) {
            console.error(`[Platform] Signing failed: ${error.message}`);
        }
    }

    private async handleSessionStart(data: any) {
        console.log(`[Platform] 📩 Received session request for user: ${data.userAddress}`);

        if (this.onSessionStartCallback) {
            try {
                await this.onSessionStartCallback(data);
                // Confirm success back to platform (optional)
                this.socket.emit("session:confirmed", { sessionId: data.sessionId });
            } catch (error: any) {
                console.error(`[Platform] Failed to handle session: ${error.message}`);
                this.socket.emit("session:failed", { sessionId: data.sessionId, error: error.message });
            }
        }
    }
}
