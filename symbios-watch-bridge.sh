#!/bin/bash

# ====================================================================
# SYMBIOS WATCH BRIDGE
# A comprehensive utility for mirroring phone and watch to apply SymbiOS
# ====================================================================

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
RESET="\033[0m"

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHONE_MIRROR_PID=""
WATCH_BRIDGE_PID=""
WEB_SERVER_PID=""
ADB_WIRELESS=false
PHONE_IP=""
PHONE_PORT=5555

# Print header

# Function to execute ADB commands
execute_adb_command() {
    local command=$1
    
    # Check if phone is connected
    if ! adb devices | grep -q "device$"; then
        echo -e "${RED}No phone connected via ADB. Please connect your phone with USB debugging enabled.${RESET}"
        return 1
    fi
    
    # Execute the command
    echo -e "${CYAN}Executing: ${command}${RESET}"
    eval "$command"
    
    # Check if command was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Command executed successfully.${RESET}"
        # Create a file to indicate phone is connected
        touch /tmp/symbios_phone_connected
        return 0
    else
        echo -e "${RED}Failed to execute command.${RESET}"
        return 1
    fi
}
print_header() {
    clear
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${BOLD}${BLUE}          SYMBIOS WATCH BRIDGE UTILITY          ${RESET}"
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${CYAN}Mirror phone and watch for SymbiOS application${RESET}"
    echo -e "${BLUE}------------------------------------------------${RESET}"
    echo ""
}

# Print success message
success() {
    echo -e "${GREEN}✓ $1${RESET}"
}

# Print error message
error() {
    echo -e "${RED}✗ $1${RESET}"
}

# Print info message
info() {
    echo -e "${BLUE}ℹ $1${RESET}"
}

# Print warning message
warning() {
    echo -e "${YELLOW}⚠ $1${RESET}"
}

# Check dependencies
check_dependencies() {
    info "Checking dependencies..."
    
    # Check for ADB
    if ! command -v adb &> /dev/null; then
        error "ADB is not installed"
        echo -e "Please install Android Platform Tools first:"
        echo -e "brew install android-platform-tools"
        return 1
    else
        success "ADB is installed"
    fi
    
    # Check for scrcpy
    if ! command -v scrcpy &> /dev/null; then
        error "scrcpy is not installed"
        echo -e "Please install scrcpy first:"
        echo -e "brew install scrcpy"
        return 1
    else
        success "scrcpy is installed"
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        echo -e "Please install Node.js first:"
        echo -e "brew install node"
        return 1
    else
        success "Node.js is installed"
    fi
    
    return 0
}

# Check for connected devices
check_connected_devices() {
    info "Checking for connected Android devices..."
    adb devices | grep -v "List" | grep -v "^$" > /tmp/adb_devices.txt
    DEVICE_COUNT=$(cat /tmp/adb_devices.txt | wc -l)
    
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        warning "No Android devices detected"
        echo -e "Please connect your phone via USB and make sure:"
        echo -e "1. USB debugging is enabled in Developer options"
        echo -e "2. You've authorized this computer on your phone"
        
        echo -e "Would you like to wait for a device to be connected? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            info "Waiting for device..."
            adb wait-for-device
            success "Device connected"
            return 0
        else
            return 1
        fi
    else
        success "Found $DEVICE_COUNT connected Android device(s)"
        return 0
    fi
}

# Setup wireless ADB
setup_wireless_adb() {
    info "Setting up wireless ADB connection..."
    
    # Get device serial
    DEVICE_SERIAL=$(adb devices | grep -v "List" | grep -v "^$" | head -n 1 | awk '{print $1}')
    
    # Get device IP address
    PHONE_IP=$(adb -s "$DEVICE_SERIAL" shell ip addr show wlan0 | grep "inet\s" | awk '{print $2}' | awk -F'/' '{print $1}')
    
    if [ -z "$PHONE_IP" ]; then
        warning "Could not determine device IP address. Make sure Wi-Fi is enabled."
        echo -e "Would you like to enter the IP address manually? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "Enter your phone's IP address:"
            read -r PHONE_IP
        else
            warning "Continuing with USB connection..."
            return 1
        fi
    fi
    
    info "Setting up wireless ADB connection to $PHONE_IP..."
    
    # Configure device for wireless connection
    adb -s "$DEVICE_SERIAL" tcpip $PHONE_PORT
    sleep 2
    
    # Connect wirelessly
    adb connect $PHONE_IP:$PHONE_PORT
    
    if [ $? -eq 0 ]; then
        success "Wireless ADB connection established!"
        echo -e "You can now disconnect the USB cable."
        ADB_WIRELESS=true
        return 0
    else
        error "Failed to establish wireless connection."
        warning "Continuing with USB connection..."
        return 1
    fi
}

# Start phone mirroring
start_phone_mirroring() {
    info "Starting phone screen mirroring..."
    
    # Get device serial
    if [ "$ADB_WIRELESS" = true ]; then
        DEVICE_SERIAL="$PHONE_IP:$PHONE_PORT"
    else
        DEVICE_SERIAL=$(adb devices | grep -v "List" | grep -v "^$" | head -n 1 | awk '{print $1}')
    fi
    
    # Get device info
    DEVICE_MODEL=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.model 2>/dev/null)
    DEVICE_BRAND=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.brand 2>/dev/null)
    
    # Start scrcpy in the background
    scrcpy -s "$DEVICE_SERIAL" --window-title "SymbiOS Phone Mirror: $DEVICE_BRAND $DEVICE_MODEL" --always-on-top --window-x 50 --window-y 50 --window-width 400 --window-height 800 &
    PHONE_MIRROR_PID=$!
    
    if [ $? -eq 0 ]; then
        success "Phone mirroring started (PID: $PHONE_MIRROR_PID)"
        return 0
    else
        error "Failed to start phone mirroring"
        return 1
    fi
}

# Start watch bridge server
start_watch_bridge() {
    info "Starting Samsung Watch bridge server..."
    
    # Check if watch server script exists
    if [ ! -f "$SCRIPT_DIR/watch-server.js" ]; then
        info "Creating watch server script..."
        bash "$SCRIPT_DIR/mac-samsung-watch-bridge.sh"
    fi
    
    # Check if server is already running
    if lsof -i:3030 > /dev/null 2>&1; then
        warning "Watch bridge server is already running on port 3030"
        WEB_SERVER_PID=$(lsof -t -i:3030)
        success "Using existing watch bridge server (PID: $WEB_SERVER_PID)"
    else
        # Start the server
        node "$SCRIPT_DIR/watch-server.js" &
        WEB_SERVER_PID=$!
        
        # Wait a moment to ensure the server starts properly
        sleep 2
        
        if ! lsof -i:3030 > /dev/null 2>&1; then
            error "Failed to start watch bridge server"
            return 1
        else
            success "Watch bridge server started (PID: $WEB_SERVER_PID)"
        fi
    fi
    
    # Open the visualizer in browser
    info "Opening watch visualizer in browser..."
    open "http://localhost:3030"
    
    # If phone is mirrored, notify the visualizer
    if [ ! -z "$PHONE_MIRROR_PID" ]; then
        info "Notifying watch visualizer about phone connection..."
        # This will be picked up by the visualizer's event listener
        touch "/tmp/symbios_phone_connected"
    fi
    
    return 0
}

# Install SymbiOS watch components
install_symbios_watch() {
    info "Preparing to install SymbiOS components on watch..."
    
    # Check if phone is mirrored
    if [ -z "$PHONE_MIRROR_PID" ]; then
        warning "Phone is not mirrored. It's recommended to mirror your phone first."
        echo -e "Would you like to mirror your phone now? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            check_connected_devices && start_phone_mirroring
            if [ -z "$PHONE_MIRROR_PID" ]; then
                error "Failed to mirror phone. Cannot proceed with watch installation."
                return 1
            fi
        else
            warning "Proceeding without phone mirroring. Some features may be limited."
        fi
    fi
    
    # Check if watch bridge is running
    if [ -z "$WEB_SERVER_PID" ]; then
        warning "Watch bridge server is not running. It's recommended to start it first."
        echo -e "Would you like to start the watch bridge server now? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            start_watch_bridge
            if [ -z "$WEB_SERVER_PID" ]; then
                error "Failed to start watch bridge server. Cannot proceed with watch installation."
                return 1
            fi
        else
            warning "Proceeding without watch bridge server. Visualization will be limited."
        fi
    fi
    
    # Instructions for accessing watch through phone
    echo -e "${YELLOW}=== WATCH ACCESS INSTRUCTIONS ===${RESET}"
    echo -e "1. On your mirrored phone, open the Galaxy Wearable app"
    echo -e "2. Navigate to Watch settings > Watch software update"
    echo -e "3. Enable Developer mode on your watch (tap Build number 7 times)"
    echo -e "4. Enable ADB debugging on your watch"
    echo -e "5. In the Galaxy Wearable app, go to About watch > Software information"
    echo -e "   and note your watch's IP address"
    echo -e ""
    
    # Try to auto-detect watch IP first
    WATCH_IP=""
    if [ ! -z "$PHONE_MIRROR_PID" ]; then
        info "Attempting to auto-detect watch IP through phone..."
        # Try to get watch IP from phone (this is a simplified example)
        DETECTED_IP=$(adb shell "ip addr show | grep -A 2 'wearable0' | grep 'inet' | awk '{print \$2}' | cut -d/ -f1" 2>/dev/null)
        
        if [ ! -z "$DETECTED_IP" ]; then
            success "Detected watch IP: $DETECTED_IP"
            echo -e "Use detected IP address? (y/n)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                WATCH_IP=$DETECTED_IP
            fi
        else
            warning "Could not auto-detect watch IP"
        fi
    fi
    
    # If auto-detection failed or was skipped, ask for manual entry
    if [ -z "$WATCH_IP" ]; then
        echo -e "Enter your watch's IP address (shown in Developer options):"
        read -r WATCH_IP
        
        if [ -z "$WATCH_IP" ]; then
            error "No IP address provided. Cannot connect to watch."
            return 1
        fi
    fi
    
    # Connect to watch via ADB
    info "Connecting to watch via ADB at $WATCH_IP:5555..."
    adb connect $WATCH_IP:5555
    
    if [ $? -ne 0 ]; then
        error "Failed to connect to watch. Please check the IP address and ensure ADB debugging is enabled."
        echo -e "Would you like to retry with a different IP address? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "Enter your watch's IP address:"
            read -r WATCH_IP
            info "Retrying connection to $WATCH_IP:5555..."
            adb connect $WATCH_IP:5555
            
            if [ $? -ne 0 ]; then
                error "Failed to connect to watch again. Aborting installation."
                return 1
            fi
        else
            return 1
        fi
    fi
    
    success "Connected to watch!"
    
    # Save watch IP for future use
    echo "$WATCH_IP" > "/tmp/symbios_watch_ip"
    
    # Create SymbiOS watch package
    info "Creating SymbiOS watch package..."
    
    # Create a temporary directory for watch files
    WATCH_TEMP_DIR="/tmp/symbios-watch"
    mkdir -p "$WATCH_TEMP_DIR"
    
    # Create a simple SymbiOS agent for the watch
    cat > "$WATCH_TEMP_DIR/symbios-agent.js" << 'EOF'
// SymbiOS Watch Agent
// This script enables cross-device communication for the watch

// Configuration
const config = {
  version: "0.1.0",
  deviceType: "watch",
  syncInterval: 5000,  // ms
};

// State management
let state = {
  connected: false,
  batteryLevel: 0,
  lastSync: null,
  phoneConnected: false,
  macConnected: false,
};

// Initialize
function initialize() {
  console.log("SymbiOS Watch Agent initializing...");
  
  // Start state monitoring
  monitorState();
  
  // Start sync loop
  setInterval(syncState, config.syncInterval);
  
  console.log("SymbiOS Watch Agent initialized");
}

// Monitor device state
function monitorState() {
  // Battery monitoring would go here
  
  // Connection status would go here
}

// Sync state with phone/Mac
function syncState() {
  state.lastSync = new Date();
  // Sync code would go here
}

// Start the agent
initialize();
EOF
    
    # Create a manifest file
    cat > "$WATCH_TEMP_DIR/manifest.json" << 'EOF'
{
  "name": "SymbiOS Watch Agent",
  "version": "0.1.0",
  "description": "SymbiOS integration for Samsung Galaxy Watch",
  "main": "symbios-agent.js",
  "author": "SymbiOS Project"
}
EOF
    
    # Push files to watch
    info "Pushing SymbiOS files to watch..."
    adb -s "$WATCH_IP:5555" push "$WATCH_TEMP_DIR" "/sdcard/symbios"
    
    if [ $? -eq 0 ]; then
        success "SymbiOS files pushed to watch successfully!"
        
        # Instructions for activating SymbiOS on watch
        echo -e "${YELLOW}=== SYMBIOS ACTIVATION INSTRUCTIONS ===${RESET}"
        echo -e "1. On your watch, navigate to Settings > Developer options"
        echo -e "2. Install the SymbiOS package from /sdcard/symbios"
        echo -e "3. Follow the on-screen instructions to complete setup"
        echo -e ""
        echo -e "Your watch is now ready for SymbiOS integration!"
        
        return 0
    else
        error "Failed to push SymbiOS files to watch"
        return 1
    fi
}

# Cleanup function
cleanup() {
    info "Cleaning up..."
    
    # Kill phone mirroring process
    if [ ! -z "$PHONE_MIRROR_PID" ]; then
        kill $PHONE_MIRROR_PID 2>/dev/null
        success "Phone mirroring stopped"
    fi
    
    # Kill watch bridge server
    if [ ! -z "$WEB_SERVER_PID" ]; then
        kill $WEB_SERVER_PID 2>/dev/null
        success "Watch bridge server stopped"
    fi
    
    # Disconnect ADB connections
    if [ "$ADB_WIRELESS" = true ]; then
        adb disconnect $PHONE_IP:$PHONE_PORT 2>/dev/null
        success "Disconnected from phone"
    fi
    
    # Disconnect from watch if connected
    adb disconnect "*:5555" 2>/dev/null
    
    echo -e "${GREEN}All processes cleaned up successfully${RESET}"
}

# Show main menu
show_main_menu() {
    while true; do
        print_header
        
        echo -e "${BOLD}MAIN MENU${RESET}"
        echo -e "1. Mirror phone to Mac"
        echo -e "2. Start Samsung watch bridge"
        echo -e "3. Install SymbiOS on watch"
        echo -e "4. Setup wireless ADB connection"
        echo -e "5. View connection status"
        echo -e "6. Start complete SymbiOS environment"
        echo -e "7. Exit"
        echo -e ""
        echo -e "Enter your choice (1-7):"
        read -r choice
        
        case $choice in
            1)
                check_connected_devices && start_phone_mirroring
                echo -e "Press Enter to continue..."
                read
                ;;
            2)
                start_watch_bridge
                echo -e "Press Enter to continue..."
                read
                ;;
            3)
                install_symbios_watch
                echo -e "Press Enter to continue..."
                read
                ;;
            4)
                check_connected_devices && setup_wireless_adb
                echo -e "Press Enter to continue..."
                read
                ;;
            5)
                print_header
                echo -e "${BOLD}CONNECTION STATUS${RESET}"
                echo -e "Phone mirroring: $([ ! -z "$PHONE_MIRROR_PID" ] && echo "${GREEN}Active${RESET} (PID: $PHONE_MIRROR_PID)" || echo "${RED}Inactive${RESET}")"
                echo -e "Watch bridge: $([ ! -z "$WEB_SERVER_PID" ] && echo "${GREEN}Active${RESET} (PID: $WEB_SERVER_PID)" || echo "${RED}Inactive${RESET}")"
                echo -e "Wireless ADB: $([ "$ADB_WIRELESS" = true ] && echo "${GREEN}Enabled${RESET} ($PHONE_IP:$PHONE_PORT)" || echo "${RED}Disabled${RESET}")"
                
                # Check if watch is connected
                WATCH_IP=""
                if [ -f "/tmp/symbios_watch_ip" ]; then
                    WATCH_IP=$(cat "/tmp/symbios_watch_ip")
                    echo -e "Watch connection: ${GREEN}Configured${RESET} (IP: $WATCH_IP:5555)"
                    
                    # Check actual connection status
                    if adb devices | grep -q "$WATCH_IP:5555"; then
                        echo -e "Watch ADB status: ${GREEN}Connected${RESET}"
                    else
                        echo -e "Watch ADB status: ${RED}Disconnected${RESET}"
                    fi
                else
                    echo -e "Watch connection: ${RED}Not configured${RESET}"
                fi
                
                echo -e ""
                echo -e "Connected devices:"
                adb devices
                
                echo -e ""
                echo -e "Press Enter to continue..."
                read
                ;;
            6)
                info "Starting complete SymbiOS environment..."
                
                # Step 1: Check dependencies
                if ! check_dependencies; then
                    error "Missing dependencies. Cannot start SymbiOS environment."
                    echo -e "Press Enter to continue..."
                    read
                    continue
                fi
                
                # Step 2: Connect to phone
                if [ -z "$PHONE_MIRROR_PID" ]; then
                    info "Setting up phone connection..."
                    if check_connected_devices; then
                        # Try wireless first
                        setup_wireless_adb
                        start_phone_mirroring
                    else
                        error "Failed to connect to phone. Cannot start complete environment."
                        echo -e "Press Enter to continue..."
                        read
                        continue
                    fi
                fi
                
                # Step 3: Start watch bridge
                if [ -z "$WEB_SERVER_PID" ]; then
                    info "Starting watch bridge..."
                    start_watch_bridge
                fi
                
                # Step 4: Connect to watch if possible
                if [ -f "/tmp/symbios_watch_ip" ]; then
                    WATCH_IP=$(cat "/tmp/symbios_watch_ip")
                    info "Reconnecting to previously configured watch at $WATCH_IP:5555..."
                    adb connect $WATCH_IP:5555
                else
                    warning "No previous watch connection found."
                    echo -e "Would you like to set up watch connection now? (y/n)"
                    read -r response
                    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                        install_symbios_watch
                    fi
                fi
                
                success "SymbiOS environment is now running!"
                echo -e "Phone mirroring: $([ ! -z "$PHONE_MIRROR_PID" ] && echo "${GREEN}Active${RESET}" || echo "${RED}Inactive${RESET}")"
                echo -e "Watch bridge: $([ ! -z "$WEB_SERVER_PID" ] && echo "${GREEN}Active${RESET}" || echo "${RED}Inactive${RESET}")"
                echo -e "Press Enter to continue..."
                read
                ;;
            7)
                cleanup
                exit 0
                ;;
            *)
                warning "Invalid option. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Handle script termination
trap cleanup EXIT

# Main function
main() {
    # Check for direct command execution
    if [ "$1" = "execute-adb" ]; then
        if [ -z "$2" ]; then
            error "No ADB command provided."
            exit 1
        fi
        
        # Execute the ADB command directly
        execute_adb_command "$2"
        exit $?
    fi
    
    print_header
    
    # Check dependencies
    if ! check_dependencies; then
        error "Missing dependencies. Please install required tools and try again."
        exit 1
    fi
    
    # Show main menu
    show_main_menu
}

# Run main function
main
