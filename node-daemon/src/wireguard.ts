import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export interface WireGuardConfig {
    interfaceName: string; // e.g., 'wg0'
    port: number;
    privateKey: string;
    address: string; // e.g., '10.8.0.1/24'
}

export interface PeerConfig {
    publicKey: string;
    allowedIps: string; // e.g., '10.8.0.2/32'
}

export class WireGuardService {
    private config: WireGuardConfig;
    private configPath: string;

    constructor(config: WireGuardConfig) {
        this.config = config;
        this.configPath = `/etc/wireguard/${config.interfaceName}.conf`;
    }

    /**
     * Generates Private/Public Key pair
     */
    static async generateKeys(): Promise<{ privateKey: string; publicKey: string }> {
        try {
            const { stdout: privateKey } = await execAsync("wg genkey");
            const { stdout: publicKey } = await execAsync(`echo "${privateKey.trim()}" | wg pubkey`);
            return {
                privateKey: privateKey.trim(),
                publicKey: publicKey.trim(),
            };
        } catch (error) {
            throw new Error("Failed to generate keys. Is WireGuard installed?");
        }
    }

    /**
     * Creates the wg0.conf file and initializes the interface
     */
    async up() {
        console.log(`[WireGuard] Initializing ${this.config.interfaceName}...`);

        // 1. Create Configuration File
        const confContent = `
[Interface]
PrivateKey = ${this.config.privateKey}
Address = ${this.config.address}
ListenPort = ${this.config.port}
SaveConfig = false
PostUp = iptables -A FORWARD -i ${this.config.interfaceName} -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i ${this.config.interfaceName} -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
`;

        // Ensure directory exists
        await execAsync("mkdir -p /etc/wireguard");
        await fs.writeFile(this.configPath, confContent.trim());
        await fs.chmod(this.configPath, 0o600);

        // 2. Bring Interface Up
        try {
            // Check if already running, down it first
            await execAsync(`wg-quick down ${this.config.interfaceName}`).catch(() => { });

            await execAsync(`wg-quick up ${this.config.interfaceName}`);
            console.log(`[WireGuard] Interface ${this.config.interfaceName} is UP.`);
        } catch (error: any) {
            console.error(`[WireGuard] Failed to bring up interface: ${error.message}`);
            // If strictly kernel mode was requested but failed, this will catch it.
            // On WSL, installing wireguard-go might be needed if this fails.
            throw error;
        }
    }

    async down() {
        try {
            await execAsync(`wg-quick down ${this.config.interfaceName}`);
            console.log(`[WireGuard] Interface ${this.config.interfaceName} is DOWN.`);
        } catch (error) {
            // Ignore error if already down
        }
    }

    /**
     * Adds a peer (User) dynamically without restarting the interface
     */
    async addPeer(peer: PeerConfig) {
        console.log(`[WireGuard] Adding peer ${peer.publicKey.substring(0, 6)}...`);
        // wg set wg0 peer <KEY> allowed-ips <IP>
        await execAsync(`wg set ${this.config.interfaceName} peer "${peer.publicKey}" allowed-ips "${peer.allowedIps}"`);
    }

    /**
     * Removes a peer
     */
    async removePeer(publicKey: string) {
        console.log(`[WireGuard] Removing peer ${publicKey.substring(0, 6)}...`);
        await execAsync(`wg set ${this.config.interfaceName} peer "${publicKey}" remove`);
    }

    /**
     * Gets transfer statistics
     */
    async getStats() {
        // Output: <public-key> <rx-bytes> <tx-bytes> <latest-handshake> <allowed-ips>
        const { stdout } = await execAsync(`wg show ${this.config.interfaceName} dump`);
        return stdout.trim().split("\n").slice(1).map(line => {
            const [publicKey, psk, endpoint, allowedIps, latestHandshake, rx, tx] = line.split("\t");
            return { publicKey, rx: parseInt(rx), tx: parseInt(tx), latestHandshake: parseInt(latestHandshake) };
        });
    }
}
