import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('Health Check', () => {
    let app: any;

    beforeAll(async () => {
        // Set environment variables before importing app
        process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
        process.env.SESSION_SECRET = "test_secret";
        process.env.REDIS_URL = "redis://localhost:6379";
        process.env.NODE_ENV = "test";

        const { createApp } = await import('../app');
        const created = await createApp();
        app = created.app;
    });

    it('should return 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});
