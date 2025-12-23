import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useWallet } from "@/lib/wallet";

import Dashboard from "@/pages/dashboard";
import Connect from "@/pages/connect";
import Sessions from "@/pages/sessions";
import Earnings from "@/pages/earnings";
import Nodes from "@/pages/nodes";
import Contracts from "@/pages/contracts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import BlockchainDashboard from "@/pages/blockchain-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/blockchain" component={BlockchainDashboard} />
      <Route path="/connect" component={Connect} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { checkSession } = useWallet();

  useEffect(() => {
    checkSession();
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="x4pn-theme">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <header className="flex h-14 items-center justify-between gap-4 border-b px-4 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
