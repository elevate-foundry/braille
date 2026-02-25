/**
 * BrailleBuddy Haptic Feedback System
 * 
 * Implements the Web Vibration API for providing tactile feedback
 * when interacting with braille characters on mobile devices.
 * Supports three haptic modes: Standard, Rhythmic, and Frequency-based.
 */

class HapticFeedbackManager {
  constructor() {
    // Check if vibration is supported
    this.isSupported = 'vibrate' in navigator;
    
    // Default configuration
    this.config = {
      enabled: true,
      mode: 'standard', // 'standard', 'rhythmic', 'frequency'
      intensity: 0.7,   // 0.0 to 1.0
      duration: 50,     // Base duration in milliseconds
    };
    
    // Braille character vibration patterns
    this.braillePatterns = {
      // Standard mode patterns (single vibration with different durations)
      standard: {
        // Format: [duration]
        'a': [40],  // ⠁ (dot 1)
        'b': [60],  // ⠃ (dots 1,2)
        'c': [60],  // ⠉ (dots 1,4)
        'd': [70],  // ⠙ (dots 1,4,5)
        'e': [40],  // ⠑ (dots 1,5)
        'f': [70],  // ⠋ (dots 1,2,4)
        'g': [80],  // ⠛ (dots 1,2,4,5)
        'h': [60],  // ⠓ (dots 1,2,5)
        'i': [50],  // ⠊ (dots 2,4)
        'j': [60],  // ⠚ (dots 2,4,5)
        'k': [50],  // ⠅ (dots 1,3)
        'l': [70],  // ⠇ (dots 1,2,3)
        'm': [70],  // ⠍ (dots 1,3,4)
        'n': [80],  // ⠝ (dots 1,3,4,5)
        'o': [60],  // ⠕ (dots 1,3,5)
        'p': [80],  // ⠏ (dots 1,2,3,4)
        'q': [90],  // ⠟ (dots 1,2,3,4,5)
        'r': [70],  // ⠗ (dots 1,2,3,5)
        's': [60],  // ⠎ (dots 2,3,4)
        't': [70],  // ⠞ (dots 2,3,4,5)
        'u': [60],  // ⠥ (dots 1,3,6)
        'v': [80],  // ⠧ (dots 1,2,3,6)
        'w': [70],  // ⠺ (dots 2,4,5,6)
        'x': [80],  // ⠭ (dots 1,3,4,6)
        'y': [90],  // ⠽ (dots 1,3,4,5,6)
        'z': [80],  // ⠵ (dots 1,3,5,6)
        ' ': [20],  // Space
        '.': [30, 30, 30], // Period - three short pulses
        ',': [40, 20, 40], // Comma - two pulses
        '?': [30, 20, 30, 20, 50], // Question mark - pattern
        '!': [60, 20, 60], // Exclamation - two longer pulses
      },
      
      // Rhythmic mode patterns (sequence of vibrations matching dot patterns)
      rhythmic: {
        // Format: [on, off, on, off, ...]
        'a': [40, 0, 0, 0, 0, 0],  // ⠁ (dot 1)
        'b': [40, 20, 40, 0, 0, 0],  // ⠃ (dots 1,2)
        'c': [40, 0, 0, 40, 0, 0],  // ⠉ (dots 1,4)
        // Additional patterns would be defined for all characters
      }
    };
    
    // Dot positions for frequency-based patterns
    this.brailleDots = {
      'a': [1, 0, 0, 0, 0, 0], // ⠁
      'b': [1, 1, 0, 0, 0, 0], // ⠃
      'c': [1, 0, 0, 1, 0, 0], // ⠉
      'd': [1, 0, 0, 1, 1, 0], // ⠙
      'e': [1, 0, 0, 0, 1, 0], // ⠑
      'f': [1, 1, 0, 1, 0, 0], // ⠋
      'g': [1, 1, 0, 1, 1, 0], // ⠛
      'h': [1, 1, 0, 0, 1, 0], // ⠓
      'i': [0, 1, 0, 1, 0, 0], // ⠊
      'j': [0, 1, 0, 1, 1, 0], // ⠚
      'k': [1, 0, 1, 0, 0, 0], // ⠅
      'l': [1, 1, 1, 0, 0, 0], // ⠇
      'm': [1, 0, 1, 1, 0, 0], // ⠍
      'n': [1, 0, 1, 1, 1, 0], // ⠝
      'o': [1, 0, 1, 0, 1, 0], // ⠕
      'p': [1, 1, 1, 1, 0, 0], // ⠏
      'q': [1, 1, 1, 1, 1, 0], // ⠟
      'r': [1, 1, 1, 0, 1, 0], // ⠗
      's': [0, 1, 1, 1, 0, 0], // ⠎
      't': [0, 1, 1, 1, 1, 0], // ⠞
      'u': [1, 0, 1, 0, 0, 1], // ⠥
      'v': [1, 1, 1, 0, 0, 1], // ⠧
      'w': [0, 1, 0, 1, 1, 1], // ⠺
      'x': [1, 0, 1, 1, 0, 1], // ⠭
      'y': [1, 0, 1, 1, 1, 1], // ⠽
      'z': [1, 0, 1, 0, 1, 1], // ⠵
      ' ': [0, 0, 0, 0, 0, 0], // Space
      // Additional characters would be defined
    };
    
    // Load saved preferences if available
    this._loadPreferences();
  }

  /**
   * Initialize the haptic feedback system
   * @returns {boolean} - Whether haptic feedback is supported
   */
  initialize() {
    if (!this.isSupported) {
      console.warn('Haptic feedback not supported on this device');
      return false;
    }
    
    console.log(`Haptic feedback initialized in ${this.config.mode} mode`);
    return true;
  }

  /**
   * Trigger haptic feedback for a braille character
   * @param {string} character - The braille character
   * @returns {boolean} - Whether the feedback was triggered
   */
  triggerFeedback(character) {
    if (!this.isSupported || !this.config.enabled) {
      return false;
    }
    
    let pattern;
    
    switch (this.config.mode) {
      case 'standard':
        pattern = this._getStandardPattern(character);
        break;
      case 'rhythmic':
        pattern = this._getRhythmicPattern(character);
        break;
      case 'frequency':
        pattern = this._getFrequencyPattern(character);
        break;
      default:
        pattern = [this.config.duration];
    }
    
    // Apply intensity scaling
    pattern = pattern.map(duration => 
      typeof duration === 'number' ? Math.round(duration * this.config.intensity) : 0
    );
    
    // Ensure we don't have zero durations (which would stop the pattern)
    pattern = pattern.map(duration => duration === 0 ? 1 : duration);
    
    // Trigger vibration
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
      return false;
    }
  }

  /**
   * Trigger haptic feedback for a sequence of braille characters
   * @param {string} text - String of braille characters
   * @param {number} delay - Delay between characters in ms
   */
  async triggerSequence(text, delay = 300) {
    if (!this.isSupported || !this.config.enabled || !text) {
      return false;
    }
    
    for (let i = 0; i < text.length; i++) {
      this.triggerFeedback(text[i]);
      if (i < text.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return true;
  }

  /**
   * Update haptic feedback configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._savePreferences();
    
    // Test the new configuration
    if (this.isSupported && this.config.enabled) {
      navigator.vibrate(Math.round(50 * this.config.intensity));
    }
    
    return this.config;
  }

  /**
   * Enable or disable haptic feedback
   * @param {boolean} enabled - Whether haptic feedback should be enabled
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    this._savePreferences();
    
    // Provide feedback that the setting was changed
    if (this.isSupported && enabled) {
      navigator.vibrate(50);
    }
    
    return enabled;
  }

  /**
   * Set haptic feedback mode
   * @param {string} mode - 'standard', 'rhythmic', or 'frequency'
   */
  setMode(mode) {
    if (['standard', 'rhythmic', 'frequency'].includes(mode)) {
      this.config.mode = mode;
      this._savePreferences();
      
      // Provide feedback in the new mode
      if (this.isSupported && this.config.enabled) {
        this.triggerFeedback('a');
      }
      
      return true;
    }
    return false;
  }

  /**
   * Set haptic feedback intensity
   * @param {number} intensity - Value between 0.0 and 1.0
   */
  setIntensity(intensity) {
    if (intensity >= 0 && intensity <= 1) {
      this.config.intensity = intensity;
      this._savePreferences();
      
      // Provide feedback at the new intensity
      if (this.isSupported && this.config.enabled) {
        navigator.vibrate(Math.round(50 * intensity));
      }
      
      return true;
    }
    return false;
  }

  /**
   * Get current haptic feedback configuration
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if haptic feedback is supported
   * @returns {boolean} - Whether haptic feedback is supported
   */
  isHapticFeedbackSupported() {
    return this.isSupported;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Get standard pattern for a character
   * @private
   */
  _getStandardPattern(character) {
    return this.braillePatterns.standard[character.toLowerCase()] || [this.config.duration];
  }

  /**
   * Get rhythmic pattern for a character
   * @private
   */
  _getRhythmicPattern(character) {
    // Use predefined rhythmic pattern if available
    if (this.braillePatterns.rhythmic[character.toLowerCase()]) {
      return this.braillePatterns.rhythmic[character.toLowerCase()];
    }
    
    // Otherwise generate from dot pattern
    const dots = this.brailleDots[character.toLowerCase()] || [0, 0, 0, 0, 0, 0];
    const pattern = [];
    
    dots.forEach((dot, index) => {
      if (dot) {
        pattern.push(this.config.duration);
      } else {
        pattern.push(0);
      }
      
      // Add pause between dots (except after the last one)
      if (index < dots.length - 1) {
        pattern.push(20);
      }
    });
    
    return pattern.filter(duration => duration > 0).length > 0 ? 
      pattern.filter(duration => duration > 0) : 
      [this.config.duration];
  }

  /**
   * Get frequency-based pattern for a character
   * @private
   */
  _getFrequencyPattern(character) {
    const dots = this.brailleDots[character.toLowerCase()] || [0, 0, 0, 0, 0, 0];
    const dotCount = dots.filter(dot => dot).length;
    
    // No dots (space)
    if (dotCount === 0) {
      return [20];
    }
    
    // Calculate vibration duration based on dot count
    // More dots = longer vibration
    const duration = Math.max(30, Math.min(100, 30 + (dotCount * 10)));
    
    return [duration];
  }

  /**
   * Save preferences to localStorage
   * @private
   */
  _savePreferences() {
    try {
      localStorage.setItem('brailleBuddy_hapticConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving haptic preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   * @private
   */
  _loadPreferences() {
    try {
      const savedConfig = localStorage.getItem('brailleBuddy_hapticConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading haptic preferences:', error);
    }
  }
}

export default HapticFeedbackManager;
