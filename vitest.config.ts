import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['server/tests/**/*.test.ts'],
        environment: 'node',
        globals: true,
    },
    resolve: {
        alias: {
            "@shared": path.resolve(process.cwd(), "shared"),
        }
    }
});
