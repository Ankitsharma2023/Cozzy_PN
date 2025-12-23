import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatUSDC } from "@/lib/wallet";
import { useWallet } from "@/lib/wallet";
import { ethers } from "ethers";

interface DepositModalBlockchainProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onDeposit: (amount: number) => Promise<void>;
}

type DepositStep = "input" | "approve" | "deposit" | "success" | "error";

export function DepositModalBlockchain({
  open,
  onOpenChange,
  currentBalance,
  onDeposit,
}: DepositModalBlockchainProps) {
  const { address, isConnected } = useWallet();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("input");
  const [error, setError] = useState<string | null>(null);

  const presetAmounts = [5, 10, 25, 50];

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setStep("approve");
      // In a real implementation, this would interact with the blockchain
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setStep("deposit");
      await onDeposit(depositAmount);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      setStep("error");
    }
  };

  const handleClose = () => {
    setAmount("");
    setStep("input");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC (Blockchain)</DialogTitle>
          <DialogDescription>
            Add USDC to your X4PN balance to use VPN services directly through the blockchain
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 text-lg font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ${preset}
                </Button>
              ))}
            </div>

            <div className="p-3 rounded-md bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-mono font-medium">
                  {formatUSDC(currentBalance)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">After Deposit</span>
                <span className="font-mono font-medium text-status-online">
                  {formatUSDC(currentBalance + (parseFloat(amount) || 0))}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        )}

        {(step === "approve" || step === "deposit") && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {step === "approve" ? "Approving USDC..." : "Depositing..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {step === "approve"
                  ? "Please confirm the approval in your wallet"
                  : "Processing your deposit transaction"}
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-status-online" />
            <div>
              <p className="font-medium">Deposit Successful!</p>
              <p className="text-sm text-muted-foreground">
                {formatUSDC(parseFloat(amount))} has been added to your balance
              </p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium">Deposit Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "input" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Deposit {amount && formatUSDC(parseFloat(amount))}
              </Button>
            </>
          )}
          {(step === "success" || step === "error") && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}