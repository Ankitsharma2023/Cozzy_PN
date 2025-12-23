import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { EarningsChart } from "@/components/earnings-chart";
import { WithdrawModal } from "@/components/withdraw-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  Coins,
  TrendingUp,
  ArrowDownToLine,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { User, Transaction } from "@shared/schema";

export default function Earnings() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", address],
    enabled: isConnected && !!address,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", address],
    enabled: isConnected && !!address,
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
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", address] });
      toast({
        title: "Withdrawal Successful",
        description: "Funds sent to your wallet",
      });
    },
  });

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Wallet className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view your earnings
          </p>
        </div>
      </div>
    );
  }

  const usdcBalance = user?.usdcBalance ?? 0;
  const x4pnBalance = user?.x4pnBalance ?? 0;
  const totalEarned = user?.totalEarnedX4pn ?? 0;

  const chartData = generateChartData(transactions);

  return (
    <div className="p-6 space-y-8" data-testid="page-earnings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-muted-foreground">
            Track your rewards and withdrawals
          </p>
        </div>
        <Button
          onClick={() => setWithdrawOpen(true)}
          className="gap-2"
          data-testid="button-withdraw-earnings"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Withdraw
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="USDC Available"
          value={formatUSDC(usdcBalance)}
          icon={DollarSign}
          iconGradient="from-chart-1/20 to-chart-1/5"
          testId="stat-usdc-available"
        />
        <StatCard
          title="X4PN Available"
          value={formatX4PN(x4pnBalance)}
          subtitle="tokens"
          icon={Coins}
          iconGradient="from-chart-2/20 to-chart-2/5"
          testId="stat-x4pn-available"
        />
        <StatCard
          title="Total Earned (X4PN)"
          value={formatX4PN(totalEarned)}
          subtitle="all time"
          icon={TrendingUp}
          trend={8.5}
          iconGradient="from-chart-4/20 to-chart-4/5"
          testId="stat-total-earned-x4pn"
        />
      </div>

      <EarningsChart data={chartData} />

      <Card data-testid="card-earnings-breakdown">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            How You Earn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Coins className="h-4 w-4 text-chart-2" />
                X4PN Token Rewards
              </h3>
              <p className="text-sm text-muted-foreground">
                Earn X4PN tokens every time you use the VPN. For every $0.10 USDC
                spent, you receive 1 X4PN token. These tokens can be traded on
                decentralized exchanges or held for governance.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-chart-1" />
                Node Operator Earnings
              </h3>
              <p className="text-sm text-muted-foreground">
                Run a VPN node and earn 80% of all user payments in USDC. Plus,
                receive X4PN token rewards for providing network capacity. The
                more users you serve, the more you earn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

function generateChartData(transactions: Transaction[]) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate.toDateString() === date.toDateString();
    });

    const usdc = dayTransactions
      .filter((t) => t.token === "usdc" && t.type === "earn")
      .reduce((sum, t) => sum + t.amount, 0);
    const x4pn = dayTransactions
      .filter((t) => t.token === "x4pn" && t.type === "earn")
      .reduce((sum, t) => sum + t.amount, 0);

    last7Days.push({ date: dateStr, usdc, x4pn });
  }
  return last7Days;
}
