/**
 * BrailleFST - Finite State Transducer for Braille Encoding/Decoding
 * 
 * This module implements a lightweight, deterministic rule-based system for
 * converting between text and Braille Binary Encoding Standard (BBES).
 * 
 * Unlike transformer-based approaches, this FST is optimized for:
 * - Minimal memory footprint
 * - Deterministic behavior
 * - Fast encoding/decoding
 * - Support for multiple braille standards
 */

class BrailleFST {
    constructor(options = {}) {
        // Default options
        this.options = {
            standard: 'ueb', // Universal English Braille
            grade: 1,        // Grade 1 (uncontracted) or Grade 2 (contracted)
            language: 'en',  // English
            ...options
        };
        
        // Initialize state machine
        this.initialized = false;
        this.transitionTable = {};
        this.contractionMap = {};
        this.reverseMap = {};
        
        // Braille dot patterns (Unicode)
        this.brailleDots = {
            // Basic Latin alphabet (Grade 1)
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
            'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
            'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
            'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
            'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
            
            // Numbers (preceded by number sign ⠼)
            '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
            '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
            
            // Punctuation
            '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖',
            '?': '⠦', '"': '⠦', '(': '⠐⠣', ')': '⠐⠜', '-': '⠤',
            
            // Special characters
            '#': '⠼', // Number sign
            '_': '⠸', // Underscore
            '/': '⠌', // Slash
            '\\': '⠐⠌', // Backslash
            '@': '⠈⠁', // At sign
            '&': '⠈⠯', // Ampersand
            '*': '⠐⠔', // Asterisk
            '+': '⠐⠖', // Plus
            '=': '⠐⠶', // Equals
            '<': '⠐⠪', // Less than
            '>': '⠐⠕', // Greater than
            '$': '⠈⠎', // Dollar sign
            '%': '⠨⠴', // Percent
            '^': '⠈⠢', // Caret
            '~': '⠈⠔', // Tilde
            '[': '⠐⠣', // Left bracket
            ']': '⠐⠜', // Right bracket
            '{': '⠸⠣', // Left brace
            '}': '⠸⠜', // Right brace
            '|': '⠸⠇', // Vertical bar
            '`': '⠈', // Grave accent
            
            // Space
            ' ': '⠀'
        };
        
        // Binary representation of braille patterns (6-dot)
        this.brailleBinary = {};
        
        // Initialize the FST
        this._initialize();
    }
    
    /**
     * Initialize the FST with transition tables and maps
     * @private
     */
    _initialize() {
        // Create binary representations for each braille character
        for (const [char, braille] of Object.entries(this.brailleDots)) {
            this.brailleBinary[char] = this._brailleToBinary(braille);
        }
        
        // Create reverse mappings
        this._createReverseMappings();
        
        // Load contractions if using Grade 2
        if (this.options.grade === 2) {
            this._loadContractions();
        }
        
        // Build transition table for the FST
        this._buildTransitionTable();
        
        this.initialized = true;
    }
    
    /**
     * Convert braille unicode to binary representation
     * @private
     * @param {string} braille - Braille unicode character
     * @returns {string} - Binary representation (6 bits)
     */
    _brailleToBinary(braille) {
        // Handle multi-character braille sequences
        if (braille.length > 1) {
            return braille.split('').map(b => this._brailleToBinary(b)).join('');
        }
        
        // Get the Unicode code point and subtract the base code point for braille patterns
        const codePoint = braille.codePointAt(0);
        const baseCodePoint = '⠀'.codePointAt(0); // Empty braille pattern
        
        // The difference gives us the dot pattern (as a decimal number)
        const dotPattern = codePoint - baseCodePoint;
        
        // Convert to 6-bit binary string
        return dotPattern.toString(2).padStart(6, '0');
    }
    
    /**
     * Convert binary representation to braille unicode
     * @private
     * @param {string} binary - Binary representation (6 bits)
     * @returns {string} - Braille unicode character
     */
    _binaryToBraille(binary) {
        // Handle longer binary sequences (multiple characters)
        if (binary.length > 6) {
            const chars = [];
            for (let i = 0; i < binary.length; i += 6) {
                const chunk = binary.substr(i, 6);
                chars.push(this._binaryToBraille(chunk));
            }
            return chars.join('');
        }
        
        // Convert binary to decimal
        const dotPattern = parseInt(binary, 2);
        
        // Add to base code point to get the braille character
        const baseCodePoint = '⠀'.codePointAt(0);
        const codePoint = baseCodePoint + dotPattern;
        
        // Convert code point to character
        return String.fromCodePoint(codePoint);
    }
    
    /**
     * Create reverse mappings (braille to text)
     * @private
     */
    _createReverseMappings() {
        this.reverseMap = {};
        
        // Create mapping from braille to text
        for (const [char, braille] of Object.entries(this.brailleDots)) {
            this.reverseMap[braille] = char;
        }
    }
    
    /**
     * Load contractions for Grade 2 braille
     * @private
     */
    _loadContractions() {
        // Common English contractions for Grade 2 braille
        const grade2Contractions = {
            // Common words
            'and': '⠯',
            'for': '⠿',
            'of': '⠷',
            'the': '⠮',
            'with': '⠾',
            'in': '⠔',
            'was': '⠴',
            'were': '⠶',
            
            // Word parts
            'ar': '⠜',
            'ch': '⠡',
            'ed': '⠫',
            'er': '⠻',
            'gh': '⠣',
            'ing': '⠬',
            'ou': '⠳',
            'ow': '⠪',
            'sh': '⠩',
            'st': '⠌',
            'th': '⠹',
            'wh': '⠱',
            
            // Short-form words
            'about': '⠁⠃',
            'above': '⠁⠃⠧',
            'according': '⠁⠉',
            'across': '⠁⠉⠗',
            'after': '⠁⠋',
            'afternoon': '⠁⠋⠝',
            'afterward': '⠁⠋⠺',
            'again': '⠁⠛',
            'against': '⠁⠛⠌',
            'almost': '⠁⠇⠍',
            'already': '⠁⠇⠗',
            'also': '⠁⠇',
            'although': '⠁⠇⠹',
            'altogether': '⠁⠇⠞',
            'always': '⠁⠇⠺',
            'because': '⠃⠉',
            'before': '⠃⠋',
            'behind': '⠃⠓',
            'below': '⠃⠇',
            'beneath': '⠃⠝',
            'beside': '⠃⠎',
            'between': '⠃⠞',
            'beyond': '⠃⠽',
            'blind': '⠃⠇',
            'braille': '⠃⠗⠇',
            'children': '⠡⠝'
        };
        
        // Add contractions to the map
        this.contractionMap = grade2Contractions;
        
        // Add binary representations for contractions
        for (const [word, braille] of Object.entries(this.contractionMap)) {
            this.brailleBinary[word] = this._brailleToBinary(braille);
        }
        
        // Add to reverse map
        for (const [word, braille] of Object.entries(this.contractionMap)) {
            this.reverseMap[braille] = word;
        }
    }
    
    /**
     * Build the transition table for the FST
     * @private
     */
    _buildTransitionTable() {
        // Simple state machine for basic transitions
        this.transitionTable = {
            'START': {
                'LETTER': 'WORD',
                'NUMBER': 'NUMBER_MODE',
                'SPACE': 'START',
                'PUNCTUATION': 'PUNCTUATION'
            },
            'WORD': {
                'LETTER': 'WORD',
                'NUMBER': 'NUMBER_MODE',
                'SPACE': 'START',
                'PUNCTUATION': 'PUNCTUATION'
            },
            'NUMBER_MODE': {
                'LETTER': 'WORD',
                'NUMBER': 'NUMBER_MODE',
                'SPACE': 'START',
                'PUNCTUATION': 'PUNCTUATION'
            },
            'PUNCTUATION': {
                'LETTER': 'WORD',
                'NUMBER': 'NUMBER_MODE',
                'SPACE': 'START',
                'PUNCTUATION': 'PUNCTUATION'
            }
        };
    }
    
    /**
     * Get character type for FST transitions
     * @private
     * @param {string} char - Character to check
     * @returns {string} - Character type (LETTER, NUMBER, SPACE, PUNCTUATION)
     */
    _getCharType(char) {
        if (/[a-zA-Z]/.test(char)) return 'LETTER';
        if (/[0-9]/.test(char)) return 'NUMBER';
        if (/\s/.test(char)) return 'SPACE';
        return 'PUNCTUATION';
    }
    
    /**
     * Encode text to braille using the FST
     * @param {string} text - Text to encode
     * @returns {object} - Encoded result with unicode, binary, and BBES formats
     */
    encode(text) {
        if (!this.initialized) {
            throw new Error('BrailleFST not initialized');
        }
        
        let state = 'START';
        let brailleUnicode = '';
        let brailleBinary = '';
        let currentWord = '';
        let numberMode = false;
        
        // Convert to lowercase for processing
        text = text.toLowerCase();
        
        // Process character by character
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charType = this._getCharType(char);
            
            // Update state based on transition table
            state = this.transitionTable[state][charType];
            
            // Handle numbers (add number sign when entering number mode)
            if (charType === 'NUMBER' && !numberMode) {
                brailleUnicode += this.brailleDots['#'];
                brailleBinary += this.brailleBinary['#'];
                numberMode = true;
            } else if (charType !== 'NUMBER') {
                numberMode = false;
            }
            
            // Handle Grade 2 contractions
            if (this.options.grade === 2 && charType === 'LETTER') {
                currentWord += char;
                
                // Check if we have a contraction for the current word
                if (this.contractionMap[currentWord]) {
                    // We'll handle this when we reach a word boundary
                    continue;
                }
                
                // Check if we have a contraction for the current word plus next character
                if (i < text.length - 1) {
                    const nextChar = text[i + 1];
                    const potentialContraction = currentWord + nextChar;
                    
                    if (this.contractionMap[potentialContraction]) {
                        // Wait for the next character
                        continue;
                    }
                }
            }
            
            // Handle word boundaries for contractions
            if (this.options.grade === 2 && (charType === 'SPACE' || charType === 'PUNCTUATION')) {
                if (this.contractionMap[currentWord]) {
                    brailleUnicode += this.contractionMap[currentWord];
                    brailleBinary += this.brailleBinary[currentWord];
                    currentWord = '';
                } else {
                    // Encode each character of the word
                    for (const c of currentWord) {
                        brailleUnicode += this.brailleDots[c] || '';
                        brailleBinary += this.brailleBinary[c] || '';
                    }
                    currentWord = '';
                }
            }
            
            // Add the current character
            if (this.brailleDots[char]) {
                brailleUnicode += this.brailleDots[char];
                brailleBinary += this.brailleBinary[char];
            }
        }
        
        // Handle any remaining word
        if (currentWord && this.options.grade === 2) {
            if (this.contractionMap[currentWord]) {
                brailleUnicode += this.contractionMap[currentWord];
                brailleBinary += this.brailleBinary[currentWord];
            } else {
                // Encode each character of the word
                for (const c of currentWord) {
                    brailleUnicode += this.brailleDots[c] || '';
                    brailleBinary += this.brailleBinary[c] || '';
                }
            }
        }
        
        // Create BBES format (compact binary representation)
        const bbes = this._createBBES(brailleBinary);
        
        return {
            unicode: brailleUnicode,
            binary: brailleBinary,
            bbes: bbes
        };
    }
    
    /**
     * Decode braille to text using the FST
     * @param {string} braille - Braille to decode (unicode or binary)
     * @param {string} format - Format of input ('unicode', 'binary', or 'bbes')
     * @returns {string} - Decoded text
     */
    decode(braille, format = 'unicode') {
        if (!this.initialized) {
            throw new Error('BrailleFST not initialized');
        }
        
        let binary = '';
        
        // Convert input to binary based on format
        if (format === 'unicode') {
            // Convert unicode braille to binary
            for (const char of braille) {
                binary += this._brailleToBinary(char);
            }
        } else if (format === 'binary') {
            binary = braille;
        } else if (format === 'bbes') {
            binary = this._decodeBBES(braille);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }
        
        let text = '';
        let state = 'START';
        let numberMode = false;
        
        // Process in 6-bit chunks (one braille cell)
        for (let i = 0; i < binary.length; i += 6) {
            const chunk = binary.substr(i, 6);
            const brailleChar = this._binaryToBraille(chunk);
            
            // Check for number sign
            if (brailleChar === this.brailleDots['#']) {
                numberMode = true;
                continue;
            }
            
            // Look up in reverse map
            if (this.reverseMap[brailleChar]) {
                const char = this.reverseMap[brailleChar];
                
                // Handle numbers
                if (numberMode && '123456789'.includes(char)) {
                    text += char;
                } else {
                    numberMode = false;
                    text += char;
                }
            }
        }
        
        return text;
    }
    
    /**
     * Create BBES (Braille Binary Encoding Standard) from binary
     * @private
     * @param {string} binary - Binary representation
     * @returns {string} - BBES format (base64 encoded)
     */
    _createBBES(binary) {
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
     * Decode BBES to binary
     * @private
     * @param {string} bbes - BBES format (base64 encoded)
     * @returns {string} - Binary representation
     */
    _decodeBBES(bbes) {
        // Convert base64 to byte array
        const bytes = atob(bbes).split('').map(c => c.charCodeAt(0));
        
        // Convert byte array to binary
        let binary = '';
        for (const byte of bytes) {
            binary += byte.toString(2).padStart(8, '0');
        }
        
        return binary;
    }
    
    /**
     * Set options for the FST
     * @param {object} options - Options to set
     */
    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
        
        // Reinitialize with new options
        this._initialize();
    }
    
    /**
     * Get the current options
     * @returns {object} - Current options
     */
    getOptions() {
        return { ...this.options };
    }
    
    /**
     * Get statistics about the FST
     * @returns {object} - Statistics
     */
    getStats() {
        return {
            characterCount: Object.keys(this.brailleDots).length,
            contractionCount: Object.keys(this.contractionMap).length,
            standard: this.options.standard,
            grade: this.options.grade,
            language: this.options.language
        };
    }
}

// Export the BrailleFST class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleFST };
} else if (typeof window !== 'undefined') {
    window.BrailleFST = BrailleFST;
}
