/**
 * Braille 8-Dot Unicode Utilities
 * 
 * Handles conversion between dot patterns and Unicode braille characters (U+2800-U+28FF)
 * Supports all 256 possible 8-dot combinations
 */

class Braille8DotUnicode {
    constructor() {
        this.BASE_UNICODE = 0x2800; // ⠀ (blank braille pattern)
        
        // Dot position to bit value mapping
        this.DOT_VALUES = {
            1: 0x01,   // 1
            2: 0x02,   // 2
            3: 0x04,   // 4
            4: 0x08,   // 8
            5: 0x10,   // 16
            6: 0x20,   // 32
            7: 0x40,   // 64
            8: 0x80    // 128
        };
    }

    /**
     * Convert array of dot numbers to Unicode braille character
     * @param {Array<number>} dots - Array of dot numbers (1-8)
     * @returns {string} Unicode braille character
     */
    dotsToUnicode(dots) {
        let value = this.BASE_UNICODE;
        
        for (const dot of dots) {
            if (dot >= 1 && dot <= 8) {
                value += this.DOT_VALUES[dot];
            }
        }
        
        return String.fromCharCode(value);
    }

    /**
     * Convert Unicode braille character to array of dot numbers
     * @param {string} char - Unicode braille character
     * @returns {Array<number>} Array of active dot numbers
     */
    unicodeToDots(char) {
        const codePoint = char.charCodeAt(0);
        
        // Validate it's a braille character
        if (codePoint < 0x2800 || codePoint > 0x28FF) {
            throw new Error(`Invalid braille character: ${char} (U+${codePoint.toString(16).toUpperCase()})`);
        }
        
        const value = codePoint - this.BASE_UNICODE;
        const dots = [];
        
        // Check each dot position
        for (let dot = 1; dot <= 8; dot++) {
            if (value & this.DOT_VALUES[dot]) {
                dots.push(dot);
            }
        }
        
        return dots;
    }

    /**
     * Convert binary string (8 bits) to Unicode braille
     * @param {string} binary - 8-bit binary string (e.g., "10110001")
     * @returns {string} Unicode braille character
     */
    binaryToUnicode(binary) {
        if (binary.length !== 8) {
            throw new Error('Binary string must be exactly 8 bits');
        }
        
        const dots = [];
        for (let i = 0; i < 8; i++) {
            if (binary[i] === '1') {
                dots.push(i + 1);
            }
        }
        
        return this.dotsToUnicode(dots);
    }

    /**
     * Convert Unicode braille to binary string
     * @param {string} char - Unicode braille character
     * @returns {string} 8-bit binary string
     */
    unicodeToBinary(char) {
        const dots = this.unicodeToDots(char);
        let binary = '00000000';
        
        for (const dot of dots) {
            const index = dot - 1;
            binary = binary.substring(0, index) + '1' + binary.substring(index + 1);
        }
        
        return binary;
    }

    /**
     * Convert 6-dot pattern to 8-dot (dots 7-8 remain empty)
     * @param {Array<number>} dots6 - Array of 6-dot numbers (1-6)
     * @returns {string} 8-dot Unicode braille character
     */
    convert6DotTo8Dot(dots6) {
        const validDots = dots6.filter(dot => dot >= 1 && dot <= 6);
        return this.dotsToUnicode(validDots);
    }

    /**
     * Convert 8-dot pattern to 6-dot (removes dots 7-8)
     * @param {string} char8 - 8-dot Unicode braille character
     * @returns {string} 6-dot Unicode braille character
     */
    convert8DotTo6Dot(char8) {
        const dots = this.unicodeToDots(char8);
        const dots6 = dots.filter(dot => dot <= 6);
        return this.dotsToUnicode(dots6);
    }

    /**
     * Get all possible braille patterns (256 total)
     * @returns {Array<Object>} Array of pattern objects
     */
    getAllPatterns() {
        const patterns = [];
        
        for (let i = 0; i <= 255; i++) {
            const unicode = String.fromCharCode(this.BASE_UNICODE + i);
            const dots = this.unicodeToDots(unicode);
            const binary = i.toString(2).padStart(8, '0');
            
            patterns.push({
                decimal: i,
                binary: binary,
                dots: dots,
                unicode: unicode,
                codePoint: `U+${(this.BASE_UNICODE + i).toString(16).toUpperCase()}`
            });
        }
        
        return patterns;
    }

    /**
     * Get braille pattern by decimal value (0-255)
     * @param {number} decimal - Decimal value (0-255)
     * @returns {Object} Pattern object
     */
    getPatternByDecimal(decimal) {
        if (decimal < 0 || decimal > 255) {
            throw new Error('Decimal value must be between 0 and 255');
        }
        
        const unicode = String.fromCharCode(this.BASE_UNICODE + decimal);
        const dots = this.unicodeToDots(unicode);
        const binary = decimal.toString(2).padStart(8, '0');
        
        return {
            decimal: decimal,
            binary: binary,
            dots: dots,
            unicode: unicode,
            codePoint: `U+${(this.BASE_UNICODE + decimal).toString(16).toUpperCase()}`
        };
    }

    /**
     * Check if character is a valid braille pattern
     * @param {string} char - Character to check
     * @returns {boolean} True if valid braille pattern
     */
    isValidBraillePattern(char) {
        const codePoint = char.charCodeAt(0);
        return codePoint >= 0x2800 && codePoint <= 0x28FF;
    }

    /**
     * Get human-readable description of braille pattern
     * @param {string} char - Unicode braille character
     * @returns {string} Description
     */
    getPatternDescription(char) {
        const dots = this.unicodeToDots(char);
        
        if (dots.length === 0) {
            return 'Empty cell (no dots)';
        }
        
        if (dots.length === 8) {
            return 'Full cell (all dots)';
        }
        
        return `Dots ${dots.join(', ')}`;
    }

    /**
     * Compare two braille patterns
     * @param {string} char1 - First braille character
     * @param {string} char2 - Second braille character
     * @returns {Object} Comparison result
     */
    comparePatterns(char1, char2) {
        const dots1 = this.unicodeToDots(char1);
        const dots2 = this.unicodeToDots(char2);
        
        const common = dots1.filter(dot => dots2.includes(dot));
        const onlyIn1 = dots1.filter(dot => !dots2.includes(dot));
        const onlyIn2 = dots2.filter(dot => !dots1.includes(dot));
        
        return {
            identical: dots1.length === dots2.length && common.length === dots1.length,
            commonDots: common,
            uniqueTo1: onlyIn1,
            uniqueTo2: onlyIn2,
            similarity: common.length / Math.max(dots1.length, dots2.length, 1)
        };
    }

    /**
     * Generate random braille pattern
     * @param {boolean} use8Dot - If true, use all 8 dots; if false, use only 6 dots
     * @returns {string} Random Unicode braille character
     */
    getRandomPattern(use8Dot = true) {
        const maxValue = use8Dot ? 255 : 63;
        const randomValue = Math.floor(Math.random() * (maxValue + 1));
        return String.fromCharCode(this.BASE_UNICODE + randomValue);
    }

    /**
     * Get braille patterns for a range of dots
     * @param {number} minDots - Minimum number of dots
     * @param {number} maxDots - Maximum number of dots
     * @returns {Array<Object>} Array of matching patterns
     */
    getPatternsByDotCount(minDots, maxDots) {
        const patterns = [];
        
        for (let i = 0; i <= 255; i++) {
            const unicode = String.fromCharCode(this.BASE_UNICODE + i);
            const dots = this.unicodeToDots(unicode);
            
            if (dots.length >= minDots && dots.length <= maxDots) {
                patterns.push({
                    decimal: i,
                    dots: dots,
                    unicode: unicode,
                    dotCount: dots.length
                });
            }
        }
        
        return patterns;
    }

    /**
     * Mirror braille pattern horizontally (swap left and right columns)
     * @param {string} char - Unicode braille character
     * @returns {string} Mirrored braille character
     */
    mirrorPattern(char) {
        const dots = this.unicodeToDots(char);
        const mirroredDots = dots.map(dot => {
            // Swap columns: 1↔4, 2↔5, 3↔6, 7↔8
            const mirrorMap = {1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3, 7: 8, 8: 7};
            return mirrorMap[dot];
        });
        
        return this.dotsToUnicode(mirroredDots);
    }

    /**
     * Invert braille pattern (toggle all dots)
     * @param {string} char - Unicode braille character
     * @returns {string} Inverted braille character
     */
    invertPattern(char) {
        const dots = this.unicodeToDots(char);
        const allDots = [1, 2, 3, 4, 5, 6, 7, 8];
        const invertedDots = allDots.filter(dot => !dots.includes(dot));
        
        return this.dotsToUnicode(invertedDots);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Braille8DotUnicode;
}
