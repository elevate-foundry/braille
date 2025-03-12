// Simulate BBID data for the Linux machine named "Ryan Mac"
const crypto = require('crypto');

function generateSimulatedBBID() {
    const deviceName = 'Ryan Mac';
    const deviceType = 'desktop';
    const deviceOS = 'linux';
    
    // Create a simulated BBID based on your actual implementation
    const bbid = {
        version: "1.0.0",
        id: crypto.createHash('sha256').update(`${deviceName}-${Date.now()}`).digest('hex').substring(0, 16),
        metadata: {
            created: new Date(Date.now() - 86400000).toISOString(), // yesterday
            modified: new Date().toISOString(),
            name: deviceName,
            type: deviceType,
            os: deviceOS,
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
            raw: crypto.createHash('sha256').update(`${deviceName}-${deviceOS}-${deviceType}`).digest('hex'),
            bbes: `⠃⠃⠑⠎_${crypto.createHash('sha256').update(`${deviceName}-${deviceOS}-${deviceType}`).digest('hex').substring(0, 10)}`,
            algorithm: "sha256",
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
    
    return bbid;
}

// Output the simulated BBID as JSON
console.log(JSON.stringify(generateSimulatedBBID(), null, 2));
