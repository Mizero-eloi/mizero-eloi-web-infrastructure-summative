#!/bin/bash

# Quick Test Script for Developer Job Search Application
# This script performs basic tests to verify the application is working

set -e

echo "=========================================="
echo "Developer Job Search - Quick Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file with your API credentials"
    echo "Run: cp .env.example .env"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Test 1: API Configuration
echo "Test 1: API Configuration"
echo "-------------------------"
node test-api.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API configuration test passed${NC}"
else
    echo -e "${RED}✗ API configuration test failed${NC}"
    exit 1
fi
echo ""

# Test 2: Start server in background
echo "Test 2: Starting server..."
echo "-------------------------"
node server.js &
SERVER_PID=$!
sleep 3

# Check if server started
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi
echo ""

# Test 3: Health endpoint
echo "Test 3: Health Endpoint"
echo "-------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ Health endpoint working${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health endpoint failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Test 4: Job Search Endpoint
echo "Test 4: Job Search Endpoint"
echo "-------------------------"
SEARCH_RESPONSE=$(curl -s "http://localhost:3000/api/jobs/search?q=developer&location=us&page=1")
if echo "$SEARCH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Job search endpoint working${NC}"
    JOB_COUNT=$(echo "$SEARCH_RESPONSE" | grep -o '"totalResults":[0-9]*' | grep -o '[0-9]*' || echo "0")
    echo "Jobs found: $JOB_COUNT"
else
    echo -e "${RED}✗ Job search endpoint failed${NC}"
    echo "Response: $SEARCH_RESPONSE"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Test 5: Frontend files
echo "Test 5: Frontend Files"
echo "-------------------------"
if [ -f "public/index.html" ] && [ -f "public/app.js" ] && [ -f "public/styles.css" ]; then
    echo -e "${GREEN}✓ All frontend files present${NC}"
else
    echo -e "${RED}✗ Missing frontend files${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Test 6: Static file serving
echo "Test 6: Static File Serving"
echo "-------------------------"
HTML_RESPONSE=$(curl -s http://localhost:3000/ | head -1)
if echo "$HTML_RESPONSE" | grep -q "DOCTYPE"; then
    echo -e "${GREEN}✓ Static files served correctly${NC}"
else
    echo -e "${RED}✗ Static file serving failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Cleanup
echo "Stopping test server..."
kill $SERVER_PID 2>/dev/null || true
sleep 1

echo ""
echo -e "${GREEN}=========================================="
echo "All Tests Passed! ✓"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the server: npm start"
echo "2. Open browser: http://localhost:3000"
echo "3. Test the UI manually"
echo "4. Review TESTING.md for comprehensive testing guide"
echo ""

