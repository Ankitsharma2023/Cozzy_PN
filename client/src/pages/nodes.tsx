import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NodeOperatorForm } from "@/components/node-operator-form";
import { NodeStats } from "@/components/node-stats";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Server, DollarSign, Coins, Users, Wallet } from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";
import type { Node } from "@shared/schema";
import { registerAsNodeOperator } from "@/lib/contracts";
import { ethers } from "ethers";

export default function Nodes() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: nodes = [], isLoading } = useQuery<Node[]>({
    queryKey: ["/api/nodes/operator", address],
    enabled: isConnected && !!address,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      location: string;
      country: string;
      countryCode: string;
      ipAddress: string;
      port: number;
      ratePerMinute: number;
    }) => {
      // 1. Register as Operator on Blockchain
      if (!window.ethereum) throw new Error("Wallet not connected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      try {
        const tx = await registerAsNodeOperator(signer);
        await tx.wait();

        toast({
          title: "Blockchain Registration",
          description: "Successfully registered as operator on-chain.",
        });
      } catch (error: any) {
        // If already registered, we might want to proceed or warn
        if (!error.message.includes("Already registered")) {
          console.error("Blockchain registration failed:", error);
        }
      }

      // 2. Register Node in Backend Database
      await apiRequest("POST", "/api/nodes/register", {
        ...data,
        operatorAddress: address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/operator", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      setActiveTab("overview");
      toast({
        title: "Node Registered",
        description: "Your VPN node is now active and ready to serve users",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleNodeMutation = useMutation({
    mutationFn: async ({ nodeId, active }: { nodeId: string; active: boolean }) => {
      await apiRequest("PATCH", `/api/nodes/${nodeId}`, { isActive: active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes/operator", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
    },
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
            Connect your wallet to register and manage VPN nodes
          </p>
        </div>
      </div>
    );
  }

  const totalNodes = nodes.length;
  const activeNodes = nodes.filter((n) => n.isActive).length;
  const totalEarningsUsdc = nodes.reduce((sum, n) => sum + (n.totalEarnedUsdc || 0), 0);
  const totalEarningsX4pn = nodes.reduce((sum, n) => sum + (n.totalEarnedX4pn || 0), 0);
  const totalActiveUsers = nodes.reduce((sum, n) => sum + (n.activeUsers || 0), 0);

  return (
    <div className="p-6 space-y-8" data-testid="page-nodes">
      <div>
        <h1 className="text-3xl font-bold">Node Operator</h1>
        <p className="text-muted-foreground">
          Run VPN nodes and earn USDC + X4PN rewards
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Your Nodes"
          value={`${activeNodes}/${totalNodes}`}
          subtitle="active"
          icon={Server}
          iconGradient="from-chart-1/20 to-chart-1/5"
          testId="stat-your-nodes"
        />
        <StatCard
          title="Total USDC Earned"
          value={formatUSDC(totalEarningsUsdc)}
          icon={DollarSign}
          iconGradient="from-chart-2/20 to-chart-2/5"
          testId="stat-usdc-earned"
        />
        <StatCard
          title="Total X4PN Earned"
          value={formatX4PN(totalEarningsX4pn)}
          icon={Coins}
          iconGradient="from-chart-3/20 to-chart-3/5"
          testId="stat-x4pn-earned"
        />
        <StatCard
          title="Active Users"
          value={totalActiveUsers.toString()}
          subtitle="currently connected"
          icon={Users}
          iconGradient="from-chart-4/20 to-chart-4/5"
          testId="stat-active-users"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="register" data-testid="tab-register">
            Register Node
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <NodeStats
            nodes={nodes}
            isLoading={isLoading}
            onToggleNode={(nodeId, active) =>
              toggleNodeMutation.mutate({ nodeId, active })
            }
          />
        </TabsContent>
        <TabsContent value="register" className="mt-6">
          <NodeOperatorForm
            onSubmit={registerMutation.mutateAsync}
            isSubmitting={registerMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
