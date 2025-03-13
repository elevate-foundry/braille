// BBID API endpoint for Vercel
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
    
    res.status(200).json(bbidData);
};
