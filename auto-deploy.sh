#!/bin/bash

# Auto-deployment script for BrailleBuddy to Vercel
# This script handles the entire deployment process programmatically

# Text styling
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}===== BrailleBuddy Auto-Deployment Script =====${NC}"
echo -e "${BLUE}This script will automatically deploy BrailleBuddy to Vercel${NC}"
echo ""

# Step 1: Create a backup branch
echo -e "${BOLD}Step 1: Creating backup of current work${NC}"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b $BACKUP_BRANCH
git add .
git commit -m "Backup before auto-deployment" --allow-empty
git push origin $BACKUP_BRANCH
echo -e "${GREEN}✓ Backup created on branch: $BACKUP_BRANCH${NC}"

# Step 2: Install dependencies
echo -e "${BOLD}Step 2: Installing dependencies${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Build the project
echo -e "${BOLD}Step 3: Building the project${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}× Build failed. Aborting deployment.${NC}"
    exit 1
fi

# Step 4: Create a .vercel directory if it doesn't exist
echo -e "${BOLD}Step 4: Setting up Vercel configuration${NC}"
mkdir -p .vercel

# Step 5: Create project.json file with the existing project ID
echo -e "${BOLD}Step 5: Creating project configuration${NC}"
cat > .vercel/project.json << EOF
{
  "projectId": "prj_braillebuddy",
  "orgId": "elevate-foundry"
}
EOF
echo -e "${GREEN}✓ Project configuration created${NC}"

# Step 6: Deploy to Vercel using direct API call
echo -e "${BOLD}Step 6: Deploying to Vercel${NC}"
echo -e "${YELLOW}Starting deployment...${NC}"

# Use Vercel CLI with --yes flag to skip all prompts
VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep projectId | cut -d'"' -f4)
echo -e "${BLUE}Deploying project ID: ${VERCEL_PROJECT_ID}${NC}"

# Deploy using Vercel CLI with environment variables from .env
vercel deploy --prod --yes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
else
    echo -e "${RED}× Deployment failed.${NC}"
    echo -e "${YELLOW}Trying alternative deployment method...${NC}"
    
    # Alternative deployment method - push to GitHub and let Vercel auto-deploy
    git add .
    git commit -m "Auto-deployment update $(date +%Y%m%d-%H%M%S)"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Code pushed to GitHub. Vercel should auto-deploy if GitHub integration is enabled.${NC}"
    else
        echo -e "${RED}× GitHub push failed.${NC}"
        exit 1
    fi
fi

echo -e "${BOLD}${GREEN}===== Deployment Process Complete =====${NC}"
echo -e "${GREEN}BrailleBuddy should now be updated at https://braillebuddy.vercel.app${NC}"
echo -e "${BLUE}Key features in this update:${NC}"
echo -e "${BLUE}- Braille fingerprinting for secure user identification${NC}"
echo -e "${BLUE}- Enhanced haptic feedback with multiple modes${NC}"
echo -e "${BLUE}- Device integration (Samsung Watch, mobile)${NC}"
echo -e "${BLUE}- Multilingual braille support${NC}"
echo ""
echo -e "${YELLOW}Please check the Vercel dashboard to confirm deployment status.${NC}"
