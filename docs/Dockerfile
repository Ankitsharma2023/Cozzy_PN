FROM node:20-slim AS base

# Install OpenSSL for Prisma/Drizzle if needed
RUN apt-get update -y && apt-get install -y openssl

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
