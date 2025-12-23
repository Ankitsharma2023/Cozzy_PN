// Example component showing how to use blockchain contracts directly
// This is an example of how the frontend could interact with the smart contracts directly
// instead of going through the backend API

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet';
import { ethers } from 'ethers';
import { 
  getX4PNTokenContract, 
  getVpnSessionsContract,
  depositUSDC,
  withdrawUSDC,
  startVPNSession,
  settleVPNSession,
  endVPNSession,
  getX4PNBalance,
  getUserBalance
} from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

export function BlockchainInteractionExample() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [x4pnBalance, setX4pnBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize provider and signer when wallet is connected
  useEffect(() => {
    if (isConnected && window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      
      browserProvider.getSigner().then(setSigner);
    }
  }, [isConnected]);

  // Fetch balances
  const fetchBalances = async () => {
    if (!signer || !address) return;
    
    try {
      // Get X4PN token balance
      const x4pnBalance = await getX4PNBalance(signer, address);
      setX4pnBalance(ethers.formatEther(x4pnBalance));
      
      // Get USDC balance in the VPN contract
      const usdcBalance = await getUserBalance(signer, address);
      setUsdcBalance(ethers.formatUnits(usdcBalance, 6)); // USDC has 6 decimals
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch balances',
        variant: 'destructive',
      });
    }
  };

  // Deposit USDC
  const handleDeposit = async (amount: string) => {
    if (!signer) return;
    
    try {
      setIsProcessing(true);
      const amountInWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
      const tx = await depositUSDC(amountInWei, signer);
      
      toast({
        title: 'Transaction Sent',
        description: `Deposit transaction hash: ${tx.hash.substring(0, 10)}...`,
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'USDC deposited successfully',
      });
      
      // Refresh balances
      await fetchBalances();
    } catch (error) {
      console.error('Error depositing USDC:', error);
      toast({
        title: 'Error',
        description: 'Failed to deposit USDC',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Withdraw USDC
  const handleWithdraw = async (amount: string) => {
    if (!signer) return;
    
    try {
      setIsProcessing(true);
      const amountInWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
      const tx = await withdrawUSDC(amountInWei, signer);
      
      toast({
        title: 'Transaction Sent',
        description: `Withdraw transaction hash: ${tx.hash.substring(0, 10)}...`,
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'USDC withdrawn successfully',
      });
      
      // Refresh balances
      await fetchBalances();
    } catch (error) {
      console.error('Error withdrawing USDC:', error);
      toast({
        title: 'Error',
        description: 'Failed to withdraw USDC',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium text-yellow-800">Wallet Not Connected</h3>
        <p className="text-yellow-700">Connect your wallet to interact with the blockchain contracts directly.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-card text-card-foreground">
      <h2 className="text-xl font-bold mb-4">Blockchain Contract Interaction</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-2">X4PN Token Balance</h3>
          <p className="text-2xl font-bold">{x4pnBalance} X4PN</p>
        </div>
        
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-2">USDC Balance (in VPN Contract)</h3>
          <p className="text-2xl font-bold">{usdcBalance} USDC</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={fetchBalances}
          disabled={isProcessing || !signer}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Refresh Balances
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Deposit USDC</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Amount"
              className="px-3 py-2 border rounded"
            />
            <button 
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleDeposit(input.value);
              }}
              disabled={isProcessing || !signer}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Withdraw USDC</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Amount"
              className="px-3 py-2 border rounded"
            />
            <button 
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleWithdraw(input.value);
              }}
              disabled={isProcessing || !signer}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded">
          Transaction in progress... Please confirm in your wallet and wait for confirmation.
        </div>
      )}
    </div>
  );
}