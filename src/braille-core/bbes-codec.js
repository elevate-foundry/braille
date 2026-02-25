/**
 * BBESCodec - Shared Braille Binary Encoding Standard Codec
 * 
 * Centralizes the core binary ↔ braille ↔ BBES conversion logic that was
 * previously duplicated across BrailleFST, BrailleFSTGrade3, and BrailleAE.
 * 
 * All modules in the Braille Infinity Lattice Pipeline should use this codec
 * for consistent encoding/decoding behavior.
 * 
 * Supports two modes:
 *   - 6-bit (standard braille, dots 1-6): brailleToBinary / binaryToBraille
 *   - 8-bit (8-dot braille, full vector space): brailleToBinary8 / binaryToBraille8
 * 
 * The 8-bit mode treats each braille cell as a point in {0,1}^8 — an
 * 8-dimensional binary vector space isomorphic to a byte.
 */

class BBESCodec {
    /**
     * Convert braille unicode to binary representation
     * @param {string} braille - Braille unicode character(s)
     * @returns {string} - Binary representation (6 bits per cell)
     */
    static brailleToBinary(braille) {
        // Handle multi-character braille sequences
        if (braille.length > 1) {
            return braille.split('').map(b => BBESCodec.brailleToBinary(b)).join('');
        }
        
        // Get the Unicode code point and subtract the base code point for braille patterns
        const codePoint = braille.codePointAt(0);
        const baseCodePoint = 0x2800; // Empty braille pattern ⠀
        
        // The difference gives us the dot pattern (as a decimal number)
        const dotPattern = codePoint - baseCodePoint;
        
        // Convert to 6-bit binary string
        return dotPattern.toString(2).padStart(6, '0');
    }
    
    /**
     * Convert binary representation to braille unicode
     * @param {string} binary - Binary representation (6 bits per cell)
     * @returns {string} - Braille unicode character(s)
     */
    static binaryToBraille(binary) {
        // Handle longer binary sequences (multiple characters)
        if (binary.length > 6) {
            const chars = [];
            for (let i = 0; i < binary.length; i += 6) {
                const chunk = binary.substr(i, 6);
                chars.push(BBESCodec.binaryToBraille(chunk));
            }
            return chars.join('');
        }
        
        // Convert binary to decimal
        const dotPattern = parseInt(binary, 2);
        
        // Add to base code point to get the braille character
        const baseCodePoint = 0x2800;
        const codePoint = baseCodePoint + dotPattern;
        
        // Convert code point to character
        return String.fromCodePoint(codePoint);
    }
    
    /**
     * Create BBES (Braille Binary Encoding Standard) from binary string
     * @param {string} binary - Binary representation
     * @returns {string} - BBES format (base64 encoded)
     */
    static createBBES(binary) {
        // Pad binary to multiple of 8 for byte alignment
        while (binary.length % 8 !== 0) {
            binary += '0';
        }
        
        // Convert binary to byte array
        const bytes = [];
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            bytes.push(parseInt(byte, 2));
        }
        
        // Convert byte array to base64
        return btoa(String.fromCharCode(...bytes));
    }
    
    /**
     * Decode BBES to binary string
     * @param {string} bbes - BBES format (base64 encoded)
     * @returns {string} - Binary representation
     */
    static decodeBBES(bbes) {
        // Convert base64 to byte array
        const bytes = atob(bbes).split('').map(c => c.charCodeAt(0));
        
        // Convert byte array to binary
        let binary = '';
        for (const byte of bytes) {
            binary += byte.toString(2).padStart(8, '0');
        }
        
        return binary;
    }

    // ─── 8-Bit Vector Space Mode ──────────────────────────────────────────
    //
    // Each 8-dot braille cell (U+2800–U+28FF) encodes a full byte.
    // Dot layout → bit mapping:  Unicode = 0x2800 + Σ(dᵢ × 2ⁱ) for i∈{0..7}
    //
    //   ┌───┐
    //   │1 4│  →  bits 0,3
    //   │2 5│  →  bits 1,4
    //   │3 6│  →  bits 2,5
    //   │7 8│  →  bits 6,7
    //   └───┘

    /**
     * Convert braille unicode to 8-bit binary (full 8-dot vector space).
     * @param {string} braille - Braille unicode character(s)
     * @returns {string} - Binary representation (8 bits per cell)
     */
    static brailleToBinary8(braille) {
        if (braille.length > 1) {
            return braille.split('').map(b => BBESCodec.brailleToBinary8(b)).join('');
        }
        const dotPattern = braille.codePointAt(0) - 0x2800;
        return dotPattern.toString(2).padStart(8, '0');
    }

    /**
     * Convert 8-bit binary to braille unicode (full 8-dot vector space).
     * @param {string} binary - Binary representation (8 bits per cell)
     * @returns {string} - Braille unicode character(s)
     */
    static binaryToBraille8(binary) {
        if (binary.length > 8) {
            const chars = [];
            for (let i = 0; i < binary.length; i += 8) {
                chars.push(BBESCodec.binaryToBraille8(binary.substr(i, 8)));
            }
            return chars.join('');
        }
        return String.fromCodePoint(0x2800 + parseInt(binary.padEnd(8, '0'), 2));
    }

    /**
     * Convert an 8D binary vector (Float64Array or Array) to binary string.
     * @param {Float64Array|Array<number>} vec - 8-element vector, each 0 or 1
     * @returns {string} - 8-character binary string
     */
    static vectorToBinary(vec) {
        let bin = '';
        for (let i = 0; i < 8; i++) bin += Math.round(vec[i] || 0) ? '1' : '0';
        return bin;
    }

    /**
     * Convert a binary string to an 8D vector.
     * @param {string} binary - 8-character binary string
     * @returns {Float64Array} - 8-element vector
     */
    static binaryToVector(binary) {
        const v = new Float64Array(8);
        for (let i = 0; i < 8; i++) v[i] = binary[i] === '1' ? 1 : 0;
        return v;
    }

    /**
     * Encode text to 8-dot braille string (byte-level bijection).
     * Each UTF-8 byte maps to exactly one braille character.
     * This is lossless for any binary data.
     * @param {string} text - Input text
     * @returns {string} - Braille unicode string
     */
    static textToBraille8(text) {
        const bytes = new TextEncoder().encode(text);
        let braille = '';
        for (const b of bytes) braille += String.fromCodePoint(0x2800 + b);
        return braille;
    }

    /**
     * Decode 8-dot braille string back to text.
     * @param {string} braille - Braille unicode string (8-dot encoded)
     * @returns {string} - Decoded text
     */
    static braille8ToText(braille) {
        const bytes = new Uint8Array(braille.length);
        for (let i = 0; i < braille.length; i++) {
            bytes[i] = braille.codePointAt(i) - 0x2800;
        }
        return new TextDecoder().decode(bytes);
    }
}

// Export the BBESCodec class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BBESCodec };
} else if (typeof window !== 'undefined') {
    window.BBESCodec = BBESCodec;
}
