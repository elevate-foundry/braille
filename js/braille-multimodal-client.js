/**
 * Braille Multimodal Client
 * 
 * Connects BrailleBuddy to the Braille Multimodal API for:
 * - AI-powered braille tutoring
 * - Multimodal braille encoding (text, images, audio patterns)
 * - Semantic analysis of braille patterns
 * - Haptic pattern generation from braille
 */

class BrailleMultimodalClient {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:8000';
        this.timeout = options.timeout || 60000;
        this.onResponse = options.onResponse || null;
        this.onError = options.onError || null;
        this.hapticFeedback = options.hapticFeedback || null;
        
        // Braille letter mappings (matching the API)
        this.letterMap = {
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛',
            'h': '⠓', 'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝',
            'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥',
            'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵', ' ': '⠀'
        };
        this.reverseMap = Object.fromEntries(
            Object.entries(this.letterMap).map(([k, v]) => [v, k])
        );
    }

    /**
     * Check if the API is available
     */
    async isAvailable() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (e) {
            console.warn('Braille Multimodal API not available:', e.message);
            return false;
        }
    }

    /**
     * Encode text to braille
     * @param {string} text - Text to encode
     * @returns {Promise<{text: string, braille: string}>}
     */
    async encodeText(text) {
        try {
            const response = await fetch(`${this.apiUrl}/encode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                signal: AbortSignal.timeout(this.timeout)
            });
            return await response.json();
        } catch (e) {
            // Fallback to local encoding
            const braille = text.split('').map(c => 
                this.letterMap[c.toLowerCase()] || '⠿'
            ).join('');
            return { text, braille };
        }
    }

    /**
     * Decode braille to text
     * @param {string} braille - Braille to decode
     * @returns {Promise<{braille: string, text: string}>}
     */
    async decodeBraille(braille) {
        try {
            const response = await fetch(`${this.apiUrl}/decode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ braille }),
                signal: AbortSignal.timeout(this.timeout)
            });
            return await response.json();
        } catch (e) {
            // Fallback to local decoding
            const text = braille.split('').map(c => 
                this.reverseMap[c] || '?'
            ).join('');
            return { braille, text };
        }
    }

    /**
     * Generate a braille image pattern
     * @param {string} pattern - Pattern type (gradient, checkerboard, circle, wave, noise)
     * @param {number} size - Grid size
     * @returns {Promise<{pattern: string, braille: string}>}
     */
    async generateImage(pattern = 'gradient', size = 8) {
        try {
            const response = await fetch(`${this.apiUrl}/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pattern, size }),
                signal: AbortSignal.timeout(this.timeout)
            });
            return await response.json();
        } catch (e) {
            this._handleError(e);
            return { pattern, braille: '', error: e.message };
        }
    }

    /**
     * Chat with the braille AI
     * @param {string} message - User message
     * @returns {Promise<{message: string, response: string}>}
     */
    async chat(message) {
        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
                signal: AbortSignal.timeout(this.timeout)
            });
            const result = await response.json();
            if (this.onResponse) {
                this.onResponse(result);
            }
            return result;
        } catch (e) {
            this._handleError(e);
            return { message, response: 'Sorry, I could not process that request.', error: e.message };
        }
    }

    /**
     * Ask the AI for help with a braille learning question
     * @param {string} question - Learning question
     * @param {object} context - Additional context (current letter, difficulty, etc.)
     * @returns {Promise<string>} AI response
     */
    async askTutor(question, context = {}) {
        const contextStr = Object.entries(context)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        
        const prompt = contextStr 
            ? `[Context: ${contextStr}] ${question}`
            : question;
        
        const result = await this.chat(prompt);
        return result.response;
    }

    /**
     * Get a hint for a braille character
     * @param {string} letter - The letter to get a hint for
     * @returns {Promise<string>} Hint text
     */
    async getHint(letter) {
        const braille = this.letterMap[letter.toLowerCase()];
        if (!braille) return `I don't have information about "${letter}"`;
        
        const result = await this.chat(
            `Give a short, child-friendly hint to remember the braille pattern for the letter "${letter}" (${braille}). Include which dots are raised.`
        );
        return result.response;
    }

    /**
     * Generate adaptive feedback based on user performance
     * @param {object} performance - User performance data
     * @returns {Promise<string>} Encouragement or guidance
     */
    async getAdaptiveFeedback(performance) {
        const { correctCount, incorrectCount, currentLetter, difficulty } = performance;
        const accuracy = correctCount / (correctCount + incorrectCount) || 0;
        
        let prompt;
        if (accuracy > 0.8) {
            prompt = `The student got ${correctCount} correct and ${incorrectCount} wrong (${Math.round(accuracy * 100)}% accuracy). Give brief encouraging praise for learning braille.`;
        } else if (accuracy > 0.5) {
            prompt = `The student is learning the letter "${currentLetter}" and has ${Math.round(accuracy * 100)}% accuracy. Give a short, encouraging tip.`;
        } else {
            prompt = `The student is struggling with "${currentLetter}" (${Math.round(accuracy * 100)}% accuracy). Give a simple, encouraging hint about the braille pattern.`;
        }
        
        const result = await this.chat(prompt);
        return result.response;
    }

    /**
     * Convert braille pattern to haptic vibration sequence
     * @param {string} braille - Braille character or string
     * @returns {number[]} Vibration pattern array for Web Vibration API
     */
    brailleToHaptic(braille) {
        const patterns = [];
        const baseDuration = 100;
        const gap = 50;
        
        for (const char of braille) {
            const code = char.charCodeAt(0);
            if (code >= 0x2800 && code <= 0x28FF) {
                const dotPattern = code - 0x2800;
                
                // Convert 8-bit pattern to vibration sequence
                for (let bit = 0; bit < 8; bit++) {
                    if (dotPattern & (1 << bit)) {
                        patterns.push(baseDuration); // Vibrate
                    } else {
                        patterns.push(0); // No vibration (but still a slot)
                    }
                    patterns.push(gap); // Gap between dots
                }
                patterns.push(gap * 2); // Gap between characters
            }
        }
        
        return patterns.filter(p => p > 0); // Remove zero-duration entries
    }

    /**
     * Play haptic feedback for a braille pattern
     * @param {string} braille - Braille to play as haptic
     */
    playHaptic(braille) {
        if (!('vibrate' in navigator)) {
            console.warn('Vibration API not supported');
            return;
        }
        
        const pattern = this.brailleToHaptic(braille);
        navigator.vibrate(pattern);
    }

    /**
     * Generate a practice exercise
     * @param {string} difficulty - 'easy', 'medium', 'hard'
     * @param {string} type - 'letter', 'word', 'sentence'
     * @returns {Promise<{challenge: string, braille: string, hint: string}>}
     */
    async generateExercise(difficulty = 'easy', type = 'letter') {
        const prompts = {
            easy: {
                letter: 'Give me a single letter to practice in braille. Just respond with the letter.',
                word: 'Give me a simple 3-letter word to practice in braille. Just respond with the word.'
            },
            medium: {
                letter: 'Give me a letter that uses dots on both columns in braille. Just respond with the letter.',
                word: 'Give me a 5-letter word to practice in braille. Just respond with the word.'
            },
            hard: {
                word: 'Give me a challenging word with common contractions to practice. Just respond with the word.',
                sentence: 'Give me a short sentence to practice in braille. Just respond with the sentence.'
            }
        };
        
        const prompt = prompts[difficulty]?.[type] || prompts.easy.letter;
        const result = await this.chat(prompt);
        const challenge = result.response.trim().replace(/[^a-zA-Z\s]/g, '');
        const encoded = await this.encodeText(challenge);
        
        return {
            challenge,
            braille: encoded.braille,
            hint: `This ${type} has ${challenge.length} character(s)`
        };
    }

    _handleError(error) {
        console.error('BrailleMultimodalClient error:', error);
        if (this.onError) {
            this.onError(error);
        }
    }
}

// Export for use in BrailleBuddy
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleMultimodalClient;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BrailleMultimodalClient = BrailleMultimodalClient;
}
