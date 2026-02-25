/**
 * Computer Braille Code (CBC) Implementation
 * 
 * Provides 1:1 mapping between ASCII characters and 8-dot braille patterns
 * Enables direct computer input/output without mode indicators
 */

class ComputerBrailleCode {
    constructor() {
        this.unicode = new Braille8DotUnicode();
        
        // ASCII to 8-dot braille mapping (0-127)
        this.asciiToBraille = this.initializeASCIIMapping();
        
        // Reverse mapping for braille to ASCII
        this.brailleToASCII = this.initializeReverseMapping();
    }

    /**
     * Initialize ASCII to braille mapping
     */
    initializeASCIIMapping() {
        const mapping = {};
        
        // Control characters (0-31)
        mapping[0] = [];  // NUL
        mapping[1] = [8]; // SOH
        mapping[2] = [1, 8]; // STX
        mapping[3] = [1, 4, 8]; // ETX
        mapping[4] = [1, 4, 5, 8]; // EOT
        mapping[5] = [1, 5, 8]; // ENQ
        mapping[6] = [1, 2, 4, 8]; // ACK
        mapping[7] = [1, 2, 4, 5, 8]; // BEL
        mapping[8] = [1, 2, 5, 8]; // BS
        mapping[9] = [2, 4, 8]; // HT (Tab)
        mapping[10] = [2, 4, 5, 8]; // LF
        mapping[11] = [1, 3, 8]; // VT
        mapping[12] = [1, 2, 3, 8]; // FF
        mapping[13] = [1, 3, 4, 8]; // CR
        mapping[14] = [1, 3, 4, 5, 8]; // SO
        mapping[15] = [1, 3, 5, 8]; // SI
        mapping[16] = [1, 2, 3, 4, 8]; // DLE
        mapping[17] = [1, 2, 3, 4, 5, 8]; // DC1
        mapping[18] = [1, 2, 3, 5, 8]; // DC2
        mapping[19] = [2, 3, 4, 8]; // DC3
        mapping[20] = [2, 3, 4, 5, 8]; // DC4
        mapping[21] = [1, 3, 6, 8]; // NAK
        mapping[22] = [1, 2, 3, 6, 8]; // SYN
        mapping[23] = [2, 4, 5, 6, 8]; // ETB
        mapping[24] = [1, 3, 4, 6, 8]; // CAN
        mapping[25] = [1, 3, 4, 5, 6, 8]; // EM
        mapping[26] = [1, 3, 5, 6, 8]; // SUB
        mapping[27] = [2, 4, 6, 8]; // ESC
        mapping[28] = [1, 2, 3, 4, 5, 6, 8]; // FS
        mapping[29] = [2, 3, 4, 5, 6, 8]; // GS
        mapping[30] = [2, 3, 5, 6, 8]; // RS
        mapping[31] = [4, 5, 6, 8]; // US

        // Space (32)
        mapping[32] = []; // Space (empty cell)

        // Punctuation and symbols (33-47)
        mapping[33] = [2, 3, 4, 6]; // !
        mapping[34] = [5]; // "
        mapping[35] = [3, 4, 5, 6, 7]; // #
        mapping[36] = [1, 2, 4, 6, 7]; // $
        mapping[37] = [1, 4, 6, 7]; // %
        mapping[38] = [1, 2, 3, 4, 6, 7]; // &
        mapping[39] = [3]; // '
        mapping[40] = [1, 2, 3, 5, 6, 7]; // (
        mapping[41] = [2, 3, 4, 5, 6, 7]; // )
        mapping[42] = [1, 6, 7]; // *
        mapping[43] = [3, 4, 6]; // +
        mapping[44] = [6]; // ,
        mapping[45] = [3, 6]; // -
        mapping[46] = [4, 6]; // .
        mapping[47] = [3, 4, 7]; // /

        // Numbers (48-57)
        mapping[48] = [3, 5, 6, 7]; // 0
        mapping[49] = [2, 7]; // 1
        mapping[50] = [2, 3, 7]; // 2
        mapping[51] = [2, 5, 7]; // 3
        mapping[52] = [2, 5, 6, 7]; // 4
        mapping[53] = [2, 6, 7]; // 5
        mapping[54] = [2, 3, 5, 7]; // 6
        mapping[55] = [2, 3, 5, 6, 7]; // 7
        mapping[56] = [2, 3, 6, 7]; // 8
        mapping[57] = [3, 5, 7]; // 9

        // More punctuation (58-64)
        mapping[58] = [1, 5, 6]; // :
        mapping[59] = [5, 6]; // ;
        mapping[60] = [1, 2, 6, 7]; // <
        mapping[61] = [1, 2, 3, 4, 5, 6]; // =
        mapping[62] = [3, 4, 5, 7]; // >
        mapping[63] = [1, 4, 5, 6]; // ?
        mapping[64] = [4, 7]; // @

        // Uppercase letters (65-90)
        mapping[65] = [1]; // A
        mapping[66] = [1, 2]; // B
        mapping[67] = [1, 4]; // C
        mapping[68] = [1, 4, 5]; // D
        mapping[69] = [1, 5]; // E
        mapping[70] = [1, 2, 4]; // F
        mapping[71] = [1, 2, 4, 5]; // G
        mapping[72] = [1, 2, 5]; // H
        mapping[73] = [2, 4]; // I
        mapping[74] = [2, 4, 5]; // J
        mapping[75] = [1, 3]; // K
        mapping[76] = [1, 2, 3]; // L
        mapping[77] = [1, 3, 4]; // M
        mapping[78] = [1, 3, 4, 5]; // N
        mapping[79] = [1, 3, 5]; // O
        mapping[80] = [1, 2, 3, 4]; // P
        mapping[81] = [1, 2, 3, 4, 5]; // Q
        mapping[82] = [1, 2, 3, 5]; // R
        mapping[83] = [2, 3, 4]; // S
        mapping[84] = [2, 3, 4, 5]; // T
        mapping[85] = [1, 3, 6]; // U
        mapping[86] = [1, 2, 3, 6]; // V
        mapping[87] = [2, 4, 5, 6]; // W
        mapping[88] = [1, 3, 4, 6]; // X
        mapping[89] = [1, 3, 4, 5, 6]; // Y
        mapping[90] = [1, 3, 5, 6]; // Z

        // More symbols (91-96)
        mapping[91] = [2, 4, 6, 7]; // [
        mapping[92] = [1, 2, 5, 6, 7]; // \
        mapping[93] = [1, 2, 4, 5, 6, 7]; // ]
        mapping[94] = [4, 5, 7]; // ^
        mapping[95] = [4, 5, 6, 7]; // _
        mapping[96] = [4]; // `

        // Lowercase letters (97-122) - add dot 7 to uppercase
        mapping[97] = [1, 7]; // a
        mapping[98] = [1, 2, 7]; // b
        mapping[99] = [1, 4, 7]; // c
        mapping[100] = [1, 4, 5, 7]; // d
        mapping[101] = [1, 5, 7]; // e
        mapping[102] = [1, 2, 4, 7]; // f
        mapping[103] = [1, 2, 4, 5, 7]; // g
        mapping[104] = [1, 2, 5, 7]; // h
        mapping[105] = [2, 4, 7]; // i
        mapping[106] = [2, 4, 5, 7]; // j
        mapping[107] = [1, 3, 7]; // k
        mapping[108] = [1, 2, 3, 7]; // l
        mapping[109] = [1, 3, 4, 7]; // m
        mapping[110] = [1, 3, 4, 5, 7]; // n
        mapping[111] = [1, 3, 5, 7]; // o
        mapping[112] = [1, 2, 3, 4, 7]; // p
        mapping[113] = [1, 2, 3, 4, 5, 7]; // q
        mapping[114] = [1, 2, 3, 5, 7]; // r
        mapping[115] = [2, 3, 4, 7]; // s
        mapping[116] = [2, 3, 4, 5, 7]; // t
        mapping[117] = [1, 3, 6, 7]; // u
        mapping[118] = [1, 2, 3, 6, 7]; // v
        mapping[119] = [2, 4, 5, 6, 7]; // w
        mapping[120] = [1, 3, 4, 6, 7]; // x
        mapping[121] = [1, 3, 4, 5, 6, 7]; // y
        mapping[122] = [1, 3, 5, 6, 7]; // z

        // Final symbols (123-127)
        mapping[123] = [2, 4, 6]; // {
        mapping[124] = [1, 2, 5, 6]; // |
        mapping[125] = [1, 2, 4, 5, 6]; // }
        mapping[126] = [4, 5]; // ~
        mapping[127] = [1, 2, 3, 4, 5, 6, 7, 8]; // DEL

        return mapping;
    }

    /**
     * Initialize reverse mapping (braille to ASCII)
     */
    initializeReverseMapping() {
        const reverse = {};
        
        for (const [ascii, dots] of Object.entries(this.asciiToBraille)) {
            const key = dots.sort((a, b) => a - b).join(',');
            reverse[key] = parseInt(ascii);
        }
        
        return reverse;
    }

    /**
     * Convert ASCII character to 8-dot braille
     */
    asciiToBrailleDots(char) {
        const code = char.charCodeAt(0);
        if (code < 0 || code > 127) {
            throw new Error(`Character '${char}' is outside ASCII range (0-127)`);
        }
        return this.asciiToBraille[code] || [];
    }

    /**
     * Convert ASCII character to Unicode braille
     */
    asciiToBrailleUnicode(char) {
        const dots = this.asciiToBrailleDots(char);
        return this.unicode.dotsToUnicode(dots);
    }

    /**
     * Convert ASCII string to braille Unicode string
     */
    textToBraille(text) {
        return text.split('').map(char => this.asciiToBrailleUnicode(char)).join('');
    }

    /**
     * Convert braille dots to ASCII character
     */
    brailleDotsToAscii(dots) {
        const key = dots.sort((a, b) => a - b).join(',');
        const code = this.brailleToASCII[key];
        
        if (code === undefined) {
            throw new Error(`No ASCII mapping for dots: ${dots.join(', ')}`);
        }
        
        return String.fromCharCode(code);
    }

    /**
     * Convert Unicode braille to ASCII character
     */
    brailleUnicodeToAscii(brailleChar) {
        const dots = this.unicode.unicodeToDots(brailleChar);
        return this.brailleDotsToAscii(dots);
    }

    /**
     * Convert braille Unicode string to ASCII text
     */
    brailleToText(brailleString) {
        return brailleString.split('').map(char => {
            try {
                return this.brailleUnicodeToAscii(char);
            } catch (e) {
                return '?'; // Unknown character
            }
        }).join('');
    }

    /**
     * Get ASCII character info
     */
    getCharacterInfo(char) {
        const code = char.charCodeAt(0);
        const dots = this.asciiToBrailleDots(char);
        const unicode = this.asciiToBrailleUnicode(char);
        
        return {
            character: char,
            ascii: code,
            asciiHex: `0x${code.toString(16).toUpperCase()}`,
            dots: dots,
            unicode: unicode,
            unicodeHex: `U+${unicode.charCodeAt(0).toString(16).toUpperCase()}`,
            category: this.getCharacterCategory(code),
            description: this.getCharacterDescription(code)
        };
    }

    /**
     * Get character category
     */
    getCharacterCategory(code) {
        if (code < 32) return 'Control';
        if (code === 32) return 'Space';
        if (code >= 33 && code <= 47) return 'Punctuation';
        if (code >= 48 && code <= 57) return 'Digit';
        if (code >= 58 && code <= 64) return 'Punctuation';
        if (code >= 65 && code <= 90) return 'Uppercase Letter';
        if (code >= 91 && code <= 96) return 'Symbol';
        if (code >= 97 && code <= 122) return 'Lowercase Letter';
        if (code >= 123 && code <= 126) return 'Symbol';
        if (code === 127) return 'Control';
        return 'Unknown';
    }

    /**
     * Get character description
     */
    getCharacterDescription(code) {
        const descriptions = {
            0: 'NUL (Null)',
            9: 'TAB (Horizontal Tab)',
            10: 'LF (Line Feed)',
            13: 'CR (Carriage Return)',
            27: 'ESC (Escape)',
            32: 'SPACE',
            127: 'DEL (Delete)'
        };
        
        return descriptions[code] || String.fromCharCode(code);
    }

    /**
     * Check if character is printable
     */
    isPrintable(char) {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126;
    }

    /**
     * Get all printable ASCII characters with braille
     */
    getAllPrintableCharacters() {
        const characters = [];
        
        for (let code = 32; code <= 126; code++) {
            const char = String.fromCharCode(code);
            characters.push(this.getCharacterInfo(char));
        }
        
        return characters;
    }

    /**
     * Convert between uppercase and lowercase
     */
    toggleCase(char) {
        const code = char.charCodeAt(0);
        
        if (code >= 65 && code <= 90) {
            // Uppercase to lowercase
            return String.fromCharCode(code + 32);
        } else if (code >= 97 && code <= 122) {
            // Lowercase to uppercase
            return String.fromCharCode(code - 32);
        }
        
        return char; // Not a letter
    }

    /**
     * Validate braille pattern for CBC
     */
    isValidCBCPattern(dots) {
        const key = dots.sort((a, b) => a - b).join(',');
        return this.brailleToASCII.hasOwnProperty(key);
    }

    /**
     * Get similar characters (same base pattern)
     */
    getSimilarCharacters(char) {
        const info = this.getCharacterInfo(char);
        const baseDots = info.dots.filter(d => d <= 6);
        const similar = [];
        
        for (let code = 32; code <= 126; code++) {
            const testChar = String.fromCharCode(code);
            const testDots = this.asciiToBrailleDots(testChar).filter(d => d <= 6);
            
            if (JSON.stringify(baseDots) === JSON.stringify(testDots) && testChar !== char) {
                similar.push(this.getCharacterInfo(testChar));
            }
        }
        
        return similar;
    }

    /**
     * Format text for display with braille
     */
    formatWithBraille(text, options = {}) {
        const showAscii = options.showAscii !== false;
        const showDots = options.showDots !== false;
        const showUnicode = options.showUnicode !== false;
        
        return text.split('').map(char => {
            const info = this.getCharacterInfo(char);
            let result = char;
            
            if (showUnicode) result += ` ${info.unicode}`;
            if (showDots) result += ` [${info.dots.join(',')}]`;
            if (showAscii) result += ` (${info.ascii})`;
            
            return result;
        }).join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComputerBrailleCode;
}
