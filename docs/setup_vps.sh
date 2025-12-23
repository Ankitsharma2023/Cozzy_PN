#!/bin/bash

# Cozzy_PN Production Setup Script
# Works on Ubuntu 20.04/22.04 LTS

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   Cozzy_PN VPN - Production Installer ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check for Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run as root (sudo ./setup_vps.sh)${NC}"
  exit 1
fi

# 1. System Updates & Dependencies
echo -e "\n${GREEN}[1/5] Updating System...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl git apt-transport-https ca-certificates gnupg lsb-release

# 2. Install WireGuard (Host Modules)
echo -e "\n${GREEN}[2/5] Installing WireGuard Modules...${NC}"
if ! lsmod | grep -q wireguard; then
    apt-get install -y wireguard wireguard-tools
    echo -e "WireGuard installed."
else
    echo -e "WireGuard modules already present."
fi

# 3. Install Docker
echo -e "\n${GREEN}[3/5] Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

# 4. Configuration
echo -e "\n${GREEN}[4/5] Configuration${NC}"
echo "Select Deployment Role:"
echo "1) Full Stack (Platform + Node) - For Master Server"
echo "2) Node Only - For VPN Gateway Servers"
read -p "Enter 1 or 2: " choice

if [ "$choice" == "1" ]; then
    ROLE="full"
else
    ROLE="node"
fi

# Create .env if missing
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}WARNING: Using default .env credentials. Please edit .env after installation!${NC}"
fi

# 5. Deployment
echo -e "\n${GREEN}[5/5] Deploying...${NC}"

if [ "$ROLE" == "full" ]; then
    echo "Starting Full Stack..."
    # Ensure database migrations are run if needed, but handled by app startup generally
    docker compose -f docker-compose.prod.yml up -d --build
    
    echo -e "\n${GREEN}Deployment Complete!${NC}"
    echo "Platform is running on ports 80/443 (via Nginx)"
    echo "NOTE: Ensure DNS records point to this server."

elif [ "$ROLE" == "node" ]; then
    echo "Starting VPN Node Daemon..."
    read -p "Enter Platform URL (e.g., https://api.yourvpn.com): " PLATFORM_URL
    read -p "Enter Node ID (unique identifier): " NODE_ID
    read -p "Enter Node Private Key (hex, or press Enter to generate): " USER_KEY

    if [ -z "$USER_KEY" ]; then
        NODE_PRIVATE_KEY="0x$(openssl rand -hex 32)"
        echo -e "${YELLOW}Generated New Private Key:${NC} $NODE_PRIVATE_KEY"
        echo "SAVE THIS KEY! It is your identity wallet."
    else
        NODE_PRIVATE_KEY=$USER_KEY
    fi
    
    export PLATFORM_URL=${PLATFORM_URL:-http://localhost:5000}
    export NODE_ID=${NODE_ID:-$(hostname)}
    export NODE_PRIVATE_KEY=$NODE_PRIVATE_KEY
    
    docker compose -f docker-compose.node.yml up -d --build
    
    echo -e "\n${GREEN}Node Deployment Complete!${NC}"
    echo "Node '$NODE_ID' is connecting to $PLATFORM_URL"
    echo "Check logs with: docker logs -f x4pn-node"
fi

echo -e "\n${BLUE} Setup Finished. ${NC}"
