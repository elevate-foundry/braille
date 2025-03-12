/**
 * BrailleBuddy Typing Mode
 * 
 * This module implements the braille typing practice mode using keyboard input.
 * It allows users to practice typing braille using the keyboard keys:
 * - F, D, S (left hand) for dots 1, 2, 3
 * - J, K, L (right hand) for dots 4, 5, 6
 */

class BrailleTyping {
    constructor() {
        // Current state
        this.currentTarget = '';
        this.currentCell = [false, false, false, false, false, false];
        this.score = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        
        // DOM elements
        this.typingModeElement = document.getElementById('typing-mode');
        this.recognitionModeElement = document.getElementById('recognition-mode');
        this.typingTargetElement = document.getElementById('typing-target');
        this.typingFeedbackElement = document.getElementById('typing-feedback');
        this.typingDots = Array.from(document.querySelectorAll('.typing-cell .dot'));
        
        // Braille patterns for letters (1-indexed as per braille convention)
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
            'z': [1, 0, 1, 0, 1, 1],
            ' ': [0, 0, 0, 0, 0, 0]
        };
        
        // Key to dot mapping
        this.keyToDotMap = {
            'f': 0, // Dot 1
            'd': 1, // Dot 2
            's': 2, // Dot 3
            'j': 3, // Dot 4
            'k': 4, // Dot 5
            'l': 5  // Dot 6
        };
        
        // Initialize
        this.bindEvents();
    }
    
    /**
     * Initialize the typing mode
     */
    initialize() {
        // Set up initial target
        this.generateNewTarget();
        
        // Clear current cell
        this.clearCell();
        
        // Reset score
        this.score = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        
        // Update UI
        this.updateTypingFeedback('Type the letter using F, D, S, J, K, L keys');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mode switching
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                this.switchMode(mode);
                
                // Update active button
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
        
        // Keyboard events for typing
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Click events for dots
        this.typingDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.toggleDot(index);
            });
        });
        
        // Submit button
        document.getElementById('submit-typing').addEventListener('click', () => {
            this.checkAnswer();
        });
        
        // Clear button
        document.getElementById('clear-typing').addEventListener('click', () => {
            this.clearCell();
        });
        
        // Next button
        document.getElementById('next-typing').addEventListener('click', () => {
            this.generateNewTarget();
        });
        
        // Open keyboard button
        document.getElementById('open-keyboard').addEventListener('click', () => {
            brailleKeyboard.show();
        });
    }
    
    /**
     * Switch between practice modes
     * @param {string} mode - The mode to switch to ('recognition' or 'typing')
     */
    switchMode(mode) {
        if (mode === 'recognition') {
            this.typingModeElement.classList.add('hidden');
            this.recognitionModeElement.classList.remove('hidden');
        } else if (mode === 'typing') {
            this.typingModeElement.classList.remove('hidden');
            this.recognitionModeElement.classList.add('hidden');
            this.initialize();
        }
    }
    
    /**
     * Handle keyboard input
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Only process if typing mode is active and visible
        if (this.typingModeElement.classList.contains('hidden')) return;
        
        const key = event.key.toLowerCase();
        
        // Check if the key is mapped to a dot
        if (this.keyToDotMap[key] !== undefined) {
            event.preventDefault();
            const dotIndex = this.keyToDotMap[key];
            this.toggleDot(dotIndex);
        }
        // Space key to submit
        else if (key === ' ' || key === 'enter') {
            event.preventDefault();
            this.checkAnswer();
        }
        // Backspace to clear
        else if (key === 'backspace') {
            event.preventDefault();
            this.clearCell();
        }
    }
    
    /**
     * Toggle a dot in the current braille cell
     * @param {number} dotIndex - The index of the dot to toggle (0-5)
     */
    toggleDot(dotIndex) {
        if (dotIndex >= 0 && dotIndex < 6) {
            this.currentCell[dotIndex] = !this.currentCell[dotIndex];
            this.updateCellDisplay();
            
            // Provide haptic feedback if available
            if (window.navigator && window.navigator.vibrate && window.hapticFeedback) {
                window.hapticFeedback.provideFeedback('dot');
            }
        }
    }
    
    /**
     * Update the visual display of the braille cell
     */
    updateCellDisplay() {
        this.typingDots.forEach((dot, index) => {
            if (this.currentCell[index]) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Clear the current braille cell
     */
    clearCell() {
        this.currentCell = [false, false, false, false, false, false];
        this.updateCellDisplay();
    }
    
    /**
     * Generate a new random target letter to type
     */
    generateNewTarget() {
        // Get all available letters
        const letters = Object.keys(this.braillePatterns).filter(key => key !== ' ');
        
        // Select a random letter
        const randomIndex = Math.floor(Math.random() * letters.length);
        this.currentTarget = letters[randomIndex];
        
        // Update the display
        this.typingTargetElement.textContent = this.currentTarget.toUpperCase();
        
        // Clear the current cell
        this.clearCell();
        
        // Clear feedback
        this.updateTypingFeedback('');
    }
    
    /**
     * Check if the current cell matches the target
     */
    checkAnswer() {
        this.totalAttempts++;
        
        // Get the target pattern
        const targetPattern = this.braillePatterns[this.currentTarget];
        
        // Compare with current cell
        let isCorrect = true;
        for (let i = 0; i < 6; i++) {
            if ((targetPattern[i] === 1) !== this.currentCell[i]) {
                isCorrect = false;
                break;
            }
        }
        
        // Update score and feedback
        if (isCorrect) {
            this.correctAttempts++;
            this.updateTypingFeedback('Correct! Well done.', 'correct');
            
            // Trigger achievement if applicable
            if (window.achievements) {
                if (this.correctAttempts === 5) {
                    window.achievements.unlock('braille_typist');
                }
                if (this.correctAttempts === 10) {
                    window.achievements.unlock('braille_expert_typist');
                }
            }
            
            // Update adaptive learning system if available
            if (window.adaptiveLearning) {
                window.adaptiveLearning.recordSuccess(this.currentTarget, 'typing');
            }
            
            // Provide haptic feedback if available
            if (window.navigator && window.navigator.vibrate && window.hapticFeedback) {
                window.hapticFeedback.provideFeedback('success');
            }
            
            // Generate a new target after a short delay
            setTimeout(() => {
                this.generateNewTarget();
            }, 1500);
        } else {
            this.updateTypingFeedback('Not quite right. Try again.', 'incorrect');
            
            // Update adaptive learning system if available
            if (window.adaptiveLearning) {
                window.adaptiveLearning.recordFailure(this.currentTarget, 'typing');
            }
            
            // Provide haptic feedback if available
            if (window.navigator && window.navigator.vibrate && window.hapticFeedback) {
                window.hapticFeedback.provideFeedback('error');
            }
        }
        
        // Update accuracy in user stats if available
        if (window.userStats) {
            const accuracy = Math.round((this.correctAttempts / this.totalAttempts) * 100);
            window.userStats.updateTypingAccuracy(accuracy);
        }
    }
    
    /**
     * Update the feedback message
     * @param {string} message - The feedback message
     * @param {string} type - The type of feedback ('correct', 'incorrect', or '')
     */
    updateTypingFeedback(message, type = '') {
        this.typingFeedbackElement.textContent = message;
        this.typingFeedbackElement.className = 'feedback';
        
        if (type) {
            this.typingFeedbackElement.classList.add(type);
        }
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.brailleTyping = new BrailleTyping();
});
