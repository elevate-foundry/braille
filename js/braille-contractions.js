/**
 * BrailleBuddy Contractions Module
 * 
 * This module provides support for Grade 2 Braille contractions including:
 * 1. Two-letter contractions (th, sh, ch, etc.)
 * 2. Whole-word contractions (single character representing entire words)
 * 3. Partial contractions (shortened forms of common words)
 * 4. Prefix and suffix contractions
 */

class BrailleContractions {
    constructor() {
        // Initialize contractions data
        this.initializeContractions();
        
        // Track which contractions the user has learned
        this.learnedContractions = new Set();
        
        // Load learned contractions from local storage if available
        this.loadLearnedContractions();
    }
    
    /**
     * Initialize all braille contractions data structures
     */
    initializeContractions() {
        // Two-letter contractions (single character represents two letters)
        this.twoLetterContractions = {
            'th': [1, 0, 0, 1, 1, 1], // ⠹ dots 1456
            'sh': [1, 0, 0, 1, 0, 1], // ⠩ dots 146
            'ch': [1, 0, 0, 0, 0, 1], // ⠡ dots 16
            'gh': [1, 1, 0, 0, 0, 1], // ⠣ dots 126
            'wh': [1, 0, 0, 0, 1, 1], // ⠱ dots 156
            'ou': [1, 1, 0, 0, 1, 1], // ⠳ dots 1256
            'er': [1, 1, 0, 1, 1, 1], // ⠻ dots 12456
            'ed': [1, 1, 0, 1, 0, 1], // ⠫ dots 1246
            'ow': [0, 1, 0, 1, 0, 1], // ⠪ dots 246
            'st': [0, 0, 1, 1, 0, 0], // ⠌ dots 34
            'ar': [0, 0, 1, 1, 1, 0], // ⠜ dots 345
            'ing': [0, 0, 1, 1, 0, 1] // ⠬ dots 346
        };
        
        // Whole-word contractions (single character represents entire word)
        this.wholeWordContractions = {
            'and': [1, 1, 1, 1, 0, 1], // ⠯ dots 12346
            'for': [1, 1, 1, 1, 1, 1], // ⠿ dots 123456
            'of': [1, 1, 1, 0, 1, 1], // ⠷ dots 12356
            'the': [0, 1, 1, 1, 0, 1], // ⠮ dots 2346
            'with': [0, 1, 1, 1, 1, 1], // ⠾ dots 23456
            'in': [0, 0, 1, 0, 1, 0], // ⠔ dots 35
            'that': [0, 1, 1, 1, 1, 0], // ⠞ letter t wordsign
            'which': [1, 0, 0, 0, 1, 1], // ⠱ dots 156
            'as': [1, 0, 1, 0, 1, 1], // ⠵ letter z wordsign
            'so': [0, 1, 1, 1, 0, 0]  // ⠎ letter s wordsign
        };
        
        // Partial contractions (shortened forms of common words)
        this.partialContractions = {
            'about': ['ab', [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]], // ⠁⠃
            'before': ['bef', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0]], // ⠃⠑⠋
            'behind': ['beh', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0]], // ⠃⠑⠓
            'below': ['bel', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0]], // ⠃⠑⠇
            'beneath': ['ben', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0]], // ⠃⠑⠝
            'beside': ['bes', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0]], // ⠃⠑⠎
            'between': ['bet', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0]], // ⠃⠑⠞
            'beyond': ['bey', [1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1]], // ⠃⠑⠽
            'children': ['chn', [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0]], // ⠡⠝
            'could': ['cd', [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0]] // ⠉⠙
        };
        
        // Prefix contractions
        this.prefixContractions = {
            'dis': [0, 1, 0, 0, 1, 1], // ⠲ lower groupsign, dots 256
            'con': [0, 1, 0, 0, 1, 0], // ⠒ lower groupsign, dots 25
            'com': [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0], // ⠉⠕⠍
            're': [1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0], // ⠗⠑
            'un': [1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0], // ⠥⠝
        };
        
        // Suffix contractions
        this.suffixContractions = {
            'ble': [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // ⠃⠇⠑
            'ing': [0, 0, 1, 1, 0, 1], // ⠬ dots 346
            'ity': [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1], // ⠰⠽ dots 56 + y
            'ment': [0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0], // ⠰⠞ dots 56 + t
            'ness': [0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0], // ⠰⠎ dots 56 + s
            'tion': [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0], // ⠰⠝ dots 56 + n
            'ful': [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0], // ⠰⠇ dots 56 + l
            'less': [0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0], // ⠨⠎ dots 46 + s
        };
        
        // Descriptions for contractions
        this.contractionDescriptions = {
            // Two-letter contractions
            'th': "Common two-letter contraction for 'th' as in 'the', 'this', 'that'.",
            'sh': "Common two-letter contraction for 'sh' as in 'ship', 'shop', 'wish'.",
            'ch': "Common two-letter contraction for 'ch' as in 'church', 'chair', 'much'.",
            'wh': "Common two-letter contraction for 'wh' as in 'what', 'when', 'where'.",
            'ou': "Common two-letter contraction for 'ou' as in 'out', 'about', 'sound'.",
            'er': "Common two-letter contraction for 'er' as in 'over', 'never', 'water'.",
            'ed': "Common two-letter contraction for 'ed' as in 'played', 'wanted', 'jumped'.",
            'ow': "Common two-letter contraction for 'ow' as in 'how', 'now', 'brown'.",
            'st': "Common two-letter contraction for 'st' as in 'stop', 'first', 'best'.",
            'ar': "Common two-letter contraction for 'ar' as in 'car', 'far', 'star'.",
            'ing': "Common ending contraction for 'ing' as in 'running', 'playing', 'singing'.",
            
            // Whole-word contractions
            'and': "Whole-word contraction for 'and', one of the most common words in English.",
            'for': "Whole-word contraction for 'for', a common preposition.",
            'of': "Whole-word contraction for 'of', a common preposition showing possession or connection.",
            'the': "Whole-word contraction for 'the', the most common word in English.",
            'with': "Whole-word contraction for 'with', a common preposition.",
            'in': "Whole-word contraction for 'in', a common preposition indicating location.",
            'that': "Alphabetic wordsign: the letter 't' standing alone means 'that'.",
            'which': "Strong wordsign for 'which' (same cell as the 'wh' groupsign).",
            'as': "Whole-word contraction for 'as', used in comparisons and time expressions.",
            'so': "Whole-word contraction for 'so', used to show result or degree."
        };
        
        // All contractions combined for easy access
        this.allContractions = {};
        Object.assign(this.allContractions, this.twoLetterContractions);
        
        // Add whole word contractions to all contractions
        for (const [word, pattern] of Object.entries(this.wholeWordContractions)) {
            this.allContractions[word] = pattern;
        }
    }
    
    /**
     * Get a contraction pattern by its text representation
     * @param {string} text - The text representation of the contraction
     * @returns {Array} - The dot pattern for the contraction
     */
    getContractionPattern(text) {
        return this.allContractions[text.toLowerCase()] || null;
    }
    
    /**
     * Get a description for a contraction
     * @param {string} text - The text representation of the contraction
     * @returns {string} - Description of the contraction
     */
    getContractionDescription(text) {
        return this.contractionDescriptions[text.toLowerCase()] || 
               `A Grade 2 Braille contraction for "${text}".`;
    }
    
    /**
     * Check if a text is a valid contraction
     * @param {string} text - Text to check
     * @returns {boolean} - True if it's a valid contraction
     */
    isContraction(text) {
        return text.toLowerCase() in this.allContractions;
    }
    
    /**
     * Get all two-letter contractions
     * @returns {Object} - All two-letter contractions
     */
    getTwoLetterContractions() {
        return this.twoLetterContractions;
    }
    
    /**
     * Get all whole-word contractions
     * @returns {Object} - All whole-word contractions
     */
    getWholeWordContractions() {
        return this.wholeWordContractions;
    }
    
    /**
     * Record that a contraction has been learned by the user
     * @param {string} contraction - The contraction that was learned
     */
    recordContractionLearned(contraction) {
        this.learnedContractions.add(contraction.toLowerCase());
        this.saveLearnedContractions();
    }
    
    /**
     * Check if a contraction has been learned
     * @param {string} contraction - The contraction to check
     * @returns {boolean} - True if the contraction has been learned
     */
    isContractionLearned(contraction) {
        return this.learnedContractions.has(contraction.toLowerCase());
    }
    
    /**
     * Get all learned contractions
     * @returns {Array} - Array of learned contractions
     */
    getLearnedContractions() {
        return Array.from(this.learnedContractions);
    }
    
    /**
     * Save learned contractions to local storage
     */
    saveLearnedContractions() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('learnedContractions', JSON.stringify(Array.from(this.learnedContractions)));
        }
    }
    
    /**
     * Load learned contractions from local storage
     */
    loadLearnedContractions() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('learnedContractions');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.learnedContractions = new Set(parsed);
                } catch (e) {
                    console.error('Error loading learned contractions:', e);
                    this.learnedContractions = new Set();
                }
            }
        }
    }
    
    /**
     * Get a list of recommended contractions to learn next
     * Based on what the user already knows
     * @param {number} count - Number of contractions to recommend
     * @returns {Array} - Array of recommended contractions
     */
    getRecommendedContractions(count = 5) {
        // Start with two-letter contractions as they're simpler
        const twoLetterKeys = Object.keys(this.twoLetterContractions);
        const wholeWordKeys = Object.keys(this.wholeWordContractions);
        
        // Combine all contractions
        const allKeys = [...twoLetterKeys, ...wholeWordKeys];
        
        // Filter out already learned contractions
        const notLearned = allKeys.filter(key => !this.isContractionLearned(key));
        
        // If all are learned, return random selection for review
        if (notLearned.length === 0) {
            return this.getRandomContractions(count);
        }
        
        // Prioritize two-letter contractions first
        const notLearnedTwoLetter = twoLetterKeys.filter(key => !this.isContractionLearned(key));
        
        // If there are unlearned two-letter contractions, prioritize those
        if (notLearnedTwoLetter.length > 0) {
            // Return up to count two-letter contractions
            if (notLearnedTwoLetter.length <= count) {
                // Fill remaining slots with whole-word contractions
                const notLearnedWholeWord = wholeWordKeys.filter(key => !this.isContractionLearned(key));
                const remaining = count - notLearnedTwoLetter.length;
                
                return [
                    ...notLearnedTwoLetter,
                    ...notLearnedWholeWord.slice(0, remaining)
                ];
            } else {
                // Just return a subset of two-letter contractions
                return this.getRandomSubset(notLearnedTwoLetter, count);
            }
        }
        
        // Otherwise, return whole-word contractions
        return this.getRandomSubset(notLearned, count);
    }
    
    /**
     * Get a random subset of contractions
     * @param {Array} contractions - Array of contractions to choose from
     * @param {number} count - Number of contractions to return
     * @returns {Array} - Random subset of contractions
     */
    getRandomSubset(contractions, count) {
        const shuffled = [...contractions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    /**
     * Get random contractions for review
     * @param {number} count - Number of contractions to return
     * @returns {Array} - Random contractions
     */
    getRandomContractions(count = 5) {
        const allKeys = [
            ...Object.keys(this.twoLetterContractions),
            ...Object.keys(this.wholeWordContractions)
        ];
        
        return this.getRandomSubset(allKeys, count);
    }
}

// Initialize braille contractions if window is loaded
if (typeof window !== 'undefined') {
    window.brailleContractions = new BrailleContractions();
}
