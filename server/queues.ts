import { Queue, QueueEvents } from 'bullmq';
import { logger } from './logger';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const blockchainQueue = new Queue('blockchain-events', { connection });
export const emailQueue = new Queue('email-notifications', { connection });

const queueEvents = new QueueEvents('blockchain-events', { connection });

queueEvents.on('completed', ({ jobId }) => {
    logger.info(`Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed: ${failedReason}`);
});
