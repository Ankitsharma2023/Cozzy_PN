import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Signal,
  DollarSign,
  Globe,
  Users,
  TrendingUp,
  CheckCircle,
  Loader2,
  GlobeLock,
} from "lucide-react";
import type { Node } from "@shared/schema";

interface AIReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  allNodes: Node[];
  onConnect?: () => void;
}

interface ReasoningFactor {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  score: number;
}

function generateReasoningFactors(node: Node, allNodes: Node[]): ReasoningFactor[] {
  const avgLatency = allNodes.reduce((sum, n) => sum + n.latency, 0) / allNodes.length;
  const avgRate = allNodes.reduce((sum, n) => sum + n.ratePerMinute, 0) / allNodes.length;
  const avgUptime = allNodes.reduce((sum, n) => sum + n.uptime, 0) / allNodes.length;

  const factors: ReasoningFactor[] = [];

  // Latency factor
  const latencyScore = Math.max(0, 100 - (node.latency - avgLatency) * 2);
  factors.push({
    icon: <Signal className="h-5 w-5 text-blue-500" />,
    title: "Network Latency",
    description: `${node.latency}ms latency - ${latencyScore > 80 ? "Excellent" : latencyScore > 60 ? "Good" : "Fair"} response time`,
    value: `${node.latency}ms`,
    score: latencyScore,
  });

  // Cost efficiency
  const costScore = Math.max(0, 100 - (node.ratePerMinute - avgRate) * 100);
  factors.push({
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    title: "Cost Efficiency",
    description: `${node.ratePerMinute.toFixed(4)} USDC/min - Competitive pricing`,
    value: `$${node.ratePerMinute.toFixed(4)}/min`,
    score: costScore,
  });

  // Server load
  const loadScore = Math.max(0, 100 - node.activeUsers * 5);
  factors.push({
    icon: <Users className="h-5 w-5 text-purple-500" />,
    title: "Server Load",
    description: `${node.activeUsers} active users - Low congestion for better speed`,
    value: `${node.activeUsers} users`,
    score: loadScore,
  });

  // Uptime reliability
  const uptimeScore = node.uptime;
  factors.push({
    icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
    title: "Uptime Reliability",
    description: `${node.uptime.toFixed(1)}% uptime - Highly stable connection`,
    value: `${node.uptime.toFixed(1)}%`,
    score: uptimeScore,
  });

  return factors;
}

function getOverallScore(factors: ReasoningFactor[]): number {
  return factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
}

export function AIReasoningModal({
  isOpen,
  onClose,
  selectedNode,
  allNodes,
  onConnect,
}: AIReasoningModalProps) {
  const [showReasons, setShowReasons] = useState(false);
  const [factors, setFactors] = useState<ReasoningFactor[]>([]);

  useEffect(() => {
    if (isOpen && selectedNode) {
      setShowReasons(false);
      const timer = setTimeout(() => {
        const generatedFactors = generateReasoningFactors(selectedNode, allNodes);
        setFactors(generatedFactors);
        setShowReasons(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedNode, allNodes]);

  if (!selectedNode) return null;

  const overallScore = getOverallScore(factors);
  const nodeEmoji = getFlagEmoji(selectedNode.countryCode);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            🤖 AI Server Selection Analysis
          </DialogTitle>
          <DialogDescription>
            Here's why we're recommending this server for your connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Header */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{nodeEmoji}</span>
              <div>
                <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedNode.location}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {overallScore.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">Match Score</p>
            </div>
          </div>

          {/* Analyzing State */}
          {!showReasons && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzing server metrics & network conditions...
                </p>
              </div>
            </div>
          )}

          {/* Reasoning Factors */}
          {showReasons && (
            <div className="space-y-3">
              {factors.map((factor, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden transition-all animate-in fade-in slide-in-from-left-4"
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {factor.icon}
                          <div>
                            <h4 className="font-medium">{factor.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {factor.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-semibold text-primary">
                          {factor.score.toFixed(0)}/100
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(5, factor.score)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {showReasons && (
            <div className="space-y-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Recommendation</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        This server offers the best balance of speed, cost, and reliability
                        based on current network conditions. You'll get a fast, stable
                        connection with excellent value for your USDC. Click "Connect" to
                        establish your secure session.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {onConnect && (
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => {
                    onConnect();
                    onClose();
                  }}
                >
                  <GlobeLock className="h-5 w-5" />
                  Connect to VPN
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
