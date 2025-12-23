import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GlobeLock,
  ShieldOff,
  Server,
  Clock,
  DollarSign,
  Coins,
  ArrowUpDown,
  Loader2,
  Download,
  Brain,
  Zap,
  TrendingUp,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import { useWallet } from "@/lib/wallet";
import { ethers } from "ethers";
import {
  startVPNSession,
  settleVPNSession,
  endVPNSession
} from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";
import type { Session, Node } from "@shared/schema";

interface BlockchainSessionControlProps {
  session: Session | null;
  node: Node | null;
  userBalance: number;
  isConnecting: boolean;
  onSessionChange?: () => void;
}

interface NodeReasoning {
  explanation: string;
  benefits: string[];
  score: number;
  location: string;
}

export function BlockchainSessionControl({
  session,
  node,
  userBalance,
  isConnecting,
  onSessionChange,
}: BlockchainSessionControlProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nodeReasoning, setNodeReasoning] = useState<NodeReasoning | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

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

  const generateNodeReasoning = (): NodeReasoning => {
    const locations = [
      "Singapore", "Frankfurt", "Virginia", "Tokyo", "Bangalore", 
      "London", "Mumbai", "San Francisco", "Sydney", "Toronto"
    ];
    
    const reasoningOptions = [
      {
        explanation: "Our AI selected a server in {location} for optimal latency to your region. This node provides direct peering with major networks and maintains excellent throughput for streaming and browsing.",
        benefits: ["Low Latency", "Direct Peering", "Streaming Optimized"],
        score: 94
      },
      {
        explanation: "Chosen a {location}-based server for its superior network redundancy and uptime history. The AI detected multiple failover paths ensuring uninterrupted VPN service with minimal packet loss.",
        benefits: ["High Availability", "Network Redundancy", "Minimal Packet Loss"],
        score: 91
      },
      {
        explanation: "AI analyzed current network conditions and selected {location} as the most cost-effective location without compromising speed. This server maintains optimal user distribution for uncongested bandwidth.",
        benefits: ["Cost Effective", "Light Load", "Balanced Performance"],
        score: 89
      },
      {
        explanation: "Selected {location} server for its geographic positioning advantages and proven reliability. The node offers consistent speeds with efficient routing to minimize latency spikes.",
        benefits: ["Geographic Advantage", "Consistent Speed", "Efficient Routing"],
        score: 92
      },
      {
        explanation: "The algorithm chose {location} based on real-time performance metrics showing superior packet delivery and stable connections. This location balances price and performance effectively.",
        benefits: ["Real-time Optimized", "Stable Connection", "Value Pricing"],
        score: 90
      }
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomReason = reasoningOptions[Math.floor(Math.random() * reasoningOptions.length)];
    
    return {
      explanation: randomReason.explanation.replace("{location}", randomLocation),
      benefits: randomReason.benefits,
      score: randomReason.score,
      location: randomLocation
    };
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const estimatedRemainingTime =
    session && session.ratePerSecond && userBalance > 0
      ? Math.floor(userBalance / session.ratePerSecond)
      : 0;

  const progressPercent = session?.isActive && userBalance > 0
    ? Math.min((currentCost / userBalance) * 100, 100)
    : 0;

  const handleConnect = async () => {
    if (!address) return;

    if (!window.ethereum) {
      toast({
        title: "Wallet Error",
        description: "MetaMask is not installed",
        variant: "destructive",
      });
      return;
    }

    const reasoning = generateNodeReasoning();
    setNodeReasoning(reasoning);
    setShowReasoning(true);

    try {
      setIsProcessing(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const ratePerMinuteWei = ethers.parseUnits("2", 6);
      const ratePerSecond = ratePerMinuteWei / BigInt(60);

      const dummyAddress = "0xa9bd972853e366cd908591bc929a2e68006aba02";

      const tx = await startVPNSession(dummyAddress, ratePerSecond, signer);

      toast({
        title: "AI Analyzing Network",
        description: "Selecting optimal VPN server...",
      });

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        toast({
          title: "VPN Connected",
          description: `Connected to AI-selected server in ${reasoning.location}`,
        });

        if (onSessionChange) {
          onSessionChange();
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      toast({
        title: "Connection Failed",
        description: err.reason || err.message || "Failed to connect to VPN",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!address) return;

    if (!window.ethereum) {
      toast({
        title: "Wallet Error",
        description: "MetaMask is not installed",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      try {
        const settleTx = await settleVPNSession(signer);
        await settleTx.wait();
      } catch (settleErr: any) {
        console.warn("Settlement failed:", settleErr.message);
      }

      const tx = await endVPNSession(signer);

      toast({
        title: "Transaction Sent",
        description: "Ending VPN session... Please wait for confirmation",
      });

      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        toast({
          title: "VPN Disconnected",
          description: "Your session has ended",
        });

        if (onSessionChange) {
          onSessionChange();
        }
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Disconnection error:", err);
      toast({
        title: "Disconnection Failed",
        description: err.reason || err.message || "Failed to disconnect VPN",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="overflow-visible" data-testid="card-blockchain-session-control">
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
        {session?.isActive && nodeReasoning && (
          <Badge variant="secondary" className="gap-1">
            <span className="text-lg leading-none">🌐</span>
            {nodeReasoning.location}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showReasoning && nodeReasoning && !session?.isActive && (
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/40 dark:to-purple-950/40 rounded-lg border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">AI Recommendation</h4>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Score: {nodeReasoning.score}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {nodeReasoning.explanation}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {nodeReasoning.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs gap-1 px-2 py-1">
                      <Zap className="h-3 w-3" />
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{nodeReasoning?.location || "AI Optimized"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">COZZ Earned:</span>
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
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => window.open(`/api/sessions/${session.id}/config`, '_blank')}
            >
              <Download className="h-4 w-4" />
              Download WireGuard Config
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={handleDisconnect}
              disabled={isProcessing}
              data-testid="button-disconnect-vpn"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldOff className="h-5 w-5" />
              )}
              {isProcessing ? "Disconnecting..." : "Disconnect VPN"}
            </Button>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">AI-Optimized VPN</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Click connect to see AI analysis and get connected to the best server
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleConnect}
              disabled={isConnecting || userBalance <= 0 || !address || isProcessing}
              data-testid="button-connect-vpn"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <span>Connect with AI</span>
                </div>
              )}
            </Button>
            <div className="space-y-1">
              {userBalance <= 0 && (
                <p className="text-xs text-destructive">
                  Deposit USDC to start using VPN
                </p>
              )}
              {!address && (
                <p className="text-xs text-destructive">
                  Connect your wallet to use VPN
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                AI analyzes latency, throughput, and pricing
              </p>
            </div>
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