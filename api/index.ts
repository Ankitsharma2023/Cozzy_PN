import type { IncomingMessage, ServerResponse } from "http";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    console.log("[API] Handler invoked");
    try {
        if (!app) {
            console.log("[API] Initializing app...");
            // Use dynamic import to catch top-level errors in server modules
            const { createApp } = await import("../server/app");
            const result = await createApp({ disableStatic: true });
            app = result.app;
            console.log("[API] App initialized successfully");
        }
        app(req, res);
    } catch (error: any) {
        console.error("[API] Critical startup error:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end(`Critical Startup Error:\n${error.message}\n\nStack:\n${error.stack}`);
    }
}
