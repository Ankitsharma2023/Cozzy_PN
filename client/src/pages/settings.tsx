import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { useWallet, switchToBase, BASE_MAINNET_CHAIN_ID } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  Wallet,
  ExternalLink,
} from "lucide-react";

export default function Settings() {
  const { theme } = useTheme();
  const { address, isConnected, chainId } = useWallet();
  const { toast } = useToast();

  const handleSwitchNetwork = async () => {
    try {
      await switchToBase();
      toast({
        title: "Network Switched",
        description: "Connected to Base Mainnet",
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Please try again or add the network manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-settings">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and wallet connection
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet & Network
            </CardTitle>
            <CardDescription>
              Manage your wallet connection and blockchain network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Wallet</p>
                {isConnected ? (
                  <code className="text-sm text-muted-foreground font-mono">
                    {address}
                  </code>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
              {isConnected && (
                <Badge variant="secondary" className="bg-status-online/10 text-status-online border-0">
                  Connected
                </Badge>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Network</p>
                <p className="text-sm text-muted-foreground">
                  {chainId === BASE_MAINNET_CHAIN_ID
                    ? "Base Mainnet"
                    : "Unknown Network"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchNetwork}
                data-testid="button-switch-network"
              >
                <Globe className="h-4 w-4 mr-2" />
                Switch to Base
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-alerts">Session Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when balance is low
                </p>
              </div>
              <Switch id="session-alerts" defaultChecked data-testid="switch-session-alerts" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tx-notifications">Transaction Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for deposits and withdrawals
                </p>
              </div>
              <Switch id="tx-notifications" defaultChecked data-testid="switch-tx-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-disconnect">Auto Disconnect</Label>
                <p className="text-sm text-muted-foreground">
                  Disconnect VPN when balance reaches zero
                </p>
              </div>
              <Switch id="auto-disconnect" defaultChecked data-testid="switch-auto-disconnect" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tx-signing">Confirm Transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Always prompt before signing transactions
                </p>
              </div>
              <Switch id="tx-signing" defaultChecked data-testid="switch-tx-signing" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
