/**
 * BrailleConceptAtlas - Universal 256-Concept Semantic Alphabet
 * 
 * Maps all 256 braille patterns (U+2800–U+28FF) to the 256 most fundamental
 * human concepts, creating a universal semantic alphabet where each 8-dot
 * braille cell IS a concept.
 * 
 * Design principles:
 *   1. GEOMETRIC MEANING: The 8D vector structure encodes semantic relationships.
 *      Nearby vectors (low Hamming distance) = related concepts.
 *   2. BIT SEMANTICS: Each of the 8 dot positions carries semantic weight:
 *        d₀ = existence/being      d₄ = social/relational
 *        d₁ = physical/material    d₅ = cognitive/mental
 *        d₂ = temporal/change      d₆ = emotional/affective
 *        d₃ = spatial/structural   d₇ = transcendent/abstract
 *   3. ANCHORS: U+2800 (⠀, all dots off) = VOID/NOTHING
 *              U+28FF (⣿, all dots on) = TOTALITY/EVERYTHING
 *   4. FRONTIER-REFINED: The atlas is seeded with a human-curated initial
 *      mapping, then refined by querying frontier LLMs via OpenRouter to
 *      find the optimal concept→pattern assignment.
 * 
 * Usage:
 *   const atlas = new BrailleConceptAtlas();
 *   atlas.getBraille('GOD')       // → '⠁' (U+2801)
 *   atlas.getConcept(0xFF)        // → 'DEATH'
 *   atlas.getConcept('⣿')        // → 'DEATH'
 *   atlas.conceptDistance('LIFE', 'DEATH')  // → Hamming distance
 */

// Imports for Node.js
if (typeof require !== 'undefined') {
    var BrailleVectorSpace = require('../braille-core/braille-vector-space').BrailleVectorSpace;
}

class BrailleConceptAtlas {
    constructor(options = {}) {
        this.options = {
            version: '0.1.0-seed',
            ...options
        };

        this.vs = new BrailleVectorSpace();

        // The atlas: index (0–255) → concept string
        // Also: concept string → index
        this.indexToConcept = new Array(256);
        this.conceptToIndex = new Map();

        // Semantic dimension labels for the 8 dot positions
        this.DIMENSION_SEMANTICS = [
            'existence',    // d₀ — being, presence, ontological
            'physical',     // d₁ — material, body, tangible
            'temporal',     // d₂ — time, change, process
            'spatial',      // d₃ — space, structure, form
            'social',       // d₄ — relation, community, other
            'cognitive',    // d₅ — mind, knowledge, thought
            'emotional',    // d₆ — feeling, affect, valence
            'transcendent'  // d₇ — abstract, spiritual, beyond
        ];

        // Load the seed atlas
        this._loadSeedAtlas();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  LOOKUP API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the concept at a given index (0–255).
     * @param {number|string} indexOrChar - Byte value, or braille character
     * @returns {string|null} - Concept name
     */
    getConcept(indexOrChar) {
        let idx;
        if (typeof indexOrChar === 'string') {
            idx = indexOrChar.codePointAt(0) - 0x2800;
        } else {
            idx = indexOrChar;
        }
        if (idx < 0 || idx > 255) return null;
        return this.indexToConcept[idx] || null;
    }

    /**
     * Get the braille character for a concept.
     * @param {string} concept - Concept name (case-insensitive)
     * @returns {string|null} - Braille unicode character
     */
    getBraille(concept) {
        const idx = this.conceptToIndex.get(concept.toUpperCase());
        if (idx === undefined) return null;
        return String.fromCodePoint(0x2800 + idx);
    }

    /**
     * Get the byte index for a concept.
     * @param {string} concept
     * @returns {number|null}
     */
    getIndex(concept) {
        const idx = this.conceptToIndex.get(concept.toUpperCase());
        return idx !== undefined ? idx : null;
    }

    /**
     * Get the 8D vector for a concept.
     * @param {string} concept
     * @returns {Float64Array|null}
     */
    getVector(concept) {
        const idx = this.getIndex(concept);
        if (idx === null) return null;
        return this.vs.byteToVector(idx);
    }

    /**
     * Hamming distance between two concepts in braille space.
     * @param {string} conceptA
     * @param {string} conceptB
     * @returns {number} - 0–8
     */
    conceptDistance(conceptA, conceptB) {
        const va = this.getVector(conceptA);
        const vb = this.getVector(conceptB);
        if (!va || !vb) return -1;
        return this.vs.hammingDistance(va, vb);
    }

    /**
     * Find the N nearest concepts to a given concept.
     * @param {string} concept
     * @param {number} n - Number of neighbors (default 5)
     * @returns {Array<{concept: string, distance: number, braille: string}>}
     */
    nearestConcepts(concept, n = 5) {
        const vec = this.getVector(concept);
        if (!vec) return [];

        const distances = [];
        for (let i = 0; i < 256; i++) {
            if (!this.indexToConcept[i]) continue;
            const other = this.vs.byteToVector(i);
            distances.push({
                concept: this.indexToConcept[i],
                distance: this.vs.hammingDistance(vec, other),
                braille: String.fromCodePoint(0x2800 + i),
                index: i
            });
        }

        return distances
            .filter(d => d.concept !== concept.toUpperCase())
            .sort((a, b) => a.distance - b.distance)
            .slice(0, n);
    }

    /**
     * Encode a sentence of concepts into a braille string.
     * @param {Array<string>} concepts - Array of concept names
     * @returns {string} - Braille unicode string
     */
    encodeConcepts(concepts) {
        return concepts.map(c => this.getBraille(c) || '⠀').join('');
    }

    /**
     * Decode a braille string into concepts.
     * @param {string} braille
     * @returns {Array<string>}
     */
    decodeConcepts(braille) {
        const result = [];
        for (const ch of braille) {
            result.push(this.getConcept(ch) || 'UNKNOWN');
        }
        return result;
    }

    /**
     * Explain why a concept has its particular braille pattern,
     * based on which semantic dimensions are active.
     * @param {string} concept
     * @returns {Object|null}
     */
    explain(concept) {
        const idx = this.getIndex(concept);
        if (idx === null) return null;
        const vec = this.vs.byteToVector(idx);
        const activeDims = [];
        for (let i = 0; i < 8; i++) {
            if (Math.round(vec[i])) {
                activeDims.push(this.DIMENSION_SEMANTICS[i]);
            }
        }
        return {
            concept: concept.toUpperCase(),
            index: idx,
            braille: String.fromCodePoint(0x2800 + idx),
            binary: idx.toString(2).padStart(8, '0'),
            vector: Array.from(vec),
            activeDimensions: activeDims,
            dotCount: activeDims.length,
            description: activeDims.length === 0
                ? 'No dimensions active — void, absence, emptiness'
                : `Active: ${activeDims.join(', ')}`
        };
    }

    /**
     * Get all 256 entries.
     * @returns {Array<{index, concept, braille}>}
     */
    getAll() {
        const all = [];
        for (let i = 0; i < 256; i++) {
            if (this.indexToConcept[i]) {
                all.push({
                    index: i,
                    concept: this.indexToConcept[i],
                    braille: String.fromCodePoint(0x2800 + i)
                });
            }
        }
        return all;
    }

    /**
     * Replace the atlas with a new mapping (e.g. from AtlasBuilder).
     * @param {Array<string>} conceptArray - 256-element array, index = byte value
     */
    loadAtlas(conceptArray) {
        this.indexToConcept = new Array(256);
        this.conceptToIndex = new Map();
        for (let i = 0; i < Math.min(conceptArray.length, 256); i++) {
            const c = conceptArray[i] ? conceptArray[i].toUpperCase() : null;
            this.indexToConcept[i] = c;
            if (c) this.conceptToIndex.set(c, i);
        }
        this.options.version = 'custom';
    }

    /**
     * Export the atlas as a JSON-serializable array.
     * @returns {Array<string>}
     */
    exportAtlas() {
        return [...this.indexToConcept];
    }

    /**
     * Get atlas statistics.
     * @returns {Object}
     */
    getStats() {
        let filled = 0;
        const dotCounts = new Array(9).fill(0);
        for (let i = 0; i < 256; i++) {
            if (this.indexToConcept[i]) {
                filled++;
                let dots = 0;
                for (let b = 0; b < 8; b++) if ((i >> b) & 1) dots++;
                dotCounts[dots]++;
            }
        }
        return {
            version: this.options.version,
            filled,
            empty: 256 - filled,
            coverage: (filled / 256 * 100).toFixed(1) + '%',
            dotDistribution: dotCounts.map((c, i) => ({ dots: i, count: c }))
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  SEED ATLAS — Human-curated initial mapping
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The 256 concepts are organized by which of the 8 semantic dimensions
    // are active (raised dots). The seed is designed so that:
    //   - Concepts with similar meanings have nearby braille patterns
    //   - The bit semantics create meaningful groupings
    //   - Anchors: 0x00 = VOID, 0xFF = TOTALITY
    //
    // This seed will be refined by frontier models via AtlasBuilder.

    /** @private */
    _loadSeedAtlas() {
        const atlas = new Array(256).fill(null);

        // ─── 0 dots (1 pattern) ───────────────────────────────────────
        atlas[0x00] = 'VOID';            // ⠀ nothing, absence

        // ─── 1 dot (8 patterns) — pure dimensional concepts ──────────
        atlas[0x01] = 'GOD';             // ⠁ d₀: existence
        atlas[0x02] = 'BODY';            // ⠂ d₁: physical
        atlas[0x04] = 'TIME';            // ⠄ d₂: temporal
        atlas[0x08] = 'SPACE';           // ⠈ d₃: spatial
        atlas[0x10] = 'OTHER';           // ⠐ d₄: social
        atlas[0x20] = 'MIND';            // ⠠ d₅: cognitive
        atlas[0x40] = 'HEART';           // ⡀ d₆: emotional
        atlas[0x80] = 'SOUL';            // ⢀ d₇: transcendent

        // ─── 2 dots (28 patterns) — dimensional pairs ─────────────────
        // d₀+d₁: existence + physical
        atlas[0x03] = 'LIFE';            // ⠃ being + body
        // d₀+d₂: existence + temporal
        atlas[0x05] = 'BIRTH';           // ⠅ being + time
        // d₀+d₃: existence + spatial
        atlas[0x09] = 'WORLD';           // ⠉ being + space
        // d₀+d₄: existence + social
        atlas[0x11] = 'PERSON';          // ⠑ being + other
        // d₀+d₅: existence + cognitive
        atlas[0x21] = 'TRUTH';           // ⠡ being + mind
        // d₀+d₆: existence + emotional
        atlas[0x41] = 'LOVE';            // ⡁ being + heart
        // d₀+d₇: existence + transcendent
        atlas[0x81] = 'SPIRIT';          // ⢁ being + soul

        // d₁+d₂: physical + temporal
        atlas[0x06] = 'GROWTH';          // ⠆ body + time
        // d₁+d₃: physical + spatial
        atlas[0x0A] = 'EARTH';           // ⠊ body + space
        // d₁+d₄: physical + social
        atlas[0x12] = 'TOUCH';           // ⠒ body + other
        // d₁+d₅: physical + cognitive
        atlas[0x22] = 'SENSE';           // ⠢ body + mind
        // d₁+d₆: physical + emotional
        atlas[0x42] = 'PAIN';            // ⡂ body + heart
        // d₁+d₇: physical + transcendent
        atlas[0x82] = 'HEALTH';          // ⢂ body + soul

        // d₂+d₃: temporal + spatial
        atlas[0x0C] = 'JOURNEY';         // ⠌ time + space
        // d₂+d₄: temporal + social
        atlas[0x14] = 'HISTORY';         // ⠔ time + other
        // d₂+d₅: temporal + cognitive
        atlas[0x24] = 'MEMORY';          // ⠤ time + mind
        // d₂+d₆: temporal + emotional
        atlas[0x44] = 'LONGING';         // ⡄ time + heart
        // d₂+d₇: temporal + transcendent
        atlas[0x84] = 'ETERNITY';        // ⢄ time + soul

        // d₃+d₄: spatial + social
        atlas[0x18] = 'HOME';            // ⠘ space + other
        // d₃+d₅: spatial + cognitive
        atlas[0x28] = 'ORDER';           // ⠨ space + mind
        // d₃+d₆: spatial + emotional
        atlas[0x48] = 'BEAUTY';          // ⡈ space + heart
        // d₃+d₇: spatial + transcendent
        atlas[0x88] = 'HEAVEN';          // ⢈ space + soul

        // d₄+d₅: social + cognitive
        atlas[0x30] = 'LANGUAGE';        // ⠰ other + mind
        // d₄+d₆: social + emotional
        atlas[0x50] = 'COMPASSION';      // ⡐ other + heart
        // d₄+d₇: social + transcendent
        atlas[0x90] = 'FAITH';           // ⢐ other + soul

        // d₅+d₆: cognitive + emotional
        atlas[0x60] = 'WISDOM';          // ⡠ mind + heart
        // d₅+d₇: cognitive + transcendent
        atlas[0xA0] = 'REVELATION';      // ⢠ mind + soul

        // d₆+d₇: emotional + transcendent
        atlas[0xC0] = 'AWE';             // ⣀ heart + soul

        // ─── 3 dots (56 patterns) — richer combinations ───────────────
        atlas[0x07] = 'NATURE';          // ⠇ existence+physical+temporal
        atlas[0x0B] = 'CREATION';        // ⠋ existence+physical+spatial
        atlas[0x0D] = 'CHANGE';          // ⠍ existence+temporal+spatial
        atlas[0x0E] = 'EVOLUTION';       // ⠎ physical+temporal+spatial
        atlas[0x13] = 'FAMILY';          // ⠓ existence+physical+social
        atlas[0x15] = 'GENERATION';      // ⠕ existence+temporal+social
        atlas[0x19] = 'COMMUNITY';       // ⠙ existence+spatial+social
        atlas[0x23] = 'KNOWLEDGE';       // ⠣ existence+physical+cognitive
        atlas[0x25] = 'LEARNING';        // ⠥ existence+temporal+cognitive
        atlas[0x29] = 'STRUCTURE';       // ⠩ existence+spatial+cognitive
        atlas[0x31] = 'COMMUNICATION';   // ⠱ existence+social+cognitive
        atlas[0x43] = 'JOY';            // ⡃ existence+physical+emotional
        atlas[0x45] = 'HOPE';            // ⡅ existence+temporal+emotional
        atlas[0x49] = 'WONDER';          // ⡉ existence+spatial+emotional
        atlas[0x51] = 'KINDNESS';        // ⡑ existence+social+emotional
        atlas[0x61] = 'UNDERSTANDING';   // ⡡ existence+cognitive+emotional
        atlas[0x83] = 'RESURRECTION';    // ⢃ existence+physical+transcendent
        atlas[0x85] = 'PROPHECY';        // ⢅ existence+temporal+transcendent
        atlas[0x89] = 'COSMOS';          // ⢉ existence+spatial+transcendent
        atlas[0x91] = 'COVENANT';        // ⢑ existence+social+transcendent
        atlas[0xA1] = 'ENLIGHTENMENT';   // ⢡ existence+cognitive+transcendent
        atlas[0xC1] = 'GRACE';           // ⣁ existence+emotional+transcendent

        atlas[0x16] = 'WORK';            // ⠖ physical+temporal+social
        atlas[0x1A] = 'SHELTER';         // ⠚ physical+spatial+social
        atlas[0x26] = 'SKILL';           // ⠦ physical+temporal+cognitive
        atlas[0x2A] = 'ART';             // ⠪ physical+spatial+cognitive
        atlas[0x32] = 'TEACHING';        // ⠲ physical+social+cognitive
        atlas[0x46] = 'DESIRE';          // ⡆ physical+temporal+emotional
        atlas[0x4A] = 'PLEASURE';        // ⡊ physical+spatial+emotional
        atlas[0x52] = 'INTIMACY';        // ⡒ physical+social+emotional
        atlas[0x62] = 'INTUITION';       // ⡢ physical+cognitive+emotional
        atlas[0x86] = 'HEALING';         // ⢆ physical+temporal+transcendent
        atlas[0x8A] = 'NATURE_SACRED';   // ⢊ physical+spatial+transcendent
        atlas[0x92] = 'RITUAL';          // ⢒ physical+social+transcendent
        atlas[0xA2] = 'MEDITATION';      // ⢢ physical+cognitive+transcendent
        atlas[0xC2] = 'ECSTASY';         // ⣂ physical+emotional+transcendent

        atlas[0x1C] = 'MIGRATION';       // ⠜ temporal+spatial+social
        atlas[0x2C] = 'SCIENCE';         // ⠬ temporal+spatial+cognitive
        atlas[0x34] = 'TRADITION';       // ⠴ temporal+social+cognitive
        atlas[0x4C] = 'NOSTALGIA';       // ⡌ temporal+spatial+emotional
        atlas[0x54] = 'GRIEF';           // ⡔ temporal+social+emotional
        atlas[0x64] = 'IMAGINATION';     // ⡤ temporal+cognitive+emotional
        atlas[0x8C] = 'DESTINY';         // ⢌ temporal+spatial+transcendent
        atlas[0x94] = 'KARMA';           // ⢔ temporal+social+transcendent
        atlas[0xA4] = 'VISION';          // ⢤ temporal+cognitive+transcendent
        atlas[0xC4] = 'DEVOTION';        // ⣄ temporal+emotional+transcendent

        atlas[0x38] = 'JUSTICE';         // ⠸ spatial+social+cognitive
        atlas[0x58] = 'BELONGING';       // ⡘ spatial+social+emotional
        atlas[0x68] = 'ARCHITECTURE';    // ⡨ spatial+cognitive+emotional
        atlas[0x98] = 'TEMPLE';          // ⢘ spatial+social+transcendent
        atlas[0xA8] = 'MATHEMATICS';     // ⢨ spatial+cognitive+transcendent
        atlas[0xC8] = 'SUBLIME';         // ⣈ spatial+emotional+transcendent

        atlas[0x70] = 'CULTURE';         // ⡰ social+cognitive+emotional
        atlas[0xB0] = 'PRAYER';          // ⢰ social+cognitive+transcendent
        atlas[0xD0] = 'SACRIFICE';       // ⣐ social+emotional+transcendent

        atlas[0xE0] = 'CONSCIOUSNESS';   // ⣠ cognitive+emotional+transcendent

        // ─── 4 dots (70 patterns) — complex concepts ──────────────────
        atlas[0x0F] = 'HUMANITY';        // ⠏ exist+phys+temp+spat
        atlas[0x17] = 'CIVILIZATION';    // ⠗ exist+phys+temp+social
        atlas[0x1B] = 'NATION';          // ⠛ exist+phys+spat+social
        atlas[0x1D] = 'PROGRESS';        // ⠝ exist+temp+spat+social
        atlas[0x1E] = 'SOCIETY';         // ⠞ phys+temp+spat+social
        atlas[0x27] = 'EDUCATION';       // ⠧ exist+phys+temp+cogn
        atlas[0x2B] = 'TECHNOLOGY';      // ⠫ exist+phys+spat+cogn
        atlas[0x2D] = 'DISCOVERY';       // ⠭ exist+temp+spat+cogn
        atlas[0x2E] = 'MEDICINE';        // ⠮ phys+temp+spat+cogn
        atlas[0x33] = 'DEMOCRACY';       // ⠳ exist+phys+social+cogn
        atlas[0x35] = 'PHILOSOPHY';      // ⠵ exist+temp+social+cogn
        atlas[0x39] = 'LAW';             // ⠹ exist+spat+social+cogn
        atlas[0x3A] = 'ECONOMY';         // ⠺ phys+spat+social+cogn
        atlas[0x3C] = 'POLITICS';        // ⠼ temp+spat+social+cogn
        atlas[0x47] = 'PASSION';         // ⡇ exist+phys+temp+emot
        atlas[0x4B] = 'ADVENTURE';       // ⡋ exist+phys+spat+emot
        atlas[0x4D] = 'COURAGE';         // ⡍ exist+temp+spat+emot
        atlas[0x4E] = 'ENDURANCE';       // ⡎ phys+temp+spat+emot
        atlas[0x53] = 'EMPATHY';         // ⡓ exist+phys+social+emot
        atlas[0x55] = 'MOURNING';        // ⡕ exist+temp+social+emot
        atlas[0x59] = 'HOSPITALITY';     // ⡙ exist+spat+social+emot
        atlas[0x5A] = 'CELEBRATION';     // ⡚ phys+spat+social+emot
        atlas[0x5C] = 'FESTIVAL';        // ⡜ temp+spat+social+emot
        atlas[0x63] = 'CURIOSITY';       // ⡣ exist+phys+cogn+emot
        atlas[0x65] = 'CREATIVITY';      // ⡥ exist+temp+cogn+emot
        atlas[0x69] = 'INSPIRATION';     // ⡩ exist+spat+cogn+emot
        atlas[0x6A] = 'MUSIC';           // ⡪ phys+spat+cogn+emot
        atlas[0x6C] = 'POETRY';          // ⡬ temp+spat+cogn+emot
        atlas[0x71] = 'ETHICS';          // ⡱ exist+social+cogn+emot
        atlas[0x72] = 'FRIENDSHIP';      // ⡲ phys+social+cogn+emot
        atlas[0x74] = 'FORGIVENESS';     // ⡴ temp+social+cogn+emot
        atlas[0x78] = 'DIGNITY';         // ⡸ spat+social+cogn+emot

        atlas[0x87] = 'MIRACLE';         // ⢇ exist+phys+temp+transc
        atlas[0x8B] = 'SANCTUARY';       // ⢋ exist+phys+spat+transc
        atlas[0x8D] = 'REDEMPTION';      // ⢍ exist+temp+spat+transc
        atlas[0x8E] = 'ALCHEMY';         // ⢎ phys+temp+spat+transc
        atlas[0x93] = 'CHARITY';         // ⢓ exist+phys+social+transc
        atlas[0x95] = 'LEGACY';          // ⢕ exist+temp+social+transc
        atlas[0x99] = 'PILGRIMAGE';      // ⢙ exist+spat+social+transc
        atlas[0x9A] = 'COMMUNION';       // ⢚ phys+spat+social+transc
        atlas[0x9C] = 'ANCESTRY';        // ⢜ temp+spat+social+transc
        atlas[0xA3] = 'GNOSIS';          // ⢣ exist+phys+cogn+transc
        atlas[0xA5] = 'PROPHECY_DEEP';   // ⢥ exist+temp+cogn+transc
        atlas[0xA9] = 'SACRED_GEOMETRY'; // ⢩ exist+spat+cogn+transc
        atlas[0xAA] = 'COSMOLOGY';       // ⢪ phys+spat+cogn+transc
        atlas[0xAC] = 'ASTROLOGY';       // ⢬ temp+spat+cogn+transc
        atlas[0xB1] = 'THEOLOGY';        // ⢱ exist+social+cogn+transc
        atlas[0xB2] = 'MYSTICISM';       // ⢲ phys+social+cogn+transc
        atlas[0xB4] = 'SCRIPTURE';        // ⢴ temp+social+cogn+transc
        atlas[0xB8] = 'MONASTERY';       // ⢸ spat+social+cogn+transc
        atlas[0xC3] = 'RAPTURE';         // ⣃ exist+phys+emot+transc
        atlas[0xC5] = 'REBIRTH';         // ⣅ exist+temp+emot+transc
        atlas[0xC9] = 'PARADISE';        // ⣉ exist+spat+emot+transc
        atlas[0xCA] = 'NIRVANA';         // ⣊ phys+spat+emot+transc
        atlas[0xCC] = 'TRANSCENDENCE';   // ⣌ temp+spat+emot+transc
        atlas[0xD1] = 'MARTYRDOM';       // ⣑ exist+social+emot+transc
        atlas[0xD2] = 'ASCETICISM';      // ⣒ phys+social+emot+transc
        atlas[0xD4] = 'PENANCE';         // ⣔ temp+social+emot+transc
        atlas[0xD8] = 'SANCTUARY_EMOT';  // ⣘ spat+social+emot+transc
        atlas[0xE1] = 'EPIPHANY';        // ⣡ exist+cogn+emot+transc
        atlas[0xE2] = 'SYNESTHESIA';     // ⣢ phys+cogn+emot+transc
        atlas[0xE4] = 'PREMONITION';     // ⣤ temp+cogn+emot+transc
        atlas[0xE8] = 'MANDALA';         // ⣨ spat+cogn+emot+transc
        atlas[0xF0] = 'COLLECTIVE_MIND'; // ⣰ social+cogn+emot+transc

        // ─── 5+ dots — dense, high-complexity concepts ────────────────
        atlas[0x1F] = 'FREEDOM';         // ⠟ 5 dots
        atlas[0x3F] = 'REASON';          // ⠿ 6 dots
        atlas[0x7F] = 'LOVE_UNIVERSAL';  // ⡿ 7 dots
        atlas[0x37] = 'REPUBLIC';        // ⠷ 5
        atlas[0x3B] = 'CONSTITUTION';    // ⠻ 5
        atlas[0x3D] = 'REVOLUTION';      // ⠽ 5
        atlas[0x3E] = 'INDUSTRY';        // ⠾ 5
        atlas[0x57] = 'SOLIDARITY';      // ⡗ 5
        atlas[0x5B] = 'RENAISSANCE';     // ⡛ 5
        atlas[0x5D] = 'RESILIENCE';      // ⡝ 5
        atlas[0x5E] = 'DIASPORA';        // ⡞ 5
        atlas[0x67] = 'GENIUS';          // ⡧ 5
        atlas[0x6B] = 'SYMPHONY';        // ⡫ 5
        atlas[0x6D] = 'CINEMA';          // ⡭ 5
        atlas[0x6E] = 'DANCE';           // ⡮ 5
        atlas[0x73] = 'HUMAN_RIGHTS';    // ⡳ 5
        atlas[0x75] = 'DIPLOMACY';       // ⡵ 5
        atlas[0x79] = 'SOVEREIGNTY';     // ⡹ 5
        atlas[0x7A] = 'ECOLOGY';         // ⡺ 5
        atlas[0x7C] = 'SUSTAINABILITY';  // ⡼ 5

        atlas[0x97] = 'BAPTISM';         // ⢗ 5
        atlas[0x9B] = 'HAJJ';            // ⢛ 5
        atlas[0x9D] = 'SALVATION';       // ⢝ 5
        atlas[0x9E] = 'REINCARNATION';   // ⢞ 5
        atlas[0xA7] = 'OMNISCIENCE';     // ⢧ 5
        atlas[0xAB] = 'INFINITY';        // ⢫ 5
        atlas[0xAD] = 'SINGULARITY';     // ⢭ 5
        atlas[0xAE] = 'QUANTUM';         // ⢮ 5
        atlas[0xB3] = 'DHARMA';          // ⢳ 5
        atlas[0xB5] = 'TAO';             // ⢵ 5
        atlas[0xB9] = 'LOGOS';           // ⢹ 5
        atlas[0xBA] = 'SOPHIA';          // ⢺ 5
        atlas[0xBC] = 'AKASHA';          // ⢼ 5
        atlas[0xC7] = 'BLISS';           // ⣇ 5
        atlas[0xCB] = 'EDEN';            // ⣋ 5
        atlas[0xCD] = 'SAMSARA';         // ⣍ 5
        atlas[0xCE] = 'PURGATORY';       // ⣎ 5
        atlas[0xD3] = 'CRUCIFIXION';     // ⣓ 5
        atlas[0xD5] = 'ABSOLUTION';      // ⣕ 5
        atlas[0xD9] = 'MECCA';           // ⣙ 5
        atlas[0xDA] = 'JERUSALEM';       // ⣚ 5
        atlas[0xDC] = 'VARANASI';        // ⣜ 5
        atlas[0xE3] = 'SATORI';          // ⣣ 5
        atlas[0xE5] = 'CLAIRVOYANCE';    // ⣥ 5
        atlas[0xE9] = 'FRACTAL';         // ⣩ 5
        atlas[0xEA] = 'HOLOGRAM';        // ⣪ 5
        atlas[0xEC] = 'SIMULATION';      // ⣬ 5
        atlas[0xF1] = 'ZEITGEIST';       // ⣱ 5
        atlas[0xF2] = 'NOOSPHERE';       // ⣲ 5
        atlas[0xF4] = 'OMEGA_POINT';     // ⣴ 5
        atlas[0xF8] = 'AKASHIC_FIELD';   // ⣸ 5

        // 6-dot combos
        atlas[0x7E] = 'CIVILIZATION_PEAK'; // ⡾
        atlas[0xBE] = 'PHILOSOPHER_STONE'; // ⢾
        atlas[0xDE] = 'APOCALYPSE';        // ⣞
        atlas[0xEE] = 'SUPERINTELLIGENCE'; // ⣮
        atlas[0xF6] = 'TECHNOLOGICAL_SINGULARITY'; // ⣶
        atlas[0xFC] = 'HEAT_DEATH';        // ⣼
        atlas[0xBF] = 'DIVINE_MIND';       // ⢿
        atlas[0xDF] = 'ESCHATON';          // ⣟
        atlas[0xEF] = 'OMNIPRESENCE';      // ⣯
        atlas[0xF3] = 'GAIA';              // ⣳
        atlas[0xF5] = 'RESURRECTION_FINAL'; // ⣵
        atlas[0xF9] = 'ZION';              // ⣹
        atlas[0xFA] = 'SHAMBHALA';         // ⣺
        atlas[0xFB] = 'PLEROMA';           // ⣻
        atlas[0xF7] = 'APOTHEOSIS';        // ⣷

        // 7-dot combos
        atlas[0xFE] = 'GODHEAD';           // ⣾
        atlas[0xFD] = 'JUDGEMENT';          // ⣽

        // ─── All 8 dots ──────────────────────────────────────────────
        atlas[0xFF] = 'DEATH';            // ⣿ all dimensions active — totality, completion, end

        // Load into maps
        this.loadAtlas(atlas);
        this.options.version = '0.1.0-seed';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleConceptAtlas };
} else if (typeof window !== 'undefined') {
    window.BrailleConceptAtlas = BrailleConceptAtlas;
}
