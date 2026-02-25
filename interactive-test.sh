#!/bin/bash

# Interactive Testing Menu for BrailleBuddy

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"

# Function to check if server is running
check_server() {
    if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
        return 0
    else
        return 1
    fi
}

# Function to start server
start_server() {
    echo -e "${YELLOW}Starting server on port 8000...${NC}"
    python3 -m http.server 8000 > /dev/null 2>&1 &
    sleep 2
    if check_server; then
        echo -e "${GREEN}✓ Server started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start server${NC}"
    fi
}

# Function to stop server
stop_server() {
    echo -e "${YELLOW}Stopping server...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Server stopped${NC}"
}

# Function to display menu
show_menu() {
    clear
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║   BrailleBuddy Interactive Test Menu      ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check server status
    if check_server; then
        echo -e "${GREEN}● Server Status: RUNNING${NC} (http://localhost:8000)"
    else
        echo -e "${RED}● Server Status: STOPPED${NC}"
    fi
    echo ""
    
    echo -e "${BOLD}${BLUE}Server Management:${NC}"
    echo -e "  ${CYAN}1)${NC} Start Server"
    echo -e "  ${CYAN}2)${NC} Stop Server"
    echo -e "  ${CYAN}3)${NC} Restart Server"
    echo -e "  ${CYAN}4)${NC} Check Server Status"
    echo ""
    
    echo -e "${BOLD}${BLUE}Quick Tests:${NC}"
    echo -e "  ${CYAN}5)${NC} Run Automated Tests"
    echo -e "  ${CYAN}6)${NC} Open Main Application"
    echo -e "  ${CYAN}7)${NC} Open All Demo Pages"
    echo ""
    
    echo -e "${BOLD}${BLUE}Individual Pages:${NC}"
    echo -e "  ${CYAN}8)${NC}  Main App (index.html)"
    echo -e "  ${CYAN}9)${NC}  BBID Recognition Demo"
    echo -e "  ${CYAN}10)${NC} BrailleCore Demo"
    echo -e "  ${CYAN}11)${NC} Haptic Test Page"
    echo -e "  ${CYAN}12)${NC} Compression Demo"
    echo ""
    
    echo -e "${BOLD}${BLUE}Documentation:${NC}"
    echo -e "  ${CYAN}13)${NC} View Test Summary"
    echo -e "  ${CYAN}14)${NC} View Quick Test Guide"
    echo -e "  ${CYAN}15)${NC} View Testing Checklist"
    echo ""
    
    echo -e "${BOLD}${BLUE}Utilities:${NC}"
    echo -e "  ${CYAN}16)${NC} Check for Console Errors (requires browser)"
    echo -e "  ${CYAN}17)${NC} View Server Logs"
    echo -e "  ${CYAN}18)${NC} Clear Browser Cache"
    echo ""
    
    echo -e "  ${CYAN}0)${NC}  Exit"
    echo ""
    echo -ne "${BOLD}Select an option: ${NC}"
}

# Main loop
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            if check_server; then
                echo -e "${YELLOW}Server is already running${NC}"
            else
                start_server
            fi
            read -p "Press Enter to continue..."
            ;;
        2)
            stop_server
            read -p "Press Enter to continue..."
            ;;
        3)
            stop_server
            sleep 1
            start_server
            read -p "Press Enter to continue..."
            ;;
        4)
            echo ""
            if check_server; then
                echo -e "${GREEN}✓ Server is running on port 8000${NC}"
                echo -e "  URL: ${BLUE}$BASE_URL${NC}"
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
                echo -e "  HTTP Status: ${GREEN}$HTTP_CODE${NC}"
            else
                echo -e "${RED}✗ Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        5)
            echo ""
            ./test-runner.sh
            read -p "Press Enter to continue..."
            ;;
        6)
            if check_server; then
                echo -e "${GREEN}Opening main application...${NC}"
                open $BASE_URL
            else
                echo -e "${RED}Server is not running. Start it first (option 1)${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        7)
            if check_server; then
                echo -e "${GREEN}Opening all demo pages...${NC}"
                ./test-all-pages.sh
            else
                echo -e "${RED}Server is not running. Start it first (option 1)${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        8)
            if check_server; then
                open "$BASE_URL/index.html"
                echo -e "${GREEN}✓ Opened main application${NC}"
            else
                echo -e "${RED}Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        9)
            if check_server; then
                open "$BASE_URL/bbid-recognition.html"
                echo -e "${GREEN}✓ Opened BBID Recognition Demo${NC}"
            else
                echo -e "${RED}Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        10)
            if check_server; then
                open "$BASE_URL/braille-core-demo.html"
                echo -e "${GREEN}✓ Opened BrailleCore Demo${NC}"
            else
                echo -e "${RED}Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        11)
            if check_server; then
                open "$BASE_URL/haptic-test.html"
                echo -e "${GREEN}✓ Opened Haptic Test Page${NC}"
            else
                echo -e "${RED}Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        12)
            if check_server; then
                open "$BASE_URL/compression-demo.html"
                echo -e "${GREEN}✓ Opened Compression Demo${NC}"
            else
                echo -e "${RED}Server is not running${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        13)
            if [ -f "TEST_SUMMARY.md" ]; then
                less TEST_SUMMARY.md
            else
                echo -e "${RED}TEST_SUMMARY.md not found${NC}"
            fi
            ;;
        14)
            if [ -f "QUICK_TEST_GUIDE.md" ]; then
                less QUICK_TEST_GUIDE.md
            else
                echo -e "${RED}QUICK_TEST_GUIDE.md not found${NC}"
            fi
            ;;
        15)
            if [ -f "TESTING_CHECKLIST.md" ]; then
                less TESTING_CHECKLIST.md
            else
                echo -e "${RED}TESTING_CHECKLIST.md not found${NC}"
            fi
            ;;
        16)
            echo ""
            echo -e "${YELLOW}To check for console errors:${NC}"
            echo "1. Open the application in your browser"
            echo "2. Press F12 (or Cmd+Option+I on Mac)"
            echo "3. Click on the 'Console' tab"
            echo "4. Look for red error messages"
            echo ""
            echo -e "${BLUE}Common errors to look for:${NC}"
            echo "  - 404 errors (missing files)"
            echo "  - JavaScript errors (syntax or runtime)"
            echo "  - CORS errors (cross-origin issues)"
            echo "  - Network errors (failed requests)"
            read -p "Press Enter to continue..."
            ;;
        17)
            echo ""
            echo -e "${YELLOW}Server logs:${NC}"
            echo "If the server is running in the background, logs are suppressed."
            echo "To see logs, start the server manually:"
            echo -e "${CYAN}python3 -m http.server 8000${NC}"
            read -p "Press Enter to continue..."
            ;;
        18)
            echo ""
            echo -e "${YELLOW}To clear browser cache:${NC}"
            echo ""
            echo -e "${BOLD}Chrome/Edge:${NC}"
            echo "  1. Press Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)"
            echo "  2. Select 'Cached images and files'"
            echo "  3. Click 'Clear data'"
            echo ""
            echo -e "${BOLD}Firefox:${NC}"
            echo "  1. Press Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)"
            echo "  2. Select 'Cache'"
            echo "  3. Click 'Clear Now'"
            echo ""
            echo -e "${BOLD}Safari:${NC}"
            echo "  1. Press Cmd+Option+E"
            echo "  2. Or: Safari > Clear History > All History"
            echo ""
            echo -e "${BOLD}Quick method (any browser):${NC}"
            echo "  Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) for hard refresh"
            read -p "Press Enter to continue..."
            ;;
        0)
            echo ""
            echo -e "${YELLOW}Do you want to stop the server before exiting? (y/n)${NC}"
            read stop_choice
            if [[ $stop_choice =~ ^[Yy]$ ]]; then
                stop_server
            fi
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            read -p "Press Enter to continue..."
            ;;
    esac
done
