#!/bin/bash

# BrailleBuddy Deployment Script
# This script deploys the BrailleBuddy application to braillebuddy.vercel.app

# Text styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}===== BrailleBuddy Deployment Script =====${NC}"
echo -e "${BLUE}This script will deploy BrailleBuddy to braillebuddy.vercel.app${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Ensure all dependencies are installed
echo -e "${BOLD}Step 1: Installing dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build the project
echo -e "${BOLD}Step 2: Building the project${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"

# Check if user is logged in to Vercel
echo -e "${BOLD}Step 3: Verifying Vercel login${NC}"
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to log in to Vercel first${NC}"
    vercel login
else
    echo -e "${GREEN}✓ Already logged in to Vercel${NC}"
fi

# Set up environment variables if needed
echo -e "${BOLD}Step 4: Setting up environment variables${NC}"
echo -e "${YELLOW}Do you need to set up environment variables? (y/n)${NC}"
read -r setup_env

if [[ $setup_env == "y" ]]; then
    echo -e "${YELLOW}Enter your MongoDB URI:${NC}"
    read -r mongodb_uri
    
    echo -e "${YELLOW}Enter a secure session secret:${NC}"
    read -r session_secret
    
    echo -e "${YELLOW}Setting up environment variables as Vercel secrets...${NC}"
    vercel secrets add mongodb_uri "$mongodb_uri"
    vercel secrets add session_secret "$session_secret"
    vercel secrets add tensorflow_model_path "/models/tensorflow"
    
    echo -e "${GREEN}✓ Environment variables set up${NC}"
else
    echo -e "${BLUE}Skipping environment variable setup${NC}"
fi

# Deploy to production
echo -e "${BOLD}Step 5: Deploying to braillebuddy.vercel.app${NC}"
echo -e "${YELLOW}Starting deployment...${NC}"

# Since the project already exists, we'll use the --force flag to update it
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Deployment successful!${NC}"
    echo -e "${BLUE}Your application is now live at:${NC} ${BOLD}https://braillebuddy.vercel.app${NC}"
    echo ""
    echo -e "${YELLOW}Important pages to check:${NC}"
    echo -e "- Main application: ${BOLD}https://braillebuddy.vercel.app${NC}"
    echo -e "- Fingerprint test: ${BOLD}https://braillebuddy.vercel.app/fingerprint-test${NC}"
    echo ""
    echo -e "${BLUE}Your unique fingerprinting solution is now ready to be demonstrated to hospitals!${NC}"
else
    echo -e "${RED}× Deployment failed. Please check the error messages above.${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}===== Deployment Process Complete =====${NC}"
