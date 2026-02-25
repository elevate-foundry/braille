#!/data/data/com.termux/files/usr/bin/bash

# Android System Analyzer
# A comprehensive script to analyze all running processes, connections, and device integrations
# With special focus on Samsung Watch and Wear app connections

echo "====================================================="
echo "🔍 ANDROID SYSTEM ANALYZER 🔍"
echo "Comprehensive analysis of your Galaxy S25+ system"
echo "====================================================="

# Check for terminate flag
TERMINATE_PROCESSES=false
if [ "$1" == "--terminate" ]; then
    TERMINATE_PROCESSES=true
    echo "⚠️ WARNING: Process termination mode activated ⚠️"
fi

# Check for specific target
TARGET_FILTER=""
if [ "$1" == "--target" ] && [ -n "$2" ]; then
    TARGET_FILTER="$2"
    echo "🎯 Target filter activated: $TARGET_FILTER"
fi

# Create a directory for our findings
RESULTS_DIR="system_analysis_results"
mkdir -p "$RESULTS_DIR"
REPORT_FILE="$RESULTS_DIR/analysis_report_$(date +%Y%m%d_%H%M%S).txt"

# Function to log findings
log_finding() {
    echo "[$(date +%H:%M:%S)] $1" | tee -a "$REPORT_FILE"
}

log_finding "Starting system analysis..."
log_finding "Device: $(getprop ro.product.model) ($(getprop ro.product.device))"
log_finding "Android version: $(getprop ro.build.version.release)"
log_finding "Kernel: $(uname -a)"

# ===================================================
# PROCESS ANALYSIS
# ===================================================

echo ""
echo "🔍 Analyzing all running processes..."
ps -ef > "$RESULTS_DIR/all_processes.txt"
TOTAL_PROCESSES=$(cat "$RESULTS_DIR/all_processes.txt" | wc -l)
log_finding "Found $TOTAL_PROCESSES total processes running"

# Categorize processes by user
echo ""
echo "🔍 Categorizing processes by user..."
cat "$RESULTS_DIR/all_processes.txt" | awk '{print $1}' | sort | uniq -c | sort -nr > "$RESULTS_DIR/processes_by_user.txt"
log_finding "Process ownership breakdown:"
while read line; do
    log_finding "  $line"
done < "$RESULTS_DIR/processes_by_user.txt"

# Find Samsung-specific processes
echo ""
echo "🔍 Identifying Samsung-specific processes..."
grep -i "samsung\|galaxy\|knox\|bixby\|oneui" "$RESULTS_DIR/all_processes.txt" > "$RESULTS_DIR/samsung_processes.txt"
SAMSUNG_PROCESSES=$(cat "$RESULTS_DIR/samsung_processes.txt" | wc -l)
log_finding "Found $SAMSUNG_PROCESSES Samsung-specific processes"

# Find Wear app and watch-related processes
echo ""
echo "🔍 Identifying Samsung Watch and Wear app connections..."
grep -i "wear\|watch\|galaxy\s*watch\|wearable\|tizen\|gear" "$RESULTS_DIR/all_processes.txt" > "$RESULTS_DIR/watch_processes.txt"
WATCH_PROCESSES=$(cat "$RESULTS_DIR/watch_processes.txt" | wc -l)

if [ $WATCH_PROCESSES -gt 0 ]; then
    log_finding "⌚ Found $WATCH_PROCESSES watch-related processes!"
    log_finding "Watch connection details:"
    cat "$RESULTS_DIR/watch_processes.txt" | while read line; do
        process_name=$(echo "$line" | awk '{for(i=8;i<=NF;i++) printf "%s ", $i; printf "\n"}')
        pid=$(echo "$line" | awk '{print $2}')
        log_finding "  - $process_name (PID: $pid)"
    done
else
    log_finding "⌚ No watch-related processes detected"
fi

# Find high CPU processes
echo ""
echo "🔍 Identifying high resource usage processes..."
ps -o pid,ppid,user,%cpu,%mem,comm -A | sort -k5 -r | head -n 10 > "$RESULTS_DIR/high_resource_processes.txt"
log_finding "Top 10 processes by resource usage:"
cat "$RESULTS_DIR/high_resource_processes.txt" | while read line; do
    log_finding "  $line"
done

# ===================================================
# NETWORK ANALYSIS
# ===================================================

echo ""
echo "🔍 Analyzing network connections..."
if command -v netstat &> /dev/null; then
    netstat -tun > "$RESULTS_DIR/network_connections.txt"
    CONNECTIONS=$(cat "$RESULTS_DIR/network_connections.txt" | grep -v "^Proto" | wc -l)
    log_finding "Found $CONNECTIONS active network connections"
    
    # Check for Bluetooth connections
    netstat -tun | grep -i "bluetooth" > "$RESULTS_DIR/bluetooth_connections.txt"
    BT_CONNECTIONS=$(cat "$RESULTS_DIR/bluetooth_connections.txt" | wc -l)
    
    if [ $BT_CONNECTIONS -gt 0 ]; then
        log_finding "🔵 Found $BT_CONNECTIONS Bluetooth connections"
    else
        log_finding "🔵 No active Bluetooth connections detected"
    fi
else
    log_finding "⚠️ netstat not available, installing net-tools..."
    pkg install net-tools -y
    log_finding "Installed net-tools for network analysis."
fi

# ===================================================
# BLUETOOTH ANALYSIS
# ===================================================

echo ""
echo "🔍 Analyzing Bluetooth connections..."
if [ -d "/sys/class/bluetooth" ]; then
    ls -la /sys/class/bluetooth > "$RESULTS_DIR/bluetooth_devices.txt"
    BT_DEVICES=$(cat "$RESULTS_DIR/bluetooth_devices.txt" | grep -v "total" | wc -l)
    log_finding "Found $BT_DEVICES Bluetooth devices"
    
    # Try to get more detailed Bluetooth info
    if command -v bluetoothctl &> /dev/null; then
        echo "devices" | bluetoothctl > "$RESULTS_DIR/bluetoothctl_devices.txt" 2>/dev/null
        log_finding "Bluetooth paired devices:"
        grep "Device" "$RESULTS_DIR/bluetoothctl_devices.txt" | while read line; do
            log_finding "  $line"
        done
    fi
else
    log_finding "⚠️ Unable to access Bluetooth information"
fi

# ===================================================
# WEAR APP SPECIFIC ANALYSIS
# ===================================================

echo ""
echo "🔍 Analyzing Samsung Wear app data..."
WEAR_APP_DATA="/data/data/com.samsung.android.app.watchmanager"
GALAXY_WEARABLE_DATA="/data/data/com.samsung.android.geargplugin"

# Check if Wear app is installed
if [ -d "$WEAR_APP_DATA" ] || [ -d "$GALAXY_WEARABLE_DATA" ]; then
    log_finding "⌚ Samsung Wear app detected on device"
    
    # Try to find connected watch info
    if [ -d "$WEAR_APP_DATA/shared_prefs" ]; then
        find "$WEAR_APP_DATA/shared_prefs" -type f -name "*.xml" -exec grep -l "watch\|gear\|wearable\|device_name" {} \; > "$RESULTS_DIR/wear_app_prefs.txt"
        WATCH_PREFS=$(cat "$RESULTS_DIR/wear_app_prefs.txt" | wc -l)
        
        if [ $WATCH_PREFS -gt 0 ]; then
            log_finding "Found $WATCH_PREFS preference files with watch information"
            log_finding "Watch connection details may be stored in these files"
        fi
    fi
    
    # Check for running Wear app services
    ps -ef | grep -i "com.samsung.android.app.watchmanager\|com.samsung.android.geargplugin" > "$RESULTS_DIR/wear_app_services.txt"
    WEAR_SERVICES=$(grep -v "grep" "$RESULTS_DIR/wear_app_services.txt" | wc -l)
    
    if [ $WEAR_SERVICES -gt 0 ]; then
        log_finding "⌚ Found $WEAR_SERVICES active Wear app services"
        grep -v "grep" "$RESULTS_DIR/wear_app_services.txt" | while read line; do
            service_name=$(echo "$line" | awk '{for(i=8;i<=NF;i++) printf "%s ", $i; printf "\n"}')
            pid=$(echo "$line" | awk '{print $2}')
            log_finding "  - $service_name (PID: $pid)"
        done
    else
        log_finding "⌚ No active Wear app services detected"
    fi
else
    log_finding "⌚ Samsung Wear app not detected on device"
fi

# ===================================================
# INSTALLED APPS ANALYSIS
# ===================================================

echo ""
echo "🔍 Analyzing installed applications..."
pm list packages > "$RESULTS_DIR/installed_packages.txt"
TOTAL_PACKAGES=$(cat "$RESULTS_DIR/installed_packages.txt" | wc -l)
log_finding "Found $TOTAL_PACKAGES installed packages"

# Find Samsung-specific packages
grep -i "samsung" "$RESULTS_DIR/installed_packages.txt" > "$RESULTS_DIR/samsung_packages.txt"
SAMSUNG_PACKAGES=$(cat "$RESULTS_DIR/samsung_packages.txt" | wc -l)
log_finding "Found $SAMSUNG_PACKAGES Samsung-specific packages"

# Find watch-related packages
grep -i "watch\|gear\|wearable\|tizen" "$RESULTS_DIR/installed_packages.txt" > "$RESULTS_DIR/watch_packages.txt"
WATCH_PACKAGES=$(cat "$RESULTS_DIR/watch_packages.txt" | wc -l)
log_finding "Found $WATCH_PACKAGES watch-related packages"

if [ $WATCH_PACKAGES -gt 0 ]; then
    log_finding "Watch-related packages:"
    cat "$RESULTS_DIR/watch_packages.txt" | while read line; do
        log_finding "  $line"
    done
fi

# ===================================================
# PROCESS TERMINATION (if enabled)
# ===================================================

if [ "$TERMINATE_PROCESSES" = true ]; then
    echo ""
    echo "🛑 Process termination mode active"
    
    # Determine target processes
    if [ -n "$TARGET_FILTER" ]; then
        echo "🎯 Targeting processes matching: $TARGET_FILTER"
        ps -ef | grep -i "$TARGET_FILTER" > "$RESULTS_DIR/target_processes.txt"
    else
        echo "⚠️ No specific target. Please specify a target with --target parameter"
        echo "Example: ./android-system-analyzer.sh --terminate --target facebook"
        TERMINATE_PROCESSES=false
    fi
    
    if [ "$TERMINATE_PROCESSES" = true ]; then
        # Filter out grep itself from results
        grep -v "grep" "$RESULTS_DIR/target_processes.txt" > "$RESULTS_DIR/filtered_target_processes.txt"
        TARGET_COUNT=$(cat "$RESULTS_DIR/filtered_target_processes.txt" | wc -l)
        
        if [ $TARGET_COUNT -gt 0 ]; then
            log_finding "⚠️ Found $TARGET_COUNT processes matching '$TARGET_FILTER'"
            
            echo ""
            echo "🛑 Attempting to terminate matching processes..."
            TERMINATED=0
            
            while read line; do
                # Extract PID (second column in ps output)
                PID=$(echo "$line" | awk '{print $2}')
                PROCESS_NAME=$(echo "$line" | awk '{for(i=8;i<=NF;i++) printf "%s ", $i; printf "\n"}')
                
                if [ ! -z "$PID" ]; then
                    log_finding "Attempting to terminate process: $PROCESS_NAME (PID: $PID)"
                    
                    # Try to kill the process
                    if kill -15 "$PID" 2>/dev/null; then
                        log_finding "✅ Successfully terminated process with PID: $PID"
                        TERMINATED=$((TERMINATED + 1))
                    else
                        log_finding "❌ Failed to terminate process with PID: $PID"
                        
                        # Try with force kill if normal kill fails
                        log_finding "Attempting force kill on PID: $PID"
                        if kill -9 "$PID" 2>/dev/null; then
                            log_finding "✅ Successfully force-terminated process with PID: $PID"
                            TERMINATED=$((TERMINATED + 1))
                        else
                            log_finding "❌ Failed to force-terminate process with PID: $PID"
                        fi
                    fi
                fi
            done < "$RESULTS_DIR/filtered_target_processes.txt"
            
            log_finding "Terminated $TERMINATED out of $TARGET_COUNT matching processes"
        else
            log_finding "No processes found matching '$TARGET_FILTER'"
        fi
    fi
fi

# ===================================================
# SUMMARY
# ===================================================

echo ""
echo "====================================================="
echo "🔍 ANALYSIS COMPLETE 🔍"
echo "====================================================="

log_finding "SYSTEM SUMMARY:"
log_finding "  - Total processes: $TOTAL_PROCESSES"
log_finding "  - Samsung processes: $SAMSUNG_PROCESSES"
log_finding "  - Watch-related processes: $WATCH_PROCESSES"
log_finding "  - Total installed packages: $TOTAL_PACKAGES"
log_finding "  - Samsung packages: $SAMSUNG_PACKAGES"
log_finding "  - Watch-related packages: $WATCH_PACKAGES"

echo ""
echo "Full report saved to: $REPORT_FILE"
echo "Detailed analysis files saved in: $RESULTS_DIR"
echo ""

if [ $WATCH_PROCESSES -gt 0 ] || [ $WATCH_PACKAGES -gt 0 ]; then
    echo "⌚ SAMSUNG WATCH CONNECTION DETECTED"
    echo "Your Galaxy S25+ appears to be connected to a Samsung Watch"
    echo "Check the detailed report for connection specifics"
else
    echo "⌚ NO SAMSUNG WATCH CONNECTION DETECTED"
    echo "Your Galaxy S25+ does not appear to be actively connected to a Samsung Watch"
    echo "If you believe this is incorrect, check if the watch is powered on and paired"
fi

echo "====================================================="
