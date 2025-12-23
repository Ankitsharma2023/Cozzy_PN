import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ServerCard } from "@/components/server-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Search, Filter, Loader2, Wallet } from "lucide-react";
import type { Node, Session } from "@shared/schema";

export default function Connect() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ["/api/nodes"],
  });

  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["/api/sessions/active", address],
    enabled: isConnected && !!address,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNodeId) throw new Error("Select a server first");
      await apiRequest("POST", "/api/sessions/start", {
        nodeId: selectedNodeId,
        userAddress: address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active", address] });
      toast({
        title: "VPN Connected",
        description: "Your secure connection is now active",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regions = Array.from(new Set(nodes.map((n) => n.country)));

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion =
      regionFilter === "all" || node.country === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.latency - b.latency;
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
            Connect your wallet to browse available VPN servers
          </p>
        </div>
      </div>
    );
  }

  if (activeSession?.isActive) {
    const connectedNode = nodes.find((n) => n.id === activeSession.nodeId);
    return (
      <div className="p-6 space-y-6" data-testid="page-connect">
        <div>
          <h1 className="text-3xl font-bold">Already Connected</h1>
          <p className="text-muted-foreground">
            You have an active VPN session
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-20 h-20 rounded-full bg-status-online/10 flex items-center justify-center">
              <Shield className="h-10 w-10 text-status-online" />
            </div>
            <h2 className="text-2xl font-bold">VPN Active</h2>
            {connectedNode && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">
                  {getFlagEmoji(connectedNode.countryCode)}
                </span>
                <span className="text-lg">{connectedNode.name}</span>
              </div>
            )}
            <p className="text-muted-foreground">
              Go to Dashboard to manage your session
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-connect">
      <div>
        <h1 className="text-3xl font-bold">Connect to VPN</h1>
        <p className="text-muted-foreground">
          Select a server to establish a secure connection
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-servers"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-region">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{sortedNodes.length} servers</Badge>
        <span>
          {sortedNodes.filter((n) => n.isActive).length} online
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : sortedNodes.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No servers found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNodes.map((node) => (
            <ServerCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => setSelectedNodeId(node.id)}
            />
          ))}
        </div>
      )}

      {selectedNodeId && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {(() => {
                const selectedNode = nodes.find((n) => n.id === selectedNodeId);
                if (!selectedNode) return null;
                return (
                  <>
                    <span className="text-2xl">
                      {getFlagEmoji(selectedNode.countryCode)}
                    </span>
                    <div>
                      <p className="font-medium">{selectedNode.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.location}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              data-testid="button-connect-selected"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
