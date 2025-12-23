// Frontend configuration
export const CONFIG = {
  // Default RPC endpoints for Base
  RPC_ENDPOINTS: {
    base: "https://mainnet.base.org",
    baseSepolia: "https://sepolia.base.org"
  },

  // Fallback RPC endpoints - more reliable options
  FALLBACK_RPC_ENDPOINTS: {
    base: [
      "https://mainnet.base.org",
      "https://base.publicnode.com",
      "https://1rpc.io/base",
      "https://base.llamarpc.com"
    ],
    baseSepolia: [
      "https://sepolia.base.org",
      "https://base-sepolia.publicnode.com"
    ]
  },

  // Network configuration
  NETWORKS: {
    base: {
      chainId: 8453,
      name: "Base Mainnet"
    },
    baseSepolia: {
      chainId: 84532,
      name: "Base Sepolia"
    }
  }
};