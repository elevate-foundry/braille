#!/bin/bash

# ====================================================================
# MAC-SAMSUNG WATCH BRIDGE
# A utility for connecting Samsung watches to Mac and visualizing data
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
SERVER_PORT=3030
BLUETOOTH_ENABLED=false
NODE_INSTALLED=false
BREW_INSTALLED=false

# Print header
print_header() {
    clear
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${BOLD}${BLUE}          MAC-SAMSUNG WATCH BRIDGE             ${RESET}"
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${CYAN}Connect and visualize your Samsung watch on Mac${RESET}"
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

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if Homebrew is installed
check_brew() {
    if command_exists brew; then
        BREW_INSTALLED=true
        success "Homebrew is installed"
    else
        warning "Homebrew is not installed"
        echo -e "Would you like to install Homebrew? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            if [ $? -eq 0 ]; then
                success "Homebrew installed successfully"
                BREW_INSTALLED=true
            else
                error "Failed to install Homebrew"
                exit 1
            fi
        else
            warning "Skipping Homebrew installation"
        fi
    fi
}

# Check if Node.js is installed
check_node() {
    if command_exists node; then
        NODE_INSTALLED=true
        NODE_VERSION=$(node -v)
        success "Node.js is installed (${NODE_VERSION})"
    else
        warning "Node.js is not installed"
        if [ "$BREW_INSTALLED" = true ]; then
            echo -e "Would you like to install Node.js? (y/n)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                info "Installing Node.js..."
                brew install node
                if [ $? -eq 0 ]; then
                    success "Node.js installed successfully"
                    NODE_INSTALLED=true
                else
                    error "Failed to install Node.js"
                fi
            else
                warning "Skipping Node.js installation"
            fi
        else
            warning "Homebrew is required to install Node.js"
        fi
    fi
}

# Check Bluetooth status
check_bluetooth() {
    info "Checking Bluetooth status..."
    
    # Check if Bluetooth is enabled using macOS system_profiler
    if system_profiler SPBluetoothDataType | grep -q "State: On"; then
        BLUETOOTH_ENABLED=true
        success "Bluetooth is enabled"
    else
        warning "Bluetooth appears to be disabled"
        echo -e "Please enable Bluetooth in System Preferences or Control Center"
        echo -e "Would you like to open Bluetooth preferences? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            open "x-apple.systempreferences:com.apple.preference.bluetooth"
        fi
    fi
}

# Create a simple Express server to serve the visualization page
create_express_server() {
    if [ ! -f "$SCRIPT_DIR/watch-server.js" ]; then
        info "Creating Express server for watch visualization..."
        
        cat > "$SCRIPT_DIR/watch-server.js" << 'EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the Samsung Watch Visualizer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'samsung-watch-visualizer.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Samsung Watch Visualizer server running at http://localhost:${PORT}`);
});
EOF
        
        success "Express server created"
    else
        info "Express server already exists"
    fi
}

# Install required npm packages
install_npm_packages() {
    if [ "$NODE_INSTALLED" = true ]; then
        info "Checking for required npm packages..."
        
        # Check if package.json exists, if not create it
        if [ ! -f "$SCRIPT_DIR/package.json" ]; then
            info "Creating package.json..."
            cat > "$SCRIPT_DIR/package.json" << 'EOF'
{
  "name": "samsung-watch-visualizer",
  "version": "1.0.0",
  "description": "Visualize Samsung watch data on Mac",
  "main": "watch-server.js",
  "scripts": {
    "start": "node watch-server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF
        fi
        
        # Install dependencies
        info "Installing npm dependencies..."
        npm install --prefix "$SCRIPT_DIR"
        
        if [ $? -eq 0 ]; then
            success "npm dependencies installed successfully"
        else
            error "Failed to install npm dependencies"
        fi
    else
        warning "Node.js is required to install npm packages"
    fi
}

# Start the visualization server
start_server() {
    if [ "$NODE_INSTALLED" = true ]; then
        info "Starting Samsung Watch Visualizer server..."
        
        # Check if the server is already running
        if lsof -i :$SERVER_PORT > /dev/null; then
            warning "A server is already running on port $SERVER_PORT"
            echo -e "Would you like to stop it and start a new one? (y/n)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                # Kill the existing process
                PID=$(lsof -i :$SERVER_PORT -t)
                kill $PID
                sleep 1
            else
                info "Using the existing server"
                open "http://localhost:$SERVER_PORT"
                return
            fi
        fi
        
        # Start the server
        node "$SCRIPT_DIR/watch-server.js" &
        SERVER_PID=$!
        
        # Wait for the server to start
        sleep 2
        
        if lsof -i :$SERVER_PORT > /dev/null; then
            success "Samsung Watch Visualizer server started successfully"
            info "Opening visualization interface in your browser..."
            open "http://localhost:$SERVER_PORT"
        else
            error "Failed to start the server"
        fi
    else
        warning "Node.js is required to start the server"
    fi
}

# Show instructions for connecting to Samsung watch
show_connection_instructions() {
    echo ""
    echo -e "${BOLD}${BLUE}Samsung Watch Connection Instructions${RESET}"
    echo -e "${BLUE}------------------------------------------------${RESET}"
    echo ""
    echo -e "1. Make sure your Samsung watch is nearby and Bluetooth is enabled on both devices"
    echo -e "2. On your watch, go to Settings > Connections > Bluetooth and make sure it's turned on"
    echo -e "3. In the browser interface, click the 'Connect to Watch' button"
    echo -e "4. Select your Samsung watch from the list of available devices"
    echo -e "5. If prompted on your watch, accept the pairing request"
    echo ""
    echo -e "${YELLOW}Note: Web Bluetooth API has some limitations in browsers.${RESET}"
    echo -e "${YELLOW}For best results, use Chrome or Edge browser.${RESET}"
    echo ""
}

# Main function
main() {
    print_header
    
    # Check requirements
    check_brew
    check_node
    check_bluetooth
    
    if [ "$BLUETOOTH_ENABLED" = false ]; then
        warning "Please enable Bluetooth before continuing"
        echo -e "Press Enter to continue once Bluetooth is enabled..."
        read
    fi
    
    # Create and start the server
    create_express_server
    install_npm_packages
    start_server
    
    # Show connection instructions
    show_connection_instructions
    
    echo ""
    echo -e "${GREEN}Setup complete! The visualization interface should now be open in your browser.${RESET}"
    echo -e "If it didn't open automatically, visit: ${BOLD}http://localhost:$SERVER_PORT${RESET}"
    echo ""
    echo -e "Press Enter to exit..."
    read
}

# Run the main function
main
