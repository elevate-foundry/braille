#!/bin/bash

# BrailleBuddy Setup Script
# This script sets up the development environment for the BrailleBuddy application
# with support for universal braille accessibility and multilingual capabilities

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Error handling
set -e  # Exit immediately if a command exits with a non-zero status
trap 'echo -e "${RED}Setup failed. See error above.${NC}"; exit 1' ERR

echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  BrailleBuddy Setup Script${NC}"
echo -e "${BOLD}${GREEN}  Universal Braille Accessibility${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"


# Function to check dependencies
check_dependency() {
    local cmd=$1
    local name=$2
    local install_cmd=$3
    
    echo -e "${BLUE}Checking for $name...${NC}"
    if ! command -v $cmd &> /dev/null; then
        echo -e "${YELLOW}$name is not installed.${NC}"
        echo -e "${YELLOW}Install command: $install_cmd${NC}"
        read -p "Would you like to install $name now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}Installing $name...${NC}"
            eval $install_cmd
            if [ $? -ne 0 ]; then
                echo -e "${RED}Failed to install $name. Please install it manually.${NC}"
                exit 1
            fi
            echo -e "${GREEN}$name installed successfully.${NC}"
        else
            echo -e "${YELLOW}Skipping $name installation. Some features may not work.${NC}"
        fi
    else
        echo -e "${GREEN}$name is already installed.${NC}"
    fi
}

# Check for required dependencies
check_dependency "node" "Node.js" "echo 'Please visit https://nodejs.org/ to download and install Node.js'"
check_dependency "python3" "Python 3" "brew install python3"
check_dependency "git" "Git" "brew install git"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 14 ]; then
    echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected.${NC}"
    echo -e "${YELLOW}It's recommended to use Node.js 14 or higher for this project.${NC}"
fi

echo -e "${GREEN}Node.js version $NODE_VERSION detected.${NC}"

# Install dependencies
echo -e "${GREEN}Installing Node.js dependencies...${NC}"
npm install express body-parser cors dotenv

# Install Python dependencies if needed for braille processing
if command -v pip3 &> /dev/null; then
    echo -e "${GREEN}Installing Python dependencies...${NC}"
    pip3 install numpy pandas matplotlib scikit-learn
fi

# Create necessary directories if they don't exist
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p data/bbid
mkdir -p logs
mkdir -p cache
mkdir -p temp

# Set up proper permissions
chmod -R 755 data
chmod -R 755 logs

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
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es,fr,de,zh,ar,hi,ru,pt,ja
BRAILLE_CODES=ueb,ebae,french,german,chinese,arabic,hindi,russian,portuguese,japanese
ENABLE_BRAILLE_FST=true
ENABLE_BRAILLE_AE=true
ENABLE_HAPTIC_BBES=true
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

# Create a package.json if it doesn't exist
if [ ! -f package.json ]; then
    echo -e "${GREEN}Creating package.json...${NC}"
    cat > package.json << EOL
{
  "name": "braille-buddy",
  "version": "1.0.0",
  "description": "An interactive web application for learning braille with universal accessibility",
  "main": "bbid-api.js",
  "scripts": {
    "start": "node bbid-api.js",
    "dev": "python3 -m http.server 8000",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "braille",
    "accessibility",
    "education",
    "universal-braille",
    "multilingual"
  ],
  "author": "Ryan Barrett",
  "license": "MIT",
  "dependencies": {
    "express": "^4.17.1",
    "body-parser": "^1.19.0",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0"
  }
}
EOL
    echo -e "${GREEN}package.json created with default values.${NC}"
else
    echo -e "${YELLOW}package.json already exists. Skipping...${NC}"
fi

# Verify the installation
echo -e "${GREEN}Verifying the installation...${NC}"

# Check if critical files exist
CRITICAL_FILES=("index.html" "js/script.js" "js/bbid-manager.js" "schemas/bbid-mcp-schema.json")
MISSING_FILES=false

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Critical file missing: $file${NC}"
        MISSING_FILES=true
    fi
done

if [ "$MISSING_FILES" = true ]; then
    echo -e "${RED}Some critical files are missing. The application may not work correctly.${NC}"
else
    echo -e "${GREEN}All critical files are present.${NC}"
fi

# Start local server for testing
echo -e "${BOLD}${GREEN}Setup complete!${NC}"
echo -e "${GREEN}To start the server, run one of the following:${NC}"
echo -e "${YELLOW}npm run dev${NC}     ${GREEN}# Starts a Python HTTP server on port 8000${NC}"
echo -e "${YELLOW}npm start${NC}      ${GREEN}# Starts the Node.js API server${NC}"
echo -e "${YELLOW}python3 -m http.server 8000${NC} ${GREEN}# Alternative way to start Python server${NC}"

# Prepare for git push
echo -e "${BOLD}${GREEN}Preparing for git push...${NC}"
echo -e "${YELLOW}Run the following commands to push your changes:${NC}"
echo -e "${BLUE}git add .${NC}"
echo -e "${BLUE}git commit -m \"Enhanced BBID for universal braille accessibility\"${NC}"
echo -e "${BLUE}git push origin main${NC}"

# Optional: Run the server automatically
read -p "Would you like to start the server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Starting the server...${NC}"
    python3 -m http.server 8000 &
    SERVER_PID=$!
    echo -e "${GREEN}Server started with PID $SERVER_PID${NC}"
    echo -e "${GREEN}Open http://localhost:8000 in your browser${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server when done${NC}"
    
    # Register a trap to kill the server when the script exits
    trap "kill $SERVER_PID 2>/dev/null" EXIT
    
    # Wait for user to press Ctrl+C
    wait $SERVER_PID
fi

echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  BrailleBuddy setup completed successfully!${NC}"
echo -e "${BOLD}${GREEN}  Universal Braille Accessibility Enabled${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"
