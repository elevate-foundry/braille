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
git commit -m "Backup before deploying with custom fingerprinting solution"
git push origin $BACKUP_BRANCH
echo -e "${GREEN}✓ Backup created on branch: $BACKUP_BRANCH${NC}"

# Install dependencies
echo -e "${BOLD}Step 2: Installing dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build the project
echo -e "${BOLD}Step 3: Building the project${NC}"
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

# Deploy to Vercel
echo -e "${BOLD}Step 4: Deploying to Vercel${NC}"
echo -e "${YELLOW}Checking if project is already linked to Vercel...${NC}"

# Check if .vercel directory exists (indicates project is linked)
if [ -d ".vercel" ]; then
    echo -e "${GREEN}✓ Project is already linked to Vercel${NC}"
    
    # Deploy to production
    echo -e "${YELLOW}Deploying to production...${NC}"
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployment successful!${NC}"
    else
        echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Project is not linked to Vercel. Linking now...${NC}"
    
    # Link to existing project
    echo -e "${YELLOW}Linking to existing project braillebuddy...${NC}"
    vercel link --project braillebuddy
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Project linked successfully${NC}"
        
        # Deploy to production
        echo -e "${YELLOW}Deploying to production...${NC}"
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Deployment successful!${NC}"
        else
            echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}× Failed to link project. Please check the error messages above.${NC}"
        exit 1
    fi
fi

# Set environment variables
echo -e "${BOLD}Step 5: Setting environment variables${NC}"
echo -e "${YELLOW}Would you like to update environment variables? (y/n)${NC}"
read -r update_env

if [[ $update_env == "y" ]]; then
    echo -e "${YELLOW}Setting MONGODB_URI...${NC}"
    vercel env add MONGODB_URI
    
    echo -e "${YELLOW}Setting SESSION_SECRET...${NC}"
    vercel env add SESSION_SECRET
    
    echo -e "${YELLOW}Setting TENSORFLOW_MODEL_PATH...${NC}"
    vercel env add TENSORFLOW_MODEL_PATH
    
    echo -e "${GREEN}✓ Environment variables set${NC}"
    
    # Deploy again to apply environment variables
    echo -e "${YELLOW}Redeploying to apply environment variables...${NC}"
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Redeployment successful!${NC}"
    else
        echo -e "${RED}× Redeployment failed. Please check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}Skipping environment variable update${NC}"
fi

echo -e "${BOLD}${GREEN}===== Deployment Complete =====${NC}"
echo -e "${GREEN}BrailleBuddy is now live at https://braillebuddy.vercel.app${NC}"
echo -e "${BLUE}Key features:${NC}"
echo -e "${BLUE}- Custom fingerprinting solution for privacy-focused user identification${NC}"
echo -e "${BLUE}- TensorFlow.js integration for AI-driven adaptivity${NC}"
echo -e "${BLUE}- Haptic feedback for enhanced learning experience${NC}"
echo -e "${BLUE}- Mobile optimization for accessibility${NC}"
echo ""
echo -e "${YELLOW}Don't forget to test the application to ensure everything is working correctly!${NC}"
