import { ethers } from 'ethers';
import x4pnToken from '../contracts/X4PNToken.json';
import x4pnVpnSessions from '../contracts/X4PNVpnSessions.json';
import { CONFIG } from './config';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  X4PN_TOKEN: "0xd84612a360359cF85E991A01dEAbB3dc8ab121F8", // Base Mainnet
  VPN_SESSIONS: "0xDFcb0654919A4AE22eCfF196cd015F156053fd6D", // Base Mainnet
  // USDC contract address on Base Mainnet
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
};

// Contract ABIs
export const CONTRACT_ABIS = {
  X4PN_TOKEN: x4pnToken,
  VPN_SESSIONS: x4pnVpnSessions,
  USDC: [
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ]
};

// Get contract instances
export function getX4PNTokenContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESSES.X4PN_TOKEN, CONTRACT_ABIS.X4PN_TOKEN, signer);
}

export function getVpnSessionsContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESSES.VPN_SESSIONS, CONTRACT_ABIS.VPN_SESSIONS, signer);
}

export function getUSDCContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESSES.USDC, CONTRACT_ABIS.USDC, signer);
}

// Retry function for handling RPC errors with multiple endpoints
export async function executeWithRpcFallback<T>(
  fn: (provider: ethers.JsonRpcProvider) => Promise<T>,
  rpcEndpoints: string[] = CONFIG.FALLBACK_RPC_ENDPOINTS.base
): Promise<T> {
  let lastError: any;

  // Try each RPC endpoint in order
  for (let i = 0; i < rpcEndpoints.length; i++) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcEndpoints[i]);
      // Test the provider first
      await provider.getNetwork();
      console.log(`Using RPC endpoint: ${rpcEndpoints[i]}`);
      return await fn(provider);
    } catch (error: any) {
      lastError = error;
      console.warn(`RPC endpoint ${rpcEndpoints[i]} failed:`, error.message);

      // If this is likely a temporary error, continue to next endpoint
      if (isTemporaryRpcError(error)) {
        continue;
      } else {
        // For permanent errors, re-throw immediately
        throw error;
      }
    }
  }

  throw lastError;
}

function isTemporaryRpcError(error: any): boolean {
  // Check for common temporary RPC errors
  return error.code === -32002 ||
    error.code === -32005 ||
    error.code === 429 ||
    (error.message && (
      error.message.includes("RPC endpoint returned too many errors") ||
      error.message.includes("rate limit") ||
      error.message.includes("timeout") ||
      error.message.includes("network error") ||
      error.message.includes("connection refused")
    ));
}

// Retry function for handling RPC errors with backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // If this is the last retry, throw the error
      if (i === maxRetries) {
        throw error;
      }

      // Check if this is an RPC error that we should retry
      if (isTemporaryRpcError(error)) {
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
        console.log(`RPC error detected, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors, re-throw immediately
        throw error;
      }
    }
  }

  throw lastError;
}

// X4PN Token contract functions
export async function getX4PNBalance(address: string, provider?: ethers.JsonRpcProvider): Promise<bigint> {
  if (provider) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.X4PN_TOKEN, CONTRACT_ABIS.X4PN_TOKEN, provider);
    return await retryWithBackoff(() => contract.balanceOf(address));
  } else {
    return await executeWithRpcFallback(async (provider) => {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.X4PN_TOKEN, CONTRACT_ABIS.X4PN_TOKEN, provider);
      return await retryWithBackoff(() => contract.balanceOf(address));
    });
  }
}

export async function approveX4PNToken(spender: string, amount: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getX4PNTokenContract(signer);
  return await retryWithBackoff(() => contract.approve(spender, amount));
}

export async function approveUSDC(spender: string, amount: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getUSDCContract(signer);
  return await retryWithBackoff(() => contract.approve(spender, amount));
}

export async function getUSDCBalance(address: string, provider?: ethers.JsonRpcProvider): Promise<bigint> {
  if (provider) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, CONTRACT_ABIS.USDC, provider);
    return await retryWithBackoff(() => contract.balanceOf(address));
  } else {
    return await executeWithRpcFallback(async (provider) => {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, CONTRACT_ABIS.USDC, provider);
      return await retryWithBackoff(() => contract.balanceOf(address));
    });
  }
}

export async function transferX4PN(signer: ethers.Signer, to: string, amount: bigint): Promise<ethers.ContractTransactionResponse> {
  const contract = getX4PNTokenContract(signer);
  return await retryWithBackoff(() => contract.transfer(to, amount));
}

export async function mintX4PN(to: string, amount: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getX4PNTokenContract(signer);
  // Check if caller is a minter
  const isMinter = await contract.minters(await signer.getAddress());
  if (!isMinter) {
    throw new Error("Caller is not authorized to mint tokens");
  }
  return await retryWithBackoff(() => contract.mint(to, amount));
}

// VPN Sessions contract functions
export async function mintRewards(to: string, amount: bigint, sessionId: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.mintRewards(to, amount, sessionId));
}

// Real contract functions that are actually implemented
export async function depositUSDC(amount: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.deposit(amount));
}

export async function withdrawUSDC(amount: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.withdraw(amount));
}

export async function startVPNSession(nodeOperator: string, ratePerSecond: bigint, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.startSession(nodeOperator, ratePerSecond));
}

export async function settleVPNSession(signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.settleSession());
}

export async function endVPNSession(signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.endSession());
}

export async function registerAsNodeOperator(signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> {
  const contract = getVpnSessionsContract(signer);
  return await retryWithBackoff(() => contract.registerAsOperator());
}

export async function getUserBalance(userAddress: string, provider?: ethers.JsonRpcProvider): Promise<bigint> {
  if (provider) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.VPN_SESSIONS, CONTRACT_ABIS.VPN_SESSIONS, provider);
    return await retryWithBackoff(() => contract.userBalances(userAddress));
  } else {
    return await executeWithRpcFallback(async (provider) => {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.VPN_SESSIONS, CONTRACT_ABIS.VPN_SESSIONS, provider);
      return await retryWithBackoff(() => contract.userBalances(userAddress));
    });
  }
}

export async function getActiveSession(userAddress: string, provider?: ethers.JsonRpcProvider): Promise<any> {
  if (provider) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.VPN_SESSIONS, CONTRACT_ABIS.VPN_SESSIONS, provider);
    return await retryWithBackoff(() => contract.getActiveSession(userAddress));
  } else {
    return await executeWithRpcFallback(async (provider) => {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.VPN_SESSIONS, CONTRACT_ABIS.VPN_SESSIONS, provider);
      return await retryWithBackoff(() => contract.getActiveSession(userAddress));
    });
  }
}