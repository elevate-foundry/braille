// Convert API endpoint for Vercel
const crypto = require('crypto');
const { convertToBBES, calculateSemanticEfficiency, setCorsHeaders } = require('./utils');

module.exports = (req, res) => {
    // Set CORS headers
    setCorsHeaders(res);
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    
    // Only handle POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const data = req.body;
        
        if (!data.fingerprint) {
            return res.status(400).json({ error: 'Missing fingerprint parameter' });
        }
        
        const originalFingerprint = data.fingerprint;
        
        // Generate SHA-256 hash if not already a hash
        let hashFingerprint = originalFingerprint;
        if (!/^[0-9a-f]{64}$/i.test(originalFingerprint)) {
            hashFingerprint = crypto.createHash('sha256').update(originalFingerprint).digest('hex');
        }
        
        // Convert to BBES format
        const bbesFingerprint = convertToBBES(hashFingerprint);
        
        // Calculate semantic efficiency metrics
        const metrics = calculateSemanticEfficiency(hashFingerprint, bbesFingerprint);
        
        const result = {
            original: originalFingerprint,
            hash: hashFingerprint,
            bbes: bbesFingerprint,
            metrics: metrics
        };
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
