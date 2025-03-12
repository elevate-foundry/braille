/**
 * BrailleBuddy Language Manager
 * 
 * This module manages different braille standards and languages,
 * allowing for multilingual support and universal braille.
 * It dynamically loads language data from JSON files.
 */

class BrailleLanguageManager {
    constructor() {
        this.languages = {};
        this.currentLanguage = 'en';
        this.currentCode = 'ueb';
        this.loadedLanguages = new Set();
        
        // Load English by default
        this.loadLanguage('en').then(() => {
            console.log('English language loaded by default');
            // Load user preference if available
            this.loadUserPreference();
        }).catch(error => {
            console.error('Failed to load default language:', error);
        });
    }
    
    /**
     * Load a language from its JSON file
     * @param {string} languageCode - Language code to load
     * @returns {Promise} - Promise that resolves when the language is loaded
     */
    async loadLanguage(languageCode) {
        if (this.loadedLanguages.has(languageCode)) {
            console.log(`Language ${languageCode} already loaded`);
            return Promise.resolve();
        }
        
        try {
            const response = await fetch(`/src/languages/${languageCode}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language ${languageCode}: ${response.statusText}`);
            }
            
            const languageData = await response.json();
            this.languages[languageCode] = {
                name: languageData.name,
                brailleCodes: languageData.brailleCodes
            };
            
            this.loadedLanguages.add(languageCode);
            console.log(`Language ${languageCode} loaded successfully`);
            
            // Dispatch event to notify that a new language was loaded
            this.triggerLanguageLoadedEvent(languageCode);
            
            return Promise.resolve();
        } catch (error) {
            console.error(`Error loading language ${languageCode}:`, error);
            return Promise.reject(error);
        }
    }
    
    /**
     * Get list of available language codes
     * @returns {Array} - Array of language codes
     */
    getAvailableLanguages() {
        return [
            'en', // English
            'es', // Spanish
            'fr', // French
            'ru', // Russian (Cyrillic)
            'ja', // Japanese
            'ar', // Arabic
            'zh', // Chinese
            'ko'  // Korean
        ];
    }
    
    /**
     * Get names of all supported languages
     * @returns {Object} - Object with language codes as keys and names as values
     */
    getSupportedLanguages() {
        const result = {};
        
        for (const code in this.languages) {
            result[code] = this.languages[code].name;
        }
        
        return result;
    }
    
    /**
     * Get names of all supported braille codes for a language
     * @param {string} languageCode - Language code
     * @returns {Object} - Object with braille code names
     */
    getSupportedBrailleCodes(languageCode) {
        if (!this.languages[languageCode]) {
            console.error(`Language ${languageCode} not supported or not loaded`);
            return {};
        }
        
        const result = {};
        const brailleCodes = this.languages[languageCode].brailleCodes;
        
        for (const code in brailleCodes) {
            result[code] = brailleCodes[code].name;
        }
        
        return result;
    }
    
    /**
     * Set the current language and braille code
     * @param {string} languageCode - Language code to set
     * @param {string} brailleCode - Braille code to set
     * @returns {Promise} - Promise that resolves when the language is set
     */
    async setLanguage(languageCode, brailleCode) {
        // Load the language if it's not already loaded
        if (!this.loadedLanguages.has(languageCode)) {
            try {
                await this.loadLanguage(languageCode);
            } catch (error) {
                console.error(`Failed to load language ${languageCode}:`, error);
                return Promise.reject(error);
            }
        }
        
        if (!this.languages[languageCode]) {
            console.error(`Language ${languageCode} not supported`);
            return Promise.reject(new Error(`Language ${languageCode} not supported`));
        }
        
        if (!this.languages[languageCode].brailleCodes[brailleCode]) {
            console.error(`Braille code ${brailleCode} not supported for language ${languageCode}`);
            return Promise.reject(new Error(`Braille code ${brailleCode} not supported for language ${languageCode}`));
        }
        
        this.currentLanguage = languageCode;
        this.currentCode = brailleCode;
        
        // Save user preference
        this.saveUserPreference();
        
        // Trigger event for language change
        this.triggerLanguageChangeEvent();
        
        return Promise.resolve();
    }
    
    /**
     * Get the current language code
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Get the current braille code
     * @returns {string} - Current braille code
     */
    getCurrentBrailleCode() {
        return this.currentCode;
    }
    
    /**
     * Get the current alphabet for the selected language and braille code
     * @returns {Object} - Current alphabet
     */
    getCurrentAlphabet() {
        if (!this.languages[this.currentLanguage] || 
            !this.languages[this.currentLanguage].brailleCodes[this.currentCode]) {
            console.error('Current language or braille code not available');
            return {};
        }
        
        return this.languages[this.currentLanguage].brailleCodes[this.currentCode].alphabet;
    }
    
    /**
     * Get the current numbers for the selected language and braille code
     * @returns {Object} - Current numbers
     */
    getCurrentNumbers() {
        if (!this.languages[this.currentLanguage] || 
            !this.languages[this.currentLanguage].brailleCodes[this.currentCode]) {
            console.error('Current language or braille code not available');
            return {};
        }
        
        return this.languages[this.currentLanguage].brailleCodes[this.currentCode].numbers;
    }
    
    /**
     * Get the current punctuation for the selected language and braille code
     * @returns {Object} - Current punctuation
     */
    getCurrentPunctuation() {
        if (!this.languages[this.currentLanguage] || 
            !this.languages[this.currentLanguage].brailleCodes[this.currentCode]) {
            console.error('Current language or braille code not available');
            return {};
        }
        
        return this.languages[this.currentLanguage].brailleCodes[this.currentCode].punctuation;
    }
    
    /**
     * Save the current language preference to localStorage
     */
    saveUserPreference() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('brailleBuddy_language', this.currentLanguage);
            localStorage.setItem('brailleBuddy_brailleCode', this.currentCode);
            console.log('User language preference saved');
        }
    }
    
    /**
     * Load the user's language preference from localStorage
     */
    loadUserPreference() {
        if (typeof localStorage !== 'undefined') {
            const savedLanguage = localStorage.getItem('brailleBuddy_language');
            const savedBrailleCode = localStorage.getItem('brailleBuddy_brailleCode');
            
            if (savedLanguage && savedBrailleCode) {
                this.loadLanguage(savedLanguage).then(() => {
                    this.setLanguage(savedLanguage, savedBrailleCode).then(() => {
                        console.log('User language preference loaded');
                    }).catch(error => {
                        console.error('Failed to set saved language:', error);
                    });
                }).catch(error => {
                    console.error('Failed to load saved language:', error);
                });
            }
        }
    }
    
    /**
     * Trigger a language change event
     */
    triggerLanguageChangeEvent() {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('brailleLanguageChanged', {
                detail: {
                    language: this.currentLanguage,
                    brailleCode: this.currentCode
                }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Trigger a language loaded event
     * @param {string} languageCode - The language code that was loaded
     */
    triggerLanguageLoadedEvent(languageCode) {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('brailleLanguageLoaded', {
                detail: {
                    language: languageCode
                }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Convert text to braille patterns based on current language
     * @param {string} text - Text to convert to braille
     * @returns {Array} - Array of braille patterns
     */
    async convertTextToBraille(text) {
        const currentAlphabet = this.getCurrentAlphabet();
        const patterns = [];
        
        // Handle different languages differently
        switch(this.currentLanguage) {
            case 'zh': // Chinese needs special handling for pinyin
                // In a real implementation, we would use a pinyin converter
                // For now, we'll just handle basic characters as a placeholder
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    // In a real implementation, we would convert to pinyin with tone
                    // and look up the corresponding pattern
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
                break;
                
            case 'ko': // Korean needs special handling for Hangul decomposition
                // In a real implementation, we would decompose Hangul into Jamo
                // For now, we'll just handle basic characters as a placeholder
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    // In a real implementation, we would decompose Hangul into Jamo
                    // and combine the corresponding patterns
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
                break;
                
            default: // Default character-by-character conversion
                for (let i = 0; i < text.length; i++) {
                    const char = text[i].toLowerCase();
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
        }
        
        return patterns;
    }
    
    /**
     * Preload all available languages
     * @returns {Promise} - Promise that resolves when all languages are loaded
     */
    preloadAllLanguages() {
        const languages = this.getAvailableLanguages();
        const promises = languages.map(lang => this.loadLanguage(lang));
        
        return Promise.all(promises);
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.brailleLanguageManager = new BrailleLanguageManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleLanguageManager;
}
