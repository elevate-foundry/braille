// Utility functions for BBID API
const crypto = require('crypto');

// Utility function to convert traditional fingerprint to BBES format
function convertToBBES(fingerprint) {
    // This is a simplified implementation - in production, use the full BBES encoding
    const prefix = '\u2803\u2803\u2811\u280e_'; // BBES in braille
    const brailleChars = [
        '\u2801', '\u2803', '\u2809', '\u2819', '\u2811', '\u280b', '\u281b', '\u2813', '\u280a', '\u281a', '\u2805', '\u2807', 
        '\u280d', '\u281d', '\u2815', '\u280f', '\u281f', '\u2817', '\u280e', '\u281e', '\u2825', '\u2827', '\u283a', '\u282d', 
        '\u283d', '\u2835', '\u282f', '\u283f', '\u2837', '\u282e', '\u283e', '\u2821'
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

// Set CORS headers for Vercel serverless functions
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
    convertToBBES,
    calculateSemanticEfficiency,
    setCorsHeaders
};
