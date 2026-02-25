/**
 * SemanticCodec - Unified AI Semantic Encoding Layer
 * 
 * Consolidates the shared variable-bit-depth encoding logic used by both
 * M2MCompression and MOTLProtocol into a single foundation class.
 * 
 * Mathematical foundation: the 8D braille vector space {0,1}^8.
 * Every concept encoding (variable bit-depth) is embedded into this
 * 8-dimensional space via zero-padding, giving us a geometric view of
 * the concept space with Hamming/cosine distance metrics.
 * 
 * Architecture:
 *   BrailleVectorSpace  (linear algebra, PCA, 8D ↔ braille bijection)
 *     └── SemanticCodec  (concept maps, context tracking, vector embeddings)
 *           ├── M2MCompression  (JSON/token-oriented compression)
 *           └── MOTLProtocol    (thought-structure / RL-optimized encoding)
 *                 └── MOTLReligiousTexts (domain extension)
 */

// Import BrailleVectorSpace and ConceptAtlas if in Node.js environment
if (typeof require !== 'undefined') {
    var BrailleVectorSpace = require('../braille-core/braille-vector-space').BrailleVectorSpace;
    var BrailleConceptAtlas = require('./concept-atlas').BrailleConceptAtlas;
}

class SemanticCodec {
    constructor(options = {}) {
        this.options = {
            initialBitDepth: 3,
            adaptiveEncoding: true,
            contextWindowSize: 1000,
            semanticCompression: true,
            ...options
        };
        
        // Shared encoding tables — variable bit-depth concept maps
        this.encodingTables = {
            // Core logical operations (1-bit)
            coreOperations: new Map([
                ['AND', '0'],
                ['OR', '1']
            ]),
            
            // Common relations (2-bit)
            commonRelations: new Map([
                ['EQUALS', '00'],
                ['CONTAINS', '01'],
                ['GREATER_THAN', '10'],
                ['LESS_THAN', '11']
            ]),
            
            // Fundamental concepts (3-bit)
            fundamentalConcepts: new Map([
                ['ENTITY', '000'],
                ['ACTION', '001'],
                ['PROPERTY', '010'],
                ['STATE', '011'],
                ['EVENT', '100'],
                ['RELATION', '101'],
                ['QUANTITY', '110'],
                ['QUALITY', '111']
            ]),
            
            // Domain-specific (variable, populated by subclasses)
            domainConcepts: new Map(),
            
            // Dynamic (learned at runtime)
            dynamicConcepts: new Map()
        };
        
        // Shared context tracking
        this.context = {
            recentConcepts: [],
            conceptFrequency: new Map(),
            relationGraph: new Map()
        };
        
        // Performance metrics
        this.metrics = {
            compressionRatio: 0,
            processingSpeed: 0,
            adaptationRate: 0
        };
        
        // 8D braille vector space — mathematical foundation
        this.vectorSpace = new BrailleVectorSpace();
        
        // 256-concept universal semantic alphabet
        this.conceptAtlas = new BrailleConceptAtlas();
    }
    
    // ─── Shared Bit-Depth Encoding ────────────────────────────────────────
    
    /**
     * Assign bit encodings to a list of concepts at a given bit depth
     * @param {Array<string>} concepts - Concepts to encode
     * @param {number} bitDepth - Bit depth for encoding
     */
    assignEncodings(concepts, bitDepth) {
        const maxEncodings = Math.pow(2, bitDepth);
        
        if (concepts.length > maxEncodings) {
            console.error(`Cannot assign ${concepts.length} concepts to ${bitDepth}-bit encoding (max: ${maxEncodings})`);
            return;
        }
        
        for (let i = 0; i < concepts.length; i++) {
            const concept = concepts[i];
            const binary = i.toString(2).padStart(bitDepth, '0');
            this.encodingTables.dynamicConcepts.set(concept, binary);
            this.context.conceptFrequency.set(concept, 
                (this.context.conceptFrequency.get(concept) || 0));
        }
    }
    
    /**
     * Look up the encoding for a concept across all tables
     * @param {string} concept - Concept to encode
     * @returns {string|null} - Bit string or null if not found
     */
    encodeConcept(concept) {
        for (const table of [
            this.encodingTables.coreOperations,
            this.encodingTables.commonRelations,
            this.encodingTables.fundamentalConcepts,
            this.encodingTables.domainConcepts,
            this.encodingTables.dynamicConcepts
        ]) {
            if (table.has(concept)) return table.get(concept);
        }
        return null;
    }
    
    /**
     * Check if a concept has a fixed (non-dynamic) encoding
     * @param {string} concept - Concept to check
     * @returns {boolean}
     */
    hasFixedEncoding(concept) {
        return (
            this.encodingTables.coreOperations.has(concept) ||
            this.encodingTables.commonRelations.has(concept) ||
            this.encodingTables.fundamentalConcepts.has(concept) ||
            this.encodingTables.domainConcepts.has(concept)
        );
    }
    
    /**
     * Reassign bit depths based on frequency-sorted concepts
     * Most frequent concepts get shorter bit strings
     * @param {Array<string>} sortedConcepts - Concepts sorted by descending frequency
     */
    reassignBitDepths(sortedConcepts) {
        this.encodingTables.dynamicConcepts.clear();
        
        let conceptIndex = 0;
        const tiers = [
            { bits: 1, max: 2 },
            { bits: 2, max: 4 },
            { bits: 3, max: 8 },
            { bits: 4, max: 16 }
        ];
        
        for (const tier of tiers) {
            const count = Math.min(tier.max, sortedConcepts.length - conceptIndex);
            if (count <= 0) break;
            this.assignEncodings(sortedConcepts.slice(conceptIndex, conceptIndex + count), tier.bits);
            conceptIndex += count;
        }
        
        // Remaining concepts get 8-bit depth
        if (conceptIndex < sortedConcepts.length) {
            this.assignEncodings(sortedConcepts.slice(conceptIndex), 8);
        }
    }
    
    /**
     * Update concept frequency and optionally re-optimize encodings
     * @param {Array<string>} concepts - Concepts to track
     */
    updateContext(concepts) {
        for (const concept of concepts) {
            const freq = this.context.conceptFrequency.get(concept) || 0;
            this.context.conceptFrequency.set(concept, freq + 1);
        }
        
        this.context.recentConcepts = [
            ...concepts,
            ...this.context.recentConcepts
        ].slice(0, this.options.contextWindowSize);
        
        if (this.options.adaptiveEncoding) {
            const sorted = Array.from(this.context.conceptFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .map(e => e[0])
                .filter(c => !this.hasFixedEncoding(c));
            this.reassignBitDepths(sorted);
        }
    }
    
    /**
     * Encode a concept to bits, with literal fallback
     * @param {string} concept - Concept to encode
     * @returns {string} - Bit string
     */
    encodeConceptWithFallback(concept) {
        const existing = this.encodeConcept(concept);
        if (existing) return existing;
        
        // Literal encoding: prefix marker + 8-bit per character
        const literalBits = concept.split('')
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join('');
        return '1111' + literalBits;
    }
    
    /**
     * Get data type concept string for a JS value
     * @param {*} value
     * @returns {string}
     */
    getDataTypeConcept(value) {
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
     * Simple hash for token-based compression
     * @param {string} str
     * @returns {number}
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
    
    // ─── Vector Space Integration ──────────────────────────────────────
    //
    // Every concept's bit-string encoding can be embedded into the 8D
    // braille vector space by zero-padding to 8 bits.  This gives us
    // a geometric interpretation: similar concepts = nearby vectors.

    /**
     * Embed a concept's bit encoding into the 8D braille vector space.
     * Bit string is right-padded with zeros to 8 dimensions.
     * 
     *   "010" → [0, 1, 0, 0, 0, 0, 0, 0]
     * 
     * @param {string} concept - Concept name
     * @returns {Float64Array|null} - 8D vector or null if concept not found
     */
    conceptToVector(concept) {
        const bits = this.encodeConcept(concept);
        if (!bits) return null;
        const v = new Float64Array(8);
        for (let i = 0; i < Math.min(bits.length, 8); i++) {
            v[i] = bits[i] === '1' ? 1 : 0;
        }
        return v;
    }

    /**
     * Compute cosine similarity between two concepts in vector space.
     * @param {string} conceptA
     * @param {string} conceptB
     * @returns {number} - Similarity in [-1, 1], or 0 if either not found
     */
    conceptSimilarity(conceptA, conceptB) {
        const va = this.conceptToVector(conceptA);
        const vb = this.conceptToVector(conceptB);
        if (!va || !vb) return 0;
        return this.vectorSpace.cosineSimilarity(va, vb);
    }

    /**
     * Embed all currently encoded concepts into the 8D vector space.
     * Returns a map of concept → 8D vector, plus PCA analysis.
     * 
     * @param {number} pcaDims - Number of PCA dimensions (default 3)
     * @returns {Object} - { embeddings, pca, distanceMatrix }
     */
    embedConceptGraph(pcaDims = 3) {
        const embeddings = new Map();
        const vectors = [];
        const names = [];

        // Gather all encoded concepts
        for (const table of [
            this.encodingTables.coreOperations,
            this.encodingTables.commonRelations,
            this.encodingTables.fundamentalConcepts,
            this.encodingTables.domainConcepts,
            this.encodingTables.dynamicConcepts
        ]) {
            for (const [concept, bits] of table) {
                const v = new Float64Array(8);
                for (let i = 0; i < Math.min(bits.length, 8); i++) {
                    v[i] = bits[i] === '1' ? 1 : 0;
                }
                embeddings.set(concept, v);
                vectors.push(v);
                names.push(concept);
            }
        }

        // PCA for visualization / further compression
        let pca = null;
        if (vectors.length >= pcaDims) {
            pca = this.vectorSpace.pca(vectors, pcaDims);
        }

        // Pairwise Hamming distance matrix (compact: upper triangle)
        const N = vectors.length;
        const distances = [];
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                distances.push({
                    a: names[i],
                    b: names[j],
                    hamming: this.vectorSpace.hammingDistance(vectors[i], vectors[j]),
                    cosine: this.vectorSpace.cosineSimilarity(vectors[i], vectors[j])
                });
            }
        }

        return { embeddings, names, vectors, pca, distances };
    }

    // ─── Concept Atlas Integration ────────────────────────────────────
    //
    // The ConceptAtlas maps the 256 most fundamental human concepts to
    // braille patterns. This gives SemanticCodec a universal 1-byte-per-
    // concept encoding for high-level semantic compression.

    /**
     * Encode a sequence of high-level concepts using the 256-concept atlas.
     * Each concept becomes exactly 1 braille character (1 byte).
     * 
     * @param {Array<string>} concepts - Array of concept names (e.g. ['LOVE', 'LIFE', 'DEATH'])
     * @returns {{ braille: string, vectors: Array<Float64Array>, unknowns: Array<string> }}
     */
    encodeWithAtlas(concepts) {
        const brailleChars = [];
        const vectors = [];
        const unknowns = [];

        for (const concept of concepts) {
            const ch = this.conceptAtlas.getBraille(concept);
            if (ch) {
                brailleChars.push(ch);
                vectors.push(this.conceptAtlas.getVector(concept));
            } else {
                unknowns.push(concept);
                brailleChars.push('\u2800'); // VOID for unknown
                vectors.push(new Float64Array(8));
            }
        }

        return {
            braille: brailleChars.join(''),
            vectors,
            unknowns,
            byteLength: brailleChars.length
        };
    }

    /**
     * Decode a braille string back to high-level concepts via the atlas.
     * @param {string} braille - Braille unicode string
     * @returns {Array<string>} - Concept names
     */
    decodeWithAtlas(braille) {
        return this.conceptAtlas.decodeConcepts(braille);
    }

    /**
     * Find the atlas concept closest to a given bit encoding.
     * Bridges the variable-bit-depth encoding tables to the 256-concept atlas.
     * @param {string} bitString - Bit encoding from encodeConcept()
     * @returns {{ concept: string, distance: number, braille: string }|null}
     */
    bitsToConcept(bitString) {
        // Pad or truncate to 8 bits
        const bits8 = bitString.padEnd(8, '0').substring(0, 8);
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if (bits8[i] === '1') byte |= (1 << i);
        }

        const directConcept = this.conceptAtlas.getConcept(byte);
        if (directConcept) {
            return { concept: directConcept, distance: 0, braille: String.fromCodePoint(0x2800 + byte) };
        }

        // Find nearest occupied slot
        let bestDist = 9;
        let bestConcept = null;
        let bestIdx = 0;
        const vec = this.vectorSpace.byteToVector(byte);
        for (let i = 0; i < 256; i++) {
            const c = this.conceptAtlas.getConcept(i);
            if (!c) continue;
            const d = this.vectorSpace.hammingDistance(vec, this.vectorSpace.byteToVector(i));
            if (d < bestDist) {
                bestDist = d;
                bestConcept = c;
                bestIdx = i;
            }
        }

        return bestConcept ? {
            concept: bestConcept,
            distance: bestDist,
            braille: String.fromCodePoint(0x2800 + bestIdx)
        } : null;
    }

    /**
     * Get statistics about current encoding state
     * @returns {Object}
     */
    getStats() {
        return {
            encodingTables: {
                coreOperationsCount: this.encodingTables.coreOperations.size,
                commonRelationsCount: this.encodingTables.commonRelations.size,
                fundamentalConceptsCount: this.encodingTables.fundamentalConcepts.size,
                domainConceptsCount: this.encodingTables.domainConcepts.size,
                dynamicConceptsCount: this.encodingTables.dynamicConcepts.size,
                totalEncodedConcepts:
                    this.encodingTables.coreOperations.size +
                    this.encodingTables.commonRelations.size +
                    this.encodingTables.fundamentalConcepts.size +
                    this.encodingTables.domainConcepts.size +
                    this.encodingTables.dynamicConcepts.size
            },
            context: {
                recentConceptsCount: this.context.recentConcepts.length,
                uniqueConceptsCount: this.context.conceptFrequency.size,
                relationGraphSize: this.context.relationGraph.size
            },
            metrics: { ...this.metrics }
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SemanticCodec };
} else if (typeof window !== 'undefined') {
    window.SemanticCodec = SemanticCodec;
}
