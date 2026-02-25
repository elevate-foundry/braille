/**
 * BrailleFST Grade 3 Extension
 * 
 * This module extends the BrailleFST class to support Grade 3 braille,
 * which includes advanced contractions and shorthand notations beyond Grade 2.
 * 
 * Grade 3 is a more aggressive compression system that can significantly
 * reduce the size of braille text while maintaining readability for
 * experienced braille readers.
 */

// Import the shared BBESCodec and base BrailleFST class if in Node.js environment
if (typeof require !== 'undefined') {
    var BBESCodec = require('./bbes-codec').BBESCodec;
    var BrailleFST = require('./braille-fst').BrailleFST;
}

class BrailleFSTGrade3 extends BrailleFST {
    constructor(options = {}) {
        // Set default grade to 3
        super({
            ...options,
            grade: 3
        });
        
        // Override the grade if explicitly set
        this.options.grade = 3;
        
        // Extended contractions for Grade 3
        this.grade3Contractions = {};
        
        // Extended state transitions for Grade 3
        this.grade3Transitions = {};
        
        // Initialize Grade 3 extensions
        this._initializeGrade3();
    }
    
    /**
     * Initialize Grade 3 specific extensions
     * @private
     */
    _initializeGrade3() {
        // Load Grade 3 contractions
        this._loadGrade3Contractions();
        
        // Build extended transition table
        this._buildGrade3TransitionTable();
        
        // Add Grade 3 contractions to the main contraction map
        this.contractionMap = {
            ...this.contractionMap,
            ...this.grade3Contractions
        };
        
        // Add binary representations for Grade 3 contractions
        for (const [word, braille] of Object.entries(this.grade3Contractions)) {
            this.brailleBinary[word] = this._brailleToBinary(braille);
        }
        
        // Add to reverse map
        for (const [word, braille] of Object.entries(this.grade3Contractions)) {
            this.reverseMap[braille] = word;
        }
    }
    
    /**
     * Load Grade 3 specific contractions
     * @private
     */
    _loadGrade3Contractions() {
        // Grade 3 includes personal shorthand and advanced contractions
        // These are more aggressive than Grade 2 and can represent entire phrases
        
        // Common phrases
        this.grade3Contractions = {
            // Common phrases
            'i think': '⠊⠹',
            'i believe': '⠊⠃⠇',
            'in order to': '⠔⠕⠞',
            'as soon as possible': '⠁⠎⠁⠏',
            'for example': '⠋⠑⠛',
            'in fact': '⠔⠋',
            'in reference to': '⠔⠗⠞',
            'in regard to': '⠔⠗⠛⠞',
            'in relation to': '⠔⠗⠇⠞',
            'in respect to': '⠔⠗⠎⠞',
            'of course': '⠷⠉',
            'on the other hand': '⠕⠮⠓',
            'point of view': '⠏⠕⠧',
            'such as': '⠎⠡',
            'that is': '⠞⠊',
            'with reference to': '⠾⠗⠞',
            'with regard to': '⠾⠗⠛⠞',
            'with respect to': '⠾⠗⠎⠞',
            
            // Common words with more aggressive contractions
            'about': '⠁⠃',
            'above': '⠁⠃⠧',
            'according': '⠁⠉',
            'afternoon': '⠁⠋⠝',
            'afterward': '⠁⠋⠺',
            'again': '⠁⠛',
            'against': '⠁⠛⠌',
            'almost': '⠁⠇⠍',
            'already': '⠁⠇⠗',
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
            'children': '⠡⠝',
            'conceive': '⠉⠉⠧',
            'conceiving': '⠉⠉⠧⠛',
            'could': '⠉⠙',
            'declare': '⠙⠉⠇',
            'declaring': '⠙⠉⠇⠛',
            'either': '⠑⠊',
            'father': '⠋⠗',
            'friend': '⠋⠗⠙',
            'good': '⠛⠙',
            'great': '⠛⠗⠞',
            'herself': '⠓⠗⠋',
            'himself': '⠓⠍⠋',
            'immediate': '⠊⠍⠍',
            'knowledge': '⠅⠝',
            'letter': '⠇⠗',
            'little': '⠇⠇',
            'mother': '⠍⠗',
            'myself': '⠍⠽⠋',
            'necessary': '⠝⠑⠉',
            'neither': '⠝⠑⠊',
            'oneself': '⠕⠝⠋',
            'ourselves': '⠳⠗⠧⠎',
            'perhaps': '⠏⠗⠓',
            'question': '⠟⠝',
            'quick': '⠟⠅',
            'receive': '⠗⠉⠧',
            'receiving': '⠗⠉⠧⠛',
            'rejoice': '⠗⠚⠉',
            'rejoicing': '⠗⠚⠉⠛',
            'should': '⠩⠙',
            'themselves': '⠮⠍⠧⠎',
            'thyself': '⠹⠽⠋',
            'today': '⠞⠙',
            'together': '⠞⠛⠗',
            'tomorrow': '⠞⠍',
            'tonight': '⠞⠝',
            'would': '⠺⠙',
            'yourself': '⠽⠗⠋',
            'yourselves': '⠽⠗⠧⠎',
            
            // Domain-specific contractions (example: computing)
            'algorithm': '⠁⠇⠛⠍',
            'application': '⠁⠏⠏',
            'computer': '⠉⠏⠞⠗',
            'database': '⠙⠃',
            'function': '⠋⠝',
            'hardware': '⠓⠺',
            'internet': '⠊⠝⠞',
            'keyboard': '⠅⠃⠙',
            'network': '⠝⠞⠺',
            'program': '⠏⠗⠛',
            'software': '⠎⠺',
            'website': '⠺⠃',
            
            // Common suffixes with more aggressive contractions
            'ability': '⠁⠃⠽',
            'ation': '⠁⠰⠝',
            'ful': '⠰⠋',
            'ible': '⠰⠊⠃',
            'ical': '⠰⠊⠉',
            'ious': '⠰⠊⠎',
            'ment': '⠰⠍',
            'ness': '⠰⠝',
            'ology': '⠰⠕⠇',
            'sion': '⠰⠎⠝',
            'tion': '⠰⠞⠝',
            'tive': '⠰⠞⠧',
            
            // Common prefixes with more aggressive contractions
            'anti': '⠁⠝⠞',
            'dis': '⠙⠎',
            'electro': '⠑⠇⠉',
            'hyper': '⠓⠽⠏',
            'inter': '⠊⠝⠞⠗',
            'micro': '⠍⠊⠉',
            'multi': '⠍⠥⠇',
            'over': '⠕⠧⠗',
            'photo': '⠏⠓⠞',
            'poly': '⠏⠇⠽',
            'pseudo': '⠏⠎⠙',
            'retro': '⠗⠞⠗',
            'semi': '⠎⠍',
            'sub': '⠎⠃',
            'super': '⠎⠏⠗',
            'tele': '⠞⠇',
            'trans': '⠞⠗⠝',
            'ultra': '⠥⠇⠞',
            'under': '⠥⠝⠙',
            
            // Numbers and dates
            'first': '⠼⠁⠌',
            'second': '⠼⠃⠌',
            'third': '⠼⠉⠌',
            'fourth': '⠼⠙⠌',
            'fifth': '⠼⠑⠌',
            'january': '⠚⠁⠝',
            'february': '⠋⠑⠃',
            'march': '⠍⠉⠓',
            'april': '⠁⠏⠗',
            'may': '⠍⠽',
            'june': '⠚⠝',
            'july': '⠚⠇⠽',
            'august': '⠁⠥⠛',
            'september': '⠎⠑⠏',
            'october': '⠕⠉⠞',
            'november': '⠝⠕⠧',
            'december': '⠙⠑⠉',
            
            // Punctuation shortcuts
            '...': '⠲⠲⠲',
            '?!': '⠦⠖',
            '--': '⠤⠤',
            '""': '⠦⠴',
            '()': '⠐⠣⠐⠜',
            '[]': '⠨⠣⠨⠜',
            '{}': '⠸⠣⠸⠜',
            
            // Braille-specific terminology
            'braille': '⠃⠗⠇',
            'contraction': '⠉⠞⠗',
            'dot': '⠙⠞',
            'grade': '⠛⠗⠙',
            'tactile': '⠞⠉⠞'
        };
    }
    
    /**
     * Build Grade 3 specific transition table
     * @private
     */
    _buildGrade3TransitionTable() {
        // Extend the base transition table with Grade 3 specific states
        this.grade3Transitions = {
            'START': {
                'PHRASE_START': 'PHRASE',
                'PREFIX': 'PREFIX',
                ...this.transitionTable['START']
            },
            'WORD': {
                'SUFFIX': 'SUFFIX',
                ...this.transitionTable['WORD']
            },
            'PHRASE': {
                'PHRASE_END': 'START',
                'WORD': 'WORD'
            },
            'PREFIX': {
                'WORD': 'WORD'
            },
            'SUFFIX': {
                'SPACE': 'START',
                'SUFFIX': 'SUFFIX'
            }
        };
        
        // Merge with the base transition table
        this.transitionTable = {
            ...this.transitionTable,
            ...this.grade3Transitions
        };
    }
    
    /**
     * Enhanced character type detection for Grade 3
     * @private
     * @param {string} char - Character to check
     * @param {string} context - Surrounding context
     * @returns {string} - Character type
     */
    _getCharTypeGrade3(char, context) {
        // First check basic character types
        const basicType = super._getCharType(char);
        
        // Then check for Grade 3 specific patterns
        // This would require looking at surrounding context
        
        // For now, return the basic type
        return basicType;
    }
    
    /**
     * Enhanced encode method for Grade 3
     * @param {string} text - Text to encode
     * @returns {object} - Encoded result
     */
    encode(text) {
        if (!this.initialized) {
            throw new Error('BrailleFSTGrade3 not initialized');
        }
        
        let brailleUnicode = '';
        let brailleBinary = '';
        
        // Convert to lowercase for processing
        text = text.toLowerCase();
        
        // First, try to match phrases (longest matches first)
        const phrases = Object.keys(this.grade3Contractions)
            .filter(key => key.includes(' '))
            .sort((a, b) => b.length - a.length);
        
        let remainingText = text;
        let lastIndex = 0;
        
        // Try to match phrases
        for (const phrase of phrases) {
            const phraseIndex = remainingText.indexOf(phrase);
            if (phraseIndex !== -1) {
                // Process text before the phrase
                if (phraseIndex > 0) {
                    const beforeText = remainingText.substring(0, phraseIndex);
                    const beforeResult = super.encode(beforeText);
                    brailleUnicode += beforeResult.unicode;
                    brailleBinary += beforeResult.binary;
                }
                
                // Add the phrase contraction
                brailleUnicode += this.grade3Contractions[phrase];
                brailleBinary += this.brailleBinary[phrase];
                
                // Update remaining text
                remainingText = remainingText.substring(phraseIndex + phrase.length);
                lastIndex = phraseIndex + phrase.length;
            }
        }
        
        // Process any remaining text
        if (remainingText.length > 0) {
            // For remaining text, use Grade 2 encoding but with Grade 3 contractions
            const remainingResult = super.encode(remainingText);
            brailleUnicode += remainingResult.unicode;
            brailleBinary += remainingResult.binary;
        }
        
        // Create BBES format
        const bbes = this._createBBES(brailleBinary);
        
        return {
            unicode: brailleUnicode,
            binary: brailleBinary,
            bbes: bbes
        };
    }
    
    /**
     * Get statistics about the Grade 3 FST
     * @returns {object} - Statistics
     */
    getStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            grade: 3,
            grade3ContractionCount: Object.keys(this.grade3Contractions).length,
            phraseCount: Object.keys(this.grade3Contractions)
                .filter(key => key.includes(' ')).length
        };
    }
}

// Export the BrailleFSTGrade3 class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrailleFSTGrade3 };
} else if (typeof window !== 'undefined') {
    window.BrailleFSTGrade3 = BrailleFSTGrade3;
}
