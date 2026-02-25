#!/bin/bash
# Easy deployment script for BrailleBuddy to Galaxy S25+

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}       BrailleBuddy Easy Deployment Tool          ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Step 1: Make sure USB debugging is enabled
echo -e "${YELLOW}STEP 1: Enable USB debugging on your Galaxy S25+${NC}"
echo "1. Go to Settings > About Phone"
echo "2. Tap 'Software information'"
echo "3. Tap 'Build number' 7 times to enable Developer options"
echo "4. Go back to Settings > Developer options"
echo "5. Enable 'USB debugging'"
echo -e "${GREEN}When done, press Enter to continue...${NC}"
read -p ""

# Step 2: Connect via USB and authorize
echo -e "${YELLOW}STEP 2: Connect your Galaxy S25+ via USB-C${NC}"
echo "1. Connect your phone to your Mac with a USB-C cable"
echo "2. On your phone, you should see a popup asking to allow USB debugging"
echo "3. Check 'Always allow from this computer' and tap 'Allow'"
echo -e "${GREEN}When done, press Enter to continue...${NC}"
read -p ""

# Step 3: Check connection
echo -e "${YELLOW}STEP 3: Checking connection to your Galaxy S25+${NC}"
adb devices

# Check if device is connected
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}No device detected. Let's try to restart ADB:${NC}"
    adb kill-server
    sleep 2
    adb start-server
    sleep 2
    echo "Checking for devices again:"
    adb devices
    
    DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l)
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        echo -e "${RED}Still no device detected. Please try:${NC}"
        echo "1. Disconnect and reconnect your USB cable"
        echo "2. Make sure USB debugging is enabled"
        echo "3. Check if you need to authorize the computer on your phone"
        echo "4. Try a different USB port or cable"
        echo -e "${YELLOW}After trying these steps, run this script again.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Device connected successfully!${NC}"

# Step 4: Set up port forwarding for web access
echo -e "${YELLOW}STEP 4: Setting up port forwarding...${NC}"
adb reverse tcp:3000 tcp:3000
echo -e "${GREEN}Port forwarding set up successfully!${NC}"

# Step 5: Start the web server
echo -e "${YELLOW}STEP 5: Starting the BrailleBuddy web server...${NC}"
echo "This will run in the background. Press Ctrl+C when you want to stop it."

# Start the server
(cd "$(dirname "$0")" && npm run dev:api) &
SERVER_PID=$!

# Step 6: Instructions for accessing on phone
echo -e "${GREEN}STEP 6: Access BrailleBuddy on your Galaxy S25+${NC}"
echo "1. Open Chrome on your Galaxy S25+"
echo "2. Go to this address: ${BLUE}http://localhost:3000${NC}"
echo "3. You should now see the BrailleBuddy application!"
echo ""
echo -e "${YELLOW}The app is now running! Keep this terminal window open.${NC}"
echo -e "${YELLOW}Press Ctrl+C when you want to stop the server.${NC}"

# Wait for user to press Ctrl+C
trap "kill $SERVER_PID; echo -e '${GREEN}Server stopped.${NC}'; exit 0" INT
wait
