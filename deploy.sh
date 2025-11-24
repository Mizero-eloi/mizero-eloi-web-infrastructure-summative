#!/bin/bash

# Deployment script for Developer Job Search Application
# This script helps deploy the application to web servers

set -e  # Exit on error

echo "=========================================="
echo "Developer Job Search - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js (v14 or higher) before proceeding."
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm is installed${NC}"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install --production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file and add your API credentials${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 is not installed. Installing...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 is installed${NC}"
fi

# Stop existing application if running
echo ""
echo "Checking for existing application..."
pm2 stop job-search 2>/dev/null || true
pm2 delete job-search 2>/dev/null || true

# Start the application
echo ""
echo "Starting application..."
pm2 start server.js --name job-search

# Save PM2 configuration
pm2 save

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "==========================================${NC}"
echo ""
echo "Application status:"
pm2 status job-search
echo ""
echo "To view logs: pm2 logs job-search"
echo "To restart: pm2 restart job-search"
echo "To stop: pm2 stop job-search"
echo ""

