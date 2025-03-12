/**
 * BrailleBuddy Auto Translation Module
 * 
 * This module handles automatic translation between text and braille,
 * supporting multiple languages and braille standards.
 */

class AutoTranslation {
    constructor(brailleLanguageManager) {
        this.brailleLanguageManager = brailleLanguageManager || window.brailleLanguageManager;
        this.aiEndpoint = 'https://api.braillebuddy.com/translate'; // Future AI-powered endpoint
        this.useAI = false; // Toggle for AI-powered translation
    }
    
    /**
     * Convert text to braille patterns
     * @param {string} text - Text to convert to braille
     * @param {string} languageCode - Language code (defaults to current language)
     * @param {string} brailleCode - Braille code (defaults to current code)
     * @returns {Promise<Array>} - Promise resolving to array of braille patterns
     */
    async textToBraille(text, languageCode, brailleCode) {
        // Use provided language/braille code or fall back to current settings
        const lang = languageCode || this.brailleLanguageManager.getCurrentLanguage();
        const code = brailleCode || this.brailleLanguageManager.getCurrentBrailleCode();
        
        // If AI translation is enabled and we're online, use the AI endpoint
        if (this.useAI && navigator.onLine) {
            try {
                return await this.aiTextToBraille(text, lang, code);
            } catch (error) {
                console.error('AI translation failed, falling back to local translation:', error);
                // Fall back to local translation if AI fails
            }
        }
        
        // Local translation using the language manager
        // Make sure the language is loaded
        if (!this.brailleLanguageManager.loadedLanguages.has(lang)) {
            await this.brailleLanguageManager.loadLanguage(lang);
        }
        
        // Set the language and braille code
        if (lang !== this.brailleLanguageManager.getCurrentLanguage() || 
            code !== this.brailleLanguageManager.getCurrentBrailleCode()) {
            await this.brailleLanguageManager.setLanguage(lang, code);
        }
        
        // Convert the text to braille
        return this.brailleLanguageManager.convertTextToBraille(text);
    }
    
    /**
     * Convert braille patterns to text
     * @param {Array} braillePatterns - Array of braille patterns to convert
     * @param {string} languageCode - Language code (defaults to current language)
     * @param {string} brailleCode - Braille code (defaults to current code)
     * @returns {Promise<string>} - Promise resolving to text
     */
    async brailleToText(braillePatterns, languageCode, brailleCode) {
        // Use provided language/braille code or fall back to current settings
        const lang = languageCode || this.brailleLanguageManager.getCurrentLanguage();
        const code = brailleCode || this.brailleLanguageManager.getCurrentBrailleCode();
        
        // If AI translation is enabled and we're online, use the AI endpoint
        if (this.useAI && navigator.onLine) {
            try {
                return await this.aiBrailleToText(braillePatterns, lang, code);
            } catch (error) {
                console.error('AI translation failed, falling back to local translation:', error);
                // Fall back to local translation if AI fails
            }
        }
        
        // Local translation using the language manager
        // Make sure the language is loaded
        if (!this.brailleLanguageManager.loadedLanguages.has(lang)) {
            await this.brailleLanguageManager.loadLanguage(lang);
        }
        
        // Set the language and braille code
        if (lang !== this.brailleLanguageManager.getCurrentLanguage() || 
            code !== this.brailleLanguageManager.getCurrentBrailleCode()) {
            await this.brailleLanguageManager.setLanguage(lang, code);
        }
        
        // Convert the braille patterns to text
        return this.localBrailleToText(braillePatterns);
    }
    
    /**
     * Local implementation of braille-to-text conversion
     * @param {Array} braillePatterns - Array of braille patterns to convert
     * @returns {string} - Converted text
     */
    localBrailleToText(braillePatterns) {
        const alphabet = this.brailleLanguageManager.getCurrentAlphabet();
        const numbers = this.brailleLanguageManager.getCurrentNumbers();
        const punctuation = this.brailleLanguageManager.getCurrentPunctuation();
        
        // Combine all mappings
        const allMappings = { ...alphabet, ...numbers, ...punctuation };
        
        // Reverse the mappings (pattern -> character)
        const reverseMappings = {};
        for (const char in allMappings) {
            const pattern = allMappings[char];
            const patternKey = pattern.join(',');
            reverseMappings[patternKey] = char;
        }
        
        // Convert patterns to text
        let text = '';
        for (const pattern of braillePatterns) {
            const patternKey = pattern.join(',');
            if (reverseMappings[patternKey]) {
                text += reverseMappings[patternKey];
            } else {
                text += '?'; // Unknown pattern
            }
        }
        
        return text;
    }
    
    /**
     * AI-powered text-to-braille conversion
     * @param {string} text - Text to convert
     * @param {string} languageCode - Language code
     * @param {string} brailleCode - Braille code
     * @returns {Promise<Array>} - Promise resolving to array of braille patterns
     */
    async aiTextToBraille(text, languageCode, brailleCode) {
        try {
            const response = await fetch(this.aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    lang: languageCode,
                    brailleCode,
                    direction: 'text-to-braille'
                })
            });
            
            if (!response.ok) {
                throw new Error(`AI translation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.braillePatterns;
        } catch (error) {
            console.error('AI text-to-braille translation error:', error);
            throw error;
        }
    }
    
    /**
     * AI-powered braille-to-text conversion
     * @param {Array} braillePatterns - Braille patterns to convert
     * @param {string} languageCode - Language code
     * @param {string} brailleCode - Braille code
     * @returns {Promise<string>} - Promise resolving to text
     */
    async aiBrailleToText(braillePatterns, languageCode, brailleCode) {
        try {
            const response = await fetch(this.aiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    braillePatterns,
                    lang: languageCode,
                    brailleCode,
                    direction: 'braille-to-text'
                })
            });
            
            if (!response.ok) {
                throw new Error(`AI translation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('AI braille-to-text translation error:', error);
            throw error;
        }
    }
    
    /**
     * Enable or disable AI-powered translation
     * @param {boolean} enable - Whether to enable AI translation
     */
    setAITranslation(enable) {
        this.useAI = enable;
    }
    
    /**
     * Set the AI endpoint URL
     * @param {string} url - Endpoint URL
     */
    setAIEndpoint(url) {
        this.aiEndpoint = url;
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.autoTranslation = new AutoTranslation();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoTranslation;
}
