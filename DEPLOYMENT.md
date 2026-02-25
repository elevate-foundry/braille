# BrailleBuddy Deployment Guide

This guide provides step-by-step instructions for deploying the BrailleBuddy application to the braillebuddy.vercel.app domain.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Vercel CLI](https://vercel.com/docs/cli) installed (`npm install -g vercel`)
3. MongoDB Atlas account (for the database)

## Environment Variables

Before deploying, make sure to set up the following environment variables in Vercel:

- `MONGODB_URI`: Your MongoDB connection string (required for fingerprint storage)
- `SESSION_SECRET`: A secure random string for session encryption
- `AI_COMPRESSION_ENABLED`: Set to 'true' to enable AI compression features
- `TENSORFLOW_MODEL_PATH`: Path to your TensorFlow model (if using a pre-trained model)

These variables have been configured in the vercel.json file to use Vercel's environment secrets. You'll need to create these secrets in the Vercel dashboard.

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub:
   ```bash
   # If you haven't set up the remote yet
   git remote add origin https://github.com/your-username/your-repo.git
   
   # Push your branch
   git push -u origin tensorflow-integration
   ```

2. Import your GitHub repository in the Vercel dashboard:
   - Go to https://vercel.com/new
   - Select your repository
   - Configure the project:
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
   - Add the environment variables mentioned above
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy the project:
   ```bash
   vercel
   ```

3. Follow the interactive prompts:
   - Set up and deploy: `Y`
   - Link to existing project: Select `N` for a new project
   - Project name: Accept default or enter a custom name
   - Directory: Accept default (current directory)
   - Override settings: `N` (vercel.json will be used)

4. Set environment variables as secrets:
   ```bash
   vercel secrets add mongodb_uri "your-mongodb-connection-string"
   vercel secrets add session_secret "your-secure-random-string"
   vercel secrets add tensorflow_model_path "path/to/your/model"
   ```
   
   Then link them to your project:
   ```bash
   vercel env add MONGODB_URI
   vercel env add SESSION_SECRET
   vercel env add AI_COMPRESSION_ENABLED
   vercel env add TENSORFLOW_MODEL_PATH
   ```

5. Deploy to the braillebuddy.vercel.app domain:
   ```bash
   vercel --name braillebuddy --prod
   ```

## Post-Deployment Verification

After deployment, verify the following:

1. The application loads correctly
2. TensorFlow.js is working properly for AI-driven adaptivity
3. MongoDB connection is established
4. Custom fingerprinting solution is correctly identifying users
5. Haptic feedback works on mobile devices

## Troubleshooting

### TensorFlow.js Issues

If TensorFlow.js is not loading correctly:
- Check browser console for errors
- Verify that the memory and maxDuration settings in vercel.json are sufficient
- Consider using a CDN version of TensorFlow.js if needed

### MongoDB Connection Issues

If MongoDB is not connecting:
- Verify your connection string is correct
- Ensure your IP whitelist in MongoDB Atlas includes Vercel's IPs (0.0.0.0/0 for production)
- Check that your database user has the correct permissions
- Make sure your database is named 'braillebuddy' or update the connection string accordingly

You can test the MongoDB connection and fingerprint storage locally with:
```bash
npm run test:mongodb
```

### Performance Optimization

For better performance:
- Enable Vercel's Edge Network caching
- Implement code splitting for TensorFlow.js models
- Use WebWorkers for intensive TensorFlow.js operations

## Continuous Deployment

Set up continuous deployment by:
1. Connecting your GitHub repository to Vercel
2. Configuring automatic deployments for specific branches
3. Setting up preview deployments for pull requests

## Monitoring

Monitor your application using:
- Vercel Analytics
- MongoDB Atlas monitoring
- Custom logging solutions

For any issues, refer to the [Vercel documentation](https://vercel.com/docs) or [TensorFlow.js documentation](https://www.tensorflow.org/js).
