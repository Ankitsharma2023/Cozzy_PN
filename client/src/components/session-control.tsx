import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  ShieldOff,
  Server,
  Clock,
  DollarSign,
  Coins,
  ArrowUpDown,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { Session, Node } from "@shared/schema";

interface SessionControlProps {
  session: Session | null;
  node: Node | null;
  userBalance: number;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SessionControl({
  session,
  node,
  userBalance,
  isConnecting,
  onConnect,
  onDisconnect,
}: SessionControlProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);

  useEffect(() => {
    if (!session?.isActive || !session.startedAt) {
      setElapsedTime(0);
      setCurrentCost(0);
      return;
    }

    const startTime = new Date(session.startedAt).getTime();
    const ratePerSecond = session.ratePerSecond || 0;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
      setCurrentCost(elapsed * ratePerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const estimatedRemainingTime =
    session?.ratePerSecond && userBalance > 0
      ? Math.floor(userBalance / session.ratePerSecond)
      : 0;

  const progressPercent = session?.isActive
    ? Math.min((currentCost / userBalance) * 100, 100)
    : 0;

  return (
    <Card className="overflow-visible" data-testid="card-session-control">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="flex items-center gap-2">
          {session?.isActive ? (
            <>
              <div className="h-3 w-3 rounded-full bg-status-online animate-pulse" />
              <span>VPN Connected</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span>VPN Disconnected</span>
            </>
          )}
        </CardTitle>
        {session?.isActive && node && (
          <Badge variant="secondary" className="gap-1">
            <span className="text-lg leading-none">{getFlagEmoji(node.countryCode)}</span>
            {node.location}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {session?.isActive ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </p>
                <p
                  className="text-2xl font-mono font-bold"
                  data-testid="text-session-duration"
                >
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cost
                </p>
                <p
                  className="text-2xl font-mono font-bold"
                  data-testid="text-session-cost"
                >
                  {formatUSDC(currentCost)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance Usage</span>
                <span className="font-mono">{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Est. remaining: {formatTime(estimatedRemainingTime)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Server:</span>
                <span className="font-medium">{node?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">X4PN Earned:</span>
                <span className="font-medium font-mono">
                  {formatX4PN((session.x4pnEarned || 0) + currentCost * 10)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="h-4 w-4" />
              <span>Rate: {formatUSDC((session.ratePerSecond || 0) * 60)}/min</span>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={onDisconnect}
              data-testid="button-disconnect-vpn"
            >
              <ShieldOff className="h-5 w-5" />
              Disconnect VPN
            </Button>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Not Connected</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Connect to a VPN server to protect your privacy and earn X4PN tokens
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={onConnect}
              disabled={isConnecting || userBalance <= 0}
              data-testid="button-connect-vpn"
            >
              <Shield className="h-5 w-5" />
              {isConnecting ? "Connecting..." : "Connect to VPN"}
            </Button>
            {userBalance <= 0 && (
              <p className="text-xs text-destructive">
                Deposit USDC to start using VPN
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
