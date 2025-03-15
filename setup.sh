#!/bin/bash
pkg update -y && pkg upgrade -y
pkg install nodejs git -y
npm install -g tsx

# Install project dependencies
npm install

# Run the demo
npm run termux