import {
  type User,
  type InsertUser,
  type Node,
  type InsertNode,
  type Session,
  type InsertSession,
  type Transaction,
  type InsertTransaction,
  users,
  nodes,
  sessions,
  transactions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(
    walletAddress: string,
    usdcDelta: number,
    x4pnDelta: number,
    spentDelta?: number,
    earnedX4pnDelta?: number
  ): Promise<User | undefined>;

  // Nodes
  getNode(id: string): Promise<Node | undefined>;
  getAllNodes(): Promise<Node[]>;
  getActiveNodes(): Promise<Node[]>;
  getNodesByOperator(operatorAddress: string): Promise<Node[]>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: string, updates: Partial<Node>): Promise<Node | undefined>;
  updateNodeEarnings(
    id: string,
    usdcEarned: number,
    x4pnEarned: number
  ): Promise<Node | undefined>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getSessionsByUser(userAddress: string): Promise<Session[]>;
  getActiveSessionByUser(userAddress: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  endSession(id: string): Promise<Session | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Stats
  getNextSessionId(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.walletAddress}) = lower(${walletAddress})`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(
    walletAddress: string,
    usdcDelta: number,
    x4pnDelta: number,
    spentDelta: number = 0,
    earnedX4pnDelta: number = 0
  ): Promise<User | undefined> {
    const user = await this.getUserByWalletAddress(walletAddress);
    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        usdcBalance: sql`${users.usdcBalance} + ${usdcDelta}`,
        x4pnBalance: sql`${users.x4pnBalance} + ${x4pnDelta}`,
        totalSpent: sql`${users.totalSpent} + ${spentDelta}`,
        totalEarnedX4pn: sql`${users.totalEarnedX4pn} + ${earnedX4pnDelta}`,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  // Nodes
  async getNode(id: string): Promise<Node | undefined> {
    const [node] = await db.select().from(nodes).where(eq(nodes.id, id));
    return node;
  }

  async getAllNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getActiveNodes(): Promise<Node[]> {
    return await db.select().from(nodes).where(eq(nodes.isActive, true));
  }

  async getNodesByOperator(operatorAddress: string): Promise<Node[]> {
    return await db
      .select()
      .from(nodes)
      .where(sql`lower(${nodes.operatorAddress}) = lower(${operatorAddress})`);
  }

  async createNode(insertNode: InsertNode): Promise<Node> {
    const [node] = await db.insert(nodes).values(insertNode).returning();
    return node;
  }

  async updateNode(id: string, updates: Partial<Node>): Promise<Node | undefined> {
    const [updatedNode] = await db
      .update(nodes)
      .set(updates)
      .where(eq(nodes.id, id))
      .returning();
    return updatedNode;
  }

  async updateNodeEarnings(
    id: string,
    usdcEarned: number,
    x4pnEarned: number
  ): Promise<Node | undefined> {
    const [node] = await db
      .update(nodes)
      .set({
        totalEarnedUsdc: sql`${nodes.totalEarnedUsdc} + ${usdcEarned}`,
        totalEarnedX4pn: sql`${nodes.totalEarnedX4pn} + ${x4pnEarned}`,
      })
      .where(eq(nodes.id, id))
      .returning();
    return node;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getSessionsByUser(userAddress: string): Promise<Session[]> {
    return await db
      .select()
      .from(sessions)
      .where(sql`lower(${sessions.userAddress}) = lower(${userAddress})`)
      .orderBy(desc(sessions.startedAt));
  }

  async getActiveSessionByUser(userAddress: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          sql`lower(${sessions.userAddress}) = lower(${userAddress})`,
          eq(sessions.isActive, true)
        )
      );
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();

    // Update node active users
    await db
      .update(nodes)
      .set({ activeUsers: sql`${nodes.activeUsers} + 1` })
      .where(eq(nodes.id, insertSession.nodeId));

    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async endSession(id: string): Promise<Session | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;

    const [endedSession] = await db
      .update(sessions)
      .set({
        isActive: false,
        status: "ended",
        endedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();

    // Decrement node active users
    if (session.nodeId) {
      await db
        .update(nodes)
        .set({ activeUsers: sql`${nodes.activeUsers} - 1` })
        .where(eq(nodes.id, session.nodeId));
    }

    return endedSession;
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(insertTransaction).returning();
    return tx;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | undefined> {
    const [tx] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return tx;
  }

  // Stats
  async getNextSessionId(): Promise<number> {
    const result = await db.execute(sql`SELECT MAX(session_id) as max_id FROM sessions`);
    const maxId = result.rows[0].max_id as number;
    return (maxId || 0) + 1;
  }
}

export const storage = new DatabaseStorage();
