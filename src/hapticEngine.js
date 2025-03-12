/**
 * BrailleBuddy Haptic Engine
 * 
 * This module provides haptic feedback for braille patterns,
 * contractions, and phonetic elements to enhance the tactile
 * learning experience.
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
     * @returns {boolean} - Whether the pattern was played successfully
     */
    playTextPattern(text, language = 'en') {
        if (!this.isSupported) {
            console.warn('Haptic feedback not supported on this device');
            return false;
        }
        
        // This is a simplified implementation
        // In a full implementation, we would analyze the text for language-specific patterns
        const pattern = [];
        
        for (let i = 0; i < text.length; i++) {
            // Different pulse lengths based on character type
            if (/[aeiou]/i.test(text[i])) {
                pattern.push(150); // Vowels get longer pulses
            } else if (/[bcdfghjklmnpqrstvwxyz]/i.test(text[i])) {
                pattern.push(80);  // Consonants get medium pulses
            } else if (/[0-9]/i.test(text[i])) {
                pattern.push(120); // Numbers get different pulses
            } else {
                pattern.push(50);  // Other characters get short pulses
            }
            
            if (i < text.length - 1) {
                pattern.push(30); // Short pause between characters
            }
        }
        
        return navigator.vibrate(pattern);
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
