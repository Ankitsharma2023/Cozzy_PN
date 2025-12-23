FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wireguard-tools \
    iptables \
    iproute2 \
    openresolv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Environment variables for WireGuard
ENV WG_INTERFACE=wg0
ENV WG_PORT=51820

# This container needs NET_ADMIN capability to work
CMD ["npm", "start"]
