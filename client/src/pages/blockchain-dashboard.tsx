import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlockchainSessionControl } from "@/components/blockchain-session-control";
import { SessionHistory } from "@/components/session-history";
import { BlockchainDepositModal } from "@/components/blockchain-deposit-modal";
import { BlockchainWithdrawModal } from "@/components/blockchain-withdraw-modal";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  Coins,
  Activity,
  TrendingUp,
  Plus,
  ArrowDownToLine,
} from "lucide-react";
import { ethers } from "ethers";
import {
  getUserBalance,
  getX4PNBalance
} from "@/lib/contracts";
import type { Session, Node, User } from "@shared/schema";

export default function BlockchainDashboard() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [x4pnBalance, setX4pnBalance] = useState(0);

  // Fetch blockchain balances
  const fetchBalances = async () => {
    if (!isConnected || !address || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Get USDC balance in VPN contract
      const usdcBalanceWei = await getUserBalance(address, provider as any);
      const usdcBalanceFormatted = parseFloat(ethers.formatUnits(usdcBalanceWei, 6));
      setUsdcBalance(usdcBalanceFormatted);

      // Get X4PN token balance
      const x4pnBalanceWei = await getX4PNBalance(address, provider as any);
      const x4pnBalanceFormatted = parseFloat(ethers.formatEther(x4pnBalanceWei));
      setX4pnBalance(x4pnBalanceFormatted);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast({
        title: "Error",
        description: "Failed to fetch balances",
        variant: "destructive",
      });
    }
  };

  // Fetch balances on wallet connection and at intervals
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();

      // Refresh balances every 30 seconds
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  // Mock data for sessions and nodes (in a real app, this would come from the blockchain or API)
  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["activeSession", address],
    enabled: isConnected && !!address,
    queryFn: async () => {
      // In a real implementation, this would fetch from blockchain
      return null;
    }
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["sessions", address],
    enabled: isConnected && !!address,
    queryFn: async () => {
      // In a real implementation, this would fetch from blockchain
      return [];
    }
  });

  const { data: nodes = [] } = useQuery<Node[]>({
    queryKey: ["nodes"],
    queryFn: async () => {
      // In a real implementation, this would fetch from blockchain or API
      return [
        {
          id: "1",
          operatorAddress: "0x1234567890123456789012345678901234567890",
          name: "Tokyo Gateway",
          location: "Tokyo, Japan",
          country: "Japan",
          countryCode: "JP",
          ipAddress: "103.152.112.45",
          port: 51820,
          ratePerMinute: 0.001,
          isActive: true,
          totalEarnedUsdc: 1250.50,
          totalEarnedX4pn: 15000,
          activeUsers: 23,
          uptime: 99.9,
          latency: 15,
          createdAt: new Date(),
        }
      ];
    }
  });

  const currentNode = activeSession
    ? nodes.find((n) => n.id === activeSession.nodeId)
    : null;

  const totalSpent = 0; // Would be calculated from session history
  const totalEarned = x4pnBalance; // X4PN balance represents total earned
  const activeSessions = sessions.filter((s) => s.isActive).length;

  const handleSessionChange = () => {
    // Refresh data when session changes
    queryClient.invalidateQueries({ queryKey: ["activeSession", address] });
    queryClient.invalidateQueries({ queryKey: ["sessions", address] });
    fetchBalances();
  };

  const handleDepositSuccess = async (amount: number) => {
    try {
      if (address) {
        // Sync deposit with backend database for session balance
        await apiRequest("POST", "/api/deposits", {
          userAddress: address,
          amount,
          token: "usdc"
        });
      }
      fetchBalances();
    } catch (error) {
      console.error("Failed to sync deposit with backend", error);
      toast({
        title: "Sync Warning",
        description: "Deposit successful on-chain but failed to update backend balance.",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawSuccess = () => {
    fetchBalances();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <DollarSign className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your MetaMask wallet to access the Cozzy_PN VPN dashboard and start
            earning rewards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6" data-testid="page-blockchain-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your VPN sessions and earnings directly on-chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setWithdrawOpen(true)}
            className="gap-2"
            data-testid="button-withdraw"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Withdraw
          </Button>
          <Button
            onClick={() => setDepositOpen(true)}
            className="gap-2"
            data-testid="button-deposit"
          >
            <Plus className="h-4 w-4" />
            Deposit USDC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="USDC Balance"
          value={`$${usdcBalance.toFixed(2)}`}
          icon={DollarSign}
          iconGradient="from-chart-1/20 to-chart-1/5"
          testId="stat-usdc-balance"
        />
        <StatCard
          title="COZZ Balance"
          value={x4pnBalance.toFixed(0)}
          subtitle="tokens"
          icon={Coins}
          iconGradient="from-chart-2/20 to-chart-2/5"
          testId="stat-x4pn-balance"
        />
        <StatCard
          title="Active Sessions"
          value={activeSessions.toString()}
          icon={Activity}
          iconGradient="from-chart-3/20 to-chart-3/5"
          testId="stat-active-sessions"
        />
        <StatCard
          title="Total Earned"
          value={`${totalEarned.toFixed(0)} X4PN`}
          subtitle={`$${totalSpent.toFixed(2)} spent`}
          icon={TrendingUp}
          trend={12.5}
          iconGradient="from-chart-4/20 to-chart-4/5"
          testId="stat-total-earned"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlockchainSessionControl
          session={activeSession ?? null}
          node={currentNode ?? null}
          userBalance={usdcBalance}
          isConnecting={false}
          onSessionChange={handleSessionChange}
        />
        <SessionHistory sessions={sessions.slice(0, 10)} />
      </div>

      <BlockchainDepositModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        currentBalance={usdcBalance}
        onDepositSuccess={handleDepositSuccess}
      />

      <BlockchainWithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        usdcBalance={usdcBalance}
        x4pnBalance={x4pnBalance}
        onWithdrawSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}

// Simple stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconGradient,
  testId,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  iconGradient?: string;
  testId?: string;
}) {
  return (
    <div
      className="rounded-lg border bg-card text-card-foreground shadow-sm p-6"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold">{value}</h3>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
          {trend !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={trend >= 0 ? "text-status-online" : "text-destructive"}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>{" "}
              from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gradient-to-br ${iconGradient}`}>
          <Icon className="h-6 w-6 text-foreground" />
        </div>
      </div>
    </div>
  );
}