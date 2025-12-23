import { pgTable, text, varchar, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  usdcBalance: real("usdc_balance").notNull().default(0),
  x4pnBalance: real("x4pn_balance").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  totalEarnedX4pn: real("total_earned_x4pn").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorAddress: text("operator_address").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  ipAddress: text("ip_address").notNull(),
  port: integer("port").notNull().default(51820),
  ratePerMinute: real("rate_per_minute").notNull().default(0.001),
  isActive: boolean("is_active").notNull().default(true),
  totalEarnedUsdc: real("total_earned_usdc").notNull().default(0),
  totalEarnedX4pn: real("total_earned_x4pn").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  uptime: real("uptime").notNull().default(100),
  latency: integer("latency").notNull().default(50),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: integer("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  nodeId: varchar("node_id").notNull(),
  userAddress: text("user_address").notNull(),
  nodeAddress: text("node_address").notNull(),
  ratePerSecond: real("rate_per_second").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  lastSettledAt: timestamp("last_settled_at").notNull().defaultNow(),
  totalCost: real("total_cost").notNull().default(0),
  totalDuration: integer("total_duration").notNull().default(0),
  x4pnEarned: real("x4pn_earned").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("active"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  token: text("token").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodes.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const startSessionRequestSchema = z.object({
  nodeId: z.string(),
  userAddress: z.string(),
});

export const settleSessionRequestSchema = z.object({
  sessionId: z.string(),
  chainSessionId: z.number().optional(),
  totalCost: z.number().optional(),
  totalDuration: z.number().optional(),
  signature: z.string().optional(),
});

export const depositRequestSchema = z.object({
  userAddress: z.string(),
  amount: z.number().positive(),
});

export const withdrawRequestSchema = z.object({
  userAddress: z.string(),
  amount: z.number().positive(),
  token: z.enum(["usdc", "x4pn"]),
});

export const registerNodeRequestSchema = z.object({
  operatorAddress: z.string(),
  name: z.string(),
  location: z.string(),
  country: z.string(),
  countryCode: z.string(),
  ipAddress: z.string(),
  port: z.number().default(51820),
  ratePerMinute: z.number().positive(),
});

export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
export type SettleSessionRequest = z.infer<typeof settleSessionRequestSchema>;
export type DepositRequest = z.infer<typeof depositRequestSchema>;
export type WithdrawRequest = z.infer<typeof withdrawRequestSchema>;
export type RegisterNodeRequest = z.infer<typeof registerNodeRequestSchema>;
