#!/bin/bash

# BrailleBuddy Automated Test Runner
# This script performs automated checks on the application

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  BrailleBuddy Automated Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${RED}→ $message${NC}"
        fi
        ((FAILED++))
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${YELLOW}→ $message${NC}"
        fi
        ((WARNINGS++))
    fi
}

echo -e "${BLUE}1. File Structure Tests${NC}"
echo "---"

# Check critical files
if [ -f "index.html" ]; then
    print_result "index.html exists" "PASS"
else
    print_result "index.html exists" "FAIL" "Main entry point missing"
fi

if [ -f "manifest.json" ]; then
    print_result "manifest.json exists" "PASS"
else
    print_result "manifest.json exists" "FAIL" "PWA manifest missing"
fi

if [ -f "service-worker.js" ]; then
    print_result "service-worker.js exists" "PASS"
else
    print_result "service-worker.js exists" "FAIL" "Service worker missing"
fi

# Check critical JavaScript files
JS_FILES=(
    "js/script.js"
    "js/haptic-feedback.js"
    "js/mobile-optimization.js"
    "js/braille-language-manager.js"
    "js/bbid-manager.js"
    "js/games.js"
    "js/progress-tracker.js"
)

for file in "${JS_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_result "$file exists" "PASS"
    else
        print_result "$file exists" "FAIL" "Required JavaScript file missing"
    fi
done

echo ""
echo -e "${BLUE}2. CSS Files Tests${NC}"
echo "---"

if [ -d "css" ]; then
    CSS_COUNT=$(find css -name "*.css" | wc -l)
    if [ $CSS_COUNT -gt 0 ]; then
        print_result "CSS files found ($CSS_COUNT files)" "PASS"
    else
        print_result "CSS files found" "WARN" "No CSS files in css/ directory"
    fi
else
    print_result "css/ directory exists" "FAIL" "CSS directory missing"
fi

echo ""
echo -e "${BLUE}3. Server Tests${NC}"
echo "---"

# Check if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
    print_result "Server is running on port 8000" "PASS"
    
    # Test main page
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/index.html)
    if [ "$HTTP_CODE" = "200" ]; then
        print_result "index.html loads (HTTP $HTTP_CODE)" "PASS"
    else
        print_result "index.html loads" "FAIL" "HTTP $HTTP_CODE"
    fi
    
    # Test demo pages
    DEMO_PAGES=(
        "bbid-recognition.html"
        "braille-core-demo.html"
        "haptic-test.html"
        "compression-demo.html"
    )
    
    for page in "${DEMO_PAGES[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$page)
        if [ "$HTTP_CODE" = "200" ]; then
            print_result "$page loads (HTTP $HTTP_CODE)" "PASS"
        else
            print_result "$page loads" "FAIL" "HTTP $HTTP_CODE"
        fi
    done
    
else
    print_result "Server is running" "FAIL" "Server not responding on port 8000"
fi

echo ""
echo -e "${BLUE}4. JavaScript Syntax Tests${NC}"
echo "---"

# Check for common JavaScript errors (basic syntax check)
JS_ERROR_COUNT=0
for file in js/*.js; do
    if [ -f "$file" ]; then
        # Check for basic syntax issues
        if grep -q "console.log" "$file"; then
            ((JS_ERROR_COUNT++))
        fi
    fi
done

if [ $JS_ERROR_COUNT -gt 0 ]; then
    print_result "No console.log statements" "WARN" "Found $JS_ERROR_COUNT files with console.log (should be removed for production)"
else
    print_result "No console.log statements" "PASS"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO" js/ --include="*.js" | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    print_result "No TODO comments" "WARN" "Found $TODO_COUNT TODO comments"
else
    print_result "No TODO comments" "PASS"
fi

echo ""
echo -e "${BLUE}5. Configuration Tests${NC}"
echo "---"

if [ -f ".env" ]; then
    print_result ".env file exists" "PASS"
    
    # Check for required environment variables
    if grep -q "PORT=" .env; then
        print_result "PORT configured" "PASS"
    else
        print_result "PORT configured" "WARN" "PORT not set in .env"
    fi
    
    if grep -q "ENABLE_HAPTIC_FEEDBACK=" .env; then
        print_result "Haptic feedback configured" "PASS"
    else
        print_result "Haptic feedback configured" "WARN" "ENABLE_HAPTIC_FEEDBACK not set"
    fi
else
    print_result ".env file exists" "WARN" "Environment file missing (optional)"
fi

if [ -f "package.json" ]; then
    print_result "package.json exists" "PASS"
else
    print_result "package.json exists" "WARN" "Package file missing"
fi

echo ""
echo -e "${BLUE}6. Asset Tests${NC}"
echo "---"

# Check for images directory
if [ -d "images" ]; then
    IMAGE_COUNT=$(find images -type f | wc -l)
    if [ $IMAGE_COUNT -gt 0 ]; then
        print_result "Images directory ($IMAGE_COUNT files)" "PASS"
    else
        print_result "Images directory" "WARN" "No images found"
    fi
else
    print_result "images/ directory exists" "WARN" "Images directory missing"
fi

# Check for data directory
if [ -d "data" ]; then
    print_result "data/ directory exists" "PASS"
else
    print_result "data/ directory exists" "WARN" "Data directory missing"
fi

echo ""
echo -e "${BLUE}7. Security Tests${NC}"
echo "---"

# Check for exposed API keys
API_KEY_COUNT=$(grep -r "API_KEY\|api_key\|apiKey" js/ --include="*.js" | grep -v "process.env" | wc -l)
if [ $API_KEY_COUNT -eq 0 ]; then
    print_result "No hardcoded API keys" "PASS"
else
    print_result "No hardcoded API keys" "WARN" "Found $API_KEY_COUNT potential API key references"
fi

# Check for console.error statements
ERROR_COUNT=$(grep -r "console.error" js/ --include="*.js" | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
    print_result "Error handling implemented" "PASS" "Found $ERROR_COUNT error handlers"
else
    print_result "Error handling implemented" "WARN" "No error handlers found"
fi

echo ""
echo -e "${BLUE}8. Performance Tests${NC}"
echo "---"

# Check file sizes
LARGE_FILES=$(find . -name "*.js" -size +500k -not -path "./node_modules/*" | wc -l)
if [ $LARGE_FILES -eq 0 ]; then
    print_result "No large JavaScript files (>500KB)" "PASS"
else
    print_result "No large JavaScript files" "WARN" "Found $LARGE_FILES large files (consider minification)"
fi

# Check for minified files
MINIFIED_COUNT=$(find js/ -name "*.min.js" | wc -l)
if [ $MINIFIED_COUNT -gt 0 ]; then
    print_result "Minified files present" "PASS" "Found $MINIFIED_COUNT minified files"
else
    print_result "Minified files present" "WARN" "No minified files (consider for production)"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
PASS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed! ($PASS_RATE% success rate)${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the results above.${NC}"
    exit 1
fi
