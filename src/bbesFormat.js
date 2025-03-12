/**
 * BBES (Braille Binary Encoding Standard) Format Implementation
 * 
 * This module implements the BBES file format for ultra-efficient text compression
 * using Braille's 6-bit encoding system and contractions.
 * 
 * File Format Structure:
 * - 4 bytes: Magic number "BBES"
 * - 1 byte: Version (current: 1)
 * - 2 bytes: Flags
 *   - Bit 0: Custom dictionary included
 *   - Bit 1: AI-optimized contractions
 *   - Bits 2-15: Reserved for future use
 * - 4 bytes: Original text length
 * - 4 bytes: Dictionary size (if custom dictionary included)
 * - Variable: Dictionary data (if custom dictionary included)
 * - Variable: Compressed data (6-bit packed Braille cells)
 */

class BBESFormat {
    constructor() {
        // File format constants
        this.MAGIC_NUMBER = "BBES";
        this.VERSION = 1;
        this.FLAG_CUSTOM_DICTIONARY = 0x0001;
        this.FLAG_AI_OPTIMIZED = 0x0002;
        
        // Initialize compression engine
        this.compressionEngine = window.brailleCompression || new BrailleCompression();
        
        // Wait for compression engine to initialize
        if (this.compressionEngine && !this.compressionEngine.initialized) {
            setTimeout(() => {
                this.initialized = this.compressionEngine.initialized;
            }, 500);
        } else {
            this.initialized = true;
        }
    }
    
    /**
     * Encode text to BBES format
     * @param {string} text - The text to encode
     * @param {object} options - Encoding options
     * @returns {Uint8Array} - The BBES-encoded data
     */
    encode(text, options = {}) {
        if (!this.compressionEngine) {
            throw new Error("Compression engine not initialized");
        }
        
        // Default options
        const defaults = {
            useCustomDictionary: false,
            useAIOptimization: false
        };
        
        const settings = { ...defaults, ...options };
        
        // Compress the text using the compression engine
        const binary = this.compressionEngine.toBinary(text);
        
        // Create the BBES header
        const header = new Uint8Array(15); // 4 (magic) + 1 (version) + 2 (flags) + 4 (orig len) + 4 (dict size)
        
        // Magic number "BBES"
        header[0] = this.MAGIC_NUMBER.charCodeAt(0);
        header[1] = this.MAGIC_NUMBER.charCodeAt(1);
        header[2] = this.MAGIC_NUMBER.charCodeAt(2);
        header[3] = this.MAGIC_NUMBER.charCodeAt(3);
        
        // Version
        header[4] = this.VERSION;
        
        // Flags
        let flags = 0;
        if (settings.useCustomDictionary) flags |= this.FLAG_CUSTOM_DICTIONARY;
        if (settings.useAIOptimization) flags |= this.FLAG_AI_OPTIMIZED;
        header[5] = flags & 0xFF;
        header[6] = (flags >> 8) & 0xFF;
        
        // Original text length
        const textLength = text.length;
        header[7] = textLength & 0xFF;
        header[8] = (textLength >> 8) & 0xFF;
        header[9] = (textLength >> 16) & 0xFF;
        header[10] = (textLength >> 24) & 0xFF;
        
        // Dictionary size (0 for now, will be updated if custom dictionary is used)
        header[11] = 0;
        header[12] = 0;
        header[13] = 0;
        header[14] = 0;
        
        // Create the full BBES data
        let bbesData;
        
        if (settings.useCustomDictionary) {
            // TODO: Implement custom dictionary
            // For now, just use the standard compression
            bbesData = new Uint8Array(header.length + binary.length);
            bbesData.set(header);
            bbesData.set(binary, header.length);
        } else {
            bbesData = new Uint8Array(header.length + binary.length);
            bbesData.set(header);
            bbesData.set(binary, header.length);
        }
        
        return bbesData;
    }
    
    /**
     * Decode BBES-encoded data to text
     * @param {Uint8Array} bbesData - The BBES-encoded data
     * @returns {string} - The decoded text
     */
    decode(bbesData) {
        if (!this.compressionEngine) {
            throw new Error("Compression engine not initialized");
        }
        
        // Check magic number
        const magic = String.fromCharCode(
            bbesData[0],
            bbesData[1],
            bbesData[2],
            bbesData[3]
        );
        
        if (magic !== this.MAGIC_NUMBER) {
            throw new Error("Invalid BBES file format");
        }
        
        // Check version
        const version = bbesData[4];
        if (version > this.VERSION) {
            console.warn(`BBES file version ${version} is newer than supported version ${this.VERSION}`);
        }
        
        // Read flags
        const flags = bbesData[5] | (bbesData[6] << 8);
        const hasCustomDictionary = (flags & this.FLAG_CUSTOM_DICTIONARY) !== 0;
        const hasAIOptimization = (flags & this.FLAG_AI_OPTIMIZED) !== 0;
        
        // Read original text length
        const originalLength = bbesData[7] | 
                              (bbesData[8] << 8) | 
                              (bbesData[9] << 16) | 
                              (bbesData[10] << 24);
        
        // Read dictionary size
        const dictionarySize = bbesData[11] | 
                              (bbesData[12] << 8) | 
                              (bbesData[13] << 16) | 
                              (bbesData[14] << 24);
        
        // Extract the compressed data
        let compressedData;
        
        if (hasCustomDictionary) {
            // Skip the dictionary data
            const dictionaryStart = 15;
            const compressedStart = dictionaryStart + dictionarySize;
            compressedData = bbesData.slice(compressedStart);
            
            // TODO: Load custom dictionary
        } else {
            // No dictionary, compressed data starts after header
            compressedData = bbesData.slice(15);
        }
        
        // Decompress the data
        return this.compressionEngine.fromBinary(compressedData);
    }
    
    /**
     * Create a downloadable BBES file from text
     * @param {string} text - The text to compress
     * @param {string} filename - The filename to use
     * @param {object} options - Encoding options
     */
    createBBESFile(text, filename = 'compressed.bbes', options = {}) {
        // Encode the text to BBES format
        const bbesData = this.encode(text, options);
        
        // Create a Blob from the BBES data
        const blob = new Blob([bbesData], { type: 'application/octet-stream' });
        
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
    
    /**
     * Load a BBES file and decode it
     * @param {File} file - The BBES file to load
     * @returns {Promise<string>} - The decoded text
     */
    loadBBESFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const bbesData = new Uint8Array(event.target.result);
                    const decodedText = this.decode(bbesData);
                    resolve(decodedText);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Benchmark BBES compression against other compression methods
     * @param {string} text - The text to benchmark
     * @returns {Promise<object>} - Benchmark results
     */
    async benchmarkCompression(text) {
        // Get BBES compression stats
        const bbesData = this.encode(text);
        const bbesSize = bbesData.length;
        
        // Get ASCII size
        const asciiSize = text.length;
        
        // Get UTF-8 size
        const utf8Size = new TextEncoder().encode(text).length;
        
        // Get compression ratios
        const bbesRatio = bbesSize / asciiSize;
        const bbesSavings = (1 - bbesRatio) * 100;
        
        // Create benchmark results
        const results = {
            text: text,
            textLength: text.length,
            sizes: {
                ascii: asciiSize,
                utf8: utf8Size,
                bbes: bbesSize
            },
            ratios: {
                bbes: bbesRatio
            },
            savings: {
                bbes: bbesSavings
            }
        };
        
        // Try to estimate gzip compression if available
        if (typeof CompressionStream !== 'undefined') {
            try {
                // Use CompressionStream API if available
                const blob = new Blob([text]);
                const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'));
                const compressedBlob = await new Response(compressedStream).blob();
                
                results.sizes.gzip = compressedBlob.size;
                results.ratios.gzip = compressedBlob.size / asciiSize;
                results.savings.gzip = (1 - results.ratios.gzip) * 100;
            } catch (error) {
                console.warn('Could not benchmark gzip compression:', error);
                
                // Fallback to estimation
                results.sizes.gzipEstimated = Math.ceil(asciiSize * 0.4); // Rough estimate
                results.ratios.gzipEstimated = results.sizes.gzipEstimated / asciiSize;
                results.savings.gzipEstimated = (1 - results.ratios.gzipEstimated) * 100;
            }
        } else {
            // Fallback to estimation
            results.sizes.gzipEstimated = Math.ceil(asciiSize * 0.4); // Rough estimate
            results.ratios.gzipEstimated = results.sizes.gzipEstimated / asciiSize;
            results.savings.gzipEstimated = (1 - results.ratios.gzipEstimated) * 100;
        }
        
        return results;
    }
    
    /**
     * Generate a detailed compression report for a text
     * @param {string} text - The text to analyze
     * @returns {Promise<object>} - Detailed compression report
     */
    async generateCompressionReport(text) {
        // Get benchmark results
        const benchmarkResults = await this.benchmarkCompression(text);
        
        // Get compression details
        const compressionResult = this.compressionEngine.compress(text);
        
        // Count contractions used
        const contractionCount = compressionResult.replacements;
        
        // Calculate bits per character
        const bitsPerCharOriginal = 8; // ASCII
        const bitsPerCharBBES = (benchmarkResults.sizes.bbes * 8) / text.length;
        
        // Calculate theoretical minimum size (Shannon entropy)
        // This is a simplified estimation
        const charFrequency = {};
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            charFrequency[char] = (charFrequency[char] || 0) + 1;
        }
        
        let entropy = 0;
        for (const char in charFrequency) {
            const probability = charFrequency[char] / text.length;
            entropy -= probability * Math.log2(probability);
        }
        
        const theoreticalMinBits = Math.ceil(entropy * text.length);
        const theoreticalMinBytes = Math.ceil(theoreticalMinBits / 8);
        
        // Generate the report
        return {
            ...benchmarkResults,
            contractions: {
                count: contractionCount,
                replacements: compressionResult.replacements,
                savings: compressionResult.savings
            },
            efficiency: {
                bitsPerCharOriginal,
                bitsPerCharBBES,
                bitsPerCharReduction: bitsPerCharOriginal - bitsPerCharBBES,
                bitsPerCharReductionPercent: ((bitsPerCharOriginal - bitsPerCharBBES) / bitsPerCharOriginal) * 100
            },
            theoretical: {
                entropy,
                minBits: theoreticalMinBits,
                minBytes: theoreticalMinBytes,
                efficiencyPercent: (benchmarkResults.sizes.bbes / theoreticalMinBytes) * 100
            },
            comparison: {
                vsBzip2: "Not available", // Would require server-side or WASM implementation
                vsZstd: "Not available"   // Would require server-side or WASM implementation
            }
        };
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.bbesFormat = new BBESFormat();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BBESFormat;
}
