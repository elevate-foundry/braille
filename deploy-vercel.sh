#!/bin/bash

# BrailleBuddy Deployment Script
# This script deploys the BrailleBuddy application to Vercel with environment variables

# Text styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}===== BrailleBuddy Deployment Script =====${NC}"
echo -e "${BLUE}This script will deploy BrailleBuddy to Vercel${NC}"
echo ""

# Create a backup branch of our current work
echo -e "${BOLD}Step 1: Creating backup of current work${NC}"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b $BACKUP_BRANCH
git add .
git commit -m "Backup before deployment with custom fingerprinting"
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
echo -e "${BOLD}Step 4: Setting up environment variables${NC}"
echo -e "${YELLOW}Setting up environment variables for Vercel deployment...${NC}"

# Check if MongoDB URI is set
echo -e "${YELLOW}Would you like to set MONGODB_URI? (y/n)${NC}"
read -r set_mongodb
if [[ $set_mongodb == "y" ]]; then
    echo -e "${YELLOW}Enter your MongoDB URI:${NC}"
    read -r mongodb_uri
    vercel env add MONGODB_URI production
fi

# Check if Session Secret is set
echo -e "${YELLOW}Would you like to set SESSION_SECRET? (y/n)${NC}"
read -r set_session
if [[ $set_session == "y" ]]; then
    echo -e "${YELLOW}Enter your Session Secret:${NC}"
    read -r session_secret
    vercel env add SESSION_SECRET production
fi

# Check if TensorFlow Model Path is set
echo -e "${YELLOW}Would you like to set TENSORFLOW_MODEL_PATH? (y/n)${NC}"
read -r set_tensorflow
if [[ $set_tensorflow == "y" ]]; then
    echo -e "${YELLOW}Enter your TensorFlow Model Path:${NC}"
    read -r tensorflow_path
    vercel env add TENSORFLOW_MODEL_PATH production
fi

# Set haptic feedback enabled
vercel env add HAPTIC_FEEDBACK_ENABLED true production

# Set mobile optimization enabled
vercel env add MOBILE_OPTIMIZATION_ENABLED true production

# Set AI adaptivity enabled
vercel env add AI_ADAPTIVITY_ENABLED true production

echo -e "${GREEN}✓ Environment variables set up${NC}"

# Deploy to production
echo -e "${BOLD}Step 5: Deploying to Vercel${NC}"
echo -e "${YELLOW}Deploying to production...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
else
    echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${BOLD}${GREEN}===== Deployment Complete =====${NC}"
echo -e "${GREEN}BrailleBuddy is now live at https://braillebuddy.vercel.app${NC}"
echo -e "${BLUE}Key features:${NC}"
echo -e "${BLUE}- Custom fingerprinting solution for privacy-focused user identification${NC}"
echo -e "${BLUE}- TensorFlow.js integration for AI-driven adaptivity${NC}"
echo -e "${BLUE}- Haptic feedback for enhanced learning experience${NC}"
echo -e "${BLUE}- Mobile optimization for accessibility${NC}"
echo -e "${BLUE}- Multilingual support & universal Braille standards${NC}"
echo -e "${BLUE}- Tactile/keyboard input options${NC}"
echo -e "${BLUE}- Personalized progress tracking with achievements${NC}"
echo ""
echo -e "${YELLOW}Don't forget to test the application to ensure everything is working correctly!${NC}"
