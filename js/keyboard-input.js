/**
 * BrailleBuddy Keyboard Input
 * 
 * This module enables users to input braille characters using the keyboard.
 * It maps the standard 6-key braille keyboard layout to regular keyboard keys.
 * 
 * Standard braille keyboard layout:
 * Dots 1-2-3 (left column, top to bottom)
 * Dots 4-5-6 (right column, top to bottom)
 * 
 * We map these to:
 * F-D-S (left column, top to bottom)
 * J-K-L (right column, top to bottom)
 */

class BrailleKeyboardInput {
    constructor() {
        // Mapping of keyboard keys to braille dots
        this.keyToDotMap = {
            'f': 1, // Dot 1 (top left)
            'd': 2, // Dot 2 (middle left)
            's': 3, // Dot 3 (bottom left)
            'j': 4, // Dot 4 (top right)
            'k': 5, // Dot 5 (middle right)
            'l': 6  // Dot 6 (bottom right)
        };
        
        // Current state of dots (1=pressed, 0=not pressed)
        this.currentDots = [0, 0, 0, 0, 0, 0];
        
        // Braille patterns for each letter
        this.braillePatterns = {
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
        
        // Event listeners
        this.keydownListener = null;
        this.keyupListener = null;
        
        // Callback for when a braille character is entered
        this.onBrailleInput = null;
        
        // Visual feedback elements
        this.dotElements = null;
    }
    
    // Initialize the keyboard input
    initialize(dotElements, onBrailleInput) {
        this.dotElements = dotElements;
        this.onBrailleInput = onBrailleInput;
        
        // Set up event listeners
        this.keydownListener = this.handleKeyDown.bind(this);
        this.keyupListener = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.keydownListener);
        document.addEventListener('keyup', this.keyupListener);
        
        // Add keyboard input instructions to the page
        this.addInstructions();
    }
    
    // Clean up event listeners
    destroy() {
        if (this.keydownListener) {
            document.removeEventListener('keydown', this.keydownListener);
        }
        if (this.keyupListener) {
            document.removeEventListener('keyup', this.keyupListener);
        }
    }
    
    // Handle key down events
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Check if this is a braille key
        if (key in this.keyToDotMap) {
            const dotIndex = this.keyToDotMap[key] - 1; // Convert to 0-based index
            
            // Only process if the dot isn't already pressed
            if (this.currentDots[dotIndex] === 0) {
                this.currentDots[dotIndex] = 1;
                
                // Update visual feedback
                if (this.dotElements && this.dotElements[dotIndex]) {
                    this.dotElements[dotIndex].classList.add('active');
                }
                
                // Prevent default behavior for these keys
                event.preventDefault();
            }
        }
        
        // Check for Enter key to submit the current pattern
        if (event.key === 'Enter') {
            this.submitCurrentPattern();
            event.preventDefault();
        }
        
        // Check for Escape key to clear the current pattern
        if (event.key === 'Escape') {
            this.clearCurrentPattern();
            event.preventDefault();
        }
    }
    
    // Handle key up events
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        // Check if this is a braille key
        if (key in this.keyToDotMap) {
            const dotIndex = this.keyToDotMap[key] - 1; // Convert to 0-based index
            
            // Only process if the dot is currently pressed
            if (this.currentDots[dotIndex] === 1) {
                // Don't clear the dot on key up - we want the pattern to stay
                // until Enter or Escape is pressed
                
                // Prevent default behavior for these keys
                event.preventDefault();
            }
        }
    }
    
    // Submit the current pattern and identify the letter
    submitCurrentPattern() {
        // Convert current dots to a letter
        const letter = this.identifyLetter(this.currentDots);
        
        // Call the callback with the identified letter
        if (this.onBrailleInput && letter) {
            this.onBrailleInput(letter, this.currentDots);
        }
        
        // Clear the pattern after submission
        this.clearCurrentPattern();
    }
    
    // Clear the current pattern
    clearCurrentPattern() {
        this.currentDots = [0, 0, 0, 0, 0, 0];
        
        // Update visual feedback
        if (this.dotElements) {
            for (let i = 0; i < this.dotElements.length; i++) {
                this.dotElements[i].classList.remove('active');
            }
        }
    }
    
    // Identify a letter from a dot pattern
    identifyLetter(dotPattern) {
        for (const letter in this.braillePatterns) {
            const pattern = this.braillePatterns[letter];
            
            // Check if patterns match
            let match = true;
            for (let i = 0; i < 6; i++) {
                if (pattern[i] !== dotPattern[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                return letter;
            }
        }
        
        // No match found
        return null;
    }
    
    // Add keyboard input instructions to the page
    addInstructions() {
        // Create instructions element
        const instructions = document.createElement('div');
        instructions.className = 'keyboard-instructions';
        instructions.innerHTML = `
            <h3>Keyboard Input Mode</h3>
            <p>Use your keyboard to input braille patterns:</p>
            <div class="key-mapping">
                <div class="key-row">
                    <div class="key">F</div>
                    <div class="key">J</div>
                </div>
                <div class="key-row">
                    <div class="key">D</div>
                    <div class="key">K</div>
                </div>
                <div class="key-row">
                    <div class="key">S</div>
                    <div class="key">L</div>
                </div>
            </div>
            <p>Press keys to activate dots, then press <strong>Enter</strong> to submit.</p>
            <p>Press <strong>Escape</strong> to clear the current pattern.</p>
        `;
        
        // Add styles for the instructions
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-instructions {
                background-color: #f0f0f0;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            
            .keyboard-instructions h3 {
                color: var(--primary-color);
                margin-bottom: 10px;
            }
            
            .key-mapping {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 15px 0;
            }
            
            .key-row {
                display: flex;
                margin-bottom: 10px;
            }
            
            .key {
                width: 40px;
                height: 40px;
                background-color: white;
                border: 2px solid var(--primary-color);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin: 0 10px;
            }
        `;
        
        // Add to document
        document.head.appendChild(style);
        
        // Find the practice area to add the instructions
        const practiceArea = document.querySelector('.practice-area');
        if (practiceArea) {
            practiceArea.appendChild(instructions);
            // Initially hide the instructions
            instructions.style.display = 'none';
            
            // Create a toggle button
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-keyboard-btn';
            toggleButton.textContent = 'Enable Keyboard Input';
            toggleButton.onclick = function() {
                const isVisible = instructions.style.display !== 'none';
                instructions.style.display = isVisible ? 'none' : 'block';
                toggleButton.textContent = isVisible ? 'Enable Keyboard Input' : 'Disable Keyboard Input';
                
                // Update user settings
                if (window.progressTracker) {
                    window.progressTracker.updateSettings({
                        useKeyboardInput: !isVisible
                    });
                }
            };
            
            // Add the toggle button
            practiceArea.insertBefore(toggleButton, practiceArea.firstChild);
            
            // Check user settings to see if keyboard input should be enabled
            if (window.progressTracker && 
                window.progressTracker.userData && 
                window.progressTracker.userData.settings.useKeyboardInput) {
                toggleButton.click();
            }
        }
    }
}

// Create global instance
const brailleKeyboard = new BrailleKeyboardInput();
