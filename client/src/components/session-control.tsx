import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
  Wifi,
  Gauge,
  Network,
  Globe,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import { useWallet } from "@/lib/wallet";
import type { Session, Node } from "@shared/schema";

interface SessionControlProps {
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
  reasoningSteps: { text: string; icon: React.ReactNode; delay: number }[];
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
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { connect: connectWallet } = useWallet();

  // Clear analysis when session becomes inactive (disconnected)
  useEffect(() => {
    if (!session?.isActive) {
      setAiAnalysis(null);
    }
  }, [session?.isActive]);

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

    const reasoningSteps = [
      { text: "Connecting to network...", icon: <Globe className="h-4 w-4" />, delay: 2000 },
      { text: "Encrypting connection...", icon: <Gauge className="h-4 w-4" />, delay: 2500 },
      { text: "Establishing secure tunnel...", icon: <Network className="h-4 w-4" />, delay: 2000 },
      { text: "Routing through VPN...", icon: <Server className="h-4 w-4" />, delay: 2200 },
      { text: "Finalizing connection...", icon: <GlobeLock className="h-4 w-4" />, delay: 1500 },
    ];

    const analysisOptions = [
      {
        explanation: "Analysis complete. Based on comprehensive network evaluation, {location} provides optimal connectivity for your region with minimal latency spikes and reliable throughput. The server maintains excellent routing efficiency with direct peering to major networks, ensuring consistent performance during peak hours.",
        benefits: ["Low Latency", "High Reliability", "Cost Effective"],
        score: 92
      },
      {
        explanation: "Network analysis finalized. {location} offers the best balance of speed, stability, and security for your current requirements. Our algorithms detected superior packet delivery rates and minimal jitter, making this location ideal for streaming and data-intensive applications.",
        benefits: ["Optimal Speed", "Network Stability", "Enhanced Security"],
        score: 91
      },
      {
        explanation: "Evaluation complete. After assessing multiple performance factors, {location} emerges as the top choice with superior routing efficiency and consistent performance metrics. The server demonstrates excellent uptime history and efficient bandwidth allocation.",
        benefits: ["Efficient Routing", "Consistent Performance", "Value Optimized"],
        score: 90
      },
      {
        explanation: "Real-time data analysis finalized. {location} maintains excellent uptime with minimal congestion, ideal for uninterrupted VPN sessions. The location provides geographic advantages with multiple redundant connections ensuring maximum availability.",
        benefits: ["Excellent Uptime", "Low Congestion", "Streaming Ready"],
        score: 93
      }
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomAnalysis = analysisOptions[Math.floor(Math.random() * analysisOptions.length)];

    return {
      explanation: randomAnalysis.explanation.replace("{location}", randomLocation),
      benefits: randomAnalysis.benefits,
      score: randomAnalysis.score,
      location: randomLocation,
      reasoningSteps: reasoningSteps
    };
  };

  const streamText = async (text: string) => {
    setIsStreaming(true);
    setStreamingText("");
    
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      setStreamingText(prev => prev + (i === 0 ? "" : " ") + words[i]);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    setIsStreaming(false);
  };

  const handleConnectClick = async () => {
    // Require MetaMask authorization before proceeding
    setShowAuthDialog(true);
    try {
      await connectWallet();
    } catch (e) {
      // Authorization failed, abort connect
      setShowAuthDialog(false);
      return;
    }
    setShowAuthDialog(false);

    // Show simple professional loader in grayscale for ~10.2s
    setIsAIAnalyzing(true);
    setAiAnalysis(null);
    setStreamingText("");

    // Delay to represent secure connection establishment
    await new Promise(resolve => setTimeout(resolve, 10200));

    const analysis = generateAIAnalysis();
    setAiAnalysis(analysis);
    setIsAIAnalyzing(false);

    await streamText(analysis.explanation);

    // Short settle delay then actually connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    onConnect();
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
    <>
      {/* MetaMask authorization requirement dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authorize Wallet</DialogTitle>
            <DialogDescription>
              Please confirm the connection in MetaMask to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting for MetaMask confirmation...
          </div>
        </DialogContent>
      </Dialog>

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
        {session?.isActive && aiAnalysis && (
          <Badge variant="secondary" className="gap-1">
            <span className="text-lg leading-none">📍</span>
            {aiAnalysis.location}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isAIAnalyzing && (
          <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800">
                <GlobeLock className="h-5 w-5 text-gray-600 dark:text-gray-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">Connecting to Network</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Establishing secure connection...
                </p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        {aiAnalysis && !isAIAnalyzing && !session?.isActive && (
          <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800">
                <GlobeLock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Server Selected</h4>
                  <Badge variant="outline" className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Optimal
                  </Badge>
                </div>
                <div className="min-h-[80px]">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {streamingText}
                    {isStreaming && (
                      <span className="inline-block w-1 h-4 ml-0.5 bg-gray-600 dark:bg-gray-400 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiAnalysis.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <Zap className="h-3 w-3" />
                      {benefit}
                    </Badge>
                  ))}
                </div>
                <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting to {aiAnalysis.location}...
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
              data-testid="button-disconnect-vpn"
            >
              <ShieldOff className="h-5 w-5" />
              Disconnect VPN
            </Button>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <GlobeLock className="h-10 w-10 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ready to Connect</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Tap Connect to establish a secure VPN connection
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={handleConnectClick}
              disabled={isConnecting || userBalance <= 0 || isAIAnalyzing}
              data-testid="button-connect-vpn"
            >
              {isAIAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GlobeLock className="h-5 w-5" />
                  Connect VPN
                </>
              )}
            </Button>
            <div className="space-y-1">
              {userBalance <= 0 && (
                <p className="text-xs text-destructive">
                  Deposit USDC to start using VPN
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Secure connection • Real-time encryption • ~10s connection
              </p>
            </div>
          </div>
        )}
      </CardContent>
      </Card>
    </>
  );
}