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
    const motionMetrics = data.motionMetrics || {};
    const scrollPatterns = data.scrollPatterns || {};
    const formInteractions = data.formInteractions || {};
    const timeOnPage = data.timeOnPage || {};
    const interactionFlow = data.interactionFlow || [];
    
    // Calculate advanced metrics
    
    // 1. Keyboard dynamics analysis
    const keyboardProfile = {
        typingSpeed: keyboardMetrics.averageTypingSpeed || 0,
        keyPressCount: keyboardMetrics.keyPressCount || 0,
        keyPressIntervals: calculateStatistics(keyboardMetrics.keyPressIntervals || []),
        keyFrequency: calculateKeyFrequency(keyboardMetrics.keyCodes || {}),
        errorRate: calculateErrorRate(keyboardMetrics.keyCodes || {})
    };
    
    // 2. Mouse behavior analysis
    const mouseProfile = {
        clickFrequency: mouseMetrics.clickCount || 0,
        moveIntensity: mouseMetrics.moveCount || 0,
        averageSpeed: mouseMetrics.averageSpeed || 0,
        movementPatterns: calculateMovementPatterns(mouseMetrics.positions || []),
        clickDistribution: calculateClickDistribution(mouseMetrics.clickPositions || [])
    };
    
    // 3. Touch interaction analysis
    const touchProfile = {
        touchFrequency: touchMetrics.touchCount || 0,
        averagePressure: touchMetrics.averagePressure || 0,
        swipePatterns: calculateSwipePatterns(touchMetrics.touchPositions || []),
        multiTouchUsage: calculateMultiTouchUsage(touchMetrics.touchAreas || [])
    };
    
    // 4. Motion and orientation analysis
    const motionProfile = {
        deviceStability: motionMetrics.stability || 0,
        orientationChanges: calculateOrientationChanges(motionMetrics.orientationSamples || []),
        movementIntensity: calculateMovementIntensity(motionMetrics.accelerationSamples || [])
    };
    
    // 5. Scroll behavior analysis
    const scrollProfile = {
        scrollFrequency: scrollPatterns.scrollEvents || 0,
        scrollDirectionChanges: scrollPatterns.scrollDirectionChanges || 0,
        scrollSpeed: calculateStatistics(scrollPatterns.scrollSpeeds || [])
    };
    
    // 6. Form interaction analysis
    const formProfile = {
        focusEvents: formInteractions.focusEvents || 0,
        blurEvents: formInteractions.blurEvents || 0,
        completionTimes: calculateStatistics(Object.values(formInteractions.completionTime || {}))
    };
    
    // 7. Session behavior analysis
    const sessionProfile = {
        totalTime: timeOnPage.totalTime || 0,
        activeTime: timeOnPage.activeTime || 0,
        activityRatio: timeOnPage.totalTime ? (timeOnPage.activeTime / timeOnPage.totalTime) : 0,
        interactionDensity: calculateInteractionDensity(interactionFlow)
    };
    
    // Calculate uniqueness score (0-10 scale)
    const uniquenessScore = calculateUniquenessScore({
        keyboardProfile,
        mouseProfile,
        touchProfile,
        motionProfile,
        scrollProfile,
        formProfile,
        sessionProfile
    });
    
    // Create a comprehensive behavioral string with weighted components
    const behavioralString = JSON.stringify({
        deviceId: data.deviceId,
        keyboard: keyboardProfile,
        mouse: mouseProfile,
        touch: touchProfile,
        motion: motionProfile,
        scroll: scrollProfile,
        form: formProfile,
        session: sessionProfile,
        uniquenessScore
    });
    
    // Generate a hash from the behavioral string
    const behavioralHash = crypto.createHash('sha256').update(behavioralString).digest('hex');
    
    // Convert to BBES format
    return convertToBBES(behavioralHash);
}

// Helper functions for behavioral analysis

// Calculate basic statistics for an array of values
function calculateStatistics(values) {
    if (!values || values.length === 0) return { mean: 0, median: 0, stdDev: 0 };
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 ?
        (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2 :
        sortedValues[Math.floor(sortedValues.length / 2)];
    
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, median, stdDev };
}

// Calculate key frequency distribution
function calculateKeyFrequency(keyCodes) {
    const total = Object.values(keyCodes).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};
    
    const result = {};
    for (const [key, count] of Object.entries(keyCodes)) {
        result[key] = count / total;
    }
    return result;
}

// Calculate typing error rate based on backspace/delete usage
function calculateErrorRate(keyCodes) {
    const backspaceCount = keyCodes['8'] || 0;
    const deleteCount = keyCodes['46'] || 0;
    const totalKeyPresses = Object.values(keyCodes).reduce((sum, count) => sum + count, 0);
    
    return totalKeyPresses > 0 ? (backspaceCount + deleteCount) / totalKeyPresses : 0;
}

// Analyze mouse movement patterns
function calculateMovementPatterns(positions) {
    if (!positions || positions.length < 2) return { straightness: 0, curvature: 0 };
    
    let totalDistance = 0;
    let directDistance = 0;
    
    for (let i = 1; i < positions.length; i++) {
        const [x1, y1] = positions[i-1];
        const [x2, y2] = positions[i];
        totalDistance += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    if (positions.length >= 2) {
        const [startX, startY] = positions[0];
        const [endX, endY] = positions[positions.length - 1];
        directDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    }
    
    const straightness = totalDistance > 0 ? directDistance / totalDistance : 0;
    const curvature = 1 - straightness;
    
    return { straightness, curvature };
}

// Analyze mouse click distribution on screen
function calculateClickDistribution(clickPositions) {
    if (!clickPositions || clickPositions.length === 0) return { entropy: 0 };
    
    // Divide screen into a 5x5 grid and count clicks in each cell
    const grid = Array(5).fill().map(() => Array(5).fill(0));
    
    clickPositions.forEach(([x, y]) => {
        const gridX = Math.min(Math.floor(x / (window.innerWidth / 5)), 4);
        const gridY = Math.min(Math.floor(y / (window.innerHeight / 5)), 4);
        grid[gridY][gridX]++;
    });
    
    // Calculate entropy of the distribution
    const flatGrid = grid.flat();
    const total = flatGrid.reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return { entropy: 0 };
    
    let entropy = 0;
    flatGrid.forEach(count => {
        if (count > 0) {
            const probability = count / total;
            entropy -= probability * Math.log2(probability);
        }
    });
    
    // Normalize entropy (max entropy for 25 cells is log2(25) ≈ 4.64)
    const normalizedEntropy = entropy / Math.log2(25);
    
    return { entropy: normalizedEntropy };
}

// Analyze touch swipe patterns
function calculateSwipePatterns(touchPositions) {
    if (!touchPositions || touchPositions.length < 2) return { direction: 'none', length: 0 };
    
    // Calculate dominant direction and average swipe length
    let horizontalDistance = 0;
    let verticalDistance = 0;
    let totalDistance = 0;
    
    for (let i = 1; i < touchPositions.length; i++) {
        const [x1, y1] = touchPositions[i-1];
        const [x2, y2] = touchPositions[i];
        
        horizontalDistance += (x2 - x1);
        verticalDistance += (y2 - y1);
        totalDistance += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    const direction = Math.abs(horizontalDistance) > Math.abs(verticalDistance) ?
        (horizontalDistance > 0 ? 'right' : 'left') :
        (verticalDistance > 0 ? 'down' : 'up');
    
    const averageLength = totalDistance / (touchPositions.length - 1);
    
    return { direction, length: averageLength };
}

// Analyze multi-touch usage
function calculateMultiTouchUsage(touchAreas) {
    if (!touchAreas || touchAreas.length === 0) return { multiTouchRatio: 0 };
    
    const multiTouchCount = touchAreas.filter(area => area > 1).length;
    return { multiTouchRatio: multiTouchCount / touchAreas.length };
}

// Analyze device orientation changes
function calculateOrientationChanges(orientationSamples) {
    if (!orientationSamples || orientationSamples.length < 2) return { changeFrequency: 0 };
    
    let changes = 0;
    for (let i = 1; i < orientationSamples.length; i++) {
        const [alpha1, beta1, gamma1] = orientationSamples[i-1];
        const [alpha2, beta2, gamma2] = orientationSamples[i];
        
        // Detect significant orientation change
        if (Math.abs(beta2 - beta1) > 45 || Math.abs(gamma2 - gamma1) > 45) {
            changes++;
        }
    }
    
    return { changeFrequency: changes / (orientationSamples.length - 1) };
}

// Analyze device movement intensity
function calculateMovementIntensity(accelerationSamples) {
    if (!accelerationSamples || accelerationSamples.length === 0) return { intensity: 0 };
    
    const magnitudes = accelerationSamples.map(([x, y, z]) => Math.sqrt(x*x + y*y + z*z));
    const stats = calculateStatistics(magnitudes);
    
    return { intensity: stats.mean, variability: stats.stdDev };
}

// Calculate interaction density from interaction flow
function calculateInteractionDensity(interactionFlow) {
    if (!interactionFlow || interactionFlow.length === 0) return { density: 0 };
    
    // Group interactions by type
    const typeCount = {};
    interactionFlow.forEach(interaction => {
        typeCount[interaction.type] = (typeCount[interaction.type] || 0) + 1;
    });
    
    // Calculate entropy of interaction types
    const total = interactionFlow.length;
    let entropy = 0;
    
    Object.values(typeCount).forEach(count => {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
    });
    
    // Normalize by maximum possible entropy
    const maxEntropy = Math.log2(Object.keys(typeCount).length || 1);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
    
    return { 
        density: interactionFlow.length / 60, // interactions per minute
        diversity: normalizedEntropy
    };
}

// Detect device type based on behavioral data
function detectDeviceType(data) {
    // Check for touch events (indicates mobile or tablet)
    const hasTouchEvents = data.touchMetrics && data.touchMetrics.touchCount > 0;
    
    // Check for motion events (indicates mobile or tablet)
    const hasMotionEvents = data.motionMetrics && 
        (data.motionMetrics.orientationSamples?.length > 0 || 
         data.motionMetrics.accelerationSamples?.length > 0);
    
    // Check for mouse events (indicates laptop/desktop)
    const hasMouseEvents = data.mouseMetrics && 
        (data.mouseMetrics.clickCount > 0 || data.mouseMetrics.moveCount > 0);
    
    // Check for keyboard events (more common on laptops/desktops)
    const hasKeyboardEvents = data.keyboardMetrics && data.keyboardMetrics.keyPressCount > 0;
    
    // Determine screen size if available (helps distinguish tablet from phone)
    const screenWidth = data.deviceInfo?.screen?.split('x')[0] || 0;
    
    if (hasTouchEvents || hasMotionEvents) {
        // It's a mobile device (phone or tablet)
        if (screenWidth >= 768) {
            return 'tablet';
        } else {
            return 'smartphone';
        }
    } else if (hasMouseEvents || hasKeyboardEvents) {
        return 'laptop';
    } else {
        // Default if we can't determine
        return 'unknown';
    }
}

// Calculate overall uniqueness score
function calculateUniquenessScore(profiles) {
    // Weight factors for different profile components
    const weights = {
        keyboard: 0.25,
        mouse: 0.20,
        touch: 0.15,
        motion: 0.10,
        scroll: 0.10,
        form: 0.10,
        session: 0.10
    };
    
    // Calculate component scores (0-10 scale)
    const scores = {
        keyboard: calculateKeyboardScore(profiles.keyboardProfile),
        mouse: calculateMouseScore(profiles.mouseProfile),
        touch: calculateTouchScore(profiles.touchProfile),
        motion: calculateMotionScore(profiles.motionProfile),
        scroll: calculateScrollScore(profiles.scrollProfile),
        form: calculateFormScore(profiles.formProfile),
        session: calculateSessionScore(profiles.sessionProfile)
    };
    
    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [component, weight] of Object.entries(weights)) {
        if (scores[component] > 0) {
            totalScore += scores[component] * weight;
            totalWeight += weight;
        }
    }
    
    // Normalize to 0-10 scale
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : '0.0';
}

// Component scoring functions (each returns a value from 0-10)
function calculateKeyboardScore(profile) {
    if (!profile || profile.keyPressCount === 0) return 0;
    
    // Higher score for more typing, more consistent intervals, and lower error rate
    const typingScore = Math.min(profile.typingSpeed / 10, 10);
    const consistencyScore = profile.keyPressIntervals.stdDev < 200 ? 10 : (2000 / profile.keyPressIntervals.stdDev);
    const errorScore = 10 * (1 - Math.min(profile.errorRate * 5, 1));
    
    return (typingScore * 0.4 + consistencyScore * 0.4 + errorScore * 0.2);
}

function calculateMouseScore(profile) {
    if (!profile || (profile.clickFrequency === 0 && profile.moveIntensity === 0)) return 0;
    
    const movementScore = Math.min(profile.moveIntensity / 100, 10);
    const clickScore = Math.min(profile.clickFrequency, 10);
    const patternScore = profile.movementPatterns.curvature * 10;
    const distributionScore = profile.clickDistribution.entropy * 10;
    
    return (movementScore * 0.3 + clickScore * 0.3 + patternScore * 0.2 + distributionScore * 0.2);
}

function calculateTouchScore(profile) {
    if (!profile || profile.touchFrequency === 0) return 0;
    
    const touchScore = Math.min(profile.touchFrequency / 5, 10);
    const swipeScore = profile.swipePatterns.length > 0 ? Math.min(profile.swipePatterns.length / 50, 10) : 0;
    const multiTouchScore = profile.multiTouchUsage.multiTouchRatio * 10;
    
    return (touchScore * 0.4 + swipeScore * 0.4 + multiTouchScore * 0.2);
}

function calculateMotionScore(profile) {
    if (!profile || (profile.deviceStability === 0 && !profile.movementIntensity)) return 0;
    
    const stabilityScore = profile.deviceStability * 10;
    const orientationScore = profile.orientationChanges.changeFrequency * 10;
    const intensityScore = Math.min(profile.movementIntensity.intensity, 10);
    
    return (stabilityScore * 0.4 + orientationScore * 0.3 + intensityScore * 0.3);
}

function calculateScrollScore(profile) {
    if (!profile || profile.scrollFrequency === 0) return 0;
    
    const frequencyScore = Math.min(profile.scrollFrequency / 10, 10);
    const directionScore = Math.min(profile.scrollDirectionChanges / 5, 10);
    const speedScore = profile.scrollSpeed.mean > 0 ? Math.min(profile.scrollSpeed.mean / 100, 10) : 0;
    
    return (frequencyScore * 0.4 + directionScore * 0.3 + speedScore * 0.3);
}

function calculateFormScore(profile) {
    if (!profile || (profile.focusEvents === 0 && profile.blurEvents === 0)) return 0;
    
    const interactionScore = Math.min((profile.focusEvents + profile.blurEvents) / 5, 10);
    const completionScore = profile.completionTimes.mean > 0 ? 
        Math.min(10000 / profile.completionTimes.mean, 10) : 0;
    
    return (interactionScore * 0.6 + completionScore * 0.4);
}

function calculateSessionScore(profile) {
    if (!profile || profile.totalTime === 0) return 0;
    
    const timeScore = Math.min(profile.activeTime / 60000, 10); // Up to 10 for 1 minute active
    const ratioScore = profile.activityRatio * 10;
    const densityScore = Math.min(profile.interactionDensity.density, 10);
    const diversityScore = profile.interactionDensity.diversity * 10;
    
    return (timeScore * 0.3 + ratioScore * 0.2 + densityScore * 0.3 + diversityScore * 0.2);
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
                
                // Calculate uniqueness score for display purposes
                const uniquenessScore = calculateUniquenessScore({
                    keyboardProfile: {
                        typingSpeed: data.keyboardMetrics?.averageTypingSpeed || 0,
                        keyPressCount: data.keyboardMetrics?.keyPressCount || 0,
                        keyPressIntervals: { stdDev: 100 }, // Default value
                        errorRate: 0.05 // Default value
                    },
                    mouseProfile: {
                        clickFrequency: data.mouseMetrics?.clickCount || 0,
                        moveIntensity: data.mouseMetrics?.moveCount || 0,
                        movementPatterns: { curvature: 0.5 }, // Default value
                        clickDistribution: { entropy: 0.7 } // Default value
                    },
                    touchProfile: {
                        touchFrequency: data.touchMetrics?.touchCount || 0,
                        swipePatterns: { length: 50 }, // Default value
                        multiTouchUsage: { multiTouchRatio: 0.2 } // Default value
                    },
                    motionProfile: {
                        deviceStability: data.motionMetrics?.stability || 0,
                        orientationChanges: { changeFrequency: 0.1 }, // Default value
                        movementIntensity: { intensity: 2 } // Default value
                    },
                    scrollProfile: {
                        scrollFrequency: data.scrollPatterns?.scrollEvents || 0,
                        scrollDirectionChanges: data.scrollPatterns?.scrollDirectionChanges || 0,
                        scrollSpeed: { mean: 50 } // Default value
                    },
                    formProfile: {
                        focusEvents: data.formInteractions?.focusEvents || 0,
                        blurEvents: data.formInteractions?.blurEvents || 0,
                        completionTimes: { mean: 2000 } // Default value
                    },
                    sessionProfile: {
                        totalTime: data.timeOnPage?.totalTime || 0,
                        activeTime: data.timeOnPage?.activeTime || 0,
                        activityRatio: data.timeOnPage?.totalTime ? (data.timeOnPage.activeTime / data.timeOnPage.totalTime) : 0,
                        interactionDensity: { density: 5, diversity: 0.8 } // Default values
                    }
                });
                
                const result = {
                    success: true,
                    bbidFingerprint: behavioralFingerprint,
                    uniquenessScore: uniquenessScore,
                    message: 'Behavioral fingerprint generated successfully',
                    deviceType: detectDeviceType(data)
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
    console.log(`Enhanced with comprehensive behavioral metrics for laptops, smartphones, and tablets`);
    console.log(`\nExample curl commands:`);
    console.log(`  curl http://localhost:${PORT}/api/bbid | jq`);
    console.log(`  curl -X POST -H "Content-Type: application/json" -d '{"fingerprint":"my-device-fingerprint"}' http://localhost:${PORT}/api/convert | jq`);
    console.log(`  curl http://localhost:${PORT}/api/batch-compare | jq`);
});
