# BBID API Vercel Deployment Guide

This guide explains how to deploy the BBID API to Vercel to make it publicly accessible at `https://bbid-api.braillebuddy.vercel.app` or a similar domain.

## What We've Prepared

The codebase has been restructured for Vercel deployment with:

1. **Serverless API Functions** in the `/api` directory:
   - `bbid.js` - Provides sample BBID data
   - `convert.js` - Converts traditional fingerprints to BBID format
   - `batch-compare.js` - Compares BBID with traditional fingerprinting methods
   - `utils.js` - Shared utility functions

2. **Vercel Configuration** in `vercel.json`:
   - Configured for both static files and serverless functions
   - Set up API routes and redirects
   - Defined build settings

3. **Package Information** in `package.json`:
   - Defined dependencies
   - Set Node.js version requirements
   - Added project metadata

4. **Frontend** with `bbid-chatgpt-test.html`:
   - Updated to work with both local and deployed environments
   - Automatically detects if running locally or on Vercel

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Vercel

From the project directory:

```bash
vercel
```

During the deployment process, Vercel will ask you a few questions:
- Set up and deploy? Yes
- Which scope? (Select your account)
- Link to existing project? No
- Project name? bbid-api (or your preferred name)
- Directory? ./
- Want to override settings? No

### 4. Set Up Custom Domain (Optional)

After deployment, you can set up a custom domain in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain (e.g., `bbid-api.braillebuddy.vercel.app`)

### 5. Production Deployment

For production deployment with your final changes:

```bash
vercel --prod
```

## Testing Your Deployment

Once deployed, you can test your API using the following endpoints:

- Web Interface: `https://your-vercel-domain.vercel.app/`
- Sample BBID: `https://your-vercel-domain.vercel.app/api/bbid`
- Convert Fingerprint: `https://your-vercel-domain.vercel.app/api/convert` (POST)
- Batch Comparison: `https://your-vercel-domain.vercel.app/api/batch-compare`

## Using with ChatGPT

To test the semantic encoding density with ChatGPT:

1. Share the API endpoints with ChatGPT
2. Ask ChatGPT to analyze the semantic efficiency of BBID compared to traditional fingerprinting methods
3. Use the web interface to generate examples and share the results with ChatGPT

## Local Development

You can still run the API locally for development:

```bash
node bbid-api.js
```

The API will be available at `http://localhost:3001/`.
