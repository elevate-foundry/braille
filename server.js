// Development API server for BrailleBuddy
// This server handles API requests during local development

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Use port 3001 for API server

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// API routes
app.post('/api/customFingerprint', async (req, res) => {
  try {
    // Dynamically import the handler to avoid ESM/CJS issues
    const { default: handler } = await import('./api/customFingerprint.ts');
    return handler(req, res);
  } catch (error) {
    console.error('Error handling customFingerprint request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Consent logging endpoint
app.post('/api/consentLog', async (req, res) => {
  try {
    // Dynamically import the handler to avoid ESM/CJS issues
    const { default: handler } = await import('./api/consentLog.ts');
    return handler(req, res);
  } catch (error) {
    console.error('Error handling consent logging request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is working!' });
});

// Serve the frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`BrailleBuddy API server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/...`);
});
