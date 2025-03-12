/**
 * BrailleBuddy Compression Demo
 * 
 * This module demonstrates how Braille can be viewed as a compression system for language,
 * showcasing different levels of compression and haptic feedback patterns.
 */

class BrailleCompressionDemo {
    constructor() {
        this.hapticEngine = window.hapticEngine || new HapticEngine();
        this.languageManager = window.brailleLanguageManager || new BrailleLanguageManager();
        this.demoContainer = null;
        this.currentText = '';
        this.compressionLevels = ['text', 'grade1', 'grade2', 'aiOptimized'];
        this.compressionRatios = {
            text: 1.0,
            grade1: 0.5,
            grade2: 0.3,
            aiOptimized: 0.2
        };
        
        // Initialize when the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * Initialize the demo
     */
    initialize() {
        this.createDemoUI();
        this.bindEvents();
    }
    
    /**
     * Create the demo UI
     */
    createDemoUI() {
        // Create container if it doesn't exist
        if (!document.getElementById('braille-compression-demo')) {
            this.demoContainer = document.createElement('div');
            this.demoContainer.id = 'braille-compression-demo';
            this.demoContainer.className = 'demo-container';
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = 'Braille as a Compression System';
            this.demoContainer.appendChild(title);
            
            // Add description
            const description = document.createElement('p');
            description.innerHTML = 'This demo shows how Braille can be viewed as a compression system for language. ' +
                'Try entering text below and see how it gets compressed in different Braille formats. ' +
                'Click on any format to feel the haptic pattern.';
            this.demoContainer.appendChild(description);
            
            // Add input field
            const inputContainer = document.createElement('div');
            inputContainer.className = 'input-container';
            
            const inputLabel = document.createElement('label');
            inputLabel.textContent = 'Enter text:';
            inputLabel.setAttribute('for', 'compression-text-input');
            
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.id = 'compression-text-input';
            inputField.placeholder = 'Type a word or phrase...';
            
            inputContainer.appendChild(inputLabel);
            inputContainer.appendChild(inputField);
            this.demoContainer.appendChild(inputContainer);
            
            // Add compression visualization
            const visualizationContainer = document.createElement('div');
            visualizationContainer.className = 'visualization-container';
            
            // Create visualization for each compression level
            this.compressionLevels.forEach(level => {
                const levelContainer = document.createElement('div');
                levelContainer.className = 'compression-level';
                levelContainer.dataset.level = level;
                
                const levelTitle = document.createElement('h3');
                levelTitle.textContent = this.getLevelTitle(level);
                
                const levelDescription = document.createElement('p');
                levelDescription.textContent = this.getLevelDescription(level);
                
                const visualizationBox = document.createElement('div');
                visualizationBox.className = 'visualization-box';
                visualizationBox.dataset.level = level;
                
                const compressionRatio = document.createElement('div');
                compressionRatio.className = 'compression-ratio';
                compressionRatio.textContent = `Compression: ${Math.round((1 - this.compressionRatios[level]) * 100)}%`;
                
                levelContainer.appendChild(levelTitle);
                levelContainer.appendChild(levelDescription);
                levelContainer.appendChild(visualizationBox);
                levelContainer.appendChild(compressionRatio);
                
                visualizationContainer.appendChild(levelContainer);
            });
            
            this.demoContainer.appendChild(visualizationContainer);
            
            // Add haptic feedback controls
            const hapticContainer = document.createElement('div');
            hapticContainer.className = 'haptic-container';
            
            const hapticTitle = document.createElement('h3');
            hapticTitle.textContent = 'Haptic Feedback Patterns';
            
            const hapticDescription = document.createElement('p');
            hapticDescription.textContent = 'Click the buttons below to feel different haptic patterns:';
            
            const hapticButtons = document.createElement('div');
            hapticButtons.className = 'haptic-buttons';
            
            // Create buttons for different haptic patterns
            const patterns = [
                { name: 'Character', type: 'character', value: 'a' },
                { name: 'Word', type: 'word', value: 'the' },
                { name: 'Contraction', type: 'contraction', value: 'ing' },
                { name: 'Heartbeat', type: 'biological', value: 'heartbeat' },
                { name: 'Breathing', type: 'biological', value: 'breathing' },
                { name: 'Grade 1', type: 'compression', value: 'grade1' },
                { name: 'Grade 2', type: 'compression', value: 'grade2' },
                { name: 'AI Optimized', type: 'compression', value: 'aiOptimized' }
            ];
            
            patterns.forEach(pattern => {
                const button = document.createElement('button');
                button.textContent = pattern.name;
                button.className = 'haptic-button';
                button.dataset.type = pattern.type;
                button.dataset.value = pattern.value;
                
                hapticButtons.appendChild(button);
            });
            
            hapticContainer.appendChild(hapticTitle);
            hapticContainer.appendChild(hapticDescription);
            hapticContainer.appendChild(hapticButtons);
            
            this.demoContainer.appendChild(hapticContainer);
            
            // Add the demo container to the page
            document.body.appendChild(this.demoContainer);
            
            // Add styles
            this.addStyles();
        }
    }
    
    /**
     * Add styles for the demo
     */
    addStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .demo-container {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .input-container {
                margin: 20px 0;
            }
            
            .input-container label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .input-container input {
                width: 100%;
                padding: 10px;
                font-size: 16px;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            
            .visualization-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin: 30px 0;
            }
            
            .compression-level {
                flex: 1 1 calc(50% - 20px);
                min-width: 300px;
                background-color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .compression-level:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .compression-level h3 {
                margin-top: 0;
                color: #2c3e50;
            }
            
            .visualization-box {
                height: 100px;
                border: 1px solid #ddd;
                border-radius: 5px;
                margin: 10px 0;
                padding: 10px;
                overflow: auto;
                font-family: monospace;
                white-space: pre-wrap;
                background-color: #f9f9f9;
            }
            
            .compression-ratio {
                font-weight: bold;
                color: #3498db;
            }
            
            .haptic-container {
                margin-top: 30px;
                padding: 15px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
            }
            
            .haptic-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 15px;
            }
            
            .haptic-button {
                padding: 10px 15px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .haptic-button:hover {
                background-color: #2980b9;
            }
            
            .haptic-button:active {
                background-color: #1c6ea4;
            }
            
            @media (max-width: 600px) {
                .compression-level {
                    flex: 1 1 100%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Bind events for the demo
     */
    bindEvents() {
        // Input field event
        const inputField = document.getElementById('compression-text-input');
        if (inputField) {
            inputField.addEventListener('input', (e) => {
                this.currentText = e.target.value;
                this.updateVisualizations();
            });
        }
        
        // Compression level click events
        const compressionLevels = document.querySelectorAll('.compression-level');
        compressionLevels.forEach(level => {
            level.addEventListener('click', () => {
                const levelType = level.dataset.level;
                this.playHapticFeedbackForLevel(levelType);
            });
        });
        
        // Haptic button click events
        const hapticButtons = document.querySelectorAll('.haptic-button');
        hapticButtons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const value = button.dataset.value;
                this.playHapticPattern(type, value);
            });
        });
    }
    
    /**
     * Update the visualizations based on the current text
     */
    updateVisualizations() {
        if (!this.currentText) {
            // Clear visualizations if no text
            document.querySelectorAll('.visualization-box').forEach(box => {
                box.textContent = '';
            });
            return;
        }
        
        // Update each visualization box
        this.compressionLevels.forEach(level => {
            const box = document.querySelector(`.visualization-box[data-level="${level}"]`);
            if (box) {
                box.textContent = this.getVisualRepresentation(level);
            }
        });
    }
    
    /**
     * Get the visual representation for a compression level
     * @param {string} level - Compression level
     * @returns {string} - Visual representation
     */
    getVisualRepresentation(level) {
        switch (level) {
            case 'text':
                return this.currentText;
                
            case 'grade1':
                return this.convertToGrade1Representation();
                
            case 'grade2':
                return this.convertToGrade2Representation();
                
            case 'aiOptimized':
                return this.convertToAIOptimizedRepresentation();
                
            default:
                return this.currentText;
        }
    }
    
    /**
     * Convert text to Grade 1 Braille representation
     * @returns {string} - Grade 1 representation
     */
    convertToGrade1Representation() {
        // Simple representation of Grade 1 Braille (character by character)
        let result = '';
        
        for (let i = 0; i < this.currentText.length; i++) {
            const char = this.currentText[i].toLowerCase();
            if (/[a-z]/.test(char)) {
                result += '⠃'; // Simplified representation
            } else if (/[0-9]/.test(char)) {
                result += '⠼';
            } else if (char === ' ') {
                result += ' ';
            } else {
                result += '⠿';
            }
        }
        
        return result;
    }
    
    /**
     * Convert text to Grade 2 Braille representation (with contractions)
     * @returns {string} - Grade 2 representation
     */
    convertToGrade2Representation() {
        // Simplified representation of Grade 2 Braille (with contractions)
        let text = this.currentText.toLowerCase();
        
        // Replace common contractions
        const contractions = {
            'the': '⠮',
            'and': '⠯',
            'for': '⠿',
            'of': '⠷',
            'with': '⠾',
            'ing': '⠬',
            'ed': '⠫',
            'er': '⠻',
            'ou': '⠪',
            'ow': '⠪',
            'th': '⠹',
            'ch': '⠡',
            'sh': '⠩',
            'wh': '⠱'
        };
        
        // Replace contractions
        for (const [contraction, symbol] of Object.entries(contractions)) {
            text = text.replace(new RegExp(contraction, 'g'), symbol);
        }
        
        // Handle remaining characters
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (/[a-z]/.test(char)) {
                result += '⠃';
            } else if (/[0-9]/.test(char)) {
                result += '⠼';
            } else if (char === ' ') {
                result += ' ';
            } else if (/[⠮⠯⠿⠷⠾⠬⠫⠻⠪⠹⠡⠩⠱]/.test(char)) {
                result += char; // Keep contraction symbols
            } else {
                result += '⠿';
            }
        }
        
        return result;
    }
    
    /**
     * Convert text to AI-optimized Braille representation
     * @returns {string} - AI-optimized representation
     */
    convertToAIOptimizedRepresentation() {
        // Simplified representation of AI-optimized Braille
        // In a real implementation, this would use an AI model to optimize contractions
        let text = this.currentText.toLowerCase();
        
        // Extended contractions (more aggressive than Grade 2)
        const aiContractions = {
            'the': '⠮',
            'and': '⠯',
            'for': '⠿',
            'of': '⠷',
            'with': '⠾',
            'ing': '⠬',
            'ed': '⠫',
            'er': '⠻',
            'ou': '⠪',
            'ow': '⠪',
            'th': '⠹',
            'ch': '⠡',
            'sh': '⠩',
            'wh': '⠱',
            'because': '⠆',
            'through': '⠟',
            'people': '⠏',
            'should': '⠎',
            'would': '⠺',
            'could': '⠉',
            'about': '⠁',
            'before': '⠃',
            'between': '⠃⠞',
            'from': '⠋',
            'have': '⠓',
            'more': '⠍',
            'their': '⠞',
            'there': '⠞⠗',
            'under': '⠥',
            'where': '⠺⠗',
            'which': '⠺⠉'
        };
        
        // Replace AI-optimized contractions
        for (const [contraction, symbol] of Object.entries(aiContractions)) {
            text = text.replace(new RegExp(contraction, 'g'), symbol);
        }
        
        // Handle remaining characters (even more compressed)
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (/[a-z]/.test(char)) {
                result += '⠃';
            } else if (/[0-9]/.test(char)) {
                result += '⠼';
            } else if (char === ' ') {
                result += ' ';
            } else if (/[⠮⠯⠿⠷⠾⠬⠫⠻⠪⠹⠡⠩⠱⠆⠟⠏⠎⠺⠉⠁⠃⠋⠓⠍⠞⠥⠗]/.test(char)) {
                result += char; // Keep contraction symbols
            } else {
                result += '⠿';
            }
        }
        
        return result;
    }
    
    /**
     * Get the title for a compression level
     * @param {string} level - Compression level
     * @returns {string} - Level title
     */
    getLevelTitle(level) {
        switch (level) {
            case 'text':
                return 'Plain Text';
            case 'grade1':
                return 'Grade 1 Braille';
            case 'grade2':
                return 'Grade 2 Braille';
            case 'aiOptimized':
                return 'AI-Optimized Braille';
            default:
                return level;
        }
    }
    
    /**
     * Get the description for a compression level
     * @param {string} level - Compression level
     * @returns {string} - Level description
     */
    getLevelDescription(level) {
        switch (level) {
            case 'text':
                return 'Regular text with no compression.';
            case 'grade1':
                return 'Character-by-character mapping (basic compression).';
            case 'grade2':
                return 'Uses contractions for common words and letter combinations.';
            case 'aiOptimized':
                return 'AI-optimized contractions for maximum compression.';
            default:
                return '';
        }
    }
    
    /**
     * Play haptic feedback for a compression level
     * @param {string} level - Compression level
     */
    playHapticFeedbackForLevel(level) {
        if (!this.currentText) {
            return;
        }
        
        switch (level) {
            case 'text':
                this.hapticEngine.playTextPattern(this.currentText, 'en', false);
                break;
                
            case 'grade1':
                this.hapticEngine.playCompressionPattern(this.currentText, 'grade1');
                break;
                
            case 'grade2':
                this.hapticEngine.playCompressionPattern(this.currentText, 'grade2');
                break;
                
            case 'aiOptimized':
                this.hapticEngine.playCompressionPattern(this.currentText, 'aiOptimized');
                break;
        }
    }
    
    /**
     * Play a haptic pattern
     * @param {string} type - Pattern type
     * @param {string} value - Pattern value
     */
    playHapticPattern(type, value) {
        switch (type) {
            case 'character':
                this.hapticEngine.playCharacterByCharacter(value);
                break;
                
            case 'word':
                this.hapticEngine.playWord(value);
                break;
                
            case 'contraction':
                this.hapticEngine.playContraction(value);
                break;
                
            case 'biological':
                this.hapticEngine.playBiologicalRhythm(value);
                break;
                
            case 'compression':
                this.hapticEngine.playCompressionPattern('the quick brown fox', value);
                break;
        }
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.brailleCompressionDemo = new BrailleCompressionDemo();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleCompressionDemo;
}
