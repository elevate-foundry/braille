#!/bin/bash

# Script to open all demo pages for manual testing

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Opening All BrailleBuddy Pages${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

BASE_URL="http://localhost:8000"

# Array of all pages to test
PAGES=(
    "index.html|Main Application"
    "bbid-recognition.html|BBID Recognition Demo"
    "bbid-login-demo.html|BBID Login Demo"
    "braille-core-demo.html|BrailleCore Demo"
    "bbes-standard.html|BBES Standard Demo"
    "bbes-bible-demo.html|BBES Bible Demo"
    "bbes-fingerprint-demo.html|BBES Fingerprint Demo"
    "haptic-test.html|Haptic Test Page"
    "compression-demo.html|Compression Demo"
    "bzip-demo.html|BZip Demo"
    "test-sal.html|SAL Assistant Test"
    "test-number-sign.html|Number Sign Test"
    "my-devices.html|My Devices Page"
)

echo -e "${GREEN}Opening pages in browser...${NC}"
echo ""

for page_info in "${PAGES[@]}"; do
    IFS='|' read -r page title <<< "$page_info"
    echo -e "${BLUE}→${NC} Opening: $title"
    open "$BASE_URL/$page"
    sleep 0.5  # Small delay between opens
done

echo ""
echo -e "${GREEN}✓ All pages opened in browser tabs${NC}"
echo ""
echo -e "${BLUE}Testing Instructions:${NC}"
echo "1. Check each tab for visual errors"
echo "2. Open DevTools (F12) and check Console for errors"
echo "3. Test interactive features on each page"
echo "4. Note any issues in TESTING_CHECKLIST.md"
echo ""
echo -e "${BLUE}Quick Test Checklist:${NC}"
echo "□ All pages load without errors"
echo "□ Braille patterns display correctly"
echo "□ Interactive elements respond to clicks"
echo "□ No critical console errors (red)"
echo "□ Forms and inputs work"
echo "□ Navigation works"
echo ""
