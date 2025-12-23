import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, DollarSign, Coins, Server } from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { Session } from "@shared/schema";

interface SessionHistoryProps {
  sessions: Session[];
  isLoading?: boolean;
}

export function SessionHistory({ sessions, isLoading }: SessionHistoryProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="secondary" className="bg-status-online/10 text-status-online border-0 gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-status-online animate-pulse" />
          Active
        </Badge>
      );
    }
    if (status === "completed") {
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Completed
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0">
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card data-testid="card-session-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card data-testid="card-session-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Connect to a VPN server to start your first session
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-session-history">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    Server
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Cost
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Earned
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(session.startedAt)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatDuration(session.totalDuration)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.nodeId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatUSDC(session.totalCost)}
                  </TableCell>
                  <TableCell className="font-mono text-status-online">
                    +{formatX4PN(session.x4pnEarned)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(session.status, session.isActive)}
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
