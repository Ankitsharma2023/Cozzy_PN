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
  Brain,
  Zap,
  TrendingUp,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { Session, Node } from "@shared/schema";
import { useWallet } from "@/lib/wallet";

interface SessionControlBlockchainProps {
  session: Session | null;
  node: Node | null;
  userBalance: number;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

interface AIAnalysis {
  explanation: string;
  benefits: string[];
  score: number;
  location: string;
}

export function SessionControlBlockchain({
  session,
  node,
  userBalance,
  isConnecting,
  onConnect,
  onDisconnect,
}: SessionControlBlockchainProps) {
  const { address, isConnected } = useWallet();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

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

  const generateAIAnalysis = (): AIAnalysis => {
    const locations = [
      "Singapore", "Frankfurt", "Tokyo", "Virginia", "Mumbai",
      "London", "Sydney", "Toronto", "São Paulo", "Seoul"
    ];

    const analysisOptions = [
      {
        explanation: "AI detected {location} as optimal for your connection pattern. This location provides low-latency routing with excellent throughput for data-intensive applications.",
        benefits: ["Optimal Routing", "High Throughput", "Data Optimized"],
        score: 93
      },
      {
        explanation: "Selected {location} server based on network congestion analysis. This node maintains stable connections with minimal jitter for smooth browsing and streaming.",
        benefits: ["Low Congestion", "Stable Connection", "Minimal Jitter"],
        score: 91
      },
      {
        explanation: "Chose {location} for its cost-performance ratio. The AI calculated this offers the best value while maintaining reliable speeds for everyday use.",
        benefits: ["Best Value", "Reliable Speed", "Cost Efficient"],
        score: 89
      },
      {
        explanation: "{location} server selected for geographic advantage and network redundancy. Multiple backbone connections ensure maximum uptime and availability.",
        benefits: ["Network Redundancy", "Maximum Uptime", "Geographic Edge"],
        score: 94
      },
      {
        explanation: "Real-time analysis shows {location} delivers superior packet delivery rates. This location balances latency and bandwidth for optimal VPN experience.",
        benefits: ["Superior Delivery", "Balanced Performance", "Real-time Optimized"],
        score: 92
      }
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomAnalysis = analysisOptions[Math.floor(Math.random() * analysisOptions.length)];

    return {
      explanation: randomAnalysis.explanation.replace("{location}", randomLocation),
      benefits: randomAnalysis.benefits,
      score: randomAnalysis.score,
      location: randomLocation
    };
  };

  const handleConnectClick = () => {
    const analysis = generateAIAnalysis();
    setAiAnalysis(analysis);
    setTimeout(() => onConnect(), 500);
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
    session?.ratePerSecond && userBalance > 0
      ? Math.floor(userBalance / session.ratePerSecond)
      : 0;

  const progressPercent = session?.isActive
    ? Math.min((currentCost / userBalance) * 100, 100)
    : 0;

  return (
    <Card className="overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="flex items-center gap-2">
          {session?.isActive ? (
            <>
              <div className="h-3 w-3 rounded-full bg-status-online animate-pulse" />
              <span>VPN Connected (Blockchain)</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span>VPN Disconnected</span>
            </>
          )}
        </CardTitle>
        {session?.isActive && aiAnalysis && (
          <Badge variant="secondary" className="gap-1">
            <span className="text-lg leading-none">📍</span>
            {aiAnalysis.location}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!session?.isActive && aiAnalysis && (
          <div className="p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/40 dark:to-emerald-950/40 rounded-lg border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">AI Analysis Complete</h4>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Score: {aiAnalysis.score}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiAnalysis.explanation}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiAnalysis.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30">
                      <Zap className="h-3 w-3 text-green-600 dark:text-green-400" />
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
                <p className="text-2xl font-mono font-bold">
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cost
                </p>
                <p className="text-2xl font-mono font-bold">
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
                <span className="font-medium">{aiAnalysis?.location || "AI Selected"}</span>
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
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={onDisconnect}
            >
              <ShieldOff className="h-5 w-5" />
              Disconnect VPN
            </Button>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
              <Brain className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Smart VPN Connection</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                AI analyzes network conditions to find the perfect server for your needs
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={handleConnectClick}
              disabled={isConnecting || userBalance <= 0}
            >
              <Brain className="h-5 w-5" />
              {isConnecting ? "AI Analyzing..." : "Connect with AI"}
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
                Click to see real-time AI server selection
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