# MongoDB Setup for BrailleBuddy BBID System

This document provides instructions for setting up MongoDB integration with the BrailleBuddy BBID system deployed on Vercel.

## MongoDB Configuration

To enable the behavioral fingerprinting and device logging functionality, you need to set up the following environment variables in your Vercel project:

1. **MONGODB_USER**: Your MongoDB Atlas username
2. **MONGODB_PASSWORD**: Your MongoDB Atlas password
3. **MONGODB_CLUSTER**: Your MongoDB Atlas cluster address (e.g., `cluster0.abc123.mongodb.net`)
4. **MONGODB_DATABASE**: Your MongoDB database name (e.g., `bbid`)

## Setting Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select the BrailleBuddy project
3. Navigate to "Settings" > "Environment Variables"
4. Add the following environment variables:
   - `MONGODB_USER`
   - `MONGODB_PASSWORD`
   - `MONGODB_CLUSTER`
   - `MONGODB_DATABASE`

## Verifying the Connection

After setting up the environment variables, you can verify the MongoDB connection by:

1. Visiting the recognition demo page
2. Interacting with the page to generate behavioral data
3. Checking the MongoDB Atlas dashboard to see if the data is being stored

## Database Collections

The system uses the following collections in the MongoDB database:

- `devices`: Stores device fingerprinting information
- `behavioral_fingerprints`: Stores behavioral fingerprinting data

## Troubleshooting

If data is not appearing in your MongoDB database:

1. Check that all environment variables are correctly set in Vercel
2. Verify that your MongoDB Atlas IP access list includes Vercel's IP addresses (you may need to allow access from all IPs: `0.0.0.0/0`)
3. Check the Vercel function logs for any connection errors
4. Ensure the MongoDB user has read/write permissions for the database

## Local Development

For local development, you can create a `.env` file in the project root with the following content:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bbid?retryWrites=true&w=majority
```

Replace `username`, `password`, `cluster`, and `bbid` with your actual MongoDB credentials.
