#!/bin/bash

# BrailleBuddy Comprehensive Test Runner
# Runs all automated tests and generates reports

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║        🧪 BrailleBuddy Comprehensive Test Suite 🧪            ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Install Playwright browsers if needed
if [ ! -d "node_modules/@playwright" ]; then
    echo -e "${YELLOW}🎭 Installing Playwright...${NC}"
    npm install --save-dev @playwright/test
    npx playwright install
    echo ""
fi

# Check if server is running
echo -e "${CYAN}🔍 Checking if server is running...${NC}"
if curl -s http://localhost:8000 > /dev/null; then
    echo -e "${GREEN}✓ Server is already running on port 8000${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠ Server not running. Starting server...${NC}"
    python3 -m http.server 8000 > /dev/null 2>&1 &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start
    sleep 2
    
    if curl -s http://localhost:8000 > /dev/null; then
        echo -e "${GREEN}✓ Server started successfully (PID: $SERVER_PID)${NC}"
    else
        echo -e "${RED}❌ Failed to start server${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🚀 Running Playwright Tests${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Run tests
npx playwright test

TEST_EXIT_CODE=$?

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 Generating Test Report${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Generate HTML report
npx playwright show-report --host 127.0.0.1 &
REPORT_PID=$!

echo -e "${GREEN}✓ Test report available at: http://127.0.0.1:9323${NC}"
echo ""

# Stop server if we started it
if [ "$SERVER_RUNNING" = false ]; then
    echo -e "${YELLOW}🛑 Stopping test server (PID: $SERVER_PID)...${NC}"
    kill $SERVER_PID 2>/dev/null
fi

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📋 Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${YELLOW}View the report for details: http://127.0.0.1:9323${NC}"
fi

echo ""
echo -e "${CYAN}Test artifacts saved in:${NC}"
echo -e "  • test-results/        (screenshots, videos, traces)"
echo -e "  • test-results/html/   (HTML report)"
echo -e "  • test-results/results.json (JSON results)"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🎯 Quick Commands${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}npm test${NC}              - Run all tests"
echo -e "  ${GREEN}npm run test:headed${NC}   - Run tests with browser visible"
echo -e "  ${GREEN}npm run test:debug${NC}    - Debug tests interactively"
echo -e "  ${GREEN}npm run test:ui${NC}       - Open Playwright UI mode"
echo -e "  ${GREEN}npm run test:chromium${NC} - Test only in Chrome"
echo -e "  ${GREEN}npm run test:mobile${NC}   - Test mobile browsers"
echo ""

exit $TEST_EXIT_CODE
