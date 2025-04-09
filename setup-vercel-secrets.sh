#!/bin/bash

# This script reads environment variables from .env file and sets them as Vercel secrets
# without exposing the sensitive information

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# Read MongoDB URI from .env file
MONGODB_URI=$(grep MONGODB_URI .env | cut -d '=' -f2-)

# Set MongoDB URI as a Vercel secret
if [ -n "$MONGODB_URI" ]; then
  echo "Setting MONGODB_URI as a Vercel secret..."
  vercel env rm MONGODB_URI production -y || true
  echo "$MONGODB_URI" | vercel env add MONGODB_URI production
  echo "MONGODB_URI secret set successfully"
else
  echo "Error: MONGODB_URI not found in .env file"
  exit 1
fi

# Set other environment variables
echo "Setting other environment variables..."
vercel env add HAPTIC_FEEDBACK_ENABLED true production -y || true
vercel env add MOBILE_OPTIMIZATION_ENABLED true production -y || true
vercel env add AI_ADAPTIVITY_ENABLED true production -y || true

echo "All environment variables set successfully"
