/**
 * BrailleBuddy Multilingual Support Module
 * 
 * Implements support for different Braille standards beyond English,
 * addressing the enhancement idea for multilingual support and universal Braille.
 */

class MultilingualBrailleSupport {
  constructor() {
    // Available languages and their Braille standards
    this.availableLanguages = {
      'en': {
        name: 'English',
        code: 'en',
        standard: 'UEB', // Unified English Braille
        direction: 'ltr',
        enabled: true,
      },
      'fr': {
        name: 'French',
        code: 'fr',
        standard: 'French Braille',
        direction: 'ltr',
        enabled: true,
      },
      'es': {
        name: 'Spanish',
        code: 'es',
        standard: 'Spanish Braille',
        direction: 'ltr',
        enabled: true,
      },
      'de': {
        name: 'German',
        code: 'de',
        standard: 'German Braille',
        direction: 'ltr',
        enabled: true,
      },
      'it': {
        name: 'Italian',
        code: 'it',
        standard: 'Italian Braille',
        direction: 'ltr',
        enabled: true,
      },
      'ja': {
        name: 'Japanese',
        code: 'ja',
        standard: 'Japanese Braille',
        direction: 'ltr',
        enabled: true,
      },
      'zh': {
        name: 'Chinese',
        code: 'zh',
        standard: 'Chinese Braille',
        direction: 'ltr',
        enabled: true,
      },
      'ar': {
        name: 'Arabic',
        code: 'ar',
        standard: 'Arabic Braille',
        direction: 'rtl',
        enabled: true,
      },
      'he': {
        name: 'Hebrew',
        code: 'he',
        standard: 'Hebrew Braille',
        direction: 'rtl',
        enabled: true,
      },
      'ru': {
        name: 'Russian',
        code: 'ru',
        standard: 'Russian Braille',
        direction: 'ltr',
        enabled: true,
      },
    };
    
    // Current language
    this.currentLanguage = 'en';
    
    // Braille character mappings for each language
    this.brailleMappings = {
      // English (UEB) - Unified English Braille
      'en': {
        // Letters
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        // Numbers (with number sign ⠼)
        '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
        '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
        // Punctuation
        '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦',
        '"': '⠦', "'": '⠄', '(': '⠐⠣', ')': '⠐⠜', '-': '⠤',
        // Special characters
        ' ': '⠀', // Space
        'capital': '⠠', // Capital indicator
        'number': '⠼', // Number indicator
        'letter': '⠰', // Letter indicator
      },
      
      // French Braille
      'fr': {
        // Letters
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        // French specific characters
        'é': '⠿', 'è': '⠮', 'ê': '⠡', 'à': '⠷', 'ù': '⠾', 'ç': '⠯',
        'ë': '⠫', 'ï': '⠻', 'ô': '⠹', 'û': '⠱', 'ü': '⠳',
        // Numbers
        '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
        '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
        // Punctuation
        '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦',
        '"': '⠦', "'": '⠄', '(': '⠐⠣', ')': '⠐⠜', '-': '⠤',
        // Special characters
        ' ': '⠀',
        'capital': '⠠',
        'number': '⠼',
      },
      
      // Spanish Braille
      'es': {
        // Letters
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        // Spanish specific characters
        'á': '⠷', 'é': '⠮', 'í': '⠌', 'ó': '⠬', 'ú': '⠾', 'ü': '⠳', 'ñ': '⠻',
        '¿': '⠢', '¡': '⠖',
        // Numbers
        '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
        '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
        // Punctuation
        '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦',
        '"': '⠦', "'": '⠄', '(': '⠐⠣', ')': '⠐⠜', '-': '⠤',
        // Special characters
        ' ': '⠀',
        'capital': '⠠',
        'number': '⠼',
      },
      
      // German Braille
      'de': {
        // Letters
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        // German specific characters
        'ä': '⠜', 'ö': '⠪', 'ü': '⠳', 'ß': '⠮',
        // Numbers
        '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
        '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
        // Punctuation
        '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦',
        '"': '⠦', "'": '⠄', '(': '⠐⠣', ')': '⠐⠜', '-': '⠤',
        // Special characters
        ' ': '⠀',
        'capital': '⠠',
        'number': '⠼',
      },
      
      // Additional languages would be defined similarly
    };
    
    // Dot patterns for each language (for input)
    this.dotPatterns = {
      // English
      'en': {
        // Format: character: [dot1, dot2, dot3, dot4, dot5, dot6]
        'a': [1, 0, 0, 0, 0, 0], 'b': [1, 1, 0, 0, 0, 0],
        'c': [1, 0, 0, 1, 0, 0], 'd': [1, 0, 0, 1, 1, 0],
        'e': [1, 0, 0, 0, 1, 0], 'f': [1, 1, 0, 1, 0, 0],
        'g': [1, 1, 0, 1, 1, 0], 'h': [1, 1, 0, 0, 1, 0],
        'i': [0, 1, 0, 1, 0, 0], 'j': [0, 1, 0, 1, 1, 0],
        'k': [1, 0, 1, 0, 0, 0], 'l': [1, 1, 1, 0, 0, 0],
        'm': [1, 0, 1, 1, 0, 0], 'n': [1, 0, 1, 1, 1, 0],
        'o': [1, 0, 1, 0, 1, 0], 'p': [1, 1, 1, 1, 0, 0],
        'q': [1, 1, 1, 1, 1, 0], 'r': [1, 1, 1, 0, 1, 0],
        's': [0, 1, 1, 1, 0, 0], 't': [0, 1, 1, 1, 1, 0],
        'u': [1, 0, 1, 0, 0, 1], 'v': [1, 1, 1, 0, 0, 1],
        'w': [0, 1, 0, 1, 1, 1], 'x': [1, 0, 1, 1, 0, 1],
        'y': [1, 0, 1, 1, 1, 1], 'z': [1, 0, 1, 0, 1, 1],
        // Numbers would use the number sign prefix
        '1': [1, 0, 0, 0, 0, 0], '2': [1, 1, 0, 0, 0, 0],
        '3': [1, 0, 0, 1, 0, 0], '4': [1, 0, 0, 1, 1, 0],
        '5': [1, 0, 0, 0, 1, 0], '6': [1, 1, 0, 1, 0, 0],
        '7': [1, 1, 0, 1, 1, 0], '8': [1, 1, 0, 0, 1, 0],
        '9': [0, 1, 0, 1, 0, 0], '0': [0, 1, 0, 1, 1, 0],
        // Punctuation
        '.': [0, 0, 1, 1, 0, 0], ',': [0, 1, 0, 0, 0, 0],
        ';': [0, 1, 1, 0, 0, 0], ':': [0, 1, 0, 0, 1, 0],
        '!': [0, 1, 1, 0, 1, 0], '?': [0, 1, 0, 0, 1, 1],
        // Space
        ' ': [0, 0, 0, 0, 0, 0],
      },
      
      // Other languages would have similar patterns with variations
    };
    
    // Load saved language preference
    this._loadLanguagePreference();
  }

  /**
   * Initialize the multilingual support
   * @returns {Object} - Current language info
   */
  initialize() {
    console.log(`Multilingual support initialized with language: ${this.availableLanguages[this.currentLanguage].name}`);
    return this.getCurrentLanguageInfo();
  }

  /**
   * Set the current language
   * @param {string} languageCode - Language code (e.g., 'en', 'fr')
   * @returns {boolean} - Success status
   */
  setLanguage(languageCode) {
    if (this.availableLanguages[languageCode] && this.availableLanguages[languageCode].enabled) {
      this.currentLanguage = languageCode;
      this._saveLanguagePreference();
      
      console.log(`Language set to: ${this.availableLanguages[languageCode].name}`);
      return true;
    }
    
    console.error(`Language ${languageCode} not available or not enabled`);
    return false;
  }

  /**
   * Get information about the current language
   * @returns {Object} - Current language info
   */
  getCurrentLanguageInfo() {
    return {
      ...this.availableLanguages[this.currentLanguage],
      mappingCount: Object.keys(this.brailleMappings[this.currentLanguage] || {}).length,
    };
  }

  /**
   * Get all available languages
   * @param {boolean} enabledOnly - Whether to return only enabled languages
   * @returns {Array} - List of available languages
   */
  getAvailableLanguages(enabledOnly = true) {
    return Object.values(this.availableLanguages)
      .filter(lang => !enabledOnly || lang.enabled)
      .map(lang => ({
        name: lang.name,
        code: lang.code,
        standard: lang.standard,
        direction: lang.direction,
      }));
  }

  /**
   * Enable or disable a language
   * @param {string} languageCode - Language code
   * @param {boolean} enabled - Whether the language should be enabled
   * @returns {boolean} - Success status
   */
  setLanguageEnabled(languageCode, enabled) {
    if (this.availableLanguages[languageCode]) {
      this.availableLanguages[languageCode].enabled = enabled;
      return true;
    }
    
    return false;
  }

  /**
   * Convert text to Braille in the current language
   * @param {string} text - Text to convert
   * @returns {string} - Braille representation
   */
  textToBraille(text) {
    if (!text) return '';
    
    const mapping = this.brailleMappings[this.currentLanguage];
    if (!mapping) {
      console.error(`No Braille mapping available for ${this.currentLanguage}`);
      return '';
    }
    
    let result = '';
    let isCapital = false;
    let isNumber = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();
      
      // Check if this is an uppercase letter
      if (text[i] !== char && /[A-Z]/.test(text[i])) {
        // Add capital indicator if not already in capital mode
        if (!isCapital) {
          result += mapping['capital'];
          isCapital = true;
        }
      } else {
        isCapital = false;
      }
      
      // Check if this is a digit
      if (/[0-9]/.test(text[i])) {
        // Add number indicator if not already in number mode
        if (!isNumber) {
          result += mapping['number'];
          isNumber = true;
        }
        
        // Add the digit without the number prefix (already added above)
        result += mapping[text[i]].replace(mapping['number'], '');
      } else {
        isNumber = false;
        
        // Add the character
        if (mapping[char]) {
          result += mapping[char];
        } else {
          // If character not found in mapping, add space
          result += mapping[' '];
        }
      }
    }
    
    return result;
  }

  /**
   * Convert Braille to text in the current language
   * @param {string} braille - Braille to convert
   * @returns {string} - Text representation
   */
  brailleToText(braille) {
    if (!braille) return '';
    
    const mapping = this.brailleMappings[this.currentLanguage];
    if (!mapping) {
      console.error(`No Braille mapping available for ${this.currentLanguage}`);
      return '';
    }
    
    // Create reverse mapping
    const reverseMapping = {};
    for (const [char, brailleChar] of Object.entries(mapping)) {
      reverseMapping[brailleChar] = char;
    }
    
    let result = '';
    let isCapital = false;
    let isNumber = false;
    
    // Process each Braille character
    for (let i = 0; i < braille.length; i++) {
      const brailleChar = braille[i];
      
      // Check for special indicators
      if (brailleChar === mapping['capital']) {
        isCapital = true;
        continue;
      } else if (brailleChar === mapping['number']) {
        isNumber = true;
        continue;
      }
      
      // Convert Braille to character
      let char = reverseMapping[brailleChar];
      
      if (char) {
        // Apply capital or number formatting
        if (isCapital && /[a-z]/.test(char)) {
          char = char.toUpperCase();
          isCapital = false;
        } else if (isNumber && /[a-j]/.test(char)) {
          // Convert a-j to 1-0 when in number mode
          const numberMap = { 'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5',
                             'f': '6', 'g': '7', 'h': '8', 'i': '9', 'j': '0' };
          char = numberMap[char];
        }
        
        result += char;
      } else {
        // If Braille character not found, add space
        result += ' ';
      }
    }
    
    return result;
  }

  /**
   * Get the dot pattern for a character in the current language
   * @param {string} character - The character to get the pattern for
   * @returns {Array|null} - Dot pattern array or null if not found
   */
  getDotPattern(character) {
    const patterns = this.dotPatterns[this.currentLanguage];
    if (!patterns) {
      console.error(`No dot patterns available for ${this.currentLanguage}`);
      return null;
    }
    
    return patterns[character.toLowerCase()] || null;
  }

  /**
   * Get the character for a dot pattern in the current language
   * @param {Array} dotPattern - Dot pattern array [dot1, dot2, dot3, dot4, dot5, dot6]
   * @returns {string|null} - Character or null if not found
   */
  getCharacterFromDotPattern(dotPattern) {
    const patterns = this.dotPatterns[this.currentLanguage];
    if (!patterns) {
      console.error(`No dot patterns available for ${this.currentLanguage}`);
      return null;
    }
    
    // Convert pattern to string for comparison
    const patternString = dotPattern.join('');
    
    // Find matching character
    for (const [char, pattern] of Object.entries(patterns)) {
      if (pattern.join('') === patternString) {
        return char;
      }
    }
    
    return null;
  }

  /**
   * Get all characters and their Braille representations for the current language
   * @returns {Object} - Mapping of characters to Braille
   */
  getCharacterMap() {
    return this.brailleMappings[this.currentLanguage] || {};
  }

  /**
   * Get all dot patterns for the current language
   * @returns {Object} - Mapping of characters to dot patterns
   */
  getDotPatternMap() {
    return this.dotPatterns[this.currentLanguage] || {};
  }

  /**
   * Get the reading direction for the current language
   * @returns {string} - 'ltr' or 'rtl'
   */
  getReadingDirection() {
    return this.availableLanguages[this.currentLanguage].direction || 'ltr';
  }

  // ===== PRIVATE METHODS =====

  /**
   * Save language preference to localStorage
   * @private
   */
  _saveLanguagePreference() {
    try {
      localStorage.setItem('brailleBuddy_language', this.currentLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }

  /**
   * Load language preference from localStorage
   * @private
   */
  _loadLanguagePreference() {
    try {
      const savedLanguage = localStorage.getItem('brailleBuddy_language');
      if (savedLanguage && this.availableLanguages[savedLanguage]) {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }
}

export default MultilingualBrailleSupport;
