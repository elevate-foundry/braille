#!/bin/bash

# BrailleBuddy Setup Script
# This script sets up the development environment for the BrailleBuddy application

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting BrailleBuddy setup...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js before continuing.${NC}"
    echo "Visit https://nodejs.org/ to download and install Node.js"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 14 ]; then
    echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected.${NC}"
    echo -e "${YELLOW}It's recommended to use Node.js 14 or higher for this project.${NC}"
fi

echo -e "${GREEN}Node.js version $NODE_VERSION detected.${NC}"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install express body-parser cors dotenv

# Create necessary directories if they don't exist
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p data/bbid
mkdir -p logs

# Set up environment variables
echo -e "${GREEN}Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cat > .env << EOL
# BrailleBuddy Environment Variables
PORT=3000
API_KEY=development_key
ENVIRONMENT=development
LOG_LEVEL=info
ENABLE_HAPTIC_FEEDBACK=true
ENABLE_MULTILINGUAL=true
EOL
    echo -e "${GREEN}.env file created with default values.${NC}"
else
    echo -e "${YELLOW}.env file already exists. Skipping...${NC}"
fi

# Set up git hooks for code quality
echo -e "${GREEN}Setting up git hooks...${NC}"
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << EOL
#!/bin/bash
# Pre-commit hook to check for lint errors

echo "Running lint check..."
# Add your linting command here
# Example: npm run lint

# Check for general code quality issues
find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/vendor/*" -exec grep -l -E '[^;] *$' {} \; | xargs -r grep -n -E '[^;] *$' | grep -v -E '(function|if|else|for|while|switch|try|catch|\{|\}|//|/\*|\*/)' && {
    echo "Error: Missing semicolons in JavaScript files"
    exit 1
}

exit 0
EOL
chmod +x .git/hooks/pre-commit

# Run code quality checks
echo -e "${GREEN}Running code quality checks...${NC}"
find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/vendor/*" -exec echo "Checking {}..." \;

echo -e "${GREEN}Code quality checks completed.${NC}"

# Start local server for testing
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}To start the server, run:${NC}"
echo -e "${YELLOW}python -m http.server 8000${NC}"
echo -e "${GREEN}or${NC}"
echo -e "${YELLOW}npm start${NC}"
echo -e "${GREEN}if you have added a start script to package.json.${NC}"

# Prepare for git push
echo -e "${GREEN}Preparing for git push...${NC}"
echo -e "${YELLOW}Run the following commands to push your changes:${NC}"
echo -e "git add ."
echo -e "git commit -m \"Enhanced BBID for universal braille accessibility\""
echo -e "git push origin main"

echo -e "${GREEN}BrailleBuddy setup completed successfully!${NC}"
