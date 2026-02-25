/**
 * BrailleAE - Neural Autoencoder for Braille Compression
 * 
 * This module implements a simplified autoencoder approach for learning
 * optimal braille contractions based on language usage patterns.
 * 
 * Note: This is a client-side prototype that simulates the behavior of
 * a neural autoencoder. For production use, a proper machine learning
 * implementation would be required.
 */

// Import the shared BBESCodec if in Node.js environment
if (typeof require !== 'undefined') {
    var BBESCodec = require('./bbes-codec').BBESCodec;
}

class BrailleAE {
    constructor(options = {}) {
        // Default options
        this.options = {
            compressionLevel: 0.7,  // Target compression ratio (0.0-1.0)
            adaptiveMode: true,     // Whether to adapt to user's language patterns
            contextWindow: 10,      // Number of words to consider for context
            language: 'en',         // Language code
            ...options
        };
        
        // Initialize state
        this.initialized = false;
        this.learnedPatterns = new Map();
        this.frequencyMap = new Map();
        this.contextPatterns = new Map();
        this.encoderWeights = null;
        this.decoderWeights = null;
        
        // Training corpus (starts empty, grows as user inputs text)
        this.corpus = [];
        this.corpusSize = 0;
        
        // Initialize the autoencoder
        this._initialize();
    }
    
    /**
     * Initialize the autoencoder
     * @private
     */
    _initialize() {
        // Load pre-trained patterns if available
        this._loadPretrainedPatterns();
        
        // Initialize encoder/decoder weights with random values
        // In a real neural network, these would be trained weights
        this._initializeWeights();
        
        this.initialized = true;
    }
    
    /**
     * Load pre-trained patterns
     * @private
     */
    _loadPretrainedPatterns() {
        // In a real implementation, this would load from a pre-trained model
        // For this prototype, we'll use some basic patterns based on frequency
        
        // Common English word patterns (for demonstration)
        const commonPatterns = [
            { pattern: 'the', encoding: '⠮', frequency: 0.95 },
            { pattern: 'and', encoding: '⠯', frequency: 0.90 },
            { pattern: 'that', encoding: '⠞⠓⠁⠞', frequency: 0.85 },
            { pattern: 'have', encoding: '⠓⠁⠧⠑', frequency: 0.80 },
            { pattern: 'with', encoding: '⠾', frequency: 0.78 },
            { pattern: 'this', encoding: '⠹⠊⠎', frequency: 0.75 },
            { pattern: 'from', encoding: '⠋⠗⠕⠍', frequency: 0.73 },
            { pattern: 'they', encoding: '⠮⠽', frequency: 0.70 },
            { pattern: 'will', encoding: '⠺⠊⠇⠇', frequency: 0.68 },
            { pattern: 'would', encoding: '⠺⠙', frequency: 0.65 },
            { pattern: 'there', encoding: '⠮⠗⠑', frequency: 0.63 },
            { pattern: 'their', encoding: '⠮⠊⠗', frequency: 0.60 },
            { pattern: 'what', encoding: '⠱⠁⠞', frequency: 0.58 },
            { pattern: 'about', encoding: '⠁⠃⠞', frequency: 0.55 },
            { pattern: 'which', encoding: '⠱⠊⠉⠓', frequency: 0.53 },
            { pattern: 'when', encoding: '⠱⠑⠝', frequency: 0.50 },
            { pattern: 'your', encoding: '⠽⠗', frequency: 0.48 },
            { pattern: 'said', encoding: '⠎⠙', frequency: 0.45 },
            { pattern: 'each', encoding: '⠑⠁⠉⠓', frequency: 0.43 },
            { pattern: 'time', encoding: '⠞⠊⠍⠑', frequency: 0.40 }
        ];
        
        // Add common patterns to the learned patterns map
        for (const item of commonPatterns) {
            this.learnedPatterns.set(item.pattern, item.encoding);
            this.frequencyMap.set(item.pattern, item.frequency);
        }
        
        // Add some context-aware patterns (words that change based on context)
        // In a real implementation, these would be learned from data
        this.contextPatterns.set('bank', new Map([
            ['money', '⠃⠅⠍'], // bank in financial context
            ['river', '⠃⠅⠗']  // bank in geographical context
        ]));
        
        this.contextPatterns.set('run', new Map([
            ['fast', '⠗⠝⠋'], // run in physical context
            ['program', '⠗⠝⠏'], // run in computing context
            ['business', '⠗⠝⠃'] // run in business context
        ]));
    }
    
    /**
     * Initialize encoder/decoder weights
     * @private
     */
    _initializeWeights() {
        // In a real neural network, these would be trained weights
        // For this prototype, we'll just simulate the weights
        
        // Encoder weights (text to latent space)
        this.encoderWeights = {
            // Simulated weights for character n-grams
            'th': 0.8,
            'er': 0.7,
            'on': 0.6,
            'an': 0.6,
            'ing': 0.9,
            'tion': 0.85,
            'ed': 0.5,
            'es': 0.5,
            're': 0.6,
            'in': 0.7,
            'al': 0.5
        };
        
        // Decoder weights (latent space to braille)
        this.decoderWeights = {
            // Simulated weights for braille patterns
            '⠮': 0.9,
            '⠯': 0.85,
            '⠞': 0.6,
            '⠓': 0.7,
            '⠁': 0.5,
            '⠧': 0.5,
            '⠑': 0.6,
            '⠗': 0.7,
            '⠊': 0.6,
            '⠝': 0.7,
            '⠛': 0.6
        };
    }
    
    /**
     * Update the autoencoder with new text
     * @param {string} text - Text to learn from
     */
    learn(text) {
        if (!this.initialized) {
            throw new Error('BrailleAE not initialized');
        }
        
        // Add to corpus
        this.corpus.push(text);
        this.corpusSize += text.length;
        
        // Extract words
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        
        // Update frequency map
        for (const word of words) {
            const currentFreq = this.frequencyMap.get(word) || 0;
            this.frequencyMap.set(word, currentFreq + 1);
        }
        
        // Extract n-grams (character sequences)
        const ngrams = this._extractNgrams(text.toLowerCase(), [2, 3, 4]);
        
        // Update n-gram frequencies
        for (const ngram of ngrams) {
            const currentFreq = this.frequencyMap.get(ngram) || 0;
            this.frequencyMap.set(ngram, currentFreq + 1);
        }
        
        // Learn new patterns based on frequency
        this._learnNewPatterns();
        
        // Update context patterns
        this._updateContextPatterns(words);
        
        return {
            corpusSize: this.corpusSize,
            uniquePatterns: this.learnedPatterns.size,
            contextPatterns: this.contextPatterns.size
        };
    }
    
    /**
     * Extract n-grams from text
     * @private
     * @param {string} text - Text to extract n-grams from
     * @param {Array<number>} sizes - Sizes of n-grams to extract
     * @returns {Array<string>} - Extracted n-grams
     */
    _extractNgrams(text, sizes) {
        const ngrams = [];
        
        for (const size of sizes) {
            for (let i = 0; i <= text.length - size; i++) {
                ngrams.push(text.substr(i, size));
            }
        }
        
        return ngrams;
    }
    
    /**
     * Learn new patterns based on frequency
     * @private
     */
    _learnNewPatterns() {
        // Sort by frequency
        const sortedPatterns = [...this.frequencyMap.entries()]
            .sort((a, b) => b[1] - a[1]);
        
        // Take the top patterns based on compression level
        const patternCount = Math.floor(sortedPatterns.length * this.options.compressionLevel);
        const topPatterns = sortedPatterns.slice(0, patternCount);
        
        // Generate encodings for new patterns
        for (const [pattern, freq] of topPatterns) {
            // Skip if already has an encoding
            if (this.learnedPatterns.has(pattern)) continue;
            
            // Generate a new encoding
            const encoding = this._generateEncoding(pattern);
            this.learnedPatterns.set(pattern, encoding);
        }
    }
    
    /**
     * Generate a braille encoding for a pattern
     * @private
     * @param {string} pattern - Pattern to encode
     * @returns {string} - Braille encoding
     */
    _generateEncoding(pattern) {
        // In a real neural network, this would use the encoder to generate a latent representation
        // For this prototype, we use the standard braille dot lookup table
        
        // Start with an empty encoding
        let encoding = '';
        
        // For each character (up to 3), look up the correct braille cell
        for (let i = 0; i < Math.min(pattern.length, 3); i++) {
            const char = pattern[i];
            const brailleChar = BrailleAE.BRAILLE_DOTS[char];
            
            if (brailleChar) {
                encoding += brailleChar;
            }
        }
        
        return encoding;
    }
    
    /**
     * Update context patterns based on word co-occurrence
     * @private
     * @param {Array<string>} words - Words to analyze
     */
    _updateContextPatterns(words) {
        // Look for context patterns in the words
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // Check if this word is in our context patterns
            if (this.contextPatterns.has(word)) {
                // Look at surrounding words for context
                const context = [];
                for (let j = Math.max(0, i - this.options.contextWindow); 
                     j < Math.min(words.length, i + this.options.contextWindow); j++) {
                    if (i !== j) {
                        context.push(words[j]);
                    }
                }
                
                // Find the most relevant context word
                let bestContextWord = '';
                let highestFreq = 0;
                
                for (const contextWord of context) {
                    const contextMap = this.contextPatterns.get(word);
                    if (contextMap.has(contextWord)) {
                        const freq = this.frequencyMap.get(contextWord) || 0;
                        if (freq > highestFreq) {
                            highestFreq = freq;
                            bestContextWord = contextWord;
                        }
                    }
                }
                
                // If we found a relevant context, use it for encoding
                if (bestContextWord) {
                    const contextMap = this.contextPatterns.get(word);
                    const contextEncoding = contextMap.get(bestContextWord);
                    this.learnedPatterns.set(`${word}|${bestContextWord}`, contextEncoding);
                }
            }
        }
    }
    
    /**
     * Encode text using the autoencoder
     * @param {string} text - Text to encode
     * @returns {object} - Encoded result
     */
    encode(text) {
        if (!this.initialized) {
            throw new Error('BrailleAE not initialized');
        }
        
        // Extract words and context
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        const wordContexts = new Map();
        
        // Identify contexts for words
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            if (this.contextPatterns.has(word)) {
                // Get surrounding words
                const context = [];
                for (let j = Math.max(0, i - this.options.contextWindow); 
                     j < Math.min(words.length, i + this.options.contextWindow); j++) {
                    if (i !== j) {
                        context.push(words[j]);
                    }
                }
                
                // Find the most relevant context word
                for (const contextWord of context) {
                    const contextMap = this.contextPatterns.get(word);
                    if (contextMap.has(contextWord)) {
                        wordContexts.set(word, contextWord);
                        break;
                    }
                }
            }
        }
        
        // Encode the text
        let brailleUnicode = '';
        let brailleBinary = '';
        let currentPos = 0;
        
        while (currentPos < text.length) {
            // Try to match the longest pattern first
            let matched = false;
            let matchedPattern = '';
            let matchedEncoding = '';
            
            // Check for word with context
            const wordMatch = text.substring(currentPos).match(/\b(\w+)\b/);
            if (wordMatch && wordMatch.index === 0) {
                const word = wordMatch[1].toLowerCase();
                if (wordContexts.has(word)) {
                    const contextWord = wordContexts.get(word);
                    const contextKey = `${word}|${contextWord}`;
                    
                    if (this.learnedPatterns.has(contextKey)) {
                        matchedPattern = word;
                        matchedEncoding = this.learnedPatterns.get(contextKey);
                        matched = true;
                    }
                }
            }
            
            // If no context match, try regular patterns
            if (!matched) {
                // Sort patterns by length (longest first)
                const sortedPatterns = [...this.learnedPatterns.keys()]
                    .filter(k => !k.includes('|')) // Exclude context patterns
                    .sort((a, b) => b.length - a.length);
                
                for (const pattern of sortedPatterns) {
                    if (text.substring(currentPos).toLowerCase().startsWith(pattern)) {
                        matchedPattern = pattern;
                        matchedEncoding = this.learnedPatterns.get(pattern);
                        matched = true;
                        break;
                    }
                }
            }
            
            if (matched) {
                // Add the encoding
                brailleUnicode += matchedEncoding;
                
                // Convert to binary (simplified)
                for (const char of matchedEncoding) {
                    const codePoint = char.codePointAt(0);
                    const binary = (codePoint - 0x2800).toString(2).padStart(8, '0');
                    brailleBinary += binary;
                }
                
                // Move position
                currentPos += matchedPattern.length;
            } else {
                // No match, use the character as is
                const char = text[currentPos];
                
                // Look up in standard braille dot table
                const brailleChar = BrailleAE.BRAILLE_DOTS[char.toLowerCase()];
                if (brailleChar) {
                    brailleUnicode += brailleChar;
                    
                    // Convert to binary using BBESCodec
                    brailleBinary += BBESCodec.brailleToBinary(brailleChar);
                } else {
                    // Just use the character as is for unmapped characters
                    brailleUnicode += char;
                    brailleBinary += '00000000'; // Placeholder
                }
                
                currentPos++;
            }
        }
        
        // Create BBES format (base64 encoding of binary)
        const bbes = this._createBBES(brailleBinary);
        
        return {
            unicode: brailleUnicode,
            binary: brailleBinary,
            bbes: bbes
        };
    }
    
    /**
     * Decode braille to text
     * @param {string} braille - Braille to decode
     * @param {string} format - Format of input ('unicode', 'binary', or 'bbes')
     * @returns {string} - Decoded text
     */
    decode(braille, format = 'unicode') {
        if (!this.initialized) {
            throw new Error('BrailleAE not initialized');
        }
        
        let binary = '';
        
        // Convert input to binary based on format
        if (format === 'unicode') {
            // Convert unicode braille to binary
            for (const char of braille) {
                const codePoint = char.codePointAt(0);
                if (codePoint >= 0x2800 && codePoint <= 0x28FF) {
                    const binary = (codePoint - 0x2800).toString(2).padStart(8, '0');
                    binary += binary;
                } else {
                    binary += '00000000'; // Placeholder for non-braille
                }
            }
        } else if (format === 'binary') {
            binary = braille;
        } else if (format === 'bbes') {
            binary = this._decodeBBES(braille);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }
        
        // For this prototype, we'll do a simple reverse lookup
        // In a real neural network, this would use the decoder
        
        let text = '';
        let currentPos = 0;
        
        // Create reverse mapping
        const reverseMap = new Map();
        for (const [pattern, encoding] of this.learnedPatterns.entries()) {
            if (!pattern.includes('|')) { // Exclude context patterns
                reverseMap.set(encoding, pattern);
            }
        }
        
        // Process the braille
        while (currentPos < braille.length) {
            // Try to match the longest encoding first
            let matched = false;
            
            // Sort encodings by length (longest first)
            const sortedEncodings = [...reverseMap.keys()]
                .sort((a, b) => b.length - a.length);
            
            for (const encoding of sortedEncodings) {
                if (braille.substring(currentPos).startsWith(encoding)) {
                    text += reverseMap.get(encoding);
                    currentPos += encoding.length;
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                // No match, try to decode the character
                const char = braille[currentPos];
                const codePoint = char.codePointAt(0);
                
                if (codePoint >= 0x2800 && codePoint <= 0x28FF) {
                    // Convert from braille to letter (simplified)
                    const dotPattern = codePoint - 0x2800;
                    let letter = '?';
                    
                    // Find the first dot that is set
                    for (let i = 0; i < 6; i++) {
                        if (dotPattern & (1 << i)) {
                            letter = String.fromCharCode('a'.charCodeAt(0) + i);
                            break;
                        }
                    }
                    
                    text += letter;
                } else {
                    // Just use the character as is for non-braille
                    text += char;
                }
                
                currentPos++;
            }
        }
        
        return text;
    }
    
    /**
     * Create BBES from binary
     * @private
     * @param {string} binary - Binary representation
     * @returns {string} - BBES format (base64 encoded)
     */
    _createBBES(binary) {
        return BBESCodec.createBBES(binary);
    }
    
    /**
     * Decode BBES to binary
     * @private
     * @param {string} bbes - BBES format (base64 encoded)
     * @returns {string} - Binary representation
     */
    _decodeBBES(bbes) {
        return BBESCodec.decodeBBES(bbes);
    }
    
    /**
     * Set options for the autoencoder
     * @param {object} options - Options to set
     */
    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
    
    /**
     * Get the current options
     * @returns {object} - Current options
     */
    getOptions() {
        return { ...this.options };
    }
    
    /**
     * Get statistics about the autoencoder
     * @returns {object} - Statistics
     */
    getStats() {
        return {
            patternCount: this.learnedPatterns.size,
            contextPatternCount: this.contextPatterns.size,
            corpusSize: this.corpusSize,
            compressionLevel: this.options.compressionLevel,
            adaptiveMode: this.options.adaptiveMode,
            estimatedCompressionRatio: this._estimateCompressionRatio()
        };
    }
    
    /**
     * Estimate the compression ratio
     * @private
     * @returns {number} - Estimated compression ratio
     */
    _estimateCompressionRatio() {
        if (this.corpusSize === 0) return 1.0;
        
        // Calculate average pattern length and encoding length
        let totalPatternLength = 0;
        let totalEncodingLength = 0;
        let patternCount = 0;
        
        for (const [pattern, encoding] of this.learnedPatterns.entries()) {
            if (!pattern.includes('|')) { // Exclude context patterns
                totalPatternLength += pattern.length;
                totalEncodingLength += encoding.length;
                patternCount++;
            }
        }
        
        if (patternCount === 0) return 1.0;
        
        const avgPatternLength = totalPatternLength / patternCount;
        const avgEncodingLength = totalEncodingLength / patternCount;
        
        // Estimate compression ratio
        return avgEncodingLength / avgPatternLength;
    }
}

// Standard braille dot patterns (shared with BrailleFST for consistency)
BrailleAE.BRAILLE_DOTS = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    ' ': '⠀', '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒',
    '!': '⠖', '?': '⠦', '-': '⠤'
};

// Export the BrailleAE class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleAE };
} else if (typeof window !== 'undefined') {
    window.BrailleAE = BrailleAE;
}
