import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { ethers } from "ethers";
import { requireAuth } from "./middleware/auth";
import {
  startSessionRequestSchema,
  settleSessionRequestSchema,
  depositRequestSchema,
  withdrawRequestSchema,
  registerNodeRequestSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // User endpoints (Protected)
  app.get("/api/users/:address", requireAuth, async (req, res) => {
    try {
      const { address } = req.params;

      // Authorization Check
      if (req.session.walletAddress?.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden. You can only view your own profile." });
      }

      let user = await storage.getUserByWalletAddress(address);

      if (!user) {
        // Should have been created at login, but just in case
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Deposit endpoint (Protected)
  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const parsed = depositRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { userAddress, amount } = parsed.data;

      // Auth Check
      if (req.session.walletAddress?.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      let user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUserBalance(userAddress, amount, 0);

      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "deposit",
        amount,
        token: "usdc",
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: "completed",
      });

      res.json({ user: updatedUser, transaction });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Withdraw endpoint (Protected)
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const parsed = withdrawRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { userAddress, amount, token } = parsed.data;

      // Auth Check
      if (req.session.walletAddress?.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const balance = token === "usdc" ? user.usdcBalance : user.x4pnBalance;
      if (balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const usdcDelta = token === "usdc" ? -amount : 0;
      const x4pnDelta = token === "x4pn" ? -amount : 0;
      const updatedUser = await storage.updateUserBalance(userAddress, usdcDelta, x4pnDelta);

      const transaction = await storage.createTransaction({
        userId: user.id,
        type: "withdrawal",
        amount,
        token,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        status: "completed",
      });

      res.json({ user: updatedUser, transaction });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Node endpoints (Public Read, Protected Write)
  app.get("/api/nodes", async (req, res) => {
    try {
      const nodes = await storage.getActiveNodes();
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      res.status(500).json({ error: "Failed to fetch nodes" });
    }
  });

  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      console.error("Error fetching node:", error);
      res.status(500).json({ error: "Failed to fetch node" });
    }
  });

  app.get("/api/nodes/operator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const nodes = await storage.getNodesByOperator(address);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching operator nodes:", error);
      res.status(500).json({ error: "Failed to fetch operator nodes" });
    }
  });

  app.post("/api/nodes/register", requireAuth, async (req, res) => {
    try {
      const parsed = registerNodeRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      // Ensure operator address matches logged in user
      if (parsed.data.operatorAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Operator address must match logged in user" });
      }

      const node = await storage.createNode({
        ...parsed.data,
        isActive: true,
        totalEarnedUsdc: 0,
        totalEarnedX4pn: 0,
        activeUsers: 0,
        uptime: 100,
        latency: 50,
      });

      res.json(node);
    } catch (error) {
      console.error("Error registering node:", error);
      res.status(500).json({ error: "Failed to register node" });
    }
  });

  app.patch("/api/nodes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingNode = await storage.getNode(id);
      if (!existingNode) return res.status(404).json({ error: "Node not found" });

      if (existingNode.operatorAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const node = await storage.updateNode(id, updates);
      res.json(node);
    } catch (error) {
      console.error("Error updating node:", error);
      res.status(500).json({ error: "Failed to update node" });
    }
  });

  // Session endpoints (Protected)
  app.get("/api/sessions/:address", requireAuth, async (req, res) => {
    try {
      const { address } = req.params;
      if (address.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const sessions = await storage.getSessionsByUser(address);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active/:address", requireAuth, async (req, res) => {
    try {
      const { address } = req.params;
      if (address.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const session = await storage.getActiveSessionByUser(address);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.post("/api/sessions/start", requireAuth, async (req, res) => {
    try {
      const parsed = startSessionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { nodeId, userAddress } = parsed.data;

      // Auth Check
      if (userAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if user has active session
      const existingSession = await storage.getActiveSessionByUser(userAddress);
      if (existingSession) {
        return res.status(400).json({ error: "User already has an active session" });
      }

      // Get node info
      const node = await storage.getNode(nodeId);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }

      if (!node.isActive) {
        return res.status(400).json({ error: "Node is not active" });
      }

      // Get or create user
      let user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        // Should exist via login
        return res.status(404).json({ error: "User not found" });
      }

      if (user.usdcBalance <= 0) {
        return res.status(400).json({ error: "Insufficient USDC balance" });
      }

      const sessionId = await storage.getNextSessionId();
      const ratePerSecond = node.ratePerMinute / 60;

      const session = await storage.createSession({
        sessionId,
        userId: user.id,
        nodeId: node.id,
        userAddress: user.walletAddress,
        nodeAddress: node.operatorAddress,
        ratePerSecond,
        startedAt: new Date(),
        lastSettledAt: new Date(),
        totalCost: 0,
        totalDuration: 0,
        x4pnEarned: 0,
        isActive: true,
        status: "active",
      });

      // Emit event to Node Daemon via Socket.IO
      const io = app.get("io");
      if (io) {
        io.to(`node:${node.id}`).emit("session:start", {
          sessionId: session.id,
          userAddress: user.walletAddress,
          nodeId: node.id
        });
        console.log(`[API] Emitted session:start to node:${node.id}`);
      } else {
        console.warn("[API] Socket.IO instance not found");
      }

      res.json(session);
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/sessions/settle", requireAuth, async (req, res) => {
    try {
      const parsed = settleSessionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { sessionId, signature, totalCost: signedTotalCost, totalDuration: signedTotalDuration } = parsed.data;

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.userAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (!session.isActive) {
        return res.status(400).json({ error: "Session is not active" });
      }

      // Calculate elapsed time server-side for security
      const now = new Date();
      const lastSettled = new Date(session.lastSettledAt);
      const timeElapsed = Math.max(0, Math.floor((now.getTime() - lastSettled.getTime()) / 1000));

      if (timeElapsed <= 0 && !signature) {
        return res.status(400).json({ error: "Nothing to settle yet" });
      }

      // Get user to check balance
      const user = await storage.getUserByWalletAddress(session.userAddress);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate cost and cap to available balance
      let cost = session.ratePerSecond * timeElapsed;
      if (cost > user.usdcBalance) {
        cost = Math.max(0, user.usdcBalance);
      }

      // Signature Verification (x402)
      if (signature && signedTotalCost !== undefined && signedTotalDuration !== undefined) {
        try {
          const CONTRACT_ADDRESS = process.env.VPN_SESSIONS_ADDRESS || "0x0000000000000000000000000000000000000000"; // Mock if not set
          const messageHash = ethers.solidityPackedKeccak256(
            ["uint256", "uint256", "uint256", "address"],
            [session.sessionId, signedTotalCost, signedTotalDuration, CONTRACT_ADDRESS]
          );
          const messageBytes = ethers.getBytes(messageHash);
          const recoveredAddress = ethers.verifyMessage(messageBytes, signature);

          if (recoveredAddress.toLowerCase() !== session.userAddress.toLowerCase()) {
            return res.status(400).json({ error: "Invalid payment signature" });
          }

          console.log(`[Settlement] Verified valid signature for session ${session.sessionId}`);
        } catch (e) {
          console.error("Signature verification failed", e);
          return res.status(400).json({ error: "Signature verification failed" });
        }
      }

      if (cost <= 0) {
        return res.status(400).json({ error: "Insufficient balance for settlement" });
      }

      const x4pnReward = cost * 10;
      const actualTimeElapsed = Math.floor(cost / session.ratePerSecond);

      // Update user balance
      await storage.updateUserBalance(
        session.userAddress,
        -cost,
        x4pnReward,
        cost,
        x4pnReward
      );

      // Update node earnings
      await storage.updateNodeEarnings(session.nodeId, cost, x4pnReward);

      // Update session
      const updatedSession = await storage.updateSession(sessionId, {
        totalCost: session.totalCost + cost,
        totalDuration: session.totalDuration + actualTimeElapsed,
        x4pnEarned: session.x4pnEarned + x4pnReward,
        lastSettledAt: now,
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error settling session:", error);
      res.status(500).json({ error: "Failed to settle session" });
    }
  });

  app.post("/api/sessions/end", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      const sessionToCheck = await storage.getSession(sessionId);
      if (!sessionToCheck) return res.status(404).json({ error: "Not Found" });

      if (sessionToCheck.userAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }


      const session = await storage.endSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Transaction endpoints
  app.get("/api/transactions/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;

      // Since userId is internal ID, we need to check if it belongs to logged in user.
      const user = await storage.getUser(userId);
      if (!user || user.walletAddress.toLowerCase() !== req.session.walletAddress?.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Stats endpoint (Public)
  app.get("/api/stats", async (req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      const totalNodes = nodes.length;
      const activeNodes = nodes.filter((n) => n.isActive).length;
      const totalUsers = nodes.reduce((sum, n) => sum + n.activeUsers, 0);
      const avgLatency =
        nodes.length > 0
          ? Math.round(nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length)
          : 0;

      res.json({
        totalNodes,
        activeNodes,
        totalUsers,
        avgLatency,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
