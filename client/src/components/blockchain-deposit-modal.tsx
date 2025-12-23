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
import { DollarSign, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { formatUSDC } from "@/lib/wallet";
import { useWallet } from "@/lib/wallet";
import { ethers } from "ethers";
import {
  depositUSDC,
  approveUSDC,
  getUserBalance
} from "@/lib/contracts";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

interface BlockchainDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onDepositSuccess?: (amount: number) => void;
}

type DepositStep = "input" | "approve" | "deposit" | "confirming" | "success" | "error";

export function BlockchainDepositModal({
  open,
  onOpenChange,
  currentBalance,
  onDepositSuccess,
}: BlockchainDepositModalProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const presetAmounts = [5, 10, 25, 50];

  const handleDeposit = async () => {
    if (!address || !window.ethereum) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      // Initialize provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Convert amount to USDC decimals (6)
      const amountInWei = ethers.parseUnits(depositAmount.toString(), 6);

      setStep("approve");

      // Approve USDC spending with enhanced error handling
      const approveTx = await approveUSDC(CONTRACT_ADDRESSES.VPN_SESSIONS, amountInWei, signer);
      await approveTx.wait();

      setStep("deposit");

      // Deposit USDC to VPN contract with enhanced error handling
      const tx = await depositUSDC(amountInWei, signer);
      setTxHash(tx.hash);

      setStep("confirming");

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        setStep("success");
        if (onDepositSuccess) {
          onDepositSuccess(depositAmount);
        }
        toast({
          title: "Deposit Successful",
          description: `${formatUSDC(depositAmount)} has been added to your VPN balance`,
        });
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err: any) {
      console.error("Deposit error:", err);
      setError(err.reason || err.message || "Deposit failed. Please try again or check your wallet settings.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setAmount("");
    setStep("input");
    setError(null);
    setTxHash(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-blockchain-deposit">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
          <DialogDescription>
            Add USDC to your X4PN balance to use VPN services
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
                  data-testid="input-deposit-amount"
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
                  data-testid={`button-preset-${preset}`}
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

        {(step === "approve" || step === "deposit" || step === "confirming") && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {step === "approve"
                  ? "Approving USDC..."
                  : step === "deposit"
                    ? "Depositing..."
                    : "Confirming Transaction..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {step === "approve"
                  ? "Please confirm the approval in your wallet"
                  : step === "deposit"
                    ? "Processing your deposit transaction"
                    : "Waiting for blockchain confirmation"}
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
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
              )}
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
                disabled={!amount || parseFloat(amount) <= 0 || !address}
                data-testid="button-confirm-deposit"
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