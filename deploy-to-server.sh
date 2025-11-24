#!/bin/bash

# Deployment script for Web Servers (Web01 and Web02)
# Usage: ./deploy-to-server.sh <server_ip>
# Example: ./deploy-to-server.sh 44.211.196.180

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <server_ip>"
    echo "Example: $0 44.211.196.180"
    exit 1
fi

SERVER_IP=$1
SERVER_USER="ubuntu"
APP_DIR="/home/ubuntu/apps/developer-job-search"

echo "=========================================="
echo "Deploying to server: $SERVER_IP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env file exists locally
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found locally${NC}"
    echo "Make sure to create .env file on the server manually"
fi

echo "Step 1: Creating application directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p /home/ubuntu/apps"

echo "Step 2: Copying files to server..."
# Create a temporary tar file
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.log' \
    -czf /tmp/app-deploy.tar.gz .

# Copy to server
scp /tmp/app-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Extract on server
ssh $SERVER_USER@$SERVER_IP "cd /home/ubuntu/apps && rm -rf developer-job-search && mkdir -p developer-job-search && cd developer-job-search && tar -xzf /tmp/app-deploy.tar.gz && rm /tmp/app-deploy.tar.gz"

echo "Step 3: Installing dependencies..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && npm install --production"

echo "Step 4: Setting up .env file..."
if [ -f .env ]; then
    echo "Copying .env file..."
    scp .env $SERVER_USER@$SERVER_IP:$APP_DIR/.env
else
    echo -e "${YELLOW}No .env file found. Please create it manually on the server.${NC}"
    echo "SSH to the server and run: nano $APP_DIR/.env"
fi

echo "Step 5: Installing PM2 (if not already installed)..."
ssh $SERVER_USER@$SERVER_IP "command -v pm2 >/dev/null 2>&1 || sudo npm install -g pm2"

echo "Step 6: Starting/Restarting application..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 stop job-search 2>/dev/null || true"
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 delete job-search 2>/dev/null || true"
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 start server.js --name job-search"
ssh $SERVER_USER@$SERVER_IP "pm2 save"

echo "Step 7: Setting up PM2 startup (if not already done)..."
ssh $SERVER_USER@$SERVER_IP "pm2 startup | tail -1 | sudo bash" 2>/dev/null || echo "PM2 startup already configured"

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed!"
echo "==========================================${NC}"
echo ""
echo "Application status:"
ssh $SERVER_USER@$SERVER_IP "pm2 status job-search"
echo ""
echo "To view logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs job-search'"
echo "To test: curl http://$SERVER_IP:3000/health"
echo ""

# Cleanup
rm -f /tmp/app-deploy.tar.gz

