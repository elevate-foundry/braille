# Multilingual Braille & Browser Fingerprint Demo

This project combines multilingual braille encoding with browser fingerprinting capabilities. It demonstrates both semantic compression for medical records using specialized patterns and braille-based encoding, as well as secure browser fingerprinting for user identification.

## Features

- Medical-specific pattern recognition
- Secure encryption of sensitive data
- Compression ratio analysis
- Browser fingerprinting with Fingerprint.js Pro
- MongoDB integration for visitor tracking
- Multilingual support
- Responsive UI with Tailwind CSS

## Local Development

1. Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd braille-fingerprint-app
npm install
```

2. Set up environment variables:
Create a `.env` file with the following variables:
```
OPENAI_API_KEY=your_api_key_here
FINGERPRINT_SECRET_KEY=your_fingerprint_key
MONGODB_URI=your_mongodb_connection_string
```

3. Run the development server:
```bash
npm run dev
```

4. For terminal-based demo:
```bash
# Without email report
npm start

# With email report
npm start your.email@example.com
```

## Deploying to Vercel

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

5. Set environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add the same variables from your `.env` file

## Running on Termux (Mobile)

1. Install Termux from F-Droid
2. Set up Node.js environment:
```bash
pkg update && pkg upgrade
pkg install nodejs
```

3. Clone and set up the project:
```bash
git clone <your-repo-url>
cd braille-fingerprint-app
npm install
```

4. Run the terminal demo:
```bash
npm start
```

## Best Practices

Save a new version when:
1. Adding new medical patterns or braille encodings
2. Improving compression algorithms
3. Enhancing security features
4. Adding support for new languages
5. Implementing new fingerprinting features

Best practice is to commit changes when:
- Adding new functionality
- Fixing bugs
- Updating pattern databases
- Improving compression ratios
- Adding new report types