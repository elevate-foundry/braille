#!/bin/bash

# ====================================================================
# PHONE SCREEN MIRROR
# A simple utility to mirror your Android phone screen on your Mac
# ====================================================================

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

# Print header
echo -e "${BOLD}${BLUE}=================================================${RESET}"
echo -e "${BOLD}${BLUE}          PHONE SCREEN MIRROR UTILITY            ${RESET}"
echo -e "${BOLD}${BLUE}=================================================${RESET}"
echo -e "${BLUE}Mirror your phone screen to visualize your watch${RESET}"
echo -e "${BLUE}------------------------------------------------${RESET}"
echo ""

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: ADB is not installed${RESET}"
    echo -e "Please install Android Platform Tools first:"
    echo -e "brew install android-platform-tools"
    exit 1
fi

# Check if scrcpy is installed
if ! command -v scrcpy &> /dev/null; then
    echo -e "${RED}Error: scrcpy is not installed${RESET}"
    echo -e "Please install scrcpy first:"
    echo -e "brew install scrcpy"
    exit 1
fi

# Check for connected devices
echo -e "${BLUE}Checking for connected Android devices...${RESET}"
adb devices | grep -v "List" | grep -v "^$" > /tmp/adb_devices.txt
DEVICE_COUNT=$(cat /tmp/adb_devices.txt | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No Android devices detected.${RESET}"
    echo -e "Please connect your phone via USB and make sure:"
    echo -e "1. USB debugging is enabled in Developer options"
    echo -e "2. You've authorized this computer on your phone"
    echo ""
    echo -e "${BOLD}USB Debugging Instructions:${RESET}"
    echo -e "1. Go to Settings > About phone"
    echo -e "2. Tap Build number 7 times to enable Developer options"
    echo -e "3. Go back to Settings > System > Developer options"
    echo -e "4. Enable USB debugging"
    echo -e "5. Connect your phone to your Mac with a USB cable"
    echo -e "6. Accept the USB debugging authorization prompt on your phone"
    echo ""
    echo -e "Would you like to wait for a device to be connected? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}Waiting for device...${RESET}"
        adb wait-for-device
    else
        exit 1
    fi
fi

# Get device info
DEVICE_SERIAL=$(adb devices | grep -v "List" | grep -v "^$" | head -n 1 | awk '{print $1}')
DEVICE_MODEL=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.model 2>/dev/null)
DEVICE_BRAND=$(adb -s "$DEVICE_SERIAL" shell getprop ro.product.brand 2>/dev/null)

echo -e "${GREEN}Connected to: $DEVICE_BRAND $DEVICE_MODEL${RESET}"

# Ask if user wants to use wireless ADB
echo -e "Would you like to use wireless ADB (disconnect USB cable after setup)? (y/n)"
read -r wireless_response
if [[ "$wireless_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Get device IP address
    IP_ADDRESS=$(adb -s "$DEVICE_SERIAL" shell ip addr show wlan0 | grep "inet\s" | awk '{print $2}' | awk -F'/' '{print $1}')
    
    if [ -z "$IP_ADDRESS" ]; then
        echo -e "${YELLOW}Could not determine device IP address. Make sure Wi-Fi is enabled.${RESET}"
        echo -e "Continuing with USB connection..."
    else
        echo -e "${BLUE}Setting up wireless ADB connection to $IP_ADDRESS...${RESET}"
        
        # Set port
        PORT=5555
        
        # Configure device for wireless connection
        adb -s "$DEVICE_SERIAL" tcpip $PORT
        sleep 2
        
        # Connect wirelessly
        adb connect $IP_ADDRESS:$PORT
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Wireless ADB connection established!${RESET}"
            echo -e "You can now disconnect the USB cable."
            echo -e "Waiting 5 seconds before starting screen mirroring..."
            sleep 5
            
            # Update device serial to use wireless connection
            DEVICE_SERIAL="$IP_ADDRESS:$PORT"
        else
            echo -e "${RED}Failed to establish wireless connection.${RESET}"
            echo -e "Continuing with USB connection..."
        fi
    fi
fi

# Ask for screen mirroring options
echo -e "${BLUE}Screen Mirroring Options:${RESET}"
echo -e "1. Standard mirroring"
echo -e "2. High quality (higher resolution, may be slower)"
echo -e "3. Low latency (faster response, lower quality)"
echo -e "4. Custom settings"
echo -e "Enter your choice (1-4):"
read -r mirror_option

SCRCPY_ARGS=""

case $mirror_option in
    1)
        # Standard mirroring - default settings
        SCRCPY_ARGS="--window-title \"$DEVICE_BRAND $DEVICE_MODEL\""
        ;;
    2)
        # High quality
        SCRCPY_ARGS="--max-fps 60 --bit-rate 8M --window-title \"$DEVICE_BRAND $DEVICE_MODEL (High Quality)\""
        ;;
    3)
        # Low latency
        SCRCPY_ARGS="--max-fps 30 --bit-rate 2M --encoder 'h264' --window-title \"$DEVICE_BRAND $DEVICE_MODEL (Low Latency)\""
        ;;
    4)
        # Custom settings
        echo -e "Enter custom scrcpy arguments (leave empty for defaults):"
        read -r custom_args
        SCRCPY_ARGS="$custom_args --window-title \"$DEVICE_BRAND $DEVICE_MODEL (Custom)\""
        ;;
    *)
        # Default if invalid option
        SCRCPY_ARGS="--window-title \"$DEVICE_BRAND $DEVICE_MODEL\""
        ;;
esac

# Start screen mirroring
echo -e "${GREEN}Starting screen mirroring...${RESET}"
echo -e "Press Ctrl+C to stop mirroring."
echo -e "${YELLOW}TIP: Click on the mirrored screen to control your phone from your Mac!${RESET}"
echo -e "${YELLOW}TIP: Use mouse clicks and keyboard to interact with your phone.${RESET}"

# Execute scrcpy with the selected options
eval "scrcpy -s $DEVICE_SERIAL $SCRCPY_ARGS"

echo -e "${BLUE}Screen mirroring ended.${RESET}"

# If wireless, offer to disconnect
if [[ "$wireless_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "Would you like to disconnect the wireless ADB connection? (y/n)"
    read -r disconnect_response
    if [[ "$disconnect_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        adb disconnect $IP_ADDRESS:$PORT
        echo -e "${GREEN}Wireless connection terminated.${RESET}"
    fi
fi

echo -e "${GREEN}Done!${RESET}"
