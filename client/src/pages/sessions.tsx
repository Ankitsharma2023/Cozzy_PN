import { useQuery } from "@tanstack/react-query";
import { SessionHistory } from "@/components/session-history";
import { StatCard } from "@/components/stat-card";
import { useWallet } from "@/lib/wallet";
import { Clock, DollarSign, Coins, Activity, Wallet } from "lucide-react";
import type { Session } from "@shared/schema";

export default function Sessions() {
  const { address, isConnected } = useWallet();

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions", address],
    enabled: isConnected && !!address,
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
            Connect your wallet to view your session history
          </p>
        </div>
      </div>
    );
  }

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.isActive).length;
  const totalDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.totalCost, 0);
  const totalEarned = sessions.reduce((sum, s) => sum + s.x4pnEarned, 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-sessions">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">
          View your VPN session history and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={totalSessions.toString()}
          icon={Activity}
          iconGradient="from-chart-1/20 to-chart-1/5"
          testId="stat-total-sessions"
        />
        <StatCard
          title="Active Now"
          value={activeSessions.toString()}
          icon={Activity}
          iconGradient="from-status-online/20 to-status-online/5"
          testId="stat-active-now"
        />
        <StatCard
          title="Total Time"
          value={formatDuration(totalDuration)}
          icon={Clock}
          iconGradient="from-chart-3/20 to-chart-3/5"
          testId="stat-total-time"
        />
        <StatCard
          title="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          subtitle={`+${totalEarned.toFixed(0)} X4PN earned`}
          icon={DollarSign}
          iconGradient="from-chart-4/20 to-chart-4/5"
          testId="stat-total-cost"
        />
      </div>

      <SessionHistory sessions={sessions} isLoading={isLoading} />
    </div>
  );
}
