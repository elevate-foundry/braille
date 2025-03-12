/**
 * BrailleBuddy Haptic Feedback System
 * 
 * This module provides haptic feedback for braille characters using:
 * 1. Web Vibration API for mobile browsers
 * 2. Custom vibration patterns for each braille character
 * 3. Support for Grade 1 and Grade 2 Braille (contractions)
 * 4. Experimental haptic encoding options
 */

class HapticFeedback {
    constructor() {
        // Check if vibration is supported
        this.isVibrationSupported = 'vibrate' in navigator;
        
        // Default haptic mode
        this.hapticMode = 'standard'; // 'standard', 'rhythmic', 'frequency'
        
        // Vibration intensity (1-10)
        this.intensity = 5;
        
        // Base duration for vibrations in ms
        this.baseDuration = 50;
        
        // Gap between dot vibrations
        this.gapDuration = 50;
        
        // Braille dot positions
        this.dotPositions = [
            [0, 0], // Dot 1 (top left)
            [0, 1], // Dot 2 (middle left)
            [0, 2], // Dot 3 (bottom left)
            [1, 0], // Dot 4 (top right)
            [1, 1], // Dot 5 (middle right)
            [1, 2]  // Dot 6 (bottom right)
        ];
        
        // User preferences for haptic feedback
        this.userPreferences = {
            enabled: true,
            mode: 'standard',
            intensity: 5,
            customPatterns: {}
        };
        
        // Load user preferences from localStorage
        this.loadPreferences();
        
        // Initialize vibration patterns for braille alphabet
        this.initializePatterns();
    }
    
    /**
     * Initialize vibration patterns for braille characters
     */
    initializePatterns() {
        // Standard patterns - direct mapping of dots to vibrations
        this.standardPatterns = {};
        
        // Rhythmic patterns - using rhythm to represent dots
        this.rhythmicPatterns = {};
        
        // Frequency patterns - using different vibration intensities
        this.frequencyPatterns = {};
        
        // Get braille alphabet patterns
        const brailleAlphabet = {
            'a': [1, 0, 0, 0, 0, 0],
            'b': [1, 1, 0, 0, 0, 0],
            'c': [1, 0, 0, 1, 0, 0],
            'd': [1, 0, 0, 1, 1, 0],
            'e': [1, 0, 0, 0, 1, 0],
            'f': [1, 1, 0, 1, 0, 0],
            'g': [1, 1, 0, 1, 1, 0],
            'h': [1, 1, 0, 0, 1, 0],
            'i': [0, 1, 0, 1, 0, 0],
            'j': [0, 1, 0, 1, 1, 0],
            'k': [1, 0, 1, 0, 0, 0],
            'l': [1, 1, 1, 0, 0, 0],
            'm': [1, 0, 1, 1, 0, 0],
            'n': [1, 0, 1, 1, 1, 0],
            'o': [1, 0, 1, 0, 1, 0],
            'p': [1, 1, 1, 1, 0, 0],
            'q': [1, 1, 1, 1, 1, 0],
            'r': [1, 1, 1, 0, 1, 0],
            's': [0, 1, 1, 1, 0, 0],
            't': [0, 1, 1, 1, 1, 0],
            'u': [1, 0, 1, 0, 0, 1],
            'v': [1, 1, 1, 0, 0, 1],
            'w': [0, 1, 0, 1, 1, 1],
            'x': [1, 0, 1, 1, 0, 1],
            'y': [1, 0, 1, 1, 1, 1],
            'z': [1, 0, 1, 0, 1, 1]
        };
        
        // Add contractions if available
        if (window.brailleContractions) {
            // Get two-letter contractions
            const twoLetterContractions = window.brailleContractions.getTwoLetterContractions();
            for (const [contraction, pattern] of Object.entries(twoLetterContractions)) {
                brailleAlphabet[contraction] = pattern;
            }
            
            // Get whole-word contractions
            const wholeWordContractions = window.brailleContractions.getWholeWordContractions();
            for (const [contraction, pattern] of Object.entries(wholeWordContractions)) {
                brailleAlphabet[contraction] = pattern;
            }
        }
        
        // Generate patterns for each letter
        for (const [letter, pattern] of Object.entries(brailleAlphabet)) {
            // Standard pattern: vibrate for each raised dot
            this.standardPatterns[letter] = this.generateStandardPattern(pattern);
            
            // Rhythmic pattern: use rhythm to represent the pattern
            this.rhythmicPatterns[letter] = this.generateRhythmicPattern(pattern);
            
            // Frequency pattern: use different intensities for different positions
            this.frequencyPatterns[letter] = this.generateFrequencyPattern(pattern);
        }
    }
    
    /**
     * Generate standard vibration pattern for a braille character
     * Each raised dot gets a vibration of baseDuration
     */
    generateStandardPattern(dotPattern) {
        const pattern = [];
        
        // For each dot in the pattern
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                // Vibrate for raised dot
                pattern.push(this.baseDuration * this.intensity / 5);
            } else {
                // No vibration for non-raised dot
                pattern.push(0);
            }
            
            // Add gap between dots (except after the last one)
            if (i < dotPattern.length - 1) {
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
    
    /**
     * Generate rhythmic vibration pattern
     * Uses different rhythms to represent the pattern
     */
    generateRhythmicPattern(dotPattern) {
        const pattern = [];
        
        // Left column (dots 1, 2, 3)
        if (dotPattern[0] || dotPattern[1] || dotPattern[2]) {
            // Vibrate for left column
            const leftDuration = this.baseDuration * 2;
            pattern.push(leftDuration);
            pattern.push(this.gapDuration * 2);
        }
        
        // Right column (dots 4, 5, 6)
        if (dotPattern[3] || dotPattern[4] || dotPattern[5]) {
            // Vibrate for right column
            const rightDuration = this.baseDuration * 2;
            pattern.push(rightDuration);
            pattern.push(this.gapDuration * 2);
        }
        
        // Individual dots with short pulses
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                pattern.push(this.baseDuration);
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
    
    /**
     * Generate frequency-based vibration pattern
     * Uses different vibration intensities for different positions
     */
    generateFrequencyPattern(dotPattern) {
        const pattern = [];
        
        // For each dot in the pattern
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                // Calculate intensity based on position
                // Top dots are stronger, bottom dots are weaker
                const positionIntensity = 1 - (this.dotPositions[i][1] / 2); // 1.0, 0.5, or 0.0
                const duration = this.baseDuration * (1 + positionIntensity);
                
                pattern.push(Math.round(duration));
            } else {
                pattern.push(0);
            }
            
            // Add gap between dots
            if (i < dotPattern.length - 1) {
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
    
    /**
     * Vibrate with a specific pattern
     */
    vibrate(pattern) {
        if (!this.isVibrationSupported || !this.userPreferences.enabled) {
            console.log('Vibration not supported or disabled');
            return false;
        }
        
        try {
            navigator.vibrate(pattern);
            return true;
        } catch (error) {
            console.error('Error vibrating:', error);
            return false;
        }
    }
    
    /**
     * Provide haptic feedback for a braille character or contraction
     * @param {string} character - The character or contraction to provide feedback for
     */
    provideFeedback(character) {
        character = character.toLowerCase();
        let pattern;
        let isContraction = false;
        
        // Check if this is a contraction
        if (character.length > 1 && window.brailleContractions && window.brailleContractions.isContraction(character)) {
            isContraction = true;
        }
        
        // Get the appropriate pattern based on haptic mode
        switch (this.userPreferences.mode) {
            case 'rhythmic':
                pattern = isContraction ? this.getContractionRhythmicPattern(character) : this.rhythmicPatterns[character];
                break;
            case 'frequency':
                pattern = isContraction ? this.getContractionFrequencyPattern(character) : this.frequencyPatterns[character];
                break;
            case 'custom':
                pattern = this.userPreferences.customPatterns[character] || 
                         (isContraction ? this.getContractionStandardPattern(character) : this.standardPatterns[character]);
                break;
            default:
                pattern = isContraction ? this.getContractionStandardPattern(character) : this.standardPatterns[character];
        }
        
        // Adjust pattern based on user intensity preference
        if (this.userPreferences.intensity !== 5 && pattern) {
            const intensityFactor = this.userPreferences.intensity / 5;
            pattern = pattern.map(duration => {
                return duration > 0 ? Math.round(duration * intensityFactor) : 0;
            });
        }
        
        // Provide the haptic feedback
        return this.vibrate(pattern);
    }
    
    /**
     * Provide haptic feedback for a braille pattern
     */
    provideFeedbackForPattern(dotPattern) {
        // Generate a standard pattern from the dot pattern
        const pattern = this.generateStandardPattern(dotPattern);
        
        // Provide the haptic feedback
        return this.vibrate(pattern);
    }
    
    /**
     * Set the haptic mode
     */
    setMode(mode) {
        if (['standard', 'rhythmic', 'frequency', 'custom'].includes(mode)) {
            this.userPreferences.mode = mode;
            this.savePreferences();
            return true;
        }
        return false;
    }
    
    /**
     * Set the vibration intensity
     */
    setIntensity(intensity) {
        if (intensity >= 1 && intensity <= 10) {
            this.userPreferences.intensity = intensity;
            this.savePreferences();
            return true;
        }
        return false;
    }
    
    /**
     * Enable or disable haptic feedback
     */
    setEnabled(enabled) {
        this.userPreferences.enabled = enabled;
        this.savePreferences();
    }
    
    /**
     * Save a custom pattern for a letter
     */
    saveCustomPattern(letter, pattern) {
        letter = letter.toLowerCase();
        this.userPreferences.customPatterns[letter] = pattern;
        this.savePreferences();
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        try {
            const savedPreferences = localStorage.getItem('hapticPreferences');
            if (savedPreferences) {
                const parsed = JSON.parse(savedPreferences);
                this.userPreferences = { ...this.userPreferences, ...parsed };
            }
        } catch (error) {
            console.error('Error loading haptic preferences:', error);
        }
    }
    
    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('hapticPreferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Error saving haptic preferences:', error);
        }
    }
    
    /**
     * Test the current haptic mode with a sample letter
     */
    testHapticFeedback() {
        return this.provideFeedback('a');
    }
    
    /**
     * Check if the device supports haptic feedback
     */
    isSupported() {
        return this.isVibrationSupported;
    }
    
    /**
     * Generate standard vibration pattern for a contraction
     * @param {string} contraction - The contraction text
     * @returns {Array} - Vibration pattern for the contraction
     */
    getContractionStandardPattern(contraction) {
        // Get the contraction pattern from the brailleContractions module
        const dotPattern = window.brailleContractions ? 
                          window.brailleContractions.getContractionPattern(contraction) : null;
        
        if (!dotPattern) return null;
        
        const pattern = [];
        
        // Special intro vibration to indicate this is a contraction
        pattern.push(this.baseDuration * 2); // Longer initial vibration
        pattern.push(this.gapDuration);
        pattern.push(this.baseDuration);
        pattern.push(this.gapDuration * 2);
        
        // For each dot in the pattern
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                // Vibrate for raised dot
                pattern.push(this.baseDuration * this.intensity / 5);
            } else {
                // No vibration for non-raised dot
                pattern.push(0);
            }
            
            // Add gap between dots (except after the last one)
            if (i < dotPattern.length - 1) {
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
    
    /**
     * Generate rhythmic vibration pattern for a contraction
     * @param {string} contraction - The contraction text
     * @returns {Array} - Vibration pattern for the contraction
     */
    getContractionRhythmicPattern(contraction) {
        // Get the contraction pattern from the brailleContractions module
        const dotPattern = window.brailleContractions ? 
                          window.brailleContractions.getContractionPattern(contraction) : null;
        
        if (!dotPattern) return null;
        
        const pattern = [];
        
        // Special intro rhythm to indicate this is a contraction
        pattern.push(this.baseDuration);
        pattern.push(this.gapDuration / 2);
        pattern.push(this.baseDuration);
        pattern.push(this.gapDuration / 2);
        pattern.push(this.baseDuration * 2);
        pattern.push(this.gapDuration * 2);
        
        // Left column (dots 1, 2, 3)
        if (dotPattern[0] || dotPattern[1] || dotPattern[2]) {
            // Vibrate for left column
            const leftDuration = this.baseDuration * 2;
            pattern.push(leftDuration);
            pattern.push(this.gapDuration * 2);
        }
        
        // Right column (dots 4, 5, 6)
        if (dotPattern[3] || dotPattern[4] || dotPattern[5]) {
            // Vibrate for right column
            const rightDuration = this.baseDuration * 2;
            pattern.push(rightDuration);
            pattern.push(this.gapDuration * 2);
        }
        
        // Individual dots with short pulses
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                pattern.push(this.baseDuration);
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
    
    /**
     * Generate frequency-based vibration pattern for a contraction
     * @param {string} contraction - The contraction text
     * @returns {Array} - Vibration pattern for the contraction
     */
    getContractionFrequencyPattern(contraction) {
        // Get the contraction pattern from the brailleContractions module
        const dotPattern = window.brailleContractions ? 
                          window.brailleContractions.getContractionPattern(contraction) : null;
        
        if (!dotPattern) return null;
        
        const pattern = [];
        
        // Special frequency pattern to indicate this is a contraction
        // Increasing intensity vibrations
        pattern.push(this.baseDuration * 0.5);
        pattern.push(this.gapDuration);
        pattern.push(this.baseDuration * 1.0);
        pattern.push(this.gapDuration);
        pattern.push(this.baseDuration * 1.5);
        pattern.push(this.gapDuration * 2);
        
        // For each dot in the pattern
        for (let i = 0; i < dotPattern.length; i++) {
            if (dotPattern[i] === 1) {
                // Calculate intensity based on position
                // Top dots are stronger, bottom dots are weaker
                const positionIntensity = 1 - (this.dotPositions[i][1] / 2); // 1.0, 0.5, or 0.0
                const duration = this.baseDuration * (1 + positionIntensity);
                
                pattern.push(Math.round(duration));
            } else {
                pattern.push(0);
            }
            
            // Add gap between dots
            if (i < dotPattern.length - 1) {
                pattern.push(this.gapDuration);
            }
        }
        
        return pattern;
    }
}

// Initialize haptic feedback if window is loaded
if (typeof window !== 'undefined') {
    window.hapticFeedback = new HapticFeedback();
}
