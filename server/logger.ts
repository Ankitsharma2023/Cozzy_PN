import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Define custom log format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0 && metadata.service !== 'user-service') { // Filter out default service if needed
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

// Create the logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
    ),
    defaultMeta: { service: 'x4pn-server' },
    transports: [
        new winston.transports.Console()
    ],
});

// Stream for Morgan (HTTP logger)
export const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
