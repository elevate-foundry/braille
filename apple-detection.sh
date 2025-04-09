#!/data/data/com.termux/files/usr/bin/bash

# Apple Detection Script for Android/Termux
# This script checks for potential Apple-related software or services on your Android device

# Check for terminate flag
TERMINATE_PROCESSES=false
if [ "$1" == "--terminate" ]; then
    TERMINATE_PROCESSES=true
    echo "⚠️ WARNING: Process termination mode activated ⚠️"
fi

echo "====================================================="
echo "🔍 APPLE DETECTION TOOL FOR ANDROID 🔍"
echo "Checking if Apple is attempting to take over your Galaxy S25+"
echo "====================================================="

# Create a directory for our findings
RESULTS_DIR="apple_detection_results"
mkdir -p "$RESULTS_DIR"
REPORT_FILE="$RESULTS_DIR/detection_report_$(date +%Y%m%d_%H%M%S).txt"

# Function to log findings
log_finding() {
    echo "[$(date +%H:%M:%S)] $1" | tee -a "$REPORT_FILE"
}

log_finding "Starting Apple detection scan..."
log_finding "Device: $(getprop ro.product.model) ($(getprop ro.product.device))"
log_finding "Android version: $(getprop ro.build.version.release)"
log_finding "Kernel: $(uname -a)"

echo ""
echo "🔍 Checking for Apple-related packages..."
if pkg list-installed | grep -i "apple\|ios\|macos\|darwin" > "$RESULTS_DIR/apple_packages.txt"; then
    FOUND=$(cat "$RESULTS_DIR/apple_packages.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "⚠️ Found $FOUND Apple-related packages!"
    else
        log_finding "✅ No Apple-related packages found."
    fi
else
    log_finding "✅ No Apple-related packages found."
fi

echo ""
echo "🔍 Checking for Apple-related processes..."
if ps -ef | grep -i "apple\|ios\|macos\|darwin\|siri" > "$RESULTS_DIR/apple_processes.txt"; then
    # Filter out grep itself from results
    grep -v "grep" "$RESULTS_DIR/apple_processes.txt" > "$RESULTS_DIR/filtered_processes.txt"
    FOUND=$(cat "$RESULTS_DIR/filtered_processes.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "⚠️ Found $FOUND Apple-related processes running!"
        
        # Terminate processes if flag is set
        if [ "$TERMINATE_PROCESSES" = true ]; then
            echo ""
            echo "🛑 Attempting to terminate suspicious processes..."
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
                        if [ "$TERMINATE_PROCESSES" = true ]; then
                            log_finding "Attempting force kill on PID: $PID"
                            if kill -9 "$PID" 2>/dev/null; then
                                log_finding "✅ Successfully force-terminated process with PID: $PID"
                                TERMINATED=$((TERMINATED + 1))
                            else
                                log_finding "❌ Failed to force-terminate process with PID: $PID"
                            fi
                        fi
                    fi
                fi
            done < "$RESULTS_DIR/filtered_processes.txt"
            
            log_finding "Terminated $TERMINATED out of $FOUND suspicious processes"
        fi
    else
        log_finding "✅ No Apple-related processes found."
    fi
else
    log_finding "✅ No Apple-related processes found."
fi

echo ""
echo "🔍 Checking for Apple-related files..."
find /data/data -name "*apple*" -o -name "*ios*" -o -name "*macos*" -o -name "*darwin*" -o -name "*siri*" 2>/dev/null > "$RESULTS_DIR/apple_files.txt"
FOUND=$(cat "$RESULTS_DIR/apple_files.txt" | wc -l)
if [ $FOUND -gt 0 ]; then
    log_finding "⚠️ Found $FOUND Apple-related files!"
else
    log_finding "✅ No Apple-related files found in accessible locations."
fi

echo ""
echo "🔍 Checking network connections to Apple domains..."
if command -v netstat &> /dev/null; then
    netstat -tun | grep -i "apple\|icloud" > "$RESULTS_DIR/apple_connections.txt"
    FOUND=$(cat "$RESULTS_DIR/apple_connections.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "⚠️ Found $FOUND connections to Apple domains!"
    else
        log_finding "✅ No connections to Apple domains detected."
    fi
else
    log_finding "⚠️ netstat not available, skipping network connection check."
    pkg install net-tools -y
    log_finding "Installed net-tools for future scans."
fi

echo ""
echo "🔍 Checking for Apple-related DNS queries..."
if command -v dig &> /dev/null; then
    dig +short apple.com icloud.com > "$RESULTS_DIR/apple_dns.txt"
    FOUND=$(cat "$RESULTS_DIR/apple_dns.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "ℹ️ Your device can resolve Apple domains (normal)."
    else
        log_finding "⚠️ Unable to resolve Apple domains (unusual)."
    fi
else
    log_finding "⚠️ dig not available, skipping DNS check."
    pkg install dnsutils -y
    log_finding "Installed dnsutils for future scans."
fi

echo ""
echo "🔍 Checking for Apple-related system properties..."
getprop | grep -i "apple\|ios\|macos\|darwin" > "$RESULTS_DIR/apple_properties.txt"
FOUND=$(cat "$RESULTS_DIR/apple_properties.txt" | wc -l)
if [ $FOUND -gt 0 ]; then
    log_finding "⚠️ Found $FOUND Apple-related system properties!"
else
    log_finding "✅ No Apple-related system properties found."
fi

echo ""
echo "🔍 Checking for unusual kernel modules..."
if [ -d "/proc/modules" ]; then
    cat /proc/modules | grep -i "apple\|ios\|darwin" > "$RESULTS_DIR/apple_modules.txt"
    FOUND=$(cat "$RESULTS_DIR/apple_modules.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "⚠️ Found $FOUND suspicious kernel modules!"
    else
        log_finding "✅ No suspicious kernel modules found."
    fi
else
    log_finding "⚠️ Unable to check kernel modules."
fi

echo ""
echo "🔍 Checking for unusual system services..."
if command -v service &> /dev/null; then
    service list | grep -i "apple\|ios\|darwin\|siri" > "$RESULTS_DIR/apple_services.txt"
    FOUND=$(cat "$RESULTS_DIR/apple_services.txt" | wc -l)
    if [ $FOUND -gt 0 ]; then
        log_finding "⚠️ Found $FOUND suspicious system services!"
    else
        log_finding "✅ No suspicious system services found."
    fi
else
    log_finding "⚠️ Unable to check system services."
fi

# Advanced checks - requires root (will be skipped on non-rooted devices)
echo ""
echo "🔍 Attempting advanced checks (may require root)..."
if command -v su &> /dev/null; then
    log_finding "Device appears to be rooted, attempting privileged checks..."
    
    # Check for hidden partitions
    su -c "ls -la /dev/block/platform/*/by-name/" > "$RESULTS_DIR/partitions.txt" 2>/dev/null
    if grep -i "apple\|ios\|darwin" "$RESULTS_DIR/partitions.txt" > "$RESULTS_DIR/suspicious_partitions.txt"; then
        FOUND=$(cat "$RESULTS_DIR/suspicious_partitions.txt" | wc -l)
        if [ $FOUND -gt 0 ]; then
            log_finding "⚠️ Found $FOUND suspicious partitions!"
        else
            log_finding "✅ No suspicious partitions found."
        fi
    else
        log_finding "✅ No suspicious partitions found."
    fi
else
    log_finding "Device not rooted, skipping privileged checks."
fi

# Summary
echo ""
echo "====================================================="
echo "🔍 SCAN COMPLETE 🔍"
echo "====================================================="

# Display usage information
echo ""
echo "USAGE:"
echo "  ./apple-detection.sh          - Scan for Apple-related elements"
echo "  ./apple-detection.sh --terminate - Scan and terminate suspicious processes"

# Count total suspicious findings
TOTAL_SUSPICIOUS=0
for file in "$RESULTS_DIR"/*.txt; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "detection_report_"* ]; then
        COUNT=$(grep -v "grep" "$file" | wc -l)
        TOTAL_SUSPICIOUS=$((TOTAL_SUSPICIOUS + COUNT))
    fi
done

if [ $TOTAL_SUSPICIOUS -gt 0 ]; then
    log_finding "⚠️ ALERT: Found $TOTAL_SUSPICIOUS potentially suspicious items!"
    log_finding "Review the detailed logs in the $RESULTS_DIR directory."
    echo ""
    echo "⚠️ CONCLUSION: Some Apple-related elements were detected on your device."
    echo "This doesn't necessarily mean Apple is taking over your device, but warrants investigation."
else
    log_finding "✅ GOOD NEWS: No suspicious Apple-related elements detected!"
    echo ""
    echo "✅ CONCLUSION: Your Galaxy S25+ appears to be free from Apple influence."
    echo "No evidence found of Apple attempting to take over your Android OS."
fi

echo ""
echo "Full report saved to: $REPORT_FILE"
echo ""
echo "To run more thorough checks, consider installing specialized security apps"
echo "or consulting with a mobile security professional."
echo "====================================================="
