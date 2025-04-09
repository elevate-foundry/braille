#!/bin/bash

# ====================================================================
# MAC-ANDROID BRIDGE SCRIPT
# A comprehensive utility for Mac to Android device communication
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
TEMP_DIR="/tmp/mac-android-bridge"
LOG_FILE="$TEMP_DIR/bridge_log.txt"
CONFIG_FILE="$HOME/.mac-android-bridge.conf"
ANDROID_DEVICE=""
DEVICE_SERIAL=""
ADB_INSTALLED=false
BREW_INSTALLED=false
TERMUX_INSTALLED=false
SCRCPY_INSTALLED=false
WIRELESS_ENABLED=false

# Create temp directory
mkdir -p "$TEMP_DIR"

# ====================================================================
# UTILITY FUNCTIONS
# ====================================================================

# Print header
print_header() {
    clear
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${BOLD}${BLUE}          MAC-ANDROID BRIDGE UTILITY            ${RESET}"
    echo -e "${BOLD}${BLUE}=================================================${RESET}"
    echo -e "${CYAN}Connecting your Mac to Galaxy S25+ and beyond${RESET}"
    echo -e "${BLUE}------------------------------------------------${RESET}"
    echo ""
}

# Log message
log() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Print success message
success() {
    echo -e "${GREEN}✓ $1${RESET}"
    log "SUCCESS: $1"
}

# Print error message
error() {
    echo -e "${RED}✗ $1${RESET}"
    log "ERROR: $1"
}

# Print info message
info() {
    echo -e "${BLUE}ℹ $1${RESET}"
    log "INFO: $1"
}

# Print warning message
warning() {
    echo -e "${YELLOW}⚠ $1${RESET}"
    log "WARNING: $1"
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

# Check if ADB is installed
check_adb() {
    if command_exists adb; then
        ADB_INSTALLED=true
        success "ADB is installed"
    else
        warning "ADB is not installed"
        if [ "$BREW_INSTALLED" = true ]; then
            echo -e "Would you like to install ADB? (y/n)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                info "Installing Android Platform Tools (ADB)..."
                brew install android-platform-tools
                if [ $? -eq 0 ]; then
                    success "ADB installed successfully"
                    ADB_INSTALLED=true
                else
                    error "Failed to install ADB"
                fi
            else
                warning "Skipping ADB installation"
            fi
        else
            warning "Homebrew is required to install ADB"
        fi
    fi
}

# Check if scrcpy is installed
check_scrcpy() {
    if command_exists scrcpy; then
        SCRCPY_INSTALLED=true
        success "Scrcpy is installed"
    else
        warning "Scrcpy is not installed"
        if [ "$BREW_INSTALLED" = true ]; then
            echo -e "Would you like to install Scrcpy for screen mirroring? (y/n)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                info "Installing Scrcpy..."
                brew install scrcpy
                if [ $? -eq 0 ]; then
                    success "Scrcpy installed successfully"
                    SCRCPY_INSTALLED=true
                else
                    error "Failed to install Scrcpy"
                fi
            else
                warning "Skipping Scrcpy installation"
            fi
        else
            warning "Homebrew is required to install Scrcpy"
        fi
    fi
}

# Check connected Android devices
check_android_devices() {
    if [ "$ADB_INSTALLED" = false ]; then
        warning "ADB is required to check connected devices"
        return 1
    fi

    info "Checking for connected Android devices..."
    local devices=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)
    
    if [ "$devices" -eq 0 ]; then
        warning "No Android devices connected"
        echo -e "Please connect your Galaxy S25+ via USB and enable USB debugging"
        echo -e "Would you like instructions on how to enable USB debugging? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            show_usb_debugging_instructions
        fi
        return 1
    else
        success "Found $devices connected Android device(s)"
        
        # If multiple devices, let user select one
        if [ "$devices" -gt 1 ]; then
            echo -e "Multiple devices detected. Please select a device:"
            adb devices -l
            echo -e "Enter the serial number of the device you want to use:"
            read -r DEVICE_SERIAL
            ANDROID_DEVICE=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.model 2>/dev/null)
            if [ -z "$ANDROID_DEVICE" ]; then
                error "Invalid device serial number"
                return 1
            fi
        else
            DEVICE_SERIAL=$(adb devices | grep -v "List" | grep -v "^$" | awk '{print $1}')
            ANDROID_DEVICE=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.model 2>/dev/null)
        fi
        
        success "Connected to $ANDROID_DEVICE (Serial: $DEVICE_SERIAL)"
        return 0
    fi
}

# Show USB debugging instructions
show_usb_debugging_instructions() {
    echo -e "${CYAN}=== How to Enable USB Debugging on Galaxy S25+ ===${RESET}"
    echo -e "1. Go to Settings > About phone"
    echo -e "2. Tap on 'Software information'"
    echo -e "3. Tap on 'Build number' 7 times to enable Developer options"
    echo -e "4. Go back to Settings > Developer options"
    echo -e "5. Enable 'USB debugging'"
    echo -e "6. Connect your phone to your Mac via USB"
    echo -e "7. Tap 'Allow' when prompted on your phone"
    echo -e "${CYAN}=================================================${RESET}"
    echo -e "Press Enter to continue"
    read -r
}

# Check if Termux is installed on the device
check_termux() {
    if [ "$ADB_INSTALLED" = false ]; then
        warning "ADB is required to check for Termux"
        return 1
    fi

    info "Checking if Termux is installed on your device..."
    local termux_path=$(adb -s "$DEVICE_SERIAL" shell ls /data/data/com.termux 2>/dev/null)
    
    if [ -z "$termux_path" ]; then
        warning "Termux is not installed or not accessible"
        echo -e "Would you like instructions on how to install Termux? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            show_termux_install_instructions
        fi
        TERMUX_INSTALLED=false
    else
        success "Termux is installed on your device"
        TERMUX_INSTALLED=true
    fi
}

# Show Termux installation instructions
show_termux_install_instructions() {
    echo -e "${CYAN}=== How to Install Termux on Galaxy S25+ ===${RESET}"
    echo -e "1. Open the F-Droid app store (or install it from https://f-droid.org)"
    echo -e "2. Search for 'Termux' and install it"
    echo -e "3. Alternatively, download the APK from GitHub:"
    echo -e "   https://github.com/termux/termux-app/releases"
    echo -e "4. After installation, open Termux and run:"
    echo -e "   pkg update && pkg upgrade"
    echo -e "${CYAN}==========================================${RESET}"
    echo -e "Press Enter to continue"
    read -r
}

# Setup wireless ADB connection
setup_wireless_adb() {
    if [ "$ADB_INSTALLED" = false ]; then
        warning "ADB is required for wireless debugging"
        return 1
    fi

    info "Setting up wireless debugging..."
    
    # Get device IP address
    local ip_address=$(adb -s "$DEVICE_SERIAL" shell ip addr show wlan0 | grep "inet\s" | awk '{print $2}' | cut -d/ -f1)
    
    if [ -z "$ip_address" ]; then
        error "Could not determine device IP address. Is Wi-Fi enabled?"
        return 1
    fi
    
    # Set up TCP/IP connection
    adb -s "$DEVICE_SERIAL" tcpip 5555
    
    if [ $? -ne 0 ]; then
        error "Failed to set up TCP/IP connection"
        return 1
    fi
    
    # Give the device time to switch modes
    sleep 2
    
    # Connect to the device wirelessly
    adb connect "$ip_address:5555"
    
    if [ $? -eq 0 ]; then
        success "Wireless debugging enabled at $ip_address:5555"
        echo -e "You can now disconnect the USB cable and continue using ADB wirelessly"
        WIRELESS_ENABLED=true
        return 0
    else
        error "Failed to connect wirelessly"
        return 1
    fi
}

# Transfer file to Android device
transfer_file() {
    local source_file="$1"
    local destination="$2"
    
    if [ ! -f "$source_file" ]; then
        error "Source file does not exist: $source_file"
        return 1
    fi
    
    info "Transferring $(basename "$source_file") to $destination..."
    
    adb -s "$DEVICE_SERIAL" push "$source_file" "$destination"
    
    if [ $? -eq 0 ]; then
        success "File transferred successfully"
        return 0
    else
        error "Failed to transfer file"
        return 1
    fi
}

# Run command in Termux
run_in_termux() {
    local command="$1"
    
    if [ "$TERMUX_INSTALLED" = false ]; then
        warning "Termux is required to run commands"
        return 1
    fi
    
    info "Running command in Termux: $command"
    
    # Use ADB to run the command in Termux
    adb -s "$DEVICE_SERIAL" shell am start -n com.termux/com.termux.app.TermuxActivity
    sleep 1
    adb -s "$DEVICE_SERIAL" shell input text "$(echo "$command" | sed 's/ /\%s/g')"
    adb -s "$DEVICE_SERIAL" shell input keyevent 66  # Enter key
    
    success "Command sent to Termux"
    return 0
}

# Mirror Android screen to Mac
mirror_screen() {
    if [ "$SCRCPY_INSTALLED" = false ]; then
        warning "Scrcpy is required for screen mirroring"
        return 1
    fi
    
    info "Starting screen mirroring..."
    
    if [ -n "$DEVICE_SERIAL" ]; then
        scrcpy -s "$DEVICE_SERIAL" --window-title "Galaxy S25+ Screen Mirror" &
    else
        scrcpy --window-title "Android Screen Mirror" &
    fi
    
    if [ $? -eq 0 ]; then
        success "Screen mirroring started"
        return 0
    else
        error "Failed to start screen mirroring"
        return 1
    fi
}

# Transfer and run apple-detection script
transfer_and_run_detection() {
    local script_path="$SCRIPT_DIR/apple-detection.sh"
    
    if [ ! -f "$script_path" ]; then
        error "Apple detection script not found: $script_path"
        return 1
    fi
    
    info "Preparing to transfer and run apple-detection.sh..."
    
    # Transfer the script
    transfer_file "$script_path" "/sdcard/Download/apple-detection.sh"
    
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Make the script executable in Termux
    run_in_termux "cp /sdcard/Download/apple-detection.sh ~/apple-detection.sh && chmod +x ~/apple-detection.sh"
    
    # Ask if user wants to run in termination mode
    echo -e "Do you want to run the script in termination mode? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        run_in_termux "./apple-detection.sh --terminate"
    else
        run_in_termux "./apple-detection.sh"
    fi
    
    success "Apple detection script transferred and executed"
    return 0
}

# ====================================================================
# MAIN MENU
# ====================================================================

show_main_menu() {
    while true; do
        print_header
        
        echo -e "${CYAN}Connected Device:${RESET} ${ANDROID_DEVICE:-None}"
        echo -e "${CYAN}ADB Status:${RESET} $([ "$ADB_INSTALLED" = true ] && echo "${GREEN}Installed${RESET}" || echo "${RED}Not Installed${RESET}")"
        echo -e "${CYAN}Termux Status:${RESET} $([ "$TERMUX_INSTALLED" = true ] && echo "${GREEN}Installed${RESET}" || echo "${RED}Not Installed${RESET}")"
        echo -e "${CYAN}Wireless Status:${RESET} $([ "$WIRELESS_ENABLED" = true ] && echo "${GREEN}Enabled${RESET}" || echo "${RED}Disabled${RESET}")"
        echo ""
        
        echo -e "${BOLD}${CYAN}Choose an option:${RESET}"
        echo -e "  ${BOLD}1.${RESET} Setup Environment (Install required tools)"
        echo -e "  ${BOLD}2.${RESET} Connect to Android Device"
        echo -e "  ${BOLD}3.${RESET} Enable Wireless Debugging"
        echo -e "  ${BOLD}4.${RESET} Transfer Files to Device"
        echo -e "  ${BOLD}5.${RESET} Run Command in Termux"
        echo -e "  ${BOLD}6.${RESET} Mirror Android Screen to Mac"
        echo -e "  ${BOLD}7.${RESET} Transfer and Run Apple Detection Script"
        echo -e "  ${BOLD}8.${RESET} View Connection Log"
        echo -e "  ${BOLD}9.${RESET} Exit"
        echo ""
        echo -e "Enter your choice [1-9]: "
        read -r choice
        
        case $choice in
            1)
                check_brew
                check_adb
                check_scrcpy
                echo -e "Press Enter to continue"
                read -r
                ;;
            2)
                check_android_devices
                if [ $? -eq 0 ]; then
                    check_termux
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            3)
                if [ -z "$DEVICE_SERIAL" ]; then
                    warning "No device connected. Please connect a device first."
                else
                    setup_wireless_adb
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            4)
                if [ -z "$DEVICE_SERIAL" ]; then
                    warning "No device connected. Please connect a device first."
                else
                    echo -e "Enter the path to the file you want to transfer:"
                    read -r source_file
                    echo -e "Enter the destination path on the device (e.g., /sdcard/Download):"
                    read -r destination
                    transfer_file "$source_file" "$destination"
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            5)
                if [ "$TERMUX_INSTALLED" = false ]; then
                    warning "Termux is not installed or not detected. Please check Termux installation."
                else
                    echo -e "Enter the command to run in Termux:"
                    read -r command
                    run_in_termux "$command"
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            6)
                if [ -z "$DEVICE_SERIAL" ]; then
                    warning "No device connected. Please connect a device first."
                else
                    mirror_screen
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            7)
                if [ -z "$DEVICE_SERIAL" ]; then
                    warning "No device connected. Please connect a device first."
                elif [ "$TERMUX_INSTALLED" = false ]; then
                    warning "Termux is not installed or not detected. Please check Termux installation."
                else
                    transfer_and_run_detection
                fi
                echo -e "Press Enter to continue"
                read -r
                ;;
            8)
                if [ -f "$LOG_FILE" ]; then
                    less "$LOG_FILE"
                else
                    warning "Log file not found"
                fi
                ;;
            9)
                echo -e "${CYAN}Thank you for using the Mac-Android Bridge Utility!${RESET}"
                exit 0
                ;;
            *)
                warning "Invalid option. Please try again."
                sleep 1
                ;;
        esac
    done
}

# ====================================================================
# SCRIPT EXECUTION
# ====================================================================

# Initialize log file
echo "=== Mac-Android Bridge Log - $(date) ===" > "$LOG_FILE"

# Show welcome message
print_header
echo -e "Welcome to the Mac-Android Bridge Utility!"
echo -e "This script will help you connect your Mac to your Galaxy S25+"
echo -e "and perform various operations including running the apple-detection script."
echo ""
echo -e "Press Enter to continue..."
read -r

# Start the main menu
show_main_menu
