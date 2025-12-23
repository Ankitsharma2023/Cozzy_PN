import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

// Use a fallback connection string to prevent startup crashes if variable is missing
// This allows the app to boot and show a helpful error message instead of crashing immediately
const connectionString = process.env.DATABASE_URL || "postgres://unknown:unknown@localhost:5432/unknown";

// Enable SSL for managed Postgres providers (e.g., Supabase) where TLS is required
const needsSsl =
  /supabase\.co/.test(connectionString) ||
  /render\.com/.test(connectionString) ||
  /amazonaws\.com/.test(connectionString) ||
  process.env.PG_SSL === "true";

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
