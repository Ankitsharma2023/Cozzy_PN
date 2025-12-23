import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Signal, Users, Zap } from "lucide-react";
import { formatUSDC } from "@/lib/wallet";
import type { Node } from "@shared/schema";

interface ServerCardProps {
  node: Node;
  isSelected: boolean;
  onSelect: () => void;
}

export function ServerCard({ node, isSelected, onSelect }: ServerCardProps) {
  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-status-online";
    if (latency < 100) return "text-status-away";
    return "text-status-busy";
  };

  const getLatencyLabel = (latency: number) => {
    if (latency < 50) return "Excellent";
    if (latency < 100) return "Good";
    return "Fair";
  };

  return (
    <Card
      className={`overflow-visible transition-all cursor-pointer hover-elevate ${
        isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : ""
      }`}
      onClick={onSelect}
      data-testid={`card-server-${node.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFlagEmoji(node.countryCode)}</span>
            <div>
              <h3 className="font-medium">{node.name}</h3>
              <p className="text-sm text-muted-foreground">{node.location}</p>
            </div>
          </div>
          {node.isActive ? (
            <Badge variant="secondary" className="bg-status-online/10 text-status-online border-0">
              Online
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-status-offline/10 text-status-offline border-0">
              Offline
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Signal className={`h-3 w-3 ${getLatencyColor(node.latency)}`} />
            <span className="text-muted-foreground">{node.latency}ms</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{node.activeUsers}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className={`text-xs ${getLatencyColor(node.latency)}`}>
              {getLatencyLabel(node.latency)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="font-mono font-medium">
              {formatUSDC(node.ratePerMinute)}/min
            </p>
          </div>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            disabled={!node.isActive}
            data-testid={`button-select-server-${node.id}`}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
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
