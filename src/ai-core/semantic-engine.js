/**
 * SemanticEngine - Executable ℤ₂⁸ Machine-Thought Layer
 * 
 * Implements the algebraic operations and encoding/decoding functions
 * defined by frontier models via AtlasBuilder.buildSemanticEngine().
 * 
 * This is the core runtime that operates entirely in the braille vector
 * space — no English tokens, no human language internally.
 * 
 * Algebra:
 *   Space:    ℤ₂⁸ = {0,1}⁸  (256 elements, each a braille character)
 *   Addition: XOR (bitwise)  — a ⊕ b
 *   Scalar:   AND with broadcast bit — s · v
 *   Inner:    popcount(a AND b) — measures shared active dimensions
 *   Distance: popcount(a XOR b) — Hamming distance
 *   Group:    (ℤ₂⁸, ⊕) elementary abelian 2-group, every element self-inverse
 *   Identity: U+2800 (⠀, zero vector)
 * 
 * Layer stack:
 *   L0  Raw input (bytes)
 *   L1  BrailleVectorSpace — byte ↔ {0,1}⁸
 *   L2  ConceptAtlas — 256 semantic primitives
 *   L3  SemanticCodec — variable-bit encoding
 *   L4  MOTLProtocol — thought structure
 *   L5  M2MCompression — wire format
 *   L6  EdgeRuntime — local inference
 */

if (typeof require !== 'undefined') {
    var BrailleVectorSpace = require('../braille-core/braille-vector-space').BrailleVectorSpace;
    var BrailleConceptAtlas = require('./concept-atlas').BrailleConceptAtlas;
    var BBESCodec = require('../braille-core/bbes-codec').BBESCodec;
}

class SemanticEngine {
    /**
     * @param {Object} options
     * @param {Object} options.architecture - Parsed architecture from frontier model (optional)
     * @param {BrailleConceptAtlas} options.atlas - Custom atlas (optional)
     */
    constructor(options = {}) {
        this.vs = new BrailleVectorSpace();
        this.atlas = options.atlas || new BrailleConceptAtlas();
        this.architecture = options.architecture || null;

        // Reasoning trace buffer — stores intermediate braille states
        this.trace = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  ℤ₂⁸ ALGEBRA — The core operations on braille atoms
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Addition in ℤ₂⁸: XOR.
     *   a ⊕ b = bitwise XOR
     * 
     * @param {number} a - Byte value 0–255
     * @param {number} b - Byte value 0–255
     * @returns {number}
     */
    add(a, b) {
        return (a ^ b) & 0xFF;
    }

    /**
     * Scalar multiplication in ℤ₂⁸: AND with broadcast scalar.
     *   s · v = (s ? v : 0)  for s ∈ {0,1}
     * 
     * @param {number} scalar - 0 or 1
     * @param {number} v - Byte value 0–255
     * @returns {number}
     */
    scalarMul(scalar, v) {
        return scalar ? (v & 0xFF) : 0;
    }

    /**
     * Inner product in ℤ₂⁸: popcount(a AND b).
     *   ⟨a, b⟩ = |{i : aᵢ = 1 ∧ bᵢ = 1}|
     * 
     * @param {number} a - Byte value
     * @param {number} b - Byte value
     * @returns {number} - 0–8
     */
    inner(a, b) {
        return this._popcount(a & b);
    }

    /**
     * Hamming distance in ℤ₂⁸: popcount(a XOR b).
     *   d(a, b) = |{i : aᵢ ≠ bᵢ}|
     * 
     * @param {number} a - Byte value
     * @param {number} b - Byte value
     * @returns {number} - 0–8
     */
    distance(a, b) {
        return this._popcount(a ^ b);
    }

    /**
     * Inverse in ℤ₂⁸: self-inverse (every element is its own inverse).
     *   v ⊕ v = 0  ∀v ∈ ℤ₂⁸
     * 
     * @param {number} v - Byte value
     * @returns {number} - Same value (self-inverse under XOR)
     */
    inverse(v) {
        return v; // v ⊕ v = 0, so v is its own inverse
    }

    /**
     * Complement in ℤ₂⁸: bitwise NOT.
     *   v̄ = 0xFF XOR v
     * 
     * @param {number} v - Byte value
     * @returns {number}
     */
    complement(v) {
        return (0xFF ^ v) & 0xFF;
    }

    /**
     * Population count (number of 1-bits).
     * @private
     */
    _popcount(x) {
        x = x - ((x >> 1) & 0x55);
        x = (x & 0x33) + ((x >> 2) & 0x33);
        return (x + (x >> 4)) & 0x0F;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  ENCODING: Meaning → (U+2800–U+28FF)ⁿ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * E_text: Text → braille sequence.
     * UTF-8 byte bijection: each byte b → U+2800 + b.
     * 
     * @param {string} text
     * @returns {Uint8Array} - Array of byte values (each maps to one braille char)
     */
    encodeText(text) {
        return new TextEncoder().encode(text);
    }

    /**
     * D_text: braille sequence → Text.
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    decodeText(bytes) {
        return new TextDecoder().decode(bytes);
    }

    /**
     * E_concept: Concept names → braille sequence via atlas.
     * Each concept → 1 byte (atlas index).
     * 
     * @param {Array<string>} concepts
     * @returns {Uint8Array}
     */
    encodeConcepts(concepts) {
        const bytes = new Uint8Array(concepts.length);
        for (let i = 0; i < concepts.length; i++) {
            const idx = this.atlas.getIndex(concepts[i]);
            bytes[i] = idx !== null ? idx : 0; // VOID for unknown
        }
        return bytes;
    }

    /**
     * D_concept: braille sequence → concept names.
     * @param {Uint8Array} bytes
     * @returns {Array<string>}
     */
    decodeConcepts(bytes) {
        return Array.from(bytes, b => this.atlas.getConcept(b) || 'VOID');
    }

    /**
     * E_audio: 8-band energy frame → single byte.
     * @param {Array<number>} energies - 8 real-valued band energies
     * @param {number} threshold - Activation threshold (default 0.5)
     * @returns {number} - Byte value
     */
    encodeAudio(energies, threshold = 0.5) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if ((energies[i] || 0) >= threshold) byte |= (1 << i);
        }
        return byte;
    }

    /**
     * D_audio: byte → 8-band activation vector.
     * @param {number} byte
     * @returns {Float64Array}
     */
    decodeAudio(byte) {
        const v = new Float64Array(8);
        for (let i = 0; i < 8; i++) v[i] = (byte >> i) & 1;
        return v;
    }

    /**
     * E_image: 8-feature patch descriptor → single byte.
     * Features: edge orientation (4 dims) + intensity (2 dims) + texture (2 dims).
     * @param {Array<number>} features - 8 binary features
     * @returns {number}
     */
    encodeImage(features) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if (features[i]) byte |= (1 << i);
        }
        return byte;
    }

    /**
     * D_image: byte → 8 feature activations.
     * @param {number} byte
     * @returns {Float64Array}
     */
    decodeImage(byte) {
        return this.decodeAudio(byte); // same bit extraction
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  REASONING TRANSFORM: T: (ℤ₂⁸)ⁿ → (ℤ₂⁸)ᵐ
    // ═══════════════════════════════════════════════════════════════════════
    //
    // A reasoning step transforms a sequence of braille atoms (premise)
    // into a shorter sequence (conclusion) via a learned linear map over ℤ₂.
    //
    //   P = [c₁, c₂, ..., cₙ]        (premise: n braille bytes)
    //   vec(P) ∈ ℤ₂^(8n)              (flatten to bit vector)
    //   Q = W · vec(P) mod 2           (linear map W ∈ ℤ₂^(8m × 8n))
    //   Conclusion = reshape(Q, m, 8)  (m braille bytes)

    /**
     * Apply a reasoning transform: compress n concepts into m concepts.
     * Uses XOR-based linear combination (modular arithmetic in ℤ₂).
     * 
     * @param {Uint8Array} premise - n bytes (concept sequence)
     * @param {Array<Array<number>>} weights - m×n weight matrix (each entry 0 or 1)
     * @returns {Uint8Array} - m bytes (conclusion)
     */
    reason(premise, weights) {
        const m = weights.length;
        const conclusion = new Uint8Array(m);

        for (let i = 0; i < m; i++) {
            let result = 0;
            for (let j = 0; j < premise.length; j++) {
                if (weights[i][j]) {
                    result ^= premise[j]; // XOR accumulation = addition in ℤ₂
                }
            }
            conclusion[i] = result;
        }

        // Record trace
        this.trace.push({
            type: 'reason',
            premise: Array.from(premise),
            conclusion: Array.from(conclusion),
            timestamp: Date.now()
        });

        return conclusion;
    }

    /**
     * Distill a natural-language reasoning chain into braille atoms.
     * 
     *   frontier text → concept extraction → atlas encoding → compressed
     * 
     * @param {string} reasoningText - Natural language reasoning from a frontier model
     * @returns {Object} - { concepts, bytes, braille, compressed }
     */
    distill(reasoningText) {
        // Extract concept keywords (simple heuristic)
        const words = reasoningText.toUpperCase().split(/\s+/);
        const concepts = [];

        for (const word of words) {
            const clean = word.replace(/[^A-Z_]/g, '');
            if (this.atlas.getIndex(clean) !== null) {
                concepts.push(clean);
            }
        }

        // Deduplicate while preserving order
        const seen = new Set();
        const unique = concepts.filter(c => {
            if (seen.has(c)) return false;
            seen.add(c);
            return true;
        });

        const bytes = this.encodeConcepts(unique);

        // Build braille string
        let braille = '';
        for (const b of bytes) braille += String.fromCodePoint(0x2800 + b);

        // Compress via XOR folding (halve the length by XOR-ing pairs)
        let compressed = bytes;
        if (bytes.length > 2) {
            compressed = this._xorFold(bytes);
        }

        let compressedBraille = '';
        for (const b of compressed) compressedBraille += String.fromCodePoint(0x2800 + b);

        this.trace.push({
            type: 'distill',
            inputLength: reasoningText.length,
            conceptCount: unique.length,
            compressedLength: compressed.length,
            timestamp: Date.now()
        });

        return {
            concepts: unique,
            bytes,
            braille,
            compressed,
            compressedBraille,
            ratio: unique.length > 0
                ? (compressed.length / unique.length).toFixed(2)
                : '0'
        };
    }

    /**
     * XOR fold: compress sequence by XOR-ing adjacent pairs.
     *   [a, b, c, d] → [a⊕b, c⊕d]
     * 
     * @private
     * @param {Uint8Array} bytes
     * @returns {Uint8Array}
     */
    _xorFold(bytes) {
        const len = Math.ceil(bytes.length / 2);
        const folded = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            folded[i] = bytes[i * 2];
            if (i * 2 + 1 < bytes.length) {
                folded[i] ^= bytes[i * 2 + 1];
            }
        }
        return folded;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  COMPOSE / SEQUENCE — Building thought chains
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compose two braille atoms: the "thought combinator."
     *   combine(a, b) = a ⊕ b
     * 
     * Composing concepts creates new meaning:
     *   LOVE ⊕ DEATH = the XOR of their bit patterns
     * 
     * @param {string} conceptA
     * @param {string} conceptB
     * @returns {{ byte: number, braille: string, concept: string|null, components: string }}
     */
    compose(conceptA, conceptB) {
        const a = this.atlas.getIndex(conceptA);
        const b = this.atlas.getIndex(conceptB);
        if (a === null || b === null) return null;

        const result = this.add(a, b);
        const concept = this.atlas.getConcept(result);

        return {
            byte: result,
            braille: String.fromCodePoint(0x2800 + result),
            concept: concept || null,
            components: `${conceptA}(${a.toString(2).padStart(8, '0')}) ⊕ ${conceptB}(${b.toString(2).padStart(8, '0')}) = ${result.toString(2).padStart(8, '0')}`,
            distance_a: this.distance(result, a),
            distance_b: this.distance(result, b)
        };
    }

    /**
     * Analogy in ℤ₂⁸:
     *   A is to B as C is to ?
     *   ? = B ⊕ A ⊕ C  (the relationship B-A applied to C, in XOR arithmetic)
     * 
     * @param {string} a - Concept A
     * @param {string} b - Concept B
     * @param {string} c - Concept C
     * @returns {Object|null}
     */
    analogy(a, b, c) {
        const aIdx = this.atlas.getIndex(a);
        const bIdx = this.atlas.getIndex(b);
        const cIdx = this.atlas.getIndex(c);
        if (aIdx === null || bIdx === null || cIdx === null) return null;

        // relationship = a ⊕ b, apply to c: result = c ⊕ (a ⊕ b)
        const relationship = this.add(aIdx, bIdx);
        const result = this.add(cIdx, relationship);
        const concept = this.atlas.getConcept(result);

        return {
            query: `${a} is to ${b} as ${c} is to ?`,
            relationship: relationship,
            result: result,
            braille: String.fromCodePoint(0x2800 + result),
            concept: concept || `UNKNOWN(${result})`,
            equation: `${c} ⊕ (${a} ⊕ ${b}) = ${result.toString(2).padStart(8, '0')}`
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  SERIALIZATION — To/from wire format
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Serialize a braille byte sequence to BBES base64 wire format.
     * @param {Uint8Array} bytes
     * @returns {string} - Base64 encoded
     */
    toWire(bytes) {
        let binary = '';
        for (const b of bytes) binary += b.toString(2).padStart(8, '0');
        return BBESCodec.createBBES(binary);
    }

    /**
     * Deserialize from BBES base64 wire format.
     * @param {string} bbes - Base64 encoded
     * @returns {Uint8Array}
     */
    fromWire(bbes) {
        const binary = BBESCodec.decodeBBES(bbes);
        const bytes = new Uint8Array(Math.floor(binary.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(binary.substr(i * 8, 8), 2);
        }
        return bytes;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  TRACE / STATS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the reasoning trace.
     * @returns {Array<Object>}
     */
    getTrace() {
        return [...this.trace];
    }

    /**
     * Clear the trace.
     */
    clearTrace() {
        this.trace = [];
    }

    /**
     * Get engine stats.
     * @returns {Object}
     */
    getStats() {
        return {
            atlasVersion: this.atlas.options.version,
            atlasCoverage: this.atlas.getStats().coverage,
            traceLength: this.trace.length,
            hasArchitecture: !!this.architecture,
            algebra: {
                space: 'ℤ₂⁸',
                cardinality: 256,
                group: '(ℤ₂⁸, ⊕)',
                identity: 0,
                allSelfInverse: true
            }
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SemanticEngine };
} else if (typeof window !== 'undefined') {
    window.SemanticEngine = SemanticEngine;
}
