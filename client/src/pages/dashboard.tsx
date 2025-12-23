import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { SessionControl } from "@/components/session-control";
import { SessionHistory } from "@/components/session-history";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
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
import type { Session, Node, User } from "@shared/schema";

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", address],
    enabled: isConnected && !!address,
  });

  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["/api/sessions/active", address],
    enabled: isConnected && !!address,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions", address],
    enabled: isConnected && !!address,
  });

  const { data: nodes = [] } = useQuery<Node[]>({
    queryKey: ["/api/nodes"],
  });

  const currentNode = activeSession
    ? nodes.find((n) => n.id === activeSession.nodeId)
    : null;

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      await apiRequest("POST", "/api/deposits", {
        userAddress: address,
        amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", address] });
      toast({
        title: "Deposit Successful",
        description: "Your USDC has been deposited",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, token }: { amount: number; token: "usdc" | "x4pn" }) => {
      await apiRequest("POST", "/api/withdrawals", {
        userAddress: address,
        amount,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", address] });
      toast({
        title: "Withdrawal Successful",
        description: "Funds sent to your wallet",
      });
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const selectedNode = nodes.find((n) => n.isActive);
      if (!selectedNode) throw new Error("No active nodes available");
      await apiRequest("POST", "/api/sessions/start", {
        nodeId: selectedNode.id,
        userAddress: address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", address] });
      toast({
        title: "VPN Connected",
        description: "Your secure connection is now active",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) return;
      await apiRequest("POST", "/api/sessions/end", {
        sessionId: activeSession.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", address] });
      toast({
        title: "VPN Disconnected",
        description: "Your session has ended",
      });
    },
  });

  const usdcBalance = user?.usdcBalance ?? 0;
  const x4pnBalance = user?.x4pnBalance ?? 0;
  const totalSpent = user?.totalSpent ?? 0;
  const totalEarned = user?.totalEarnedX4pn ?? 0;
  const activeSessions = sessions.filter((s) => s.isActive).length;

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
    <div className="space-y-8 p-6" data-testid="page-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your VPN sessions and earnings
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
          title="X4PN Balance"
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
        <SessionControl
          session={activeSession ?? null}
          node={currentNode ?? null}
          userBalance={usdcBalance}
          isConnecting={startSessionMutation.isPending}
          onConnect={() => startSessionMutation.mutate()}
          onDisconnect={() => endSessionMutation.mutate()}
        />
        <SessionHistory sessions={sessions.slice(0, 10)} />
      </div>

      <DepositModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        currentBalance={usdcBalance}
        onDeposit={(amount) => depositMutation.mutateAsync(amount)}
      />

      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        usdcBalance={usdcBalance}
        x4pnBalance={x4pnBalance}
        onWithdraw={(amount, token) =>
          withdrawMutation.mutateAsync({ amount, token })
        }
      />
    </div>
  );
}
