/**
 * BrailleBuddy Tactile/Keyboard Input Controller
 * 
 * Implements six-key Braille input support, allowing users to type in Braille
 * using either keyboard keys or touch input on mobile devices.
 * This aligns with the enhancement idea for tactile/keyboard input options.
 */

import HapticFeedbackManager from './haptic-feedback.js';

class BrailleInputController {
  constructor() {
    // Initialize the haptic feedback manager
    this.hapticManager = new HapticFeedbackManager();
    this.hapticManager.initialize();
    
    // Braille dot mapping (standard 6-dot braille)
    this.dots = {
      1: false, // Top left
      2: false, // Middle left
      3: false, // Bottom left
      4: false, // Top right
      5: false, // Middle right
      6: false, // Bottom right
    };
    
    // Key mappings for keyboard input (customizable)
    this.keyMap = {
      'f': 1, // Dot 1
      'd': 2, // Dot 2
      's': 3, // Dot 3
      'j': 4, // Dot 4
      'k': 5, // Dot 5
      'l': 6, // Dot 6
      ' ': 'space', // Space
      'Enter': 'enter', // New line
      'Backspace': 'backspace', // Delete
    };
    
    // Touch target elements for mobile input
    this.touchTargets = {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
    };
    
    // Braille character mappings
    this.brailleMap = this._initBrailleMap();
    
    // Input callbacks
    this.onCharInput = null;
    this.onCellChange = null;
    
    // State tracking
    this.inputMode = 'keyboard'; // 'keyboard' or 'touch'
    this.isMobile = this._checkIfMobile();
    this.isActive = false;
    
    // For handling key combinations
    this.keysPressed = new Set();
    this.keyTimeout = null;
    this.keyTimeoutDuration = 1000; // ms to wait before resetting cell
  }

  /**
   * Initialize the Braille input controller
   * @param {Object} options - Configuration options
   * @returns {BrailleInputController} - This instance for chaining
   */
  initialize(options = {}) {
    const {
      onCharInput = null,
      onCellChange = null,
      keyMap = {},
      inputMode = this.isMobile ? 'touch' : 'keyboard',
      touchTargetIds = {},
    } = options;
    
    // Set callbacks
    this.onCharInput = onCharInput;
    this.onCellChange = onCellChange;
    
    // Update key mappings if provided
    this.keyMap = { ...this.keyMap, ...keyMap };
    
    // Set input mode
    this.inputMode = inputMode;
    
    // Set up touch targets if in touch mode
    if (this.inputMode === 'touch') {
      Object.entries(touchTargetIds).forEach(([dot, id]) => {
        const element = document.getElementById(id);
        if (element) {
          this.touchTargets[dot] = element;
          this._setupTouchEvents(element, parseInt(dot));
        }
      });
    }
    
    // Set up keyboard events if in keyboard mode
    if (this.inputMode === 'keyboard') {
      this._setupKeyboardEvents();
    }
    
    this.isActive = true;
    console.log(`Braille input initialized in ${this.inputMode} mode`);
    
    return this;
  }

  /**
   * Activate the input controller
   */
  activate() {
    if (!this.isActive) {
      this.isActive = true;
      
      if (this.inputMode === 'keyboard') {
        this._setupKeyboardEvents();
      }
      
      console.log('Braille input activated');
    }
  }

  /**
   * Deactivate the input controller
   */
  deactivate() {
    if (this.isActive) {
      this.isActive = false;
      
      if (this.inputMode === 'keyboard') {
        this._removeKeyboardEvents();
      }
      
      console.log('Braille input deactivated');
    }
  }

  /**
   * Switch input mode between keyboard and touch
   * @param {string} mode - 'keyboard' or 'touch'
   */
  switchInputMode(mode) {
    if (mode === this.inputMode) return;
    
    if (mode === 'keyboard' || mode === 'touch') {
      // Deactivate current mode
      this.deactivate();
      
      // Switch mode
      this.inputMode = mode;
      
      // Activate in new mode
      this.activate();
      
      console.log(`Switched to ${mode} input mode`);
      return true;
    }
    
    return false;
  }

  /**
   * Set a dot's state
   * @param {number} dotNumber - Dot number (1-6)
   * @param {boolean} state - Whether the dot is active
   */
  setDot(dotNumber, state) {
    if (dotNumber >= 1 && dotNumber <= 6) {
      this.dots[dotNumber] = state;
      
      // Trigger haptic feedback
      if (state && this.hapticManager.isHapticFeedbackSupported()) {
        this.hapticManager.triggerFeedback('a'); // Simple feedback for dot press
      }
      
      // Notify of cell change
      if (this.onCellChange) {
        this.onCellChange(this.dots);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Toggle a dot's state
   * @param {number} dotNumber - Dot number (1-6)
   */
  toggleDot(dotNumber) {
    if (dotNumber >= 1 && dotNumber <= 6) {
      return this.setDot(dotNumber, !this.dots[dotNumber]);
    }
    
    return false;
  }

  /**
   * Clear all dots (reset cell)
   */
  clearDots() {
    Object.keys(this.dots).forEach(dot => {
      this.dots[dot] = false;
    });
    
    // Notify of cell change
    if (this.onCellChange) {
      this.onCellChange(this.dots);
    }
  }

  /**
   * Get the current character based on dot pattern
   * @returns {string|null} - The character or null if no match
   */
  getCurrentChar() {
    const pattern = this._getPatternString();
    return this.brailleMap[pattern] || null;
  }

  /**
   * Submit the current cell as input
   */
  submitCell() {
    const char = this.getCurrentChar();
    
    if (char) {
      // Trigger haptic feedback for the character
      if (this.hapticManager.isHapticFeedbackSupported()) {
        this.hapticManager.triggerFeedback(char);
      }
      
      // Notify of character input
      if (this.onCharInput) {
        this.onCharInput(char, this.dots);
      }
      
      // Clear the cell after submission
      this.clearDots();
      
      return char;
    }
    
    return null;
  }

  /**
   * Set custom key mappings
   * @param {Object} newKeyMap - New key mappings
   */
  setKeyMap(newKeyMap) {
    this.keyMap = { ...this.keyMap, ...newKeyMap };
    
    // If active in keyboard mode, refresh event listeners
    if (this.isActive && this.inputMode === 'keyboard') {
      this._removeKeyboardEvents();
      this._setupKeyboardEvents();
    }
    
    return this.keyMap;
  }

  /**
   * Set touch targets for mobile input
   * @param {Object} touchTargetIds - Map of dot numbers to element IDs
   */
  setTouchTargets(touchTargetIds) {
    // Remove existing touch events
    Object.values(this.touchTargets).forEach(element => {
      if (element) {
        element.removeEventListener('touchstart', element._touchstartHandler);
        element.removeEventListener('touchend', element._touchendHandler);
      }
    });
    
    // Reset touch targets
    this.touchTargets = {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
    };
    
    // Set up new touch targets
    Object.entries(touchTargetIds).forEach(([dot, id]) => {
      const element = document.getElementById(id);
      if (element) {
        this.touchTargets[dot] = element;
        this._setupTouchEvents(element, parseInt(dot));
      }
    });
    
    return true;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Set up keyboard event listeners
   * @private
   */
  _setupKeyboardEvents() {
    // Avoid duplicate event listeners
    this._removeKeyboardEvents();
    
    // Create bound handlers for reference when removing
    this._keydownHandler = this._handleKeyDown.bind(this);
    this._keyupHandler = this._handleKeyUp.bind(this);
    
    // Add event listeners
    document.addEventListener('keydown', this._keydownHandler);
    document.addEventListener('keyup', this._keyupHandler);
  }

  /**
   * Remove keyboard event listeners
   * @private
   */
  _removeKeyboardEvents() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
    
    if (this._keyupHandler) {
      document.removeEventListener('keyup', this._keyupHandler);
    }
  }

  /**
   * Set up touch events for a target element
   * @param {HTMLElement} element - The target element
   * @param {number} dotNumber - The dot number (1-6)
   * @private
   */
  _setupTouchEvents(element, dotNumber) {
    // Create bound handlers for reference when removing
    element._touchstartHandler = (e) => {
      e.preventDefault();
      this.setDot(dotNumber, true);
    };
    
    element._touchendHandler = (e) => {
      e.preventDefault();
      
      // Don't immediately clear the dot - wait for potential multi-dot input
      if (!this.keyTimeout) {
        this.keyTimeout = setTimeout(() => {
          this.submitCell();
          this.keyTimeout = null;
        }, this.keyTimeoutDuration);
      }
    };
    
    // Add event listeners
    element.addEventListener('touchstart', element._touchstartHandler);
    element.addEventListener('touchend', element._touchendHandler);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - The keyboard event
   * @private
   */
  _handleKeyDown(event) {
    if (!this.isActive || this.inputMode !== 'keyboard') return;
    
    const key = event.key;
    
    // Check if this key is mapped
    if (key in this.keyMap) {
      const action = this.keyMap[key];
      
      // Handle special actions
      if (action === 'space') {
        event.preventDefault();
        this.submitCell(); // Submit current cell if any
        
        // Notify of space input
        if (this.onCharInput) {
          this.onCharInput(' ', {});
        }
        
        return;
      }
      
      if (action === 'enter') {
        event.preventDefault();
        this.submitCell(); // Submit current cell if any
        
        // Notify of enter input
        if (this.onCharInput) {
          this.onCharInput('\n', {});
        }
        
        return;
      }
      
      if (action === 'backspace') {
        event.preventDefault();
        
        // If dots are active, just clear them
        if (Object.values(this.dots).some(dot => dot)) {
          this.clearDots();
        } 
        // Otherwise, notify of backspace
        else if (this.onCharInput) {
          this.onCharInput('backspace', {});
        }
        
        return;
      }
      
      // Handle dot activation
      if (typeof action === 'number' && action >= 1 && action <= 6) {
        event.preventDefault();
        
        // Add to set of pressed keys
        this.keysPressed.add(key);
        
        // Activate the dot
        this.setDot(action, true);
        
        // Reset the timeout for auto-submission
        clearTimeout(this.keyTimeout);
        this.keyTimeout = setTimeout(() => {
          if (this.keysPressed.size > 0) {
            this.submitCell();
          }
          this.keyTimeout = null;
        }, this.keyTimeoutDuration);
      }
    }
  }

  /**
   * Handle keyup events
   * @param {KeyboardEvent} event - The keyboard event
   * @private
   */
  _handleKeyUp(event) {
    if (!this.isActive || this.inputMode !== 'keyboard') return;
    
    const key = event.key;
    
    // Remove from set of pressed keys
    this.keysPressed.delete(key);
    
    // If all mapped keys are released, submit the cell
    if (this.keysPressed.size === 0 && Object.values(this.dots).some(dot => dot)) {
      clearTimeout(this.keyTimeout);
      this.keyTimeout = setTimeout(() => {
        this.submitCell();
        this.keyTimeout = null;
      }, 200); // Short delay to allow for quick key combinations
    }
  }

  /**
   * Get the current dot pattern as a string
   * @returns {string} - Dot pattern string (e.g., "100000" for dot 1 only)
   * @private
   */
  _getPatternString() {
    return [
      this.dots[1] ? '1' : '0',
      this.dots[2] ? '1' : '0',
      this.dots[3] ? '1' : '0',
      this.dots[4] ? '1' : '0',
      this.dots[5] ? '1' : '0',
      this.dots[6] ? '1' : '0',
    ].join('');
  }

  /**
   * Check if running on a mobile device
   * @returns {boolean} - Whether the device is mobile
   * @private
   */
  _checkIfMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Initialize the Braille character mapping
   * @returns {Object} - Mapping of dot patterns to characters
   * @private
   */
  _initBrailleMap() {
    // Standard English Braille (Grade 1)
    return {
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
      '000000': ' ', // Space
      // Numbers (with number sign prefix in actual braille)
      '010000': '1', // a with number prefix
      '011000': '2', // b with number prefix
      '010010': '3', // c with number prefix
      '010011': '4', // d with number prefix
      '010001': '5', // e with number prefix
      '011010': '6', // f with number prefix
      '011011': '7', // g with number prefix
      '011001': '8', // h with number prefix
      '001010': '9', // i with number prefix
      '001011': '0', // j with number prefix
      // Punctuation
      '001000': ',', // Comma
      '001100': ';', // Semicolon
      '001110': ':', // Colon
      '001001': '.', // Period
      '001101': '!', // Exclamation
      '001111': '(', // Opening parenthesis
      '001011': ')', // Closing parenthesis
      '011001': '-', // Hyphen
      '001010': '?', // Question mark
      '000001': 'capital', // Capital indicator (not a character itself)
      '000011': 'number', // Number indicator (not a character itself)
      // Add more mappings as needed
    };
  }
}

export default BrailleInputController;
