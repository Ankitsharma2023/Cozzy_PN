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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Coins, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatUSDC, formatX4PN } from "@/lib/wallet";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usdcBalance: number;
  x4pnBalance: number;
  onWithdraw: (amount: number, token: "usdc" | "x4pn") => Promise<void>;
}

type WithdrawStep = "input" | "withdraw" | "success" | "error";

export function WithdrawModal({
  open,
  onOpenChange,
  usdcBalance,
  x4pnBalance,
  onWithdraw,
}: WithdrawModalProps) {
  const [token, setToken] = useState<"usdc" | "x4pn">("usdc");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<WithdrawStep>("input");
  const [error, setError] = useState<string | null>(null);

  const currentBalance = token === "usdc" ? usdcBalance : x4pnBalance;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > currentBalance) {
      setError("Insufficient balance");
      return;
    }

    try {
      setStep("withdraw");
      await onWithdraw(withdrawAmount, token);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setStep("error");
    }
  };

  const handleClose = () => {
    setAmount("");
    setStep("input");
    setError(null);
    onOpenChange(false);
  };

  const handleMax = () => {
    setAmount(currentBalance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-withdraw">
        <DialogHeader>
          <DialogTitle>Withdraw</DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your wallet
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-6 py-4">
            <Tabs value={token} onValueChange={(v) => setToken(v as "usdc" | "x4pn")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="usdc" className="gap-2" data-testid="tab-usdc">
                  <DollarSign className="h-4 w-4" />
                  USDC
                </TabsTrigger>
                <TabsTrigger value="x4pn" className="gap-2" data-testid="tab-x4pn">
                  <Coins className="h-4 w-4" />
                  X4PN
                </TabsTrigger>
              </TabsList>
              <TabsContent value="usdc" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Available: <span className="font-mono font-medium">{formatUSDC(usdcBalance)}</span>
                </p>
              </TabsContent>
              <TabsContent value="x4pn" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Available: <span className="font-mono font-medium">{formatX4PN(x4pnBalance)} X4PN</span>
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMax}
                  className="h-auto py-1 px-2 text-xs"
                  data-testid="button-max-withdraw"
                >
                  MAX
                </Button>
              </div>
              <div className="relative">
                {token === "usdc" ? (
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 text-lg font-mono"
                  data-testid="input-withdraw-amount"
                />
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

        {step === "withdraw" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Processing Withdrawal...</p>
              <p className="text-sm text-muted-foreground">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-status-online" />
            <div>
              <p className="font-medium">Withdrawal Successful!</p>
              <p className="text-sm text-muted-foreground">
                {token === "usdc"
                  ? formatUSDC(parseFloat(amount))
                  : `${formatX4PN(parseFloat(amount))} X4PN`}{" "}
                has been sent to your wallet
              </p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium">Withdrawal Failed</p>
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
                onClick={handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0}
                data-testid="button-confirm-withdraw"
              >
                Withdraw
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
