import { create } from 'zustand';
import { apiRequest } from './queryClient';
import { BrowserProvider } from 'ethers';

interface User {
  id: string;
  walletAddress: string;
  usdcBalance: number;
  x4pnBalance: number;
  totalSpent: number;
  totalEarnedX4pn: number;
}

interface WalletState {
  address: string | null;
  user: User | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkSession: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  user: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,

  connect: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    set({ isConnecting: true });

    try {
      // 1. Connect Wallet
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      const network = await provider.getNetwork();

      // 2. Get Nonce
      const nonceRes = await apiRequest("GET", `/api/auth/nonce/${address}`);
      const { nonce } = await nonceRes.json();

      // 3. Sign Message
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);

      // 4. Login
      const loginRes = await apiRequest("POST", "/api/auth/login", { address, signature });
      const { user } = await loginRes.json();

      set({
        address,
        user,
        isConnected: true,
        isConnecting: false,
        chainId: Number(network.chainId),
      });

    } catch (error) {
      console.error("Connection failed:", error);
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (e) {
      console.error("Logout failed:", e);
    }

    set({
      address: null,
      user: null,
      isConnected: false,
      chainId: null,
    });
  },

  checkSession: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        set({
          address: user.walletAddress,
          user,
          isConnected: true
        });

        // Optionally sync chainId if window.ethereum exists
        if (typeof window.ethereum !== 'undefined') {
          try {
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            set({ chainId: Number(network.chainId) });
          } catch (e) {
            console.warn("Could not sync chainId", e);
          }
        }
      }
    } catch (e) {
      // Not logged in, valid state
    }
  }
}));

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatX4PN(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const BASE_MAINNET_CHAIN_ID = 8453;

export async function switchToBase(): Promise<void> {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
    });
  } catch (switchError: unknown) {
    const error = switchError as { code: number };
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x2105',
            chainName: 'Base Mainnet',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org/'],
          },
        ],
      });
    }
  }
}
