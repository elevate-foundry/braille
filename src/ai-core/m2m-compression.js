/**
 * Machine-to-Machine Compression System
 * 
 * Based on BBES principles but optimized for AI-to-AI communication
 * with ultra-high information density and dynamic encoding.
 */

class M2MCompression {
    constructor(options = {}) {
        this.options = {
            compressionLevel: 0.9,
            dynamicEncoding: true,
            contextWindow: 1000,  // Context window size for adaptive encoding
            semanticCompression: true,  // Use semantic meaning rather than just words
            ...options
        };
        
        // Initialize encoding maps
        this.encodingMaps = {
            // Bit depth maps (1-bit through 8-bit encodings)
            bitDepth: new Map(),
            // Semantic concept maps (encoding abstract concepts rather than words)
            concepts: new Map(),
            // Context-sensitive encodings that change based on conversation history
            contextual: new Map()
        };
        
        // Conversation history for context-aware encoding
        this.conversationHistory = [];
        
        // Frequency tracking for dynamic optimization
        this.conceptFrequency = new Map();
        
        // Initialize the system
        this._initialize();
    }
    
    /**
     * Initialize the M2M compression system
     * @private
     */
    _initialize() {
        // Initialize bit depth allocations
        for (let i = 1; i <= 8; i++) {
            this.encodingMaps.bitDepth.set(i, new Map());
        }
        
        // Initialize with basic concept encodings
        this._initializeBaseConceptEncodings();
    }
    
    /**
     * Initialize base concept encodings
     * @private
     */
    _initializeBaseConceptEncodings() {
        // Core logical operations (1-bit encoding)
        const logicalOps = ['AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'EQUIVALENT'];
        
        // Basic data types (2-bit encoding)
        const dataTypes = ['STRING', 'NUMBER', 'BOOLEAN', 'ARRAY', 'OBJECT', 'NULL', 'UNDEFINED'];
        
        // Common operations (3-bit encoding)
        const commonOps = [
            'GET', 'SET', 'ADD', 'REMOVE', 'UPDATE', 'DELETE', 'CREATE', 'READ',
            'FILTER', 'MAP', 'REDUCE', 'SORT', 'FIND', 'COUNT', 'AVERAGE', 'SUM'
        ];
        
        // Semantic concepts (4-bit encoding)
        const semanticConcepts = [
            'ENTITY', 'ACTION', 'PROPERTY', 'RELATION', 'STATE', 'EVENT', 'TIME',
            'LOCATION', 'QUANTITY', 'QUALITY', 'CAUSE', 'EFFECT', 'PURPOSE', 'CONDITION'
        ];
        
        // Assign encodings to concepts
        this._assignEncodings(logicalOps, 1);
        this._assignEncodings(dataTypes, 2);
        this._assignEncodings(commonOps, 3);
        this._assignEncodings(semanticConcepts, 4);
    }
    
    /**
     * Assign bit encodings to a list of concepts
     * @private
     * @param {Array<string>} concepts - List of concepts to encode
     * @param {number} bitDepth - Bit depth to use for encoding
     */
    _assignEncodings(concepts, bitDepth) {
        const bitDepthMap = this.encodingMaps.bitDepth.get(bitDepth);
        const maxEncodings = Math.pow(2, bitDepth);
        
        if (!bitDepthMap || concepts.length > maxEncodings) {
            console.error(`Cannot assign ${concepts.length} concepts to ${bitDepth}-bit encoding (max: ${maxEncodings})`);
            return;
        }
        
        // Generate unique binary encodings for each concept
        for (let i = 0; i < concepts.length; i++) {
            const concept = concepts[i];
            // Convert index to binary string of specified bit depth
            const binary = i.toString(2).padStart(bitDepth, '0');
            
            // Store in bit depth map
            bitDepthMap.set(concept, binary);
            
            // Also store in concept map for quick lookup
            this.encodingMaps.concepts.set(concept, {
                bitDepth,
                encoding: binary
            });
            
            // Initialize frequency counter
            this.conceptFrequency.set(concept, 0);
        }
    }
    
    /**
     * Compress a message for machine-to-machine communication
     * @param {Object} message - Message to compress (can be any JSON-serializable object)
     * @returns {Object} - Compressed message with metadata
     */
    compress(message) {
        // Start with serialized message
        const serialized = JSON.stringify(message);
        
        // Track start time for performance metrics
        const startTime = performance.now();
        
        // Extract semantic concepts from the message
        const concepts = this._extractConcepts(message);
        
        // Update frequency counters
        for (const concept of concepts) {
            const currentFreq = this.conceptFrequency.get(concept) || 0;
            this.conceptFrequency.set(concept, currentFreq + 1);
        }
        
        // Generate compressed binary representation
        let compressed = '';
        let compressionMap = new Map();
        
        if (this.options.semanticCompression) {
            // Semantic compression (concept-based)
            const semanticCompression = this._compressSemanticConcepts(concepts);
            compressed = semanticCompression.compressed;
            compressionMap = semanticCompression.compressionMap;
        } else {
            // Token-based compression (similar to BBES)
            const tokenCompression = this._compressTokens(serialized);
            compressed = tokenCompression.compressed;
            compressionMap = tokenCompression.compressionMap;
        }
        
        // Update conversation history for context-aware encoding
        if (this.options.dynamicEncoding) {
            this._updateConversationHistory(message, concepts);
        }
        
        // Calculate compression metrics
        const originalSize = serialized.length * 8; // Size in bits
        const compressedSize = compressed.length; // Already in bits
        const compressionRatio = compressedSize / originalSize;
        const compressionPercentage = (1 - compressionRatio) * 100;
        
        // Performance metrics
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Return compressed message with metadata
        return {
            compressed,
            metadata: {
                originalSize,
                compressedSize,
                compressionRatio,
                compressionPercentage: compressionPercentage.toFixed(2) + '%',
                processingTime: processingTime.toFixed(2) + 'ms',
                conceptCount: concepts.length,
                encodingType: this.options.semanticCompression ? 'semantic' : 'token'
            },
            // Include compression map for debugging/analysis
            compressionMap: Object.fromEntries(compressionMap)
        };
    }
    
    /**
     * Decompress a message from binary format
     * @param {string} compressed - Compressed binary string
     * @param {Object} metadata - Optional metadata from compression
     * @returns {Object} - Decompressed message
     */
    decompress(compressed, metadata = {}) {
        // Implementation would reverse the compression process
        // For a proof of concept, we'd need to track the compression map
        
        // This is a placeholder for the actual implementation
        return {
            decompressed: "Placeholder for decompressed message",
            metadata: {
                ...metadata,
                decompressionTime: '0.5ms'
            }
        };
    }
    
    /**
     * Extract semantic concepts from a message
     * @private
     * @param {Object} message - Message to analyze
     * @returns {Array<string>} - List of semantic concepts
     */
    _extractConcepts(message) {
        // This would use NLP or other AI techniques to extract concepts
        // For this proof of concept, we'll use a simplified approach
        
        const concepts = [];
        
        // Extract concepts based on message structure and content
        // This is a simplified placeholder implementation
        if (typeof message === 'object') {
            // Add data type concept
            concepts.push(Array.isArray(message) ? 'ARRAY' : 'OBJECT');
            
            // Extract concepts from keys and operations
            for (const key in message) {
                if (key.includes('get') || key.includes('fetch')) {
                    concepts.push('GET');
                } else if (key.includes('set') || key.includes('update')) {
                    concepts.push('SET');
                }
                
                // Add property concept
                concepts.push('PROPERTY');
                
                // Recursively process nested objects
                if (typeof message[key] === 'object' && message[key] !== null) {
                    concepts.push(...this._extractConcepts(message[key]));
                } else {
                    // Add data type for the value
                    concepts.push(this._getDataTypeConcept(message[key]));
                }
            }
        } else {
            // Add data type concept for primitive values
            concepts.push(this._getDataTypeConcept(message));
        }
        
        return concepts;
    }
    
    /**
     * Get data type concept for a value
     * @private
     * @param {*} value - Value to check
     * @returns {string} - Data type concept
     */
    _getDataTypeConcept(value) {
        if (value === null) return 'NULL';
        if (value === undefined) return 'UNDEFINED';
        
        switch (typeof value) {
            case 'string': return 'STRING';
            case 'number': return 'NUMBER';
            case 'boolean': return 'BOOLEAN';
            case 'object': return Array.isArray(value) ? 'ARRAY' : 'OBJECT';
            default: return 'UNDEFINED';
        }
    }
    
    /**
     * Compress semantic concepts into binary representation
     * @private
     * @param {Array<string>} concepts - List of concepts to compress
     * @returns {Object} - Compressed binary string and compression map
     */
    _compressSemanticConcepts(concepts) {
        let compressed = '';
        const compressionMap = new Map();
        
        for (const concept of concepts) {
            // Get encoding for this concept
            const encodingInfo = this.encodingMaps.concepts.get(concept);
            
            if (encodingInfo) {
                // Use pre-defined encoding
                compressed += encodingInfo.encoding;
                compressionMap.set(concept, encodingInfo.encoding);
            } else {
                // For unknown concepts, use a default 8-bit encoding
                // In a real implementation, we would dynamically assign new encodings
                const defaultEncoding = '11111111';
                compressed += defaultEncoding;
                compressionMap.set(concept, defaultEncoding);
            }
        }
        
        return { compressed, compressionMap };
    }
    
    /**
     * Compress tokens (words/symbols) into binary representation
     * @private
     * @param {string} text - Text to compress
     * @returns {Object} - Compressed binary string and compression map
     */
    _compressTokens(text) {
        // Split text into tokens
        const tokens = text.match(/\w+|\W+/g) || [];
        
        let compressed = '';
        const compressionMap = new Map();
        
        for (const token of tokens) {
            // For this proof of concept, we'll use a simple hash-based encoding
            // In a real implementation, we would use more sophisticated encoding
            
            // Generate a simple hash code for the token
            const hashCode = this._simpleHash(token);
            
            // Convert to binary (8-bit for simplicity)
            const binary = (hashCode % 256).toString(2).padStart(8, '0');
            
            compressed += binary;
            compressionMap.set(token, binary);
        }
        
        return { compressed, compressionMap };
    }
    
    /**
     * Generate a simple hash code for a string
     * @private
     * @param {string} str - String to hash
     * @returns {number} - Hash code
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * Update conversation history for context-aware encoding
     * @private
     * @param {Object} message - Current message
     * @param {Array<string>} concepts - Extracted concepts
     */
    _updateConversationHistory(message, concepts) {
        // Add to history
        this.conversationHistory.push({
            timestamp: Date.now(),
            message,
            concepts
        });
        
        // Limit history size to context window
        if (this.conversationHistory.length > this.options.contextWindow) {
            this.conversationHistory.shift();
        }
        
        // Analyze history to update contextual encodings
        this._optimizeEncodingsBasedOnContext();
    }
    
    /**
     * Optimize encodings based on conversation context
     * @private
     */
    _optimizeEncodingsBasedOnContext() {
        if (this.conversationHistory.length < 10) {
            // Need more history for meaningful optimization
            return;
        }
        
        // Count concept frequency in recent history
        const recentFrequency = new Map();
        
        // Focus on more recent messages (last 20% of context window)
        const recentHistoryStart = Math.max(0, this.conversationHistory.length - Math.floor(this.options.contextWindow * 0.2));
        const recentHistory = this.conversationHistory.slice(recentHistoryStart);
        
        // Count concepts in recent history
        for (const entry of recentHistory) {
            for (const concept of entry.concepts) {
                const count = recentFrequency.get(concept) || 0;
                recentFrequency.set(concept, count + 1);
            }
        }
        
        // Sort concepts by frequency
        const sortedConcepts = [...recentFrequency.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        // Reassign bit depths based on recent frequency
        // Most frequent concepts get shorter bit depths
        this._reassignBitDepths(sortedConcepts);
    }
    
    /**
     * Reassign bit depths based on frequency
     * @private
     * @param {Array<string>} sortedConcepts - Concepts sorted by frequency
     */
    _reassignBitDepths(sortedConcepts) {
        // Clear existing bit depth maps (except for fixed encodings)
        for (let i = 1; i <= 8; i++) {
            // In a real implementation, we might preserve certain fixed encodings
            this.encodingMaps.bitDepth.get(i).clear();
        }
        
        // Assign bit depths based on frequency
        let conceptIndex = 0;
        
        // 1-bit encodings (max 2)
        const bit1Count = Math.min(2, sortedConcepts.length - conceptIndex);
        this._assignEncodings(sortedConcepts.slice(conceptIndex, conceptIndex + bit1Count), 1);
        conceptIndex += bit1Count;
        
        // 2-bit encodings (max 4)
        const bit2Count = Math.min(4, sortedConcepts.length - conceptIndex);
        this._assignEncodings(sortedConcepts.slice(conceptIndex, conceptIndex + bit2Count), 2);
        conceptIndex += bit2Count;
        
        // 3-bit encodings (max 8)
        const bit3Count = Math.min(8, sortedConcepts.length - conceptIndex);
        this._assignEncodings(sortedConcepts.slice(conceptIndex, conceptIndex + bit3Count), 3);
        conceptIndex += bit3Count;
        
        // 4-bit encodings (max 16)
        const bit4Count = Math.min(16, sortedConcepts.length - conceptIndex);
        this._assignEncodings(sortedConcepts.slice(conceptIndex, conceptIndex + bit4Count), 4);
        conceptIndex += bit4Count;
        
        // Remaining concepts get higher bit depths
        if (conceptIndex < sortedConcepts.length) {
            this._assignEncodings(sortedConcepts.slice(conceptIndex), 8);
        }
    }
    
    /**
     * Get system statistics and performance metrics
     * @returns {Object} - System statistics
     */
    getStats() {
        // Calculate bit depth distribution
        const bitDepthDistribution = {};
        for (let i = 1; i <= 8; i++) {
            bitDepthDistribution[`${i}-bit`] = this.encodingMaps.bitDepth.get(i).size;
        }
        
        // Calculate average bit depth
        let totalBits = 0;
        let totalConcepts = 0;
        
        for (let i = 1; i <= 8; i++) {
            const count = this.encodingMaps.bitDepth.get(i).size;
            totalBits += i * count;
            totalConcepts += count;
        }
        
        const avgBitDepth = totalConcepts > 0 ? totalBits / totalConcepts : 0;
        
        // Return statistics
        return {
            totalConcepts: totalConcepts,
            bitDepthDistribution,
            averageBitDepth: avgBitDepth.toFixed(2),
            contextWindowSize: this.options.contextWindow,
            historyLength: this.conversationHistory.length,
            semanticCompressionEnabled: this.options.semanticCompression,
            dynamicEncodingEnabled: this.options.dynamicEncoding
        };
    }
}

// Export the M2MCompression class
module.exports = { M2MCompression };
