#!/data/data/com.termux/files/usr/bin/bash

# Update packages
pkg update -y && pkg upgrade -y

# Install required packages
pkg install nodejs-lts git -y

# Install tsx globally
npm install -g tsx

# Install project dependencies
npm install

# Run the demo
npm run termux