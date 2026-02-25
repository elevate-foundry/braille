/**
 * BrailleBuddy Compression Utility
 * 
 * This module implements a true Braille-based compression system ("BZip")
 * that stores text more efficiently using 6-bit binary encoding for Braille cells.
 */

class BrailleCompression {
    constructor(hapticEngine = null) {
        this.contractionMap = null;
        this.reverseContractionMap = null;
        this.initialized = false;
        
        // Store injected haptic engine, falling back to global if available
        this.hapticEngine = hapticEngine || 
            (typeof window !== 'undefined' && window.hapticEngine ? window.hapticEngine : null);
        
        // Initialize the compression system
        this.initialize();
    }
    
    /**
     * Initialize the compression system
     */
    async initialize() {
        try {
            // Load contractions from haptic patterns if available
            if (this.hapticEngine && this.hapticEngine.patterns) {
                await this.initializeFromHapticPatterns();
            } else {
                // Otherwise, use default contractions
                this.initializeDefaultContractions();
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Braille compression:', error);
        }
    }
    
    /**
     * Initialize contractions from haptic patterns
     */
    async initializeFromHapticPatterns() {
        try {
            const patterns = this.hapticEngine.patterns;
            
            this.contractionMap = {};
            this.reverseContractionMap = {};
            
            // Add word patterns
            if (patterns.words) {
                Object.keys(patterns.words).forEach(word => {
                    this.contractionMap[word] = this.createBrailleCell(word);
                });
            }
            
            // Add contractions
            if (patterns.contractions) {
                Object.keys(patterns.contractions).forEach(contraction => {
                    this.contractionMap[contraction] = this.createBrailleCell(contraction);
                });
            }
            
            // Create reverse mapping
            Object.keys(this.contractionMap).forEach(text => {
                this.reverseContractionMap[this.contractionMap[text]] = text;
            });
        } catch (error) {
            console.error('Error initializing from haptic patterns:', error);
            // Fall back to default contractions
            this.initializeDefaultContractions();
        }
    }
    
    /**
     * Initialize default contractions
     */
    initializeDefaultContractions() {
        // Common Grade 2 Braille contractions
        this.contractionMap = {
            'the': '⠮',
            'and': '⠯',
            'for': '⠿',
            'of': '⠷',
            'with': '⠾',
            'ch': '⠡',
            'gh': '⠣',
            'sh': '⠩',
            'th': '⠹',
            'wh': '⠱',
            'ed': '⠫',
            'er': '⠻',
            'ou': '⠳',
            'ow': '⠪',
            'st': '⠌',
            'ar': '⠜',
            'ing': '⠬',
            'ble': '⠼',
            'ea': '⠂',
            'bb': '⠆',
            'cc': '⠒',
            'dd': '⠲',
            'ff': '⠖',
            'gg': '⠶',
            'en': '⠢',
            'in': '⠔',
            'was': '⠴',
            'were': '⠺',
            'his': '⠦',
            'had': '⠓',
            'that': '⠞',
            'by': '⠃',
            'to': '⠕',
            'into': '⠔⠕',
            'can': '⠉',
            'do': '⠙',
            'will': '⠺',
            'people': '⠏',
            'quite': '⠟',
            'rather': '⠗',
            'so': '⠎',
            'that': '⠞',
            'us': '⠥',
            'you': '⠽',
            'as': '⠵',
            'but': '⠃',
            'every': '⠑',
            'from': '⠋',
            'go': '⠛',
            'have': '⠓',
            'just': '⠚',
            'knowledge': '⠅',
            'like': '⠇',
            'more': '⠍',
            'not': '⠝',
            'one': '⠕',
            'part': '⠏',
            'question': '⠟',
            'right': '⠗',
            'some': '⠎',
            'time': '⠞',
            'under': '⠥',
            'very': '⠧',
            'work': '⠺',
            'young': '⠽',
            'zip': '⠵'
        };
        
        // Create reverse mapping
        this.reverseContractionMap = {};
        Object.keys(this.contractionMap).forEach(text => {
            this.reverseContractionMap[this.contractionMap[text]] = text;
        });
    }
    
    /**
     * Create a 6-bit binary representation of a Braille cell
     * @param {string} text - The text to convert to a Braille cell
     * @returns {string} - The Braille cell as a Unicode character
     */
    createBrailleCell(text) {
        // For now, we'll use a simple mapping
        // In a real implementation, this would convert to an actual 6-bit binary representation
        if (this.contractionMap && this.contractionMap[text]) {
            return this.contractionMap[text];
        }
        
        // If no mapping exists, return the first character
        return text.charAt(0);
    }
    
    /**
     * Compress text using Braille contractions
     * @param {string} text - The text to compress
     * @returns {object} - The compressed text and stats
     */
    compress(text) {
        if (!this.initialized) {
            console.warn('Braille compression not initialized yet');
            return { 
                original: text, 
                compressed: text,
                originalSize: text.length,
                compressedSize: text.length,
                compressionRatio: 1.0
            };
        }
        
        // Convert text to lowercase for matching
        const lowerText = text.toLowerCase();
        
        // Start with Grade 2 Braille contractions
        let compressed = lowerText;
        let replacements = 0;
        
        // Sort contractions by length (longest first) to avoid partial replacements
        const sortedContractions = Object.keys(this.contractionMap).sort((a, b) => b.length - a.length);
        
        // Replace words and contractions
        for (const contraction of sortedContractions) {
            const regex = new RegExp(contraction, 'g');
            const matches = compressed.match(regex);
            
            if (matches) {
                replacements += matches.length;
                compressed = compressed.replace(regex, this.contractionMap[contraction]);
            }
        }
        
        // Calculate compression stats
        const originalSize = text.length;
        const compressedSize = compressed.length;
        const compressionRatio = compressedSize / originalSize;
        
        return {
            original: text,
            compressed: compressed,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio,
            replacements: replacements,
            savings: originalSize - compressedSize,
            savingsPercent: (1 - compressionRatio) * 100
        };
    }
    
    /**
     * Decompress Braille-compressed text
     * @param {string} compressed - The compressed text
     * @returns {string} - The decompressed text
     */
    decompress(compressed) {
        if (!this.initialized || !this.reverseContractionMap) {
            console.warn('Braille decompression not initialized yet');
            return compressed;
        }
        
        let decompressed = '';
        
        // Process each character
        for (let i = 0; i < compressed.length; i++) {
            const char = compressed.charAt(i);
            
            // Check if this is a Braille contraction
            if (this.reverseContractionMap[char]) {
                decompressed += this.reverseContractionMap[char];
            } else {
                decompressed += char;
            }
        }
        
        return decompressed;
    }
    
    /**
     * Convert text to binary Braille representation (6-bit per cell)
     * This is where the real compression happens - each Braille cell is stored as 6 bits
     * instead of 8 bits (1 byte) or more for Unicode characters
     * @param {string} text - The text to convert
     * @returns {Uint8Array} - The binary representation
     */
    toBinary(text) {
        // First compress the text using Braille contractions
        const { compressed } = this.compress(text);
        
        // Calculate the size of the binary array
        // Each Braille cell is 6 bits, so we need ceil(compressed.length * 6 / 8) bytes
        const binarySize = Math.ceil(compressed.length * 6 / 8);
        const binary = new Uint8Array(binarySize);
        
        // Convert each Braille cell to its 6-bit representation
        let bitPosition = 0;
        
        for (let i = 0; i < compressed.length; i++) {
            const char = compressed.charAt(i);
            let bits = 0;
            
            // If it's a Braille character, convert it to 6 bits
            if (char.charCodeAt(0) >= 0x2800 && char.charCodeAt(0) <= 0x28FF) {
                // Extract the 6 bits from the Braille Unicode character
                bits = char.charCodeAt(0) - 0x2800;
            } else {
                // For non-Braille characters, use a simple encoding
                bits = char.charCodeAt(0) % 64; // Take modulo 64 to fit in 6 bits
            }
            
            // Write the 6 bits to the binary array
            const bytePosition = Math.floor(bitPosition / 8);
            const bitOffset = bitPosition % 8;
            
            if (bitOffset <= 2) {
                // All 6 bits fit in the current byte
                binary[bytePosition] |= bits << (2 - bitOffset);
            } else {
                // Split across two bytes
                const firstPartBits = 8 - bitOffset;
                const secondPartBits = 6 - firstPartBits;
                
                binary[bytePosition] |= bits >> secondPartBits;
                
                if (bytePosition + 1 < binarySize) {
                    binary[bytePosition + 1] |= (bits & ((1 << secondPartBits) - 1)) << (8 - secondPartBits);
                }
            }
            
            bitPosition += 6;
        }
        
        return binary;
    }
    
    /**
     * Convert binary Braille representation back to text
     * @param {Uint8Array} binary - The binary representation
     * @returns {string} - The decompressed text
     */
    fromBinary(binary) {
        // Calculate how many Braille cells we have
        const cellCount = Math.floor(binary.length * 8 / 6);
        let compressed = '';
        
        // Extract each 6-bit Braille cell
        for (let i = 0; i < cellCount; i++) {
            const bitPosition = i * 6;
            const bytePosition = Math.floor(bitPosition / 8);
            const bitOffset = bitPosition % 8;
            
            let bits = 0;
            
            if (bitOffset <= 2) {
                // All 6 bits are in the current byte
                bits = (binary[bytePosition] >> (2 - bitOffset)) & 0x3F;
            } else {
                // Split across two bytes
                const firstPartBits = 8 - bitOffset;
                const secondPartBits = 6 - firstPartBits;
                
                bits = (binary[bytePosition] & ((1 << firstPartBits) - 1)) << secondPartBits;
                
                if (bytePosition + 1 < binary.length) {
                    bits |= (binary[bytePosition + 1] >> (8 - secondPartBits)) & ((1 << secondPartBits) - 1);
                }
            }
            
            // Convert the 6 bits to a Braille Unicode character
            const brailleChar = String.fromCharCode(0x2800 + bits);
            compressed += brailleChar;
        }
        
        // Decompress the Braille text
        return this.decompress(compressed);
    }
    
    /**
     * Calculate the theoretical file size reduction for a given text
     * @param {string} text - The text to analyze
     * @returns {object} - Compression statistics
     */
    analyzeCompression(text) {
        // Standard encoding sizes (bytes)
        const asciiSize = text.length;
        const utf8Size = new TextEncoder().encode(text).length;
        
        // Compressed sizes
        const { compressed, compressionRatio } = this.compress(text);
        const brailleUnicodeSize = new TextEncoder().encode(compressed).length;
        
        // Binary Braille (6-bit per cell)
        const binaryBraille = this.toBinary(text);
        const binaryBrailleSize = binaryBraille.length;
        
        // Gzip comparison (estimate)
        const gzipEstimatedSize = Math.ceil(asciiSize * 0.4); // Rough estimate: gzip typically achieves ~60% compression
        
        return {
            text: text,
            textLength: text.length,
            asciiSize: asciiSize,
            utf8Size: utf8Size,
            brailleUnicodeSize: brailleUnicodeSize,
            binaryBrailleSize: binaryBrailleSize,
            gzipEstimatedSize: gzipEstimatedSize,
            compressionRatios: {
                brailleUnicode: brailleUnicodeSize / asciiSize,
                binaryBraille: binaryBrailleSize / asciiSize,
                gzipEstimated: gzipEstimatedSize / asciiSize
            },
            savingsPercent: {
                brailleUnicode: (1 - (brailleUnicodeSize / asciiSize)) * 100,
                binaryBraille: (1 - (binaryBrailleSize / asciiSize)) * 100,
                gzipEstimated: (1 - (gzipEstimatedSize / asciiSize)) * 100
            }
        };
    }
    
    /**
     * Create a downloadable BZip file from text
     * @param {string} text - The text to compress
     * @param {string} filename - The filename to use
     */
    createBZipFile(text, filename = 'compressed.bzp') {
        // Compress the text to binary
        const binary = this.toBinary(text);
        
        // Create a Blob from the binary data
        const blob = new Blob([binary], { type: 'application/octet-stream' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.brailleCompression = new BrailleCompression();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleCompression;
}
