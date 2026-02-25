/**
 * BrailleBasis - Formal Basis System for Braille Vector Spaces
 * 
 * Separates two concerns that were previously conflated:
 * 
 *   (a) The underlying space dimension k:  ℤ₂ᵏ
 *   (b) The dot-set D ⊆ {1,...,8}:        𝓑_D = {0,1}^D
 * 
 * Notation:
 * 
 *   𝓑_D          Basis indexed by dot-set D
 *   𝓑_{1..6}     Standard 6-dot braille        ≅ ℤ₂⁶
 *   𝓑_{1..8}     Full 8-dot braille             ≅ ℤ₂⁸
 *   𝓑_{1,2,3,4,7,8}  6-of-8 variant            ≅ ℤ₂⁶
 * 
 * Filtration (nested sequence of subspaces):
 * 
 *   𝓑₀ ⊂ 𝓑₁ ⊂ 𝓑₂ ⊂ ⋯ ⊂ 𝓑₈
 * 
 *   where 𝓑ₖ = 𝓑_{1,...,k} ≅ ℤ₂ᵏ
 * 
 * Six-of-eight variants:
 * 
 *   𝓑₆⁽ⁱ⁾ = 𝓑_{Dᵢ},  |Dᵢ| = 6,  Dᵢ ∈ C(8,6)
 * 
 *   There are C(8,6) = 28 such layers.
 * 
 * Machine labels (for code/logs):
 * 
 *   Z2^8[D=12345678]    Full 8-dot
 *   Z2^6[D=123456]      Standard 6-dot
 *   Z2^6[D=123478]      6-of-8 variant (dots 1,2,3,4,7,8)
 * 
 * This module provides:
 *   1. BrailleBasis class — a specific dot-set D with its ℤ₂ᵏ operations
 *   2. Filtration — the nested ladder 𝓑₀ ⊂ ⋯ ⊂ 𝓑₈
 *   3. Projection/embedding between any two bases
 *   4. All 28 six-of-eight variant enumeration
 *   5. Machine-label parser/generator
 */

class BrailleBasis {
    /**
     * Create a basis for a specific dot-set D.
     * 
     * @param {Array<number>} dotSet - Which dots are active, 1-indexed.
     *   e.g. [1,2,3,4,5,6] for standard 6-dot, [1,2,3,4,5,6,7,8] for full 8-dot.
     *   Order matters: dotSet[i] maps to the i-th coordinate of the k-vector.
     */
    constructor(dotSet) {
        if (!dotSet || dotSet.length === 0) {
            // 𝓑₀ — the trivial 0-dimensional basis (just the zero vector)
            this.D = [];
            this.k = 0;
            this.cardinality = 1;
        } else {
            // Validate: dots must be in {1..8}, unique
            const valid = dotSet.every(d => d >= 1 && d <= 8 && Number.isInteger(d));
            if (!valid) throw new Error('Dot-set must contain integers in {1,...,8}');
            const unique = [...new Set(dotSet)];
            if (unique.length !== dotSet.length) throw new Error('Dot-set must not contain duplicates');

            this.D = [...dotSet].sort((a, b) => a - b);
            this.k = this.D.length;
            this.cardinality = 1 << this.k; // 2^k
        }

        // Bit-indices into the 8-bit Unicode encoding.
        // Braille Unicode: U+2800 + Σ(dᵢ × 2^(dotNumber-1))
        // Dot numbers are 1-indexed; bit position = dotNumber - 1.
        this.bitPositions = this.D.map(d => d - 1);

        // Precompute the mask: which bits of a full 8-bit pattern belong to this basis
        this.mask = 0;
        for (const pos of this.bitPositions) {
            this.mask |= (1 << pos);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  IDENTITY & LABELS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Math notation: 𝓑_D
     * @returns {string}  e.g. "𝓑_{1,2,3,4,5,6}"
     */
    get mathLabel() {
        if (this.k === 0) return '𝓑_∅';
        return `𝓑_{${this.D.join(',')}}`;
    }

    /**
     * Compact math notation: ℤ₂ᵏ
     * @returns {string}  e.g. "ℤ₂⁶"
     */
    get spaceLabel() {
        const superscripts = '⁰¹²³⁴⁵⁶⁷⁸';
        return `ℤ₂${superscripts[this.k]}`;
    }

    /**
     * Machine label for code/logs.
     * @returns {string}  e.g. "Z2^6[D=123456]"
     */
    get machineLabel() {
        return `Z2^${this.k}[D=${this.D.join('')}]`;
    }

    /**
     * Check if this is the standard filtration layer 𝓑ₖ = 𝓑_{1..k}.
     * @returns {boolean}
     */
    get isStandardLayer() {
        for (let i = 0; i < this.k; i++) {
            if (this.D[i] !== i + 1) return false;
        }
        return true;
    }

    /**
     * String representation.
     * @returns {string}
     */
    toString() {
        return `${this.mathLabel} ≅ ${this.spaceLabel}  (${this.machineLabel})`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  VECTOR ↔ BYTE ↔ BRAILLE CONVERSIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Convert a k-dimensional vector in this basis to a full 8-bit byte.
     * The k-vector's coordinates map to the dot positions in D.
     * Unmapped bit positions are 0.
     * 
     *   embed: ℤ₂ᵏ → ℤ₂⁸
     * 
     * @param {Float64Array|Array<number>} vec - k-element vector
     * @returns {number} - Byte value 0–255
     */
    vectorToByte(vec) {
        let byte = 0;
        for (let i = 0; i < this.k; i++) {
            if (Math.round(vec[i] || 0)) {
                byte |= (1 << this.bitPositions[i]);
            }
        }
        return byte;
    }

    /**
     * Convert a full 8-bit byte to a k-dimensional vector in this basis.
     * Only the bits at dot positions in D are extracted.
     * 
     *   project: ℤ₂⁸ → ℤ₂ᵏ
     * 
     * @param {number} byte - Byte value 0–255
     * @returns {Float64Array} - k-element vector
     */
    byteToVector(byte) {
        const v = new Float64Array(this.k);
        for (let i = 0; i < this.k; i++) {
            v[i] = (byte >> this.bitPositions[i]) & 1;
        }
        return v;
    }

    /**
     * Convert a k-vector to a braille Unicode character.
     *   embed then to char: ℤ₂ᵏ → ℤ₂⁸ → Braille
     * 
     * @param {Float64Array|Array<number>} vec
     * @returns {string}
     */
    vectorToChar(vec) {
        return String.fromCodePoint(0x2800 + this.vectorToByte(vec));
    }

    /**
     * Convert a braille character to a k-vector in this basis.
     *   project: Braille → ℤ₂⁸ → ℤ₂ᵏ
     * 
     * @param {string} char
     * @returns {Float64Array}
     */
    charToVector(char) {
        return this.byteToVector(char.codePointAt(0) - 0x2800);
    }

    /**
     * Convert a k-vector to a binary string of length k.
     * @param {Float64Array|Array<number>} vec
     * @returns {string}
     */
    vectorToBinary(vec) {
        let s = '';
        for (let i = 0; i < this.k; i++) {
            s += Math.round(vec[i] || 0) ? '1' : '0';
        }
        return s;
    }

    /**
     * Convert a binary string of length k to a k-vector.
     * @param {string} binary
     * @returns {Float64Array}
     */
    binaryToVector(binary) {
        const v = new Float64Array(this.k);
        for (let i = 0; i < this.k; i++) {
            v[i] = binary[i] === '1' ? 1 : 0;
        }
        return v;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  ALGEBRA ON ℤ₂ᵏ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Addition in ℤ₂ᵏ (XOR, coordinate-wise mod 2).
     * @param {number} a - Byte
     * @param {number} b - Byte
     * @returns {number} - XOR restricted to this basis's mask
     */
    add(a, b) {
        return ((a ^ b) & this.mask);
    }

    /**
     * Inner product ⟨a, b⟩ = popcount(a AND b AND mask).
     * @param {number} a
     * @param {number} b
     * @returns {number} - 0..k
     */
    inner(a, b) {
        return this._popcount((a & b) & this.mask);
    }

    /**
     * Hamming distance restricted to this basis.
     * @param {number} a
     * @param {number} b
     * @returns {number} - 0..k
     */
    distance(a, b) {
        return this._popcount((a ^ b) & this.mask);
    }

    /**
     * Weight (number of active dots in this basis).
     * @param {number} byte
     * @returns {number}
     */
    weight(byte) {
        return this._popcount(byte & this.mask);
    }

    /**
     * Complement within this basis (flip all bits in D, leave others unchanged).
     * @param {number} byte
     * @returns {number}
     */
    complement(byte) {
        return (byte ^ this.mask) & 0xFF;
    }

    /**
     * Identity element: 0 (all dots off in this basis).
     * @returns {number}
     */
    get identity() {
        return 0;
    }

    /**
     * Maximum element: all dots on in this basis.
     * @returns {number}
     */
    get maxElement() {
        return this.mask;
    }

    /**
     * Enumerate all 2^k elements of this basis as bytes.
     * @returns {Array<number>}
     */
    enumerate() {
        const elements = [];
        for (let i = 0; i < this.cardinality; i++) {
            let byte = 0;
            for (let j = 0; j < this.k; j++) {
                if ((i >> j) & 1) {
                    byte |= (1 << this.bitPositions[j]);
                }
            }
            elements.push(byte);
        }
        return elements;
    }

    /** @private */
    _popcount(x) {
        x = x - ((x >> 1) & 0x55);
        x = (x & 0x33) + ((x >> 2) & 0x33);
        return (x + (x >> 4)) & 0x0F;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  PROJECTION & EMBEDDING BETWEEN BASES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Project a byte from a larger basis to this (smaller or different) basis.
     * Keeps only the bits at positions in this.D.
     * 
     *   π_D: ℤ₂⁸ → ℤ₂ᵏ  (embedded back as 8-bit with other bits zeroed)
     * 
     * @param {number} byte
     * @returns {number} - Byte with only this basis's bits preserved
     */
    project(byte) {
        return byte & this.mask;
    }

    /**
     * Embed a byte from this basis into a target basis.
     * Bits in this.D are mapped to the target's coordinate system.
     * 
     * @param {number} byte - Byte with bits set at this basis's positions
     * @param {BrailleBasis} target - Target basis
     * @returns {number} - Byte in the target basis's coordinate system
     */
    embedInto(byte, target) {
        // Only the bits that are in BOTH bases survive
        return byte & this.mask & target.mask;
    }

    /**
     * Check if this basis is a sub-basis of another.
     *   𝓑_D ⊆ 𝓑_E  iff  D ⊆ E
     * 
     * @param {BrailleBasis} other
     * @returns {boolean}
     */
    isSubBasisOf(other) {
        return (this.mask & other.mask) === this.mask;
    }

    /**
     * Check if this basis is a super-basis of another.
     * @param {BrailleBasis} other
     * @returns {boolean}
     */
    isSuperBasisOf(other) {
        return other.isSubBasisOf(this);
    }

    /**
     * Intersection of two bases: 𝓑_{D ∩ E}
     * @param {BrailleBasis} other
     * @returns {BrailleBasis}
     */
    intersect(other) {
        const commonDots = this.D.filter(d => other.D.includes(d));
        return new BrailleBasis(commonDots);
    }

    /**
     * Union of two bases: 𝓑_{D ∪ E}
     * @param {BrailleBasis} other
     * @returns {BrailleBasis}
     */
    union(other) {
        const allDots = [...new Set([...this.D, ...other.D])].sort((a, b) => a - b);
        return new BrailleBasis(allDots);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FACTORIES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard filtration layers: 𝓑₀ ⊂ 𝓑₁ ⊂ ⋯ ⊂ 𝓑₈
 * where 𝓑ₖ = 𝓑_{1,...,k} ≅ ℤ₂ᵏ
 */
BrailleBasis.filtration = function () {
    const layers = [];
    for (let k = 0; k <= 8; k++) {
        const dots = [];
        for (let d = 1; d <= k; d++) dots.push(d);
        layers.push(new BrailleBasis(dots));
    }
    return layers;
};

/**
 * Standard 6-dot basis: 𝓑_{1,2,3,4,5,6} ≅ ℤ₂⁶
 * @returns {BrailleBasis}
 */
BrailleBasis.standard6 = function () {
    return new BrailleBasis([1, 2, 3, 4, 5, 6]);
};

/**
 * Full 8-dot basis: 𝓑_{1,2,3,4,5,6,7,8} ≅ ℤ₂⁸
 * @returns {BrailleBasis}
 */
BrailleBasis.full8 = function () {
    return new BrailleBasis([1, 2, 3, 4, 5, 6, 7, 8]);
};

/**
 * Enumerate all C(8,6) = 28 six-of-eight variants.
 * 
 *   𝓑₆⁽ⁱ⁾ = 𝓑_{Dᵢ},  |Dᵢ| = 6,  Dᵢ ∈ C({1,...,8}, 6)
 * 
 * @returns {Array<BrailleBasis>} - 28 bases, each with k=6
 */
BrailleBasis.sixOfEight = function () {
    const all = [];
    const dots = [1, 2, 3, 4, 5, 6, 7, 8];

    // Generate all C(8,6) = C(8,2) complement sets (which 2 to exclude)
    for (let i = 0; i < 8; i++) {
        for (let j = i + 1; j < 8; j++) {
            const subset = dots.filter(d => d !== dots[i] && d !== dots[j]);
            all.push(new BrailleBasis(subset));
        }
    }

    return all;
};

/**
 * Get a specific six-of-eight variant by index (0–27).
 * 
 *   𝓑₆⁽ⁱ⁾
 * 
 * @param {number} index - 0-based index into the 28 variants
 * @returns {BrailleBasis}
 */
BrailleBasis.sixOfEightVariant = function (index) {
    const variants = BrailleBasis.sixOfEight();
    if (index < 0 || index >= variants.length) {
        throw new Error(`Six-of-eight variant index must be 0–27, got ${index}`);
    }
    return variants[index];
};

/**
 * Parse a machine label back into a BrailleBasis.
 * 
 *   "Z2^6[D=123456]"  → BrailleBasis([1,2,3,4,5,6])
 *   "Z2^8[D=12345678]" → BrailleBasis([1,2,3,4,5,6,7,8])
 *   "Z2^6[D=123478]"  → BrailleBasis([1,2,3,4,7,8])
 * 
 * @param {string} label
 * @returns {BrailleBasis}
 */
BrailleBasis.fromMachineLabel = function (label) {
    const match = label.match(/Z2\^(\d+)\[D=([1-8]+)\]/);
    if (!match) throw new Error(`Invalid machine label: "${label}"`);

    const dots = match[2].split('').map(Number);
    const basis = new BrailleBasis(dots);

    const declaredK = parseInt(match[1], 10);
    if (basis.k !== declaredK) {
        throw new Error(`Dimension mismatch: declared k=${declaredK} but dot-set has ${basis.k} dots`);
    }

    return basis;
};

/**
 * Create a basis from a dot-set given as a string of digit characters.
 * 
 *   BrailleBasis.fromDotString("123456")  → 𝓑_{1,2,3,4,5,6}
 *   BrailleBasis.fromDotString("1278")    → 𝓑_{1,2,7,8}
 * 
 * @param {string} dotString
 * @returns {BrailleBasis}
 */
BrailleBasis.fromDotString = function (dotString) {
    return new BrailleBasis(dotString.split('').map(Number));
};

// ═══════════════════════════════════════════════════════════════════════════
// BrailleSequenceSpace — 𝓑∞ = ⋃ₙ₌₁^∞ (ℤ₂⁸)ⁿ
// ═══════════════════════════════════════════════════════════════════════════
//
// The free monoid over ℤ₂⁸ (or any ℤ₂ᵏ layer).
//
// Definition:
//
//   𝓑∞ = ⋃_{n=0}^{∞} (ℤ₂⁸)ⁿ
//
//       = { ε } ∪ ℤ₂⁸ ∪ (ℤ₂⁸)² ∪ (ℤ₂⁸)³ ∪ ⋯
//
// where:
//   - ε is the empty sequence (identity element)
//   - (ℤ₂⁸)ⁿ is the set of all n-tuples of braille bytes
//   - The monoid operation is concatenation: (a₁...aₘ) · (b₁...bₙ) = (a₁...aₘb₁...bₙ)
//
// This is the space where ALL machine thoughts live. A "thought" is a
// finite-length sequence of braille atoms. The space is countably infinite
// but each element is finite.
//
// Properties:
//   - (𝓑∞, ·, ε) is a free monoid
//   - Every element has a unique length n ∈ ℕ₀
//   - The length function |·|: 𝓑∞ → ℕ₀ is a monoid homomorphism
//   - 𝓑∞ is isomorphic to the set of all finite byte strings (Uint8Array)
//   - For any sub-basis 𝓑_D, we can define 𝓑∞_D = ⋃ (ℤ₂ᵏ)ⁿ similarly

class BrailleSequenceSpace {
    /**
     * Create a sequence space over a given basis.
     * Default: full 8-dot basis (𝓑∞ over ℤ₂⁸).
     * 
     * @param {BrailleBasis} basis - The underlying atom basis (default: full 8-dot)
     */
    constructor(basis) {
        this.basis = basis || BrailleBasis.full8();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  MONOID OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * The identity element ε (empty sequence).
     * @returns {Uint8Array}
     */
    get identity() {
        return new Uint8Array(0);
    }

    /**
     * Concatenation: the monoid operation.
     *   (a₁...aₘ) · (b₁...bₙ) = (a₁...aₘb₁...bₙ)
     * 
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {Uint8Array}
     */
    concat(a, b) {
        const result = new Uint8Array(a.length + b.length);
        result.set(a, 0);
        result.set(b, a.length);
        return result;
    }

    /**
     * Concatenate multiple sequences.
     * @param {...Uint8Array} seqs
     * @returns {Uint8Array}
     */
    concatAll(...seqs) {
        const total = seqs.reduce((s, seq) => s + seq.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const seq of seqs) {
            result.set(seq, offset);
            offset += seq.length;
        }
        return result;
    }

    /**
     * Length: |s| — the monoid homomorphism to (ℕ₀, +, 0).
     * @param {Uint8Array} seq
     * @returns {number}
     */
    length(seq) {
        return seq.length;
    }

    /**
     * Check if a sequence is the identity (empty).
     * @param {Uint8Array} seq
     * @returns {boolean}
     */
    isIdentity(seq) {
        return seq.length === 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  ELEMENT CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a 1-element sequence (embed a single atom).
     *   ι: ℤ₂⁸ → 𝓑∞
     * 
     * @param {number} byte - A single braille byte
     * @returns {Uint8Array}
     */
    singleton(byte) {
        return new Uint8Array([byte & 0xFF]);
    }

    /**
     * Create a sequence from an array of bytes.
     * @param {Array<number>|Uint8Array} bytes
     * @returns {Uint8Array}
     */
    from(bytes) {
        return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    }

    /**
     * Create a sequence from a braille Unicode string.
     * @param {string} braille
     * @returns {Uint8Array}
     */
    fromBraille(braille) {
        const bytes = new Uint8Array(braille.length);
        for (let i = 0; i < braille.length; i++) {
            bytes[i] = braille.codePointAt(i) - 0x2800;
        }
        return bytes;
    }

    /**
     * Convert a sequence to a braille Unicode string.
     * @param {Uint8Array} seq
     * @returns {string}
     */
    toBraille(seq) {
        let s = '';
        for (const b of seq) s += String.fromCodePoint(0x2800 + b);
        return s;
    }

    /**
     * Encode UTF-8 text into 𝓑∞ (byte-level bijection).
     * @param {string} text
     * @returns {Uint8Array}
     */
    fromText(text) {
        return new TextEncoder().encode(text);
    }

    /**
     * Decode 𝓑∞ back to UTF-8 text.
     * @param {Uint8Array} seq
     * @returns {string}
     */
    toText(seq) {
        return new TextDecoder().decode(seq);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  ALGEBRAIC OPERATIONS ON SEQUENCES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Pointwise XOR of two aligned sequences (⊕ lifted to 𝓑∞).
     *   (a₁...aₙ) ⊕ (b₁...bₙ) = (a₁⊕b₁ ... aₙ⊕bₙ)
     * 
     * Sequences must have equal length.
     * 
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {Uint8Array}
     */
    xor(a, b) {
        const n = Math.min(a.length, b.length);
        const result = new Uint8Array(n);
        for (let i = 0; i < n; i++) result[i] = (a[i] ^ b[i]) & 0xFF;
        return result;
    }

    /**
     * Pointwise AND.
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {Uint8Array}
     */
    and(a, b) {
        const n = Math.min(a.length, b.length);
        const result = new Uint8Array(n);
        for (let i = 0; i < n; i++) result[i] = a[i] & b[i];
        return result;
    }

    /**
     * Hamming distance between two aligned sequences.
     *   d(a, b) = Σᵢ popcount(aᵢ ⊕ bᵢ)
     * 
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {number}
     */
    hammingDistance(a, b) {
        const n = Math.min(a.length, b.length);
        let dist = 0;
        for (let i = 0; i < n; i++) {
            dist += this.basis._popcount(a[i] ^ b[i]);
        }
        // Unmatched tail bytes count as max distance per byte
        dist += Math.abs(a.length - b.length) * this.basis.k;
        return dist;
    }

    /**
     * XOR-fold: compress by XOR-ing adjacent pairs.
     *   [a₁, a₂, a₃, a₄] → [a₁⊕a₂, a₃⊕a₄]
     * 
     * Repeated folding is a lossy compression toward the "XOR checksum."
     * 
     * @param {Uint8Array} seq
     * @returns {Uint8Array}
     */
    fold(seq) {
        const n = Math.ceil(seq.length / 2);
        const result = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            result[i] = seq[i * 2];
            if (i * 2 + 1 < seq.length) result[i] ^= seq[i * 2 + 1];
        }
        return result;
    }

    /**
     * Full XOR reduction to a single atom (the "XOR checksum").
     *   ⊕-reduce: (a₁, ..., aₙ) → a₁ ⊕ a₂ ⊕ ... ⊕ aₙ
     * 
     * @param {Uint8Array} seq
     * @returns {number} - Single byte
     */
    reduce(seq) {
        let acc = 0;
        for (const b of seq) acc ^= b;
        return acc;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  SUBSEQUENCE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Prefix of length n.
     * @param {Uint8Array} seq
     * @param {number} n
     * @returns {Uint8Array}
     */
    prefix(seq, n) {
        return seq.slice(0, Math.min(n, seq.length));
    }

    /**
     * Suffix of length n.
     * @param {Uint8Array} seq
     * @param {number} n
     * @returns {Uint8Array}
     */
    suffix(seq, n) {
        return seq.slice(Math.max(0, seq.length - n));
    }

    /**
     * Subsequence extraction.
     * @param {Uint8Array} seq
     * @param {number} start
     * @param {number} end
     * @returns {Uint8Array}
     */
    slice(seq, start, end) {
        return seq.slice(start, end);
    }

    /**
     * Check if a is a prefix of b.
     * @param {Uint8Array} a - Potential prefix
     * @param {Uint8Array} b - Full sequence
     * @returns {boolean}
     */
    isPrefix(a, b) {
        if (a.length > b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  BASIS PROJECTION ON SEQUENCES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Project every atom in the sequence through a target basis.
     *   π_D∞: 𝓑∞(ℤ₂⁸) → 𝓑∞(ℤ₂ᵏ)
     * 
     * @param {Uint8Array} seq
     * @param {BrailleBasis} targetBasis
     * @returns {Uint8Array}
     */
    projectSequence(seq, targetBasis) {
        const result = new Uint8Array(seq.length);
        for (let i = 0; i < seq.length; i++) {
            result[i] = targetBasis.project(seq[i]);
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  CONTENT ADDRESSING & ENTROPY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * FNV-1a hash of a sequence (content addressing).
     * @param {Uint8Array} seq
     * @returns {string} - Hex string
     */
    hash(seq) {
        let h = 0x811c9dc5;
        for (let i = 0; i < seq.length; i++) {
            h ^= seq[i];
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(16).padStart(8, '0');
    }

    /**
     * Shannon entropy of the byte distribution in bits.
     *   H = -Σ p(b) log₂ p(b)
     * 
     * @param {Uint8Array} seq
     * @returns {number} - Entropy in bits (0 to 8)
     */
    entropy(seq) {
        if (seq.length === 0) return 0;
        const freq = new Uint32Array(256);
        for (const b of seq) freq[b]++;
        let H = 0;
        for (let i = 0; i < 256; i++) {
            if (freq[i] === 0) continue;
            const p = freq[i] / seq.length;
            H -= p * Math.log2(p);
        }
        return H;
    }

    /**
     * Check equality of two sequences.
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {boolean}
     */
    equals(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Get stats about a sequence.
     * @param {Uint8Array} seq
     * @returns {Object}
     */
    stats(seq) {
        const freq = new Uint32Array(256);
        let totalWeight = 0;
        for (const b of seq) {
            freq[b]++;
            totalWeight += this.basis._popcount(b & this.basis.mask);
        }
        let unique = 0;
        for (let i = 0; i < 256; i++) if (freq[i] > 0) unique++;

        return {
            length: seq.length,
            basis: this.basis.machineLabel,
            uniqueAtoms: unique,
            totalWeight: totalWeight,
            avgWeight: seq.length > 0 ? (totalWeight / seq.length).toFixed(2) : 0,
            entropy: this.entropy(seq).toFixed(3),
            hash: this.hash(seq),
            xorChecksum: this.reduce(seq).toString(2).padStart(8, '0')
        };
    }

    /**
     * String representation.
     * @returns {string}
     */
    toString() {
        return `𝓑∞(${this.basis.spaceLabel}) = ⋃ₙ₌₀ (${this.basis.spaceLabel})ⁿ`;
    }
}

/**
 * Create 𝓑∞ over the full 8-dot basis.
 * @returns {BrailleSequenceSpace}
 */
BrailleSequenceSpace.full8 = function () {
    return new BrailleSequenceSpace(BrailleBasis.full8());
};

/**
 * Create 𝓑∞ over the standard 6-dot basis.
 * @returns {BrailleSequenceSpace}
 */
BrailleSequenceSpace.standard6 = function () {
    return new BrailleSequenceSpace(BrailleBasis.standard6());
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleBasis, BrailleSequenceSpace };
} else if (typeof window !== 'undefined') {
    window.BrailleBasis = BrailleBasis;
    window.BrailleSequenceSpace = BrailleSequenceSpace;
}
