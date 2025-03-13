// Batch comparison API endpoint for Vercel
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
    
    // Sample traditional fingerprinting methods vs BBID
    const testCases = [
        {
            name: 'UUID v4',
            description: 'Standard UUID used for device identification',
            sample: '550e8400-e29b-41d4-a716-446655440000',
            hash: crypto.createHash('sha256').update('550e8400-e29b-41d4-a716-446655440000').digest('hex'),
            bbes: null
        },
        {
            name: 'Browser Fingerprint',
            description: 'Traditional browser fingerprinting hash',
            sample: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
            hash: crypto.createHash('sha256').update('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124').digest('hex'),
            bbes: null
        },
        {
            name: 'Canvas Fingerprint',
            description: 'Hash based on canvas rendering differences',
            sample: 'Canvas:rgba(255,255,255,1):Arial:12px:Hello, world!',
            hash: crypto.createHash('sha256').update('Canvas:rgba(255,255,255,1):Arial:12px:Hello, world!').digest('hex'),
            bbes: null
        },
        {
            name: 'WebRTC Fingerprint',
            description: 'Network interface fingerprinting',
            sample: 'WebRTC:192.168.1.1:8.8.8.8:stun:stun.l.google.com:19302',
            hash: crypto.createHash('sha256').update('WebRTC:192.168.1.1:8.8.8.8:stun:stun.l.google.com:19302').digest('hex'),
            bbes: null
        },
        {
            name: 'Combined Fingerprint',
            description: 'Multiple signals combined',
            sample: 'Win10:Chrome91:1920x1080:en-US:America/New_York:PDF,Flash:Arial,Times',
            hash: crypto.createHash('sha256').update('Win10:Chrome91:1920x1080:en-US:America/New_York:PDF,Flash:Arial,Times').digest('hex'),
            bbes: null
        }
    ];
    
    // Convert each to BBES and calculate metrics
    testCases.forEach(testCase => {
        testCase.bbes = convertToBBES(testCase.hash);
        testCase.metrics = calculateSemanticEfficiency(testCase.hash, testCase.bbes);
    });
    
    // Add overall comparison
    const comparison = {
        averageCompressionRatio: testCases.reduce((sum, tc) => sum + tc.metrics.compressionRatio, 0) / testCases.length,
        averageSemanticEfficiency: testCases.reduce((sum, tc) => sum + tc.metrics.semanticEfficiency, 0) / testCases.length,
        bestPerformer: testCases.reduce((best, tc) => 
            tc.metrics.semanticEfficiency > best.metrics.semanticEfficiency ? tc : best, 
            testCases[0]
        ).name
    };
    
    const result = {
        testCases,
        comparison
    };
    
    res.status(200).json(result);
};
