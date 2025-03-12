// Simple Node.js server to expose BBID data
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Create a server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    
    // Handle specific endpoints
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
                raw: require('crypto').createHash('sha256').update('Ryan Mac Linux Firefox').digest('hex'),
                bbes: '⠃⠃⠑⠎_' + require('crypto').createHash('sha256').update('Ryan Mac Linux Firefox').digest('hex').substring(0, 10),
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
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(bbidData, null, 2));
        return;
    }
    
    // Serve static files
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'check-bbid.html'), (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Error loading index.html');
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

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`BBID API available at http://localhost:${PORT}/api/bbid`);
    console.log(`To view BBID data using curl: curl http://localhost:${PORT}/api/bbid | jq`);
});
