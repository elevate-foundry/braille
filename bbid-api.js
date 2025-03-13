// Enhanced Node.js server to expose BBID data for ChatGPT testing
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Generate a behavioral fingerprint based on user interaction data
function generateBehavioralFingerprint(data) {
    // Extract key metrics from the behavioral data
    const keyboardMetrics = data.keyboardMetrics || {};
    const mouseMetrics = data.mouseMetrics || {};
    const touchMetrics = data.touchMetrics || {};
    const scrollPatterns = data.scrollPatterns || {};
    
    // Create a unique string based on the behavioral metrics
    const behavioralString = [
        data.deviceId,
        keyboardMetrics.averageTypingSpeed,
        keyboardMetrics.keyPressCount,
        mouseMetrics.averageSpeed,
        mouseMetrics.clickCount,
        touchMetrics.touchCount,
        scrollPatterns.scrollEvents,
        data.timeOnPage ? data.timeOnPage.activeTime : 0
    ].join('_');
    
    // Generate a hash from the behavioral string
    const behavioralHash = crypto.createHash('sha256').update(behavioralString).digest('hex');
    
    // Convert to BBES format
    return convertToBBES(behavioralHash);
}

// Utility function to convert traditional fingerprint to BBES format
function convertToBBES(fingerprint) {
    // This is a simplified implementation - in production, use the full BBES encoding
    const prefix = '⠃⠃⠑⠎_'; // BBES in braille
    const brailleChars = [
        '⠁', '⠃', '⠉', '⠙', '⠑', '⠋', '⠛', '⠓', '⠊', '⠚', '⠅', '⠇', 
        '⠍', '⠝', '⠕', '⠏', '⠟', '⠗', '⠎', '⠞', '⠥', '⠧', '⠺', '⠭', 
        '⠽', '⠵', '⠯', '⠿', '⠷', '⠮', '⠾', '⠡'
    ];
    
    // Convert hex fingerprint to braille characters
    let bbesResult = prefix;
    for (let i = 0; i < fingerprint.length; i += 2) {
        if (i + 1 < fingerprint.length) {
            const hexPair = fingerprint.substring(i, i + 2);
            const decimalValue = parseInt(hexPair, 16);
            const brailleIndex = decimalValue % brailleChars.length;
            bbesResult += brailleChars[brailleIndex];
        }
    }
    
    return bbesResult;
}

// Calculate semantic efficiency metrics
function calculateSemanticEfficiency(original, bbes) {
    const originalLength = original.length;
    const bbesLength = bbes.length;
    
    // Basic compression ratio
    const compressionRatio = originalLength / bbesLength;
    
    // Entropy calculation (Shannon entropy)
    function calculateEntropy(text) {
        const charFreq = {};
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            charFreq[char] = (charFreq[char] || 0) + 1;
        }
        
        let entropy = 0;
        for (const char in charFreq) {
            const prob = charFreq[char] / text.length;
            entropy -= prob * Math.log2(prob);
        }
        
        return entropy;
    }
    
    const originalEntropy = calculateEntropy(original);
    const bbesEntropy = calculateEntropy(bbes);
    
    // Semantic density = entropy per character
    const originalDensity = originalEntropy / originalLength;
    const bbesDensity = bbesEntropy / bbesLength;
    
    // Semantic efficiency = ratio of semantic densities
    const semanticEfficiency = bbesDensity / originalDensity;
    
    return {
        originalLength,
        bbesLength,
        compressionRatio,
        originalEntropy,
        bbesEntropy,
        originalDensity,
        bbesDensity,
        semanticEfficiency
    };
}

// Create a server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    
    // Handle POST request for fingerprint conversion
    if (parsedUrl.pathname === '/api/convert' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (!data.fingerprint) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing fingerprint parameter' }));
                    return;
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
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result, null, 2));
            } catch (error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        
        return;
    }
    
    // Handle POST request for behavioral fingerprinting
    if (parsedUrl.pathname === '/api/behavioral-fingerprint' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                if (!data.deviceId) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing deviceId parameter', success: false }));
                    return;
                }
                
                // Generate a behavioral fingerprint based on the data
                const behavioralFingerprint = generateBehavioralFingerprint(data);
                
                const result = {
                    success: true,
                    bbidFingerprint: behavioralFingerprint,
                    message: 'Behavioral fingerprint generated successfully'
                };
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result, null, 2));
            } catch (error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message, success: false }));
            }
        });
        
        return;
    }
    
    // Handle GET request for sample BBID data
    if (parsedUrl.pathname === '/api/bbid') {
        // Simulate BBID data for the Linux machine named "Ryan Mac"
        const bbidData = {
            id: 'bbid_' + Buffer.from('Ryan Mac').toString('hex'),
            metadata: {
                created: new Date(Date.now() - 86400000).toISOString(), // yesterday
                modified: new Date().toISOString(),
                name: 'Ryan Mac',
                type: 'desktop',
                os: 'linux',
                osVersion: 'Ubuntu 22.04',
                browser: 'Firefox',
                browserVersion: '115.0',
                processor: 'x86_64',
                screen: '1920x1080',
                language: 'en-US',
                timezone: 'America/Denver',
                location: {
                    city: 'Salt Lake City',
                    region: 'UT',
                    country: 'USA',
                    coordinates: {
                        latitude: 40.76,
                        longitude: -111.89
                    }
                },
                userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0'
            },
            fingerprint: {
                raw: crypto.createHash('sha256').update('Ryan Mac Linux Firefox').digest('hex'),
                bbes: convertToBBES(crypto.createHash('sha256').update('Ryan Mac Linux Firefox').digest('hex')),
                algorithm: 'sha256',
                components: {
                    userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0',
                    language: 'en-US',
                    platform: 'Linux x86_64',
                    screenResolution: '1920x1080',
                    timezone: 'America/Denver',
                    plugins: 'PDF Viewer, Firefox PDF Viewer',
                    fonts: 'Ubuntu, DejaVu Sans, Liberation Sans'
                }
            },
            usage: {
                lastSeen: new Date().toISOString(),
                visitCount: 3,
                totalTimeSpent: 1200,
                features: ['learn', 'practice', 'settings'],
                mcpCompatible: true
            },
            preferences: {
                hapticFeedback: true,
                voiceAssistant: true,
                theme: 'system',
                accessibility: {
                    highContrast: false,
                    largeText: false,
                    screenReader: false
                }
            }
        };
        
        // Add semantic efficiency metrics
        bbidData.semanticAnalysis = calculateSemanticEfficiency(
            bbidData.fingerprint.raw,
            bbidData.fingerprint.bbes
        );
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(bbidData, null, 2));
        return;
    }
    
    // Handle batch comparison endpoint
    if (parsedUrl.pathname === '/api/batch-compare') {
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
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result, null, 2));
        return;
    }
    
    // Serve static files
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'bbid-chatgpt-test.html'), (err, data) => {
            if (err) {
                // Try to serve check-bbid.html as fallback
                fs.readFile(path.join(__dirname, 'check-bbid.html'), (err2, data2) => {
                    if (err2) {
                        res.statusCode = 500;
                        res.end('Error loading index.html');
                        return;
                    }
                    res.setHeader('Content-Type', 'text/html');
                    res.end(data2);
                });
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
        });
        return;
    }
    
    // 404 for everything else
    res.statusCode = 404;
    res.end('Not Found');
});

// Start the server on a different port to avoid conflicts
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`BBID Testing Server running at http://localhost:${PORT}/`);
    console.log(`BBID API available at http://localhost:${PORT}/api/bbid`);
    console.log(`Fingerprint conversion API: http://localhost:${PORT}/api/convert`);
    console.log(`Batch comparison API: http://localhost:${PORT}/api/batch-compare`);
    console.log(`Behavioral fingerprinting API: http://localhost:${PORT}/api/behavioral-fingerprint`);
    console.log(`\nExample curl commands:`);
    console.log(`  curl http://localhost:${PORT}/api/bbid | jq`);
    console.log(`  curl -X POST -H "Content-Type: application/json" -d '{"fingerprint":"my-device-fingerprint"}' http://localhost:${PORT}/api/convert | jq`);
    console.log(`  curl http://localhost:${PORT}/api/batch-compare | jq`);
});
