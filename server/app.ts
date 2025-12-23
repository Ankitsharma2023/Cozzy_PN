import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { registerRoutes } from "./routes.ts";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { logger, stream } from "./logger";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import { setupSocketServer } from "./socket";
import { register, httpRequestDurationMicroseconds } from "./metrics";

export async function createApp(options?: { disableStatic?: boolean }) {
    const app = express();
    const httpServer = createServer(app);

    if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
        app.use((_req, res) => {
            res.status(500).send(`
                <h1>Configuration Error</h1>
                <p><strong>DATABASE_URL</strong> is not set in your environment variables.</p>
                <p>The application cannot connect to the database. Please configure it in your Vercel project settings.</p>
            `);
        });
        return { app, httpServer };
    }

    // Optional Redis Client (dev can run without Redis)
    const useRedis = !!process.env.REDIS_URL && process.env.NODE_ENV !== "test";
    const redisClient = useRedis
        ? createClient({ url: process.env.REDIS_URL as string })
        : undefined;

    if (redisClient) {
        // Don't crash if redis fails in dev/test, but log it
        redisClient.connect().catch((err) => {
            logger.error(`Redis connection error: ${err}`);
        });
    }

    // Security Middleware
    app.use(helmet({
        contentSecurityPolicy: false,
    }));

    app.use(cors({
        origin: process.env.NODE_ENV === "production" ? false : "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));

    // Rate Limiting
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
        // Skip rate limiting in test environment
        skip: () => process.env.NODE_ENV === "test"
    });

    app.use("/api/", apiLimiter);

    // Logging
    if (process.env.NODE_ENV !== "test") {
        app.use(morgan("combined", { stream }));
    }

    // Metrics Middleware
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            httpRequestDurationMicroseconds
                .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
                .observe(duration / 1000);
        });
        next();
    });

    // Metrics Endpoint
    app.get('/metrics', async (_req, res) => {
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    });

    app.use(
        express.json({
            verify: (req: any, _res, buf) => {
                req.rawBody = buf;
            },
        }),
    );

    app.use(express.urlencoded({ extended: false }));

    // Session (fallback to in-memory store if Redis disabled)
    app.use(
        session({
            store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
            secret: process.env.SESSION_SECRET || "dev_secret_key_123",
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            }
        })
    );

    setupAuth(app);
    await registerRoutes(httpServer, app);

    const io = setupSocketServer(httpServer);
    app.set("io", io);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        if (process.env.NODE_ENV !== "test") {
            logger.error(err);
        }
    });

    if (process.env.NODE_ENV === "production" && !options?.disableStatic) {
        serveStatic(app);
    } else if (process.env.NODE_ENV !== "test") {
        // Only setup Vite in dev, not test or prod
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
    }

    return { app, httpServer };
}
