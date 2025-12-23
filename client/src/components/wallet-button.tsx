import { useState } from "react";
import { Wallet, ChevronDown, Copy, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWallet, truncateAddress } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const { toast } = useToast();
  const [showReAuthDialog, setShowReAuthDialog] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleReAuth = async () => {
    try {
      // Re-authorize the wallet
      await connect();
      setShowReAuthDialog(false);
      toast({
        title: "Authorization Successful",
        description: "Your wallet has been re-authorized",
      });
    } catch (error) {
      toast({
        title: "Re-authorization Failed",
        description: error instanceof Error ? error.message : "Failed to re-authorize wallet",
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-wallet-menu">
            <div className="h-2 w-2 rounded-full bg-status-online animate-pulse" />
            <span className="font-mono text-sm">{truncateAddress(address!)}</span>
            <Badge variant="secondary" className="text-xs">Base</Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} data-testid="button-copy-address">
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-view-explorer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowReAuthDialog(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Re-authorize
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={disconnect}
            className="text-destructive"
            data-testid="button-disconnect-wallet"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showReAuthDialog} onOpenChange={setShowReAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-authorize Wallet</DialogTitle>
            <DialogDescription>
              Click below to re-authorize your MetaMask wallet and continue using the VPN service.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReAuthDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReAuth}
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? "Authorizing..." : "Authorize with MetaMask"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
