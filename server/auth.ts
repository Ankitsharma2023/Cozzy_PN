import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { ethers } from "ethers";
import { logger } from "./logger";
import { z } from "zod";

const loginSchema = z.object({
    address: z.string().min(1, "Address is required"),
    signature: z.string().min(1, "Signature is required")
});

// Simple in-memory nonces for now. In prod, use Redis or DB with expiry.
const LoginNonces = new Map<string, string>();

export function setupAuth(app: Express) {

    // 1. Get Nonce (Challenge)
    app.get("/api/auth/nonce/:address", (req: Request, res: Response) => {
        const { address } = req.params;
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: "Invalid address" });
        }

        // Generate random nonce
        const nonce = `Sign this message to login to Cozzy_PN: ${Math.floor(Math.random() * 1000000)}`;
        LoginNonces.set(address.toLowerCase(), nonce);

        res.json({ nonce });
    });

    // 2. Verify Signature & Login
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        try {
            const result = loginSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ error: result.error.errors[0].message });
            }

            const { address, signature } = result.data;

            const storedNonce = LoginNonces.get(address.toLowerCase());
            if (!storedNonce) {
                return res.status(400).json({ error: "Nonce not found. Request valid nonce first." });
            }

            // Verify
            const recoveredAddress = ethers.verifyMessage(storedNonce, signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                return res.status(401).json({ error: "Invalid signature" });
            }

            // Cleanup nonce
            LoginNonces.delete(address.toLowerCase());

            // Get or Create User
            let user = await storage.getUserByWalletAddress(address);
            if (!user) {
                user = await storage.createUser({
                    walletAddress: address,
                    usdcBalance: 100, // Mock initial balance
                    x4pnBalance: 500, // Mock initial balance
                    totalSpent: 0,
                    totalEarnedX4pn: 0
                });
            }

            // Set Session
            req.session.userId = user.id;
            req.session.walletAddress = user.walletAddress;
            req.session.authenticatedAt = Date.now();

            // Save session explicitly (some stores require this)
            req.session.save((err) => {
                if (err) {
                    logger.error(`Session save error: ${err}`);
                    return res.status(500).json({ error: "Failed to create session" });
                }
                res.json({ message: "Logged in successfully", user });
            });

        } catch (error) {
            logger.error(`Login error: ${error}`);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // 3. Logout
    app.post("/api/auth/logout", (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to logout" });
            }
            res.json({ message: "Logged out" });
        });
    });

    // 4. Current User
    app.get("/api/auth/me", async (req: Request, res: Response) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const user = await storage.getUser(req.session.userId);
        res.json(user);
    });
}
