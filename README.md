# Cozzy_PN - Decentralized VPN & Reward Ecosystem

Cozzy PN is a next-generation Decentralized VPN (dVPN) platform that revolutionizes internet privacy and connectivity. Built on blockchain technology, it allows users to pay for secure, high-speed VPN services using **USDC** and earn **X4PN tokens** as rewards for their usage.

## 🚀 Key Features

- **Pay-as-you-go**: Micropayments streamed per second using USDC. No monthly subscriptions required.
- **Earn to Surf**: Users earn **X4PN** tokens as rewards for every minute connected.
- **Decentralized Infrastructure**: A global network of community-run nodes ensures censorship resistance and zero logs.
- **Transparent & Trustless**: All transactions and session settlements are verified on-chain via Smart Contracts.
- **Privacy First**: Built-in heavy encryption (WireGuard compatibility planned) and no central authority logging user data.

## 🛠 Tech Stack

### Frontend

- **React** (Vite)
- **TypeScript**
- **Tailwind CSS** (Styling)
- **shadcn/ui** (Component Library)
- **Wouter** (Routing)
- **React Query** (State Management)

### Backend

- **Node.js & Express**
- **PostgreSQL** (Database)
- **Drizzle ORM** (Database Interaction)
- **Passport.js** (Authentication)

### Blockchain

- **Solidity** (Smart Contracts)
- **Hardhat** (Development Environment)
- **Ethers.js** (Blockchain Interaction)
- **Network**: Compatible with EVM chains (Base).

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/)
- A Web3 Wallet (e.g., MetaMask)

## ⚙️ Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/ShahiTechnovation/X4PN.git
    cd X4PN
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory (copy from default or use the reference below):

    ```env
    # Database
    DATABASE_URL=postgresql://user:password@localhost:5432/x4pn_vpn

    # Server
    PORT=5000
    NODE_ENV=development

    # Blockchain (Optional for local dev)
    BASE_RPC_URL=https://mainnet.base.org
    ```

4.  **Database Migration**
    Push the schema to your local PostgreSQL instance:
    ```bash
    npm run db:push
    ```

## 🏃‍♂️ Running the Application

Start the development server (runs both Client and Server):

```bash
npm run dev
```

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 🔗 Smart Contracts

The smart contracts are located in the `contracts/` directory.

- **`CozzyPNToken.sol`**: The native reward token.
- **`CozzyPNVpnSessions.sol`**: Handles session logic, payments, and settlements.
