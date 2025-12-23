import "dotenv/config";
import { startWorker } from "./server/worker";

// Run worker
startWorker();

// Keep process alive
process.on('SIGTERM', () => {
    process.exit(0);
});
