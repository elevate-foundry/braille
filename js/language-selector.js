/**
 * BrailleBuddy Language Selector
 * 
 * This module provides UI components for selecting languages and braille codes.
 */

class LanguageSelector {
    constructor() {
        this.initialized = false;
        this.container = null;
    }
    
    /**
     * Initialize the language selector
     * @param {string} containerId - ID of the container element
     */
    initialize(containerId = 'language-selector-container') {
        if (this.initialized) return;
        
        // Check if brailleLanguageManager exists
        if (!window.brailleLanguageManager) {
            console.error('BrailleLanguageManager not found. Language selector requires it.');
            return;
        }
        
        // Find or create container
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }
        
        // Create UI
        this.createUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        
        // Update UI based on current language
        this.updateUI();
    }
    
    /**
     * Create the language selector UI
     */
    createUI() {
        // Get supported languages
        const languages = window.brailleLanguageManager.getSupportedLanguages();
        const currentLanguage = window.brailleLanguageManager.getCurrentLanguage();
        const currentCode = window.brailleLanguageManager.getCurrentBrailleCode();
        
        // Create language selector
        const html = `
            <div class="language-selector">
                <h3>Language & Braille Code</h3>
                <div class="language-selector-controls">
                    <div class="selector-group">
                        <label for="language-select">Language:</label>
                        <select id="language-select">
                            ${Object.entries(languages).map(([code, name]) => `
                                <option value="${code}" ${code === currentLanguage ? 'selected' : ''}>
                                    ${name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="selector-group">
                        <label for="braille-code-select">Braille Code:</label>
                        <select id="braille-code-select">
                            ${this.getBrailleCodeOptions(currentLanguage, currentCode)}
                        </select>
                    </div>
                </div>
                
                <div class="language-info">
                    <p class="info-text">
                        Learning braille in <span id="current-language-name">${languages[currentLanguage]}</span> 
                        using <span id="current-code-name">${this.getCurrentCodeName(currentLanguage, currentCode)}</span>.
                    </p>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Add styles
        this.addStyles();
    }
    
    /**
     * Get HTML options for braille code select
     * @param {string} languageCode - Language code
     * @param {string} currentCode - Current braille code
     * @returns {string} - HTML options
     */
    getBrailleCodeOptions(languageCode, currentCode) {
        const brailleCodes = window.brailleLanguageManager.getSupportedBrailleCodes(languageCode);
        
        return Object.entries(brailleCodes).map(([code, name]) => `
            <option value="${code}" ${code === currentCode ? 'selected' : ''}>
                ${name}
            </option>
        `).join('');
    }
    
    /**
     * Get the name of the current braille code
     * @param {string} languageCode - Language code
     * @param {string} brailleCode - Braille code
     * @returns {string} - Name of the braille code
     */
    getCurrentCodeName(languageCode, brailleCode) {
        const brailleCodes = window.brailleLanguageManager.getSupportedBrailleCodes(languageCode);
        return brailleCodes[brailleCode] || 'Unknown';
    }
    
    /**
     * Set up event listeners for language and code selection
     */
    setupEventListeners() {
        // Language select change
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', () => {
                const languageCode = languageSelect.value;
                const brailleCodes = window.brailleLanguageManager.getSupportedBrailleCodes(languageCode);
                const firstCode = Object.keys(brailleCodes)[0];
                
                // Set the language and first available code
                window.brailleLanguageManager.setLanguage(languageCode, firstCode);
                
                // Update the UI
                this.updateUI();
            });
        }
        
        // Braille code select change
        const brailleCodeSelect = document.getElementById('braille-code-select');
        if (brailleCodeSelect) {
            brailleCodeSelect.addEventListener('change', () => {
                const languageCode = window.brailleLanguageManager.getCurrentLanguage();
                const brailleCode = brailleCodeSelect.value;
                
                // Set the language and code
                window.brailleLanguageManager.setLanguage(languageCode, brailleCode);
                
                // Update info text
                this.updateInfoText();
            });
        }
        
        // Listen for language change events from other sources
        window.addEventListener('brailleLanguageChanged', () => {
            this.updateUI();
        });
    }
    
    /**
     * Update the UI based on current language and code
     */
    updateUI() {
        const currentLanguage = window.brailleLanguageManager.getCurrentLanguage();
        const currentCode = window.brailleLanguageManager.getCurrentBrailleCode();
        
        // Update language select
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = currentLanguage;
        }
        
        // Update braille code options
        const brailleCodeSelect = document.getElementById('braille-code-select');
        if (brailleCodeSelect) {
            brailleCodeSelect.innerHTML = this.getBrailleCodeOptions(currentLanguage, currentCode);
        }
        
        // Update info text
        this.updateInfoText();
    }
    
    /**
     * Update the info text about current language and code
     */
    updateInfoText() {
        const currentLanguage = window.brailleLanguageManager.getCurrentLanguage();
        const currentCode = window.brailleLanguageManager.getCurrentBrailleCode();
        const languages = window.brailleLanguageManager.getSupportedLanguages();
        
        const languageNameElement = document.getElementById('current-language-name');
        const codeNameElement = document.getElementById('current-code-name');
        
        if (languageNameElement) {
            languageNameElement.textContent = languages[currentLanguage];
        }
        
        if (codeNameElement) {
            codeNameElement.textContent = this.getCurrentCodeName(currentLanguage, currentCode);
        }
    }
    
    /**
     * Add styles for the language selector
     */
    addStyles() {
        const styleId = 'language-selector-styles';
        
        // Check if styles already exist
        if (document.getElementById(styleId)) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .language-selector {
                background-color: #f5f5f5;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .language-selector h3 {
                margin-top: 0;
                color: #2c3e50;
                font-size: 1.2rem;
            }
            
            .language-selector-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .selector-group {
                display: flex;
                flex-direction: column;
                min-width: 150px;
            }
            
            .selector-group label {
                margin-bottom: 5px;
                font-weight: bold;
                color: #555;
            }
            
            .selector-group select {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: white;
                font-size: 1rem;
                cursor: pointer;
            }
            
            .language-info {
                background-color: #e8f4f8;
                padding: 10px;
                border-radius: 4px;
                border-left: 4px solid #3498db;
            }
            
            .info-text {
                margin: 0;
                color: #2c3e50;
            }
            
            .info-text span {
                font-weight: bold;
                color: #3498db;
            }
            
            @media (max-width: 600px) {
                .language-selector-controls {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.languageSelector = new LanguageSelector();
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (window.languageSelector) {
            window.languageSelector.initialize();
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageSelector;
}
