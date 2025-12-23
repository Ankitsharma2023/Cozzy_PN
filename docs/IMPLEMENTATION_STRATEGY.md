# Cozzy_PN Production Implementation Strategy

This document outlines the strategic roadmap to transform the Cozzy_PN prototype into a production-ready, decentralized VPN ecosystem.

## 🧱 Architecture Overview: The "Three Pillars"

We will enforce a strict separation of concerns by treating the system as three distinct, interdependent sub-projects.

### 1. The Web Platform (`/platform`)

- **Role**: The User Interface & Orchestrator.
- **Components**: React Frontend (Dashboard), Express Backend (API/Indexer), PostgreSQL (Off-chain Cache).
- **Responsibility**:
  - User Authentication & Wallet Connection.
  - Browsing & Filtering available VPN Nodes.
  - Off-chain session coordination (signaling).
  - Transaction history indexing from the blockchain.

### 2. The Node Daemon (`/node-daemon`)

- **Role**: The Infrastructure Provider (The "Worker").
- **Infrastructure**: Runs on **Dedicated VPS** (Ubuntu 22.04+).
- **Technology**: Node.js/Go service wrapped in Docker.
- **System Access**:
  - Requires `root` privileges (handled via Docker `--cap-add=NET_ADMIN`).
  - Manages `wg0` (WireGuard) network interfaces directly.
- **Responsibility**:
  - Auto-configuration of WireGuard keys.
  - Real-time bandwidth tracking.
  - Enforcing session limits (cutting access when payment stops).
  - Heartbeat reporting to the Platform.

### 3. The Protocol (`/contracts`)

- **Role**: The Trust Layer.
- **Infrastructure**: EVM Blockchain (Base Mainnet).
- **Responsibility**:
  - Escrowing user funds (USDC).
  - Streaming payments to Operator wallets.
  - Minting X4PN rewards.
  - Immutable registry of registered Node Operators.

---

## 🚀 Execution Phase 1: Containerization & Restructuring

We must decouple the current monolithic structure to support distributed deployment.

### 1.1 Dockerize the Web Platform

- Create `platform/Dockerfile`: Multi-stage build for React client + Express server.
- Create `docker-compose.yml`: Orchestrates Platform + PostgreSQL.
- **Benefit**: Easy deployment to AWS/DigitalOcean for the central website.

### 1.2 Scaffold the Node Daemon

- **New Project**: Create `node-daemon/`.
- **Docker Strategy**:
  - Use `lscr.io/linuxserver/wireguard` or a custom Alpine base.
  - Implement a Control Script (Node.js/Python) that watches for session requests and runs `wg` commands (`wg set`, `wg setconf`).
- **VPS Script**: distinct `setup_node.sh` to install Docker, enable IP forwarding (`sysctl net.ipv4.ip_forward=1`), and run the container.

---

## ⚡ Execution Phase 2: System-Level Networking (WireGuard)

This is the most critical technical challenge. The Node Daemon needs to dynamically add/remove peers without restarting the interface.

### Strategy:

1.  **Dynamic Configuration**: The daemon will use the WireGuard command-line tools (`wg`) or a netlink library to add peers on the fly.
2.  **Auth Flow**:
    - User requests session -> Platform API.
    - Platform verifies funds -> Alerts Node Daemon (Websocket/Webhook).
    - Node Daemon generates public key -> Sends to User.
    - Node Daemon adds User Public Key to AllowedIPs.
    - Node Daemon enables traffic.

---

## 🌐 Execution Phase 3: Production Blockchain Ops

Moving from Hardhat Local/Base Sepolia to Mainnet requires specific security measures.

### 3.1 Security & Deployment

- **Private Key Management**: Never store keys in code. Use encrypted `.env` or Hardware Wallet signing for initial deployment.
- **Verification**: Automated Basescan verification scripts in Hardhat.
- **Multisig**: Transfer ownership of `X4PNToken` and `X4PNVpnSessions` to a Gnosis Safe (Multisig) wallet immediately after deployment.

### 3.2 Network Configuration

- Update `hardhat.config.js` with high-reliability RPC endpoints (Alchemy/Infura) rather than public endpoints to ensure transaction reliability.

---

## 📋 Action Plan (Next Steps)

1.  **Refactor Directory Structure**: Move current `client`/`server` into `platform/`.
2.  **Create Node Daemon**: Initialize the specific project for VPS deployment.
3.  **Dockerize Everything**: Ensure `docker-compose up` brings up the local environment (Platform + DB), and a separate build command creates the VPS Node image.
