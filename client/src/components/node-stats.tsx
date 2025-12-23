import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Server,
  Users,
  Activity,
  DollarSign,
  Coins,
  Power,
  Settings,
} from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { Node } from "@shared/schema";

interface NodeStatsProps {
  nodes: Node[];
  isLoading?: boolean;
  onToggleNode?: (nodeId: string, active: boolean) => void;
  onConfigureNode?: (nodeId: string) => void;
}

export function NodeStats({
  nodes,
  isLoading,
  onToggleNode,
  onConfigureNode,
}: NodeStatsProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-node-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Your Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card data-testid="card-node-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Your Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Server className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No nodes registered</p>
            <p className="text-sm text-muted-foreground">
              Register a node to start earning
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarningsUsdc = nodes.reduce((sum, n) => sum + n.totalEarnedUsdc, 0);
  const totalEarningsX4pn = nodes.reduce((sum, n) => sum + n.totalEarnedX4pn, 0);
  const totalActiveUsers = nodes.reduce((sum, n) => sum + n.activeUsers, 0);

  return (
    <Card data-testid="card-node-stats">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Your Nodes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Total USDC
            </div>
            <p className="text-xl font-bold font-mono">
              {formatUSDC(totalEarningsUsdc)}
            </p>
          </div>
          <div className="p-4 rounded-md bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              Total X4PN
            </div>
            <p className="text-xl font-bold font-mono">
              {formatX4PN(totalEarningsX4pn)}
            </p>
          </div>
          <div className="p-4 rounded-md bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Active Users
            </div>
            <p className="text-xl font-bold font-mono">{totalActiveUsers}</p>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Uptime
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Users
                  </div>
                </TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.id} data-testid={`row-node-${node.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFlagEmoji(node.countryCode)}</span>
                      <div>
                        <p className="font-medium">{node.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {node.location}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {node.isActive ? (
                      <Badge
                        variant="secondary"
                        className="bg-status-online/10 text-status-online border-0 gap-1"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-status-online" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Offline
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {node.uptime.toFixed(1)}%
                  </TableCell>
                  <TableCell className="font-mono">{node.activeUsers}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-mono text-sm">
                        {formatUSDC(node.totalEarnedUsdc)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        +{formatX4PN(node.totalEarnedX4pn)} X4PN
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleNode?.(node.id, !node.isActive)}
                        data-testid={`button-toggle-node-${node.id}`}
                      >
                        <Power
                          className={`h-4 w-4 ${
                            node.isActive ? "text-status-online" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onConfigureNode?.(node.id)}
                        data-testid={`button-configure-node-${node.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
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
