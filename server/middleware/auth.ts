import { Request, Response, NextFunction } from "express";

// Extend Session Data
declare module "express-session" {
    interface SessionData {
        userId: string;
        walletAddress: string;
        authenticatedAt: number;
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Unauthorized. Please log in first." });
    }
    next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    // Example: Check if user is admin (e.g., in a real app, check role in DB)
    // For now, we trust the session ID if it exists, or check specific address
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Example hardcoded admin check
    // if (req.session.walletAddress !== process.env.ADMIN_ADDRESS) {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    next();
}
