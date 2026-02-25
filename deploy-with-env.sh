#!/bin/bash

# BrailleBuddy Deployment Script with Environment Variables
# This script deploys the BrailleBuddy application with all required environment variables

# Text styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}===== BrailleBuddy Deployment Script =====${NC}"
echo -e "${BLUE}This script will deploy BrailleBuddy with all required environment variables${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}No .env file found. Creating one...${NC}"
    touch .env
    echo "# BrailleBuddy Environment Variables" > .env
    echo "MONGODB_URI=mongodb+srv://your-mongodb-uri" >> .env
    echo "SESSION_SECRET=your-session-secret" >> .env
    echo "TENSORFLOW_MODEL_PATH=/models/braille-model" >> .env
    echo "HAPTIC_FEEDBACK_ENABLED=true" >> .env
    echo "MOBILE_OPTIMIZATION_ENABLED=true" >> .env
    echo "AI_ADAPTIVITY_ENABLED=true" >> .env
    echo -e "${GREEN}✓ .env file created. Please edit it with your actual values.${NC}"
    echo -e "${YELLOW}Please edit the .env file with your actual values and then run this script again.${NC}"
    exit 0
fi

# Load environment variables from .env file
echo -e "${BOLD}Step 1: Loading environment variables from .env file${NC}"
source .env
echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Create a backup branch of our current work
echo -e "${BOLD}Step 2: Creating backup of current work${NC}"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b $BACKUP_BRANCH
git add .
git commit -m "Backup before deployment with environment variables"
git push origin $BACKUP_BRANCH
echo -e "${GREEN}✓ Backup created on branch: $BACKUP_BRANCH${NC}"

# Install dependencies
echo -e "${BOLD}Step 3: Installing dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build the project
echo -e "${BOLD}Step 4: Building the project${NC}"
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

# Deploy to Vercel with environment variables
echo -e "${BOLD}Step 5: Deploying to Vercel with environment variables${NC}"

# Create a temporary .vercel.env file with the environment variables
echo -e "${YELLOW}Creating temporary environment variables file...${NC}"
echo "MONGODB_URI=$MONGODB_URI" > .vercel.env
echo "SESSION_SECRET=$SESSION_SECRET" >> .vercel.env
echo "TENSORFLOW_MODEL_PATH=$TENSORFLOW_MODEL_PATH" >> .vercel.env
echo "HAPTIC_FEEDBACK_ENABLED=$HAPTIC_FEEDBACK_ENABLED" >> .vercel.env
echo "MOBILE_OPTIMIZATION_ENABLED=$MOBILE_OPTIMIZATION_ENABLED" >> .vercel.env
echo "AI_ADAPTIVITY_ENABLED=$AI_ADAPTIVITY_ENABLED" >> .vercel.env

# Deploy with environment variables
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod --env-file .vercel.env

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    # Clean up temporary file
    rm .vercel.env
else
    echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
    # Clean up temporary file
    rm .vercel.env
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
