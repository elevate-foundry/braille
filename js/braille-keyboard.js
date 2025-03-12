/**
 * BrailleBuddy Keyboard Input System
 * 
 * This module enables users to type braille using a standard keyboard.
 * It maps keys to braille dots as follows:
 * - F: Dot 1 (top left)
 * - D: Dot 2 (middle left)
 * - S: Dot 3 (bottom left)
 * - J: Dot 4 (top right)
 * - K: Dot 5 (middle right)
 * - L: Dot 6 (bottom right)
 * - Space: Confirm/submit the current braille cell
 * - Backspace: Clear the current braille cell
 * - Escape: Exit keyboard input mode
 */

class BrailleKeyboard {
    constructor() {
        // Map keys to dot positions (1-indexed as per braille convention)
        this.keyToDotMap = {
            'f': 1,
            'd': 2,
            's': 3,
            'j': 4,
            'k': 5,
            'l': 6
        };
        
        // Current braille cell state (array of 6 booleans)
        this.currentCell = [false, false, false, false, false, false];
        
        // DOM elements
        this.keyboardContainer = null;
        this.virtualBrailleCell = null;
        this.outputContainer = null;
        this.typedOutput = '';
        
        // Callback functions
        this.onCharacterTyped = null;
        this.onExit = null;
        
        // State
        this.isActive = false;
        this.isMobileKeyboardVisible = false;
    }
    
    /**
     * Initialize the braille keyboard
     * @param {Function} onCharacterTyped - Callback when a character is typed
     * @param {Function} onExit - Callback when keyboard input is exited
     */
    initialize(onCharacterTyped = null, onExit = null) {
        this.onCharacterTyped = onCharacterTyped;
        this.onExit = onExit;
        
        // Create keyboard UI
        this.createKeyboardUI();
        
        // Add keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        console.log('Braille keyboard initialized');
    }
    
    /**
     * Create the keyboard UI elements
     */
    createKeyboardUI() {
        // Create styles
        const style = document.createElement('style');
        style.textContent = `
            .braille-keyboard-container {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: rgba(255, 255, 255, 0.95);
                padding: 20px;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                flex-direction: column;
                align-items: center;
                border-top: 3px solid var(--primary-color);
            }
            
            .braille-keyboard-container.active {
                display: flex;
            }
            
            .braille-keyboard-title {
                font-size: 1.2rem;
                color: var(--primary-color);
                margin-bottom: 15px;
                text-align: center;
            }
            
            .braille-keyboard-instructions {
                font-size: 0.9rem;
                color: #666;
                margin-bottom: 20px;
                text-align: center;
                max-width: 600px;
            }
            
            .virtual-braille-cell {
                display: grid;
                grid-template-columns: repeat(2, 50px);
                grid-template-rows: repeat(3, 50px);
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .virtual-dot {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #666;
                transition: all 0.2s ease;
            }
            
            .virtual-dot.active {
                background-color: var(--accent-color);
                color: white;
                transform: scale(1.1);
            }
            
            .keyboard-key-row {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .keyboard-key {
                width: 60px;
                height: 60px;
                border-radius: 10px;
                background-color: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #333;
                border: 2px solid #ddd;
                user-select: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .keyboard-key:hover {
                background-color: #e0e0e0;
            }
            
            .keyboard-key.active {
                background-color: var(--accent-color);
                color: white;
                border-color: var(--accent-color);
                transform: scale(0.95);
            }
            
            .keyboard-key.space {
                width: 200px;
            }
            
            .keyboard-key.backspace, .keyboard-key.escape {
                background-color: #ffeeee;
                border-color: #ffcccc;
            }
            
            .keyboard-output {
                margin-top: 20px;
                padding: 15px;
                background-color: white;
                border: 2px solid #ddd;
                border-radius: 10px;
                min-height: 50px;
                width: 100%;
                max-width: 600px;
                text-align: center;
                font-size: 1.2rem;
            }
            
            .keyboard-output-label {
                font-size: 0.9rem;
                color: #666;
                margin-bottom: 5px;
            }
            
            .mobile-toggle {
                margin-top: 15px;
                padding: 10px 20px;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 5px;
                font-family: inherit;
                font-size: 1rem;
                cursor: pointer;
            }
            
            .mobile-keyboard {
                display: none;
                flex-direction: column;
                align-items: center;
                width: 100%;
                margin-top: 20px;
            }
            
            .mobile-keyboard.visible {
                display: flex;
            }
            
            @media (max-width: 768px) {
                .virtual-braille-cell {
                    grid-template-columns: repeat(2, 40px);
                    grid-template-rows: repeat(3, 40px);
                }
                
                .virtual-dot {
                    width: 40px;
                    height: 40px;
                }
                
                .keyboard-key {
                    width: 50px;
                    height: 50px;
                }
                
                .keyboard-key.space {
                    width: 150px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create keyboard container
        this.keyboardContainer = document.createElement('div');
        this.keyboardContainer.className = 'braille-keyboard-container';
        this.keyboardContainer.innerHTML = `
            <div class="braille-keyboard-title">Braille Keyboard Input</div>
            <div class="braille-keyboard-instructions">
                Use the keys F, D, S (left hand) and J, K, L (right hand) to type braille dots.
                Press Space to confirm a character, Backspace to clear, and Escape to exit.
            </div>
            
            <div class="virtual-braille-cell">
                <div class="virtual-dot" data-dot="1">F</div>
                <div class="virtual-dot" data-dot="4">J</div>
                <div class="virtual-dot" data-dot="2">D</div>
                <div class="virtual-dot" data-dot="5">K</div>
                <div class="virtual-dot" data-dot="3">S</div>
                <div class="virtual-dot" data-dot="6">L</div>
            </div>
            
            <div class="keyboard-key-row">
                <div class="keyboard-key" data-key="f">F</div>
                <div class="keyboard-key" data-key="d">D</div>
                <div class="keyboard-key" data-key="s">S</div>
            </div>
            
            <div class="keyboard-key-row">
                <div class="keyboard-key" data-key="j">J</div>
                <div class="keyboard-key" data-key="k">K</div>
                <div class="keyboard-key" data-key="l">L</div>
            </div>
            
            <div class="keyboard-key-row">
                <div class="keyboard-key space" data-key="space">Space (Confirm)</div>
            </div>
            
            <div class="keyboard-key-row">
                <div class="keyboard-key backspace" data-key="backspace">Backspace (Clear)</div>
                <div class="keyboard-key escape" data-key="escape">Escape (Exit)</div>
            </div>
            
            <button class="mobile-toggle">Show Mobile Keyboard</button>
            
            <div class="mobile-keyboard">
                <!-- Mobile touch keyboard will be added here -->
            </div>
            
            <div class="keyboard-output-label">Typed Output:</div>
            <div class="keyboard-output"></div>
        `;
        
        document.body.appendChild(this.keyboardContainer);
        
        // Store references to important elements
        this.virtualBrailleCell = this.keyboardContainer.querySelector('.virtual-braille-cell');
        this.outputContainer = this.keyboardContainer.querySelector('.keyboard-output');
        
        // Add event listeners for virtual keyboard
        this.keyboardContainer.querySelectorAll('.keyboard-key').forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.getAttribute('data-key');
                this.handleVirtualKeyPress(keyValue);
            });
        });
        
        // Add event listener for mobile keyboard toggle
        const mobileToggle = this.keyboardContainer.querySelector('.mobile-toggle');
        const mobileKeyboard = this.keyboardContainer.querySelector('.mobile-keyboard');
        
        mobileToggle.addEventListener('click', () => {
            this.isMobileKeyboardVisible = !this.isMobileKeyboardVisible;
            if (this.isMobileKeyboardVisible) {
                mobileKeyboard.classList.add('visible');
                mobileToggle.textContent = 'Hide Mobile Keyboard';
            } else {
                mobileKeyboard.classList.remove('visible');
                mobileToggle.textContent = 'Show Mobile Keyboard';
            }
        });
        
        // Create mobile touch keyboard
        this.createMobileTouchKeyboard();
    }
    
    /**
     * Create a touch-friendly keyboard for mobile devices
     */
    createMobileTouchKeyboard() {
        const mobileKeyboard = this.keyboardContainer.querySelector('.mobile-keyboard');
        
        // Create a 2x3 grid of large touch targets
        const touchGrid = document.createElement('div');
        touchGrid.style.display = 'grid';
        touchGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        touchGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
        touchGrid.style.gap = '10px';
        touchGrid.style.width = '100%';
        touchGrid.style.maxWidth = '300px';
        
        // Add the 6 dots as touch targets
        for (let i = 1; i <= 6; i++) {
            const dot = document.createElement('div');
            dot.style.width = '100%';
            dot.style.height = '80px';
            dot.style.borderRadius = '10px';
            dot.style.backgroundColor = '#f0f0f0';
            dot.style.display = 'flex';
            dot.style.alignItems = 'center';
            dot.style.justifyContent = 'center';
            dot.style.fontSize = '1.5rem';
            dot.style.fontWeight = 'bold';
            dot.style.color = '#333';
            dot.style.userSelect = 'none';
            
            // Determine which key this dot corresponds to
            let keyLabel = '';
            if (i === 1) keyLabel = 'F';
            else if (i === 2) keyLabel = 'D';
            else if (i === 3) keyLabel = 'S';
            else if (i === 4) keyLabel = 'J';
            else if (i === 5) keyLabel = 'K';
            else if (i === 6) keyLabel = 'L';
            
            dot.textContent = `Dot ${i} (${keyLabel})`;
            dot.setAttribute('data-dot', i);
            
            // Add touch event
            dot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleDot(i - 1);
                dot.style.backgroundColor = this.currentCell[i - 1] ? 'var(--accent-color)' : '#f0f0f0';
                dot.style.color = this.currentCell[i - 1] ? 'white' : '#333';
            });
            
            touchGrid.appendChild(dot);
        }
        
        mobileKeyboard.appendChild(touchGrid);
        
        // Add action buttons
        const actionButtons = document.createElement('div');
        actionButtons.style.display = 'flex';
        actionButtons.style.justifyContent = 'space-between';
        actionButtons.style.width = '100%';
        actionButtons.style.maxWidth = '300px';
        actionButtons.style.marginTop = '20px';
        
        // Confirm button
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.style.padding = '15px 30px';
        confirmButton.style.backgroundColor = 'var(--accent-color)';
        confirmButton.style.color = 'white';
        confirmButton.style.border = 'none';
        confirmButton.style.borderRadius = '5px';
        confirmButton.style.fontSize = '1rem';
        
        confirmButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleVirtualKeyPress('space');
        });
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.style.padding = '15px 30px';
        clearButton.style.backgroundColor = '#ffeeee';
        clearButton.style.color = '#333';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '5px';
        clearButton.style.fontSize = '1rem';
        
        clearButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleVirtualKeyPress('backspace');
        });
        
        actionButtons.appendChild(clearButton);
        actionButtons.appendChild(confirmButton);
        
        mobileKeyboard.appendChild(actionButtons);
    }
    
    /**
     * Handle key press events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Only process keys if keyboard is active
        if (!this.isActive) return;
        
        const key = event.key.toLowerCase();
        
        // Check if the key is mapped to a dot
        if (this.keyToDotMap[key] !== undefined) {
            event.preventDefault();
            const dotIndex = this.keyToDotMap[key] - 1;
            this.toggleDot(dotIndex);
        }
        // Space key to confirm the current cell
        else if (key === ' ' || key === 'enter') {
            event.preventDefault();
            this.confirmCell();
        }
        // Backspace to clear the current cell
        else if (key === 'backspace') {
            event.preventDefault();
            this.clearCell();
        }
        // Escape to exit keyboard input mode
        else if (key === 'escape') {
            event.preventDefault();
            this.exitKeyboardMode();
        }
    }
    
    /**
     * Handle virtual keyboard key presses
     * @param {string} key - The key that was pressed
     */
    handleVirtualKeyPress(key) {
        if (key in this.keyToDotMap) {
            const dotIndex = this.keyToDotMap[key] - 1;
            this.toggleDot(dotIndex);
        }
        else if (key === 'space') {
            this.confirmCell();
        }
        else if (key === 'backspace') {
            this.clearCell();
        }
        else if (key === 'escape') {
            this.exitKeyboardMode();
        }
    }
    
    /**
     * Toggle a dot in the current braille cell
     * @param {number} dotIndex - The index of the dot to toggle (0-5)
     */
    toggleDot(dotIndex) {
        if (dotIndex >= 0 && dotIndex < 6) {
            this.currentCell[dotIndex] = !this.currentCell[dotIndex];
            this.updateVirtualCell();
        }
    }
    
    /**
     * Update the visual representation of the virtual braille cell
     */
    updateVirtualCell() {
        const dots = this.virtualBrailleCell.querySelectorAll('.virtual-dot');
        dots.forEach((dot, index) => {
            const dotNumber = parseInt(dot.getAttribute('data-dot'));
            const dotIndex = dotNumber - 1;
            
            if (this.currentCell[dotIndex]) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update virtual keyboard keys
        const keys = this.keyboardContainer.querySelectorAll('.keyboard-key');
        keys.forEach(key => {
            const keyValue = key.getAttribute('data-key');
            if (keyValue in this.keyToDotMap) {
                const dotIndex = this.keyToDotMap[keyValue] - 1;
                if (this.currentCell[dotIndex]) {
                    key.classList.add('active');
                } else {
                    key.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * Confirm the current braille cell and convert it to a character
     */
    confirmCell() {
        // Convert the current cell to a character
        const character = this.brailleCellToCharacter(this.currentCell);
        
        if (character) {
            // Add the character to the output
            this.typedOutput += character;
            this.outputContainer.textContent = this.typedOutput;
            
            // Call the callback function if it exists
            if (typeof this.onCharacterTyped === 'function') {
                this.onCharacterTyped(character, this.typedOutput);
            }
            
            // Clear the cell for the next character
            this.clearCell();
        }
    }
    
    /**
     * Clear the current braille cell
     */
    clearCell() {
        this.currentCell = [false, false, false, false, false, false];
        this.updateVirtualCell();
    }
    
    /**
     * Exit keyboard input mode
     */
    exitKeyboardMode() {
        this.isActive = false;
        this.keyboardContainer.classList.remove('active');
        
        // Call the callback function if it exists
        if (typeof this.onExit === 'function') {
            this.onExit(this.typedOutput);
        }
        
        // Reset state
        this.typedOutput = '';
        this.clearCell();
    }
    
    /**
     * Show the keyboard input interface
     */
    show() {
        this.isActive = true;
        this.keyboardContainer.classList.add('active');
        this.outputContainer.textContent = '';
        this.typedOutput = '';
        this.clearCell();
    }
    
    /**
     * Hide the keyboard input interface
     */
    hide() {
        this.isActive = false;
        this.keyboardContainer.classList.remove('active');
    }
    
    /**
     * Convert a braille cell (array of 6 booleans) to a character
     * @param {Array<boolean>} cell - The braille cell to convert
     * @returns {string} The corresponding character
     */
    brailleCellToCharacter(cell) {
        // Convert the cell to a binary pattern
        const pattern = cell.map(dot => dot ? '1' : '0').join('');
        
        // Map of braille patterns to characters
        const brailleMap = {
            '100000': 'a',
            '110000': 'b',
            '100100': 'c',
            '100110': 'd',
            '100010': 'e',
            '110100': 'f',
            '110110': 'g',
            '110010': 'h',
            '010100': 'i',
            '010110': 'j',
            '101000': 'k',
            '111000': 'l',
            '101100': 'm',
            '101110': 'n',
            '101010': 'o',
            '111100': 'p',
            '111110': 'q',
            '111010': 'r',
            '011100': 's',
            '011110': 't',
            '101001': 'u',
            '111001': 'v',
            '010111': 'w',
            '101101': 'x',
            '101111': 'y',
            '101011': 'z',
            '010000': ',',
            '110001': ';',
            '010010': ':',
            '010001': '.',
            '010011': '!',
            '011010': '?',
            '001011': '-',
            '000000': ' '
        };
        
        return brailleMap[pattern] || '';
    }
}

// Create global instance
const brailleKeyboard = new BrailleKeyboard();

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    brailleKeyboard.initialize(
        // Character typed callback
        (character, fullText) => {
            console.log(`Character typed: ${character}`);
            // You can add custom behavior here
        },
        // Exit callback
        (finalText) => {
            console.log(`Keyboard exited. Final text: ${finalText}`);
            // You can add custom behavior here
        }
    );
});
