#!/bin/bash
# BrailleBuddy Mobile Deployment Script
# This script helps deploy the BrailleBuddy application to your Galaxy S25+

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}       BrailleBuddy Mobile Deployment Tool        ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}Deploying BrailleBuddy to your Galaxy S25+${NC}"
echo -e "${BLUE}--------------------------------------------------${NC}"
echo ""

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: ADB is not installed.${NC}"
    echo -e "Please run the mac-android-bridge.sh script first to set up ADB."
    exit 1
fi

# Check if the device is connected
echo -e "${YELLOW}Checking for connected devices...${NC}"
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}No devices found. Please connect your Galaxy S25+ and enable USB debugging.${NC}"
    exit 1
else
    echo -e "${GREEN}Device found! Proceeding with deployment.${NC}"
fi

# Deployment options
echo ""
echo -e "${BLUE}Choose a deployment option:${NC}"
echo "1. Deploy as a web app (using local server)"
echo "2. Deploy to Termux (run as a Node.js app)"
echo "3. Deploy to Android web browser (using ngrok)"
echo "4. Exit"
echo ""

read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        # Option 1: Deploy as a web app using local server
        echo -e "${YELLOW}Starting local server...${NC}"
        
        # Get local IP address
        IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
        
        # Start server in background
        echo -e "${YELLOW}Starting server on $IP_ADDRESS:3000${NC}"
        (cd "$(dirname "$0")" && npm run dev:api) &
        SERVER_PID=$!
        
        # Forward port from device to computer
        echo -e "${YELLOW}Setting up port forwarding...${NC}"
        adb reverse tcp:3000 tcp:3000
        
        echo -e "${GREEN}Server started! Access BrailleBuddy on your Galaxy S25+ by:${NC}"
        echo -e "1. Opening Chrome on your phone"
        echo -e "2. Navigating to: ${BLUE}http://localhost:3000${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C when you want to stop the server.${NC}"
        
        # Wait for user to press Ctrl+C
        trap "kill $SERVER_PID; echo -e '${GREEN}Server stopped.${NC}'; exit 0" INT
        wait
        ;;
        
    2)
        # Option 2: Deploy to Termux
        echo -e "${YELLOW}Preparing to deploy to Termux...${NC}"
        
        # Check if Termux is installed
        TERMUX_CHECK=$(adb shell pm list packages | grep com.termux)
        if [ -z "$TERMUX_CHECK" ]; then
            echo -e "${RED}Termux is not installed on your device.${NC}"
            echo -e "Please install Termux from F-Droid first."
            exit 1
        fi
        
        # Create app directory in Termux
        echo -e "${YELLOW}Creating app directory in Termux...${NC}"
        adb shell "su -c 'mkdir -p /data/data/com.termux/files/home/braille-buddy'"
        
        # Push the application files
        echo -e "${YELLOW}Copying application files to Termux...${NC}"
        adb push dist/ /data/data/com.termux/files/home/braille-buddy/
        adb push src/ /data/data/com.termux/files/home/braille-buddy/
        adb push package.json /data/data/com.termux/files/home/braille-buddy/
        
        # Create Termux setup script
        echo -e "${YELLOW}Creating setup script in Termux...${NC}"
        cat > termux-setup.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/braille-buddy
pkg update -y
pkg install -y nodejs
npm install
echo "Setup complete! Run 'cd ~/braille-buddy && npm start' to start the application."
EOF
        
        # Push and execute setup script
        adb push termux-setup.sh /data/data/com.termux/files/home/
        adb shell "chmod +x /data/data/com.termux/files/home/termux-setup.sh"
        
        echo -e "${GREEN}Deployment to Termux complete!${NC}"
        echo -e "To finish setup and run the application:"
        echo -e "1. Open Termux on your Galaxy S25+"
        echo -e "2. Run: ${BLUE}./termux-setup.sh${NC}"
        echo -e "3. After setup completes, run: ${BLUE}cd ~/braille-buddy && npm start${NC}"
        
        # Clean up
        rm termux-setup.sh
        ;;
        
    3)
        # Option 3: Deploy using ngrok
        echo -e "${YELLOW}Deploying using ngrok...${NC}"
        
        # Check if ngrok is installed
        if ! command -v ngrok &> /dev/null; then
            echo -e "${RED}Error: ngrok is not installed.${NC}"
            echo -e "Installing ngrok..."
            npm install -g ngrok
        fi
        
        # Start the server in background
        echo -e "${YELLOW}Starting server...${NC}"
        (cd "$(dirname "$0")" && npm run dev:api) &
        SERVER_PID=$!
        
        # Start ngrok
        echo -e "${YELLOW}Starting ngrok tunnel...${NC}"
        NGROK_URL=$(ngrok http 3000 --log=stdout | grep -o 'https://.*\.ngrok\.io' | head -n 1)
        
        echo -e "${GREEN}Server accessible via ngrok!${NC}"
        echo -e "Access BrailleBuddy on your Galaxy S25+ by:"
        echo -e "1. Opening Chrome on your phone"
        echo -e "2. Navigating to: ${BLUE}$NGROK_URL${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C when you want to stop the server.${NC}"
        
        # Wait for user to press Ctrl+C
        trap "kill $SERVER_PID; echo -e '${GREEN}Server and ngrok stopped.${NC}'; exit 0" INT
        wait
        ;;
        
    4)
        # Exit
        echo -e "${BLUE}Exiting deployment tool.${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid option. Please run the script again and select a valid option.${NC}"
        exit 1
        ;;
esac
