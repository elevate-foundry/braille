/**
 * BrailleBuddy Haptic Engine
 * 
 * This module provides haptic feedback for braille patterns,
 * contractions, words, and biological rhythms to enhance the tactile
 * learning experience and implement compression concepts.
 * 
 * The haptic engine supports both character-level and word-level
 * vibration patterns, with biologically-inspired rhythms for
 * more intuitive tactile feedback.
 */

class HapticEngine {
    constructor() {
        this.patterns = {};
        this.isSupported = this.checkHapticSupport();
        this.loadPatterns();
    }
    
    /**
     * Check if haptic feedback is supported on the device
     * @returns {boolean} - Whether haptic feedback is supported
     */
    checkHapticSupport() {
        return (
            typeof navigator !== 'undefined' && 
            navigator.vibrate !== undefined
        );
    }
    
    /**
     * Load haptic patterns from JSON file
     */
    async loadPatterns() {
        try {
            const response = await fetch('/src/haptic-patterns.json');
            if (!response.ok) {
                throw new Error(`Failed to load haptic patterns: ${response.statusText}`);
            }
            
            this.patterns = await response.json();
            console.log('Haptic patterns loaded successfully');
        } catch (error) {
            console.error('Error loading haptic patterns:', error);
        }
    }
    
    /**
     * Play a haptic pattern
     * @param {string} patternType - Type of pattern (contractions, tones, syllabic, jamo, feedback)
     * @param {string} patternName - Name of the pattern
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playPattern(patternType, patternName) {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        if (!this.patterns[patternType] || !this.patterns[patternType][patternName]) {
            console.error(`Pattern ${patternType}.${patternName} not found`);
            return false;
        }
        
        const pattern = this.patterns[patternType][patternName];
        return navigator.vibrate(pattern);
    }
    
    /**
     * Play a haptic pattern for a braille cell
     * @param {Array} braillePattern - Array representing a braille cell [1,0,1,0,1,0]
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playBraillePattern(braillePattern) {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        // Convert braille pattern to haptic pattern
        // Each dot that is raised (1) gets a longer vibration
        // Each dot that is not raised (0) gets a short pause
        const hapticPattern = [];
        
        for (let i = 0; i < braillePattern.length; i++) {
            if (braillePattern[i] === 1) {
                hapticPattern.push(100); // 100ms vibration for raised dot
            } else {
                hapticPattern.push(30);  // 30ms pause for non-raised dot
            }
            
            if (i < braillePattern.length - 1) {
                hapticPattern.push(50); // 50ms pause between dots
            }
        }
        
        return navigator.vibrate(hapticPattern);
    }
    
    /**
     * Play a haptic pattern for a contraction
     * @param {string} contraction - Contraction to play (e.g., "th", "ing", "the")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playContraction(contraction) {
        return this.playPattern('contractions', contraction);
    }
    
    /**
     * Play a haptic pattern for a complete word
     * @param {string} word - Word to play
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playWord(word) {
        return this.playPattern('words', word.toLowerCase());
    }
    
    /**
     * Play a biological rhythm pattern
     * @param {string} rhythm - Rhythm to play (e.g., "heartbeat", "breathing")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playBiologicalRhythm(rhythm) {
        return this.playPattern('biologicalRhythms', rhythm);
    }
    
    /**
     * Play a haptic pattern for a tone (used in Chinese)
     * @param {number} toneNumber - Tone number (1-4)
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playTone(toneNumber) {
        return this.playPattern('tones', `tone${toneNumber}`);
    }
    
    /**
     * Play a haptic pattern for syllabic scripts (Japanese)
     * @param {string} type - Type of syllabic pattern ("kana" or "kanji")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playSyllabic(type) {
        return this.playPattern('syllabic', type);
    }
    
    /**
     * Play a haptic pattern for Korean Jamo combinations
     * @param {string} type - Type of jamo pattern ("jamo" or "batchim")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playJamo(type) {
        return this.playPattern('jamo', type);
    }
    
    /**
     * Play a feedback pattern for user interactions
     * @param {string} feedback - Type of feedback ("correct", "incorrect", "hint", "success", "progress")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playFeedback(feedback) {
        return this.playPattern('feedback', feedback);
    }
    
    /**
     * Create a custom haptic pattern based on text
     * @param {string} text - Text to convert to a haptic pattern
     * @param {string} language - Language code for the text
     * @param {boolean} useWordPatterns - Whether to use word-level patterns
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playTextPattern(text, language = 'en', useWordPatterns = true) {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        // If word patterns are enabled, try to use them
        if (useWordPatterns) {
            // Split text into words
            const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
            
            // Check if we have patterns for these words
            const patterns = [];
            let hasWordPatterns = false;
            
            for (const word of words) {
                if (this.patterns.words && this.patterns.words[word]) {
                    // We have a pattern for this word
                    patterns.push(...this.patterns.words[word]);
                    patterns.push(100); // Pause between words
                    hasWordPatterns = true;
                } else {
                    // Check for contractions
                    const contractions = ['th', 'ing', 'the', 'and', 'er', 'ou'];
                    let foundContraction = false;
                    
                    for (const contraction of contractions) {
                        if (word.includes(contraction) && 
                            this.patterns.contractions && 
                            this.patterns.contractions[contraction]) {
                            patterns.push(...this.patterns.contractions[contraction]);
                            patterns.push(70); // Shorter pause after contraction
                            foundContraction = true;
                            hasWordPatterns = true;
                            break;
                        }
                    }
                    
                    if (!foundContraction) {
                        // Fall back to character-by-character for this word
                        for (let i = 0; i < word.length; i++) {
                            this._addCharacterPattern(word[i], patterns);
                        }
                        patterns.push(100); // Pause between words
                    }
                }
            }
            
            // If we found any word patterns, use them
            if (hasWordPatterns && patterns.length > 0) {
                return navigator.vibrate(patterns);
            }
        }
        
        // Fall back to character-by-character pattern
        return this.playCharacterByCharacter(text);
    }
    
    /**
     * Play a character-by-character haptic pattern
     * @param {string} text - Text to convert to a haptic pattern
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playCharacterByCharacter(text) {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        const pattern = [];
        
        for (let i = 0; i < text.length; i++) {
            this._addCharacterPattern(text[i], pattern);
            
            if (i < text.length - 1) {
                pattern.push(30); // Short pause between characters
            }
        }
        
        return navigator.vibrate(pattern);
    }
    
    /**
     * Add a character pattern to an existing pattern array
     * @private
     * @param {string} char - Character to add
     * @param {Array} pattern - Pattern array to add to
     */
    _addCharacterPattern(char, pattern) {
        // Different pulse lengths based on character type
        if (/[aeiou]/i.test(char)) {
            pattern.push(150); // Vowels get longer pulses
        } else if (/[bcdfghjklmnpqrstvwxyz]/i.test(char)) {
            pattern.push(80);  // Consonants get medium pulses
        } else if (/[0-9]/i.test(char)) {
            pattern.push(120); // Numbers get different pulses
        } else {
            pattern.push(50);  // Other characters get short pulses
        }
    }
    
    /**
     * Play a compression pattern for a word or character
     * @param {string} text - Text to play
     * @param {string} compressionLevel - Compression level ("grade1", "grade2", "aiOptimized")
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playCompressionPattern(text, compressionLevel = 'grade2') {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        if (!this.patterns.compressionPatterns || 
            !this.patterns.compressionPatterns[compressionLevel]) {
            console.error(`Compression level ${compressionLevel} not found`);
            return false;
        }
        
        const compressionPatterns = this.patterns.compressionPatterns[compressionLevel];
        
        // Check if we have a pattern for the whole text
        if (compressionPatterns[text.toLowerCase()]) {
            return navigator.vibrate(compressionPatterns[text.toLowerCase()]);
        }
        
        // Otherwise, try to find patterns for parts of the text
        const pattern = [];
        let textRemaining = text.toLowerCase();
        let foundPattern = false;
        
        // Try to match the longest patterns first
        const patternKeys = Object.keys(compressionPatterns).sort((a, b) => b.length - a.length);
        
        while (textRemaining.length > 0) {
            foundPattern = false;
            
            for (const key of patternKeys) {
                if (textRemaining.startsWith(key)) {
                    pattern.push(...compressionPatterns[key]);
                    pattern.push(50); // Pause between patterns
                    textRemaining = textRemaining.substring(key.length);
                    foundPattern = true;
                    break;
                }
            }
            
            if (!foundPattern) {
                // No pattern found, skip this character
                textRemaining = textRemaining.substring(1);
            }
        }
        
        if (pattern.length > 0) {
            return navigator.vibrate(pattern);
        }
        
        return false;
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.hapticEngine = new HapticEngine();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HapticEngine;
}
