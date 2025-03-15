#!/bin/bash

# BrailleBuddy Update & Deployment Script
# This script updates the existing braillebuddy.vercel.app project with our custom fingerprinting solution

# Text styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}===== BrailleBuddy Update & Deployment Script =====${NC}"
echo -e "${BLUE}This script will update the existing braillebuddy.vercel.app project${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Create a backup branch of our current work
echo -e "${BOLD}Step 1: Creating backup of current work${NC}"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b $BACKUP_BRANCH
git add .
git commit -m "Backup before merging with main branch"
git push origin $BACKUP_BRANCH
echo -e "${GREEN}✓ Backup created on branch: $BACKUP_BRANCH${NC}"

# Switch to main branch and pull latest changes
echo -e "${BOLD}Step 2: Getting latest version from main branch${NC}"
git checkout main
git pull origin main
echo -e "${GREEN}✓ Latest main branch pulled${NC}"

# Create a new feature branch for our changes
echo -e "${BOLD}Step 3: Creating new feature branch for our changes${NC}"
FEATURE_BRANCH="custom-fingerprinting-$(date +%Y%m%d)"
git checkout -b $FEATURE_BRANCH
echo -e "${GREEN}✓ New feature branch created: $FEATURE_BRANCH${NC}"

# Apply our custom fingerprinting changes
echo -e "${BOLD}Step 4: Applying custom fingerprinting changes${NC}"

# Copy our key files to the main branch
echo -e "${YELLOW}Copying custom fingerprinting files...${NC}"
git checkout $BACKUP_BRANCH -- src/lib/customFingerprint.ts
git checkout $BACKUP_BRANCH -- api/customFingerprint.ts
git checkout $BACKUP_BRANCH -- src/models/Fingerprint.ts
git checkout $BACKUP_BRANCH -- api/getUserProgress.ts
git checkout $BACKUP_BRANCH -- src/components/FingerprintCapture.tsx
git checkout $BACKUP_BRANCH -- src/pages/fingerprint-test.tsx
git checkout $BACKUP_BRANCH -- src/styles/FingerprintTest.module.css
git checkout $BACKUP_BRANCH -- src/aiCompression.ts
git checkout $BACKUP_BRANCH -- src/testTensorflow.ts
git checkout $BACKUP_BRANCH -- README.md
git checkout $BACKUP_BRANCH -- DEPLOYMENT.md
git checkout $BACKUP_BRANCH -- vercel.json

# Update package.json to remove Fingerprint.js dependency
echo -e "${YELLOW}Updating package.json...${NC}"
if grep -q "@fingerprintjs/fingerprintjs-pro" package.json; then
    # Remove the dependency line
    sed -i '' '/"@fingerprintjs\/fingerprintjs-pro"/d' package.json
    echo -e "${GREEN}✓ Removed Fingerprint.js dependency${NC}"
else
    echo -e "${BLUE}Fingerprint.js dependency not found in package.json${NC}"
fi

# Add test:mongodb script
if ! grep -q "test:mongodb" package.json; then
    # Add the test script before the closing scripts brace
    sed -i '' 's/"scripts": {/&\n    "test:mongodb": "tsx src\/testMongoDB.ts",/' package.json
    echo -e "${GREEN}✓ Added MongoDB test script${NC}"
fi

# Commit our changes
git add .
git commit -m "Integrate custom fingerprinting solution and TensorFlow.js"
echo -e "${GREEN}✓ Changes committed${NC}"

# Ensure all dependencies are installed
echo -e "${BOLD}Step 5: Installing dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build the project
echo -e "${BOLD}Step 6: Building the project${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}× Build failed. Please check the error messages above.${NC}"
    echo -e "${YELLOW}Would you like to continue with deployment anyway? (y/n)${NC}"
    read -r continue_deploy
    if [[ $continue_deploy != "y" ]]; then
        echo -e "${RED}Deployment aborted.${NC}"
        exit 1
    fi
fi

# Check if user is logged in to Vercel
echo -e "${BOLD}Step 7: Verifying Vercel login${NC}"
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to log in to Vercel first${NC}"
    vercel login
else
    echo -e "${GREEN}✓ Already logged in to Vercel${NC}"
fi

# Set up environment variables if needed
echo -e "${BOLD}Step 8: Setting up environment variables${NC}"
echo -e "${YELLOW}Do you need to update environment variables? (y/n)${NC}"
read -r update_env

if [[ $update_env == "y" ]]; then
    echo -e "${YELLOW}Enter your MongoDB URI:${NC}"
    read -r mongodb_uri
    
    echo -e "${YELLOW}Enter a secure session secret:${NC}"
    read -r session_secret
    
    echo -e "${YELLOW}Setting up environment variables as Vercel secrets...${NC}"
    vercel secrets add mongodb_uri "$mongodb_uri"
    vercel secrets add session_secret "$session_secret"
    vercel secrets add tensorflow_model_path "/models/tensorflow"
    
    echo -e "${GREEN}✓ Environment variables updated${NC}"
else
    echo -e "${BLUE}Skipping environment variable update${NC}"
fi

# Deploy to production
echo -e "${BOLD}Step 9: Deploying to braillebuddy.vercel.app${NC}"
echo -e "${YELLOW}Starting deployment...${NC}"

# Link to existing project
vercel link --yes

# Deploy the project
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Deployment successful!${NC}"
    echo -e "${BLUE}Your application is now live at:${NC} ${BOLD}https://braillebuddy.vercel.app${NC}"
    echo ""
    echo -e "${YELLOW}Important pages to check:${NC}"
    echo -e "- Main application: ${BOLD}https://braillebuddy.vercel.app${NC}"
    echo -e "- Fingerprint test: ${BOLD}https://braillebuddy.vercel.app/fingerprint-test${NC}"
    echo ""
    echo -e "${BLUE}Your custom fingerprinting solution is now ready for hospital demonstrations!${NC}"
    
    # Push our changes to GitHub
    echo -e "${BOLD}Step 10: Pushing changes to GitHub${NC}"
    git push origin $FEATURE_BRANCH
    echo -e "${GREEN}✓ Changes pushed to GitHub on branch: $FEATURE_BRANCH${NC}"
    echo -e "${YELLOW}Consider creating a pull request to merge these changes into main${NC}"
else
    echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}===== Update & Deployment Process Complete =====${NC}"
