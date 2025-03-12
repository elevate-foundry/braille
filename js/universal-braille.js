/**
 * Universal Braille Support Module
 * Provides comprehensive support for braille across multiple languages and codes
 * Implements the user's priority for universal braille beyond just English/UEB
 */

// Import language patterns
let brailleLanguagePatterns;
try {
  brailleLanguagePatterns = require('../test/braille-language-patterns.js');
} catch (e) {
  // Handle browser environment where require isn't available
  console.log("Running in browser environment, language patterns will be loaded separately");
}

/**
 * Universal Braille Handler
 * Core functionality for handling braille across different languages
 */
class UniversalBrailleHandler {
  constructor() {
    this.currentLanguage = 'english'; // Default language
    this.languagePatterns = brailleLanguagePatterns || {};
    this.supportedLanguages = [
      'english', 'french', 'spanish', 'german', 'japanese', 'arabic'
    ];
  }

  /**
   * Set the current language for braille display
   * @param {string} language - The language code to use
   */
  setLanguage(language) {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
      console.log(`Braille language set to: ${language}`);
      return true;
    } else {
      console.error(`Unsupported language: ${language}`);
      return false;
    }
  }

  /**
   * Get the braille pattern for a character in the current language
   * @param {string} char - The character to get the pattern for
   * @returns {string} The braille pattern
   */
  getBraillePattern(char) {
    // Handle numbers with number sign
    if (/^[0-9]$/.test(char)) {
      const numberSign = this.languagePatterns.universal.numberSign;
      const numberPattern = this.languagePatterns[this.currentLanguage].numbers[char];
      return numberSign + numberPattern;
    }
    
    // Handle letters
    if (/^[a-z]$/i.test(char)) {
      const isUpperCase = char === char.toUpperCase();
      const letter = char.toLowerCase();
      const letterPattern = this.languagePatterns[this.currentLanguage].alphabet[letter];
      
      if (isUpperCase) {
        const capitalSign = this.languagePatterns.universal.capitalSign;
        return capitalSign + letterPattern;
      }
      
      return letterPattern;
    }
    
    // Handle special characters for the current language
    if (this.languagePatterns[this.currentLanguage].specialChars && 
        this.languagePatterns[this.currentLanguage].specialChars[char]) {
      return this.languagePatterns[this.currentLanguage].specialChars[char];
    }
    
    // Handle universal punctuation
    if (this.languagePatterns.universal[char]) {
      return this.languagePatterns.universal[char];
    }
    
    // Default fallback
    console.warn(`No braille pattern found for character: ${char} in language: ${this.currentLanguage}`);
    return '';
  }

  /**
   * Convert text to braille
   * @param {string} text - The text to convert
   * @returns {string} The braille representation
   */
  textToBraille(text) {
    let braille = '';
    let isNumber = false;
    let isCapitalWord = false;
    
    // Process each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Handle numbers
      if (/^[0-9]$/.test(char)) {
        if (!isNumber) {
          // Add number sign before first digit
          braille += this.languagePatterns.universal.numberSign;
          isNumber = true;
        }
        braille += this.languagePatterns[this.currentLanguage].numbers[char];
      }
      // Handle space (resets number mode)
      else if (char === ' ') {
        braille += ' ';
        isNumber = false;
        isCapitalWord = false;
      }
      // Handle uppercase letters
      else if (char === char.toUpperCase() && /^[A-Z]$/.test(char)) {
        const nextChar = text[i + 1];
        // Check for capital word (consecutive uppercase letters)
        if (nextChar && nextChar === nextChar.toUpperCase() && /^[A-Z]$/.test(nextChar) && !isCapitalWord) {
          braille += this.languagePatterns.universal.capitalWordSign;
          isCapitalWord = true;
        } else if (!isCapitalWord) {
          braille += this.languagePatterns.universal.capitalSign;
        }
        braille += this.languagePatterns[this.currentLanguage].alphabet[char.toLowerCase()];
      }
      // Handle lowercase letters
      else if (/^[a-z]$/.test(char)) {
        isNumber = false;
        isCapitalWord = false;
        braille += this.languagePatterns[this.currentLanguage].alphabet[char];
      }
      // Handle special characters and punctuation
      else {
        isNumber = false;
        
        // Check for language-specific special characters
        if (this.languagePatterns[this.currentLanguage].specialChars && 
            this.languagePatterns[this.currentLanguage].specialChars[char]) {
          braille += this.languagePatterns[this.currentLanguage].specialChars[char];
        }
        // Check for universal punctuation
        else if (this.languagePatterns.universal[char]) {
          braille += this.languagePatterns.universal[char];
        }
        // Unknown character
        else {
          console.warn(`Character not supported in braille: ${char}`);
        }
      }
    }
    
    return braille;
  }

  /**
   * Convert braille to text (basic implementation)
   * @param {string} braille - The braille pattern to convert
   * @returns {string} The text representation
   */
  brailleToText(braille) {
    // This is a simplified implementation
    // A full implementation would need to handle contractions, number signs, etc.
    let text = '';
    let isNumber = false;
    
    // Create reverse mapping for current language
    const reverseAlphabet = {};
    const alphabet = this.languagePatterns[this.currentLanguage].alphabet;
    for (const [letter, pattern] of Object.entries(alphabet)) {
      reverseAlphabet[pattern] = letter;
    }
    
    const reverseNumbers = {};
    const numbers = this.languagePatterns[this.currentLanguage].numbers;
    for (const [number, pattern] of Object.entries(numbers)) {
      reverseNumbers[pattern] = number;
    }
    
    // Process each braille character
    // This is simplified and doesn't handle multi-cell braille characters properly
    for (let i = 0; i < braille.length; i++) {
      const char = braille[i];
      
      // Handle number sign
      if (char === this.languagePatterns.universal.numberSign) {
        isNumber = true;
        continue;
      }
      
      // Handle capital sign
      if (char === this.languagePatterns.universal.capitalSign) {
        const nextChar = braille[i + 1];
        if (nextChar && reverseAlphabet[nextChar]) {
          text += reverseAlphabet[nextChar].toUpperCase();
          i++; // Skip the next character as we've already processed it
        }
        continue;
      }
      
      // Handle space
      if (char === ' ') {
        text += ' ';
        isNumber = false;
        continue;
      }
      
      // Handle numbers
      if (isNumber && reverseNumbers[char]) {
        text += reverseNumbers[char];
        continue;
      }
      
      // Handle letters
      if (reverseAlphabet[char]) {
        text += reverseAlphabet[char];
        isNumber = false;
        continue;
      }
      
      // Unknown braille character
      console.warn(`Unknown braille character: ${char}`);
    }
    
    return text;
  }

  /**
   * Get braille dot pattern for a character
   * @param {string} char - The character to get dots for
   * @returns {Array} Array of 6 values (0 or 1) representing the dot pattern
   */
  getBrailleDots(char) {
    // Map of braille unicode characters to dot patterns
    const brailleDotPatterns = {
      '⠀': [0, 0, 0, 0, 0, 0], // Space
      '⠁': [1, 0, 0, 0, 0, 0], // Dot 1
      '⠂': [0, 1, 0, 0, 0, 0], // Dot 2
      '⠃': [1, 1, 0, 0, 0, 0], // Dots 1,2
      '⠄': [0, 0, 1, 0, 0, 0], // Dot 3
      '⠅': [1, 0, 1, 0, 0, 0], // Dots 1,3
      '⠆': [0, 1, 1, 0, 0, 0], // Dots 2,3
      '⠇': [1, 1, 1, 0, 0, 0], // Dots 1,2,3
      '⠈': [0, 0, 0, 1, 0, 0], // Dot 4
      '⠉': [1, 0, 0, 1, 0, 0], // Dots 1,4
      '⠊': [0, 1, 0, 1, 0, 0], // Dots 2,4
      '⠋': [1, 1, 0, 1, 0, 0], // Dots 1,2,4
      '⠌': [0, 0, 1, 1, 0, 0], // Dots 3,4
      '⠍': [1, 0, 1, 1, 0, 0], // Dots 1,3,4
      '⠎': [0, 1, 1, 1, 0, 0], // Dots 2,3,4
      '⠏': [1, 1, 1, 1, 0, 0], // Dots 1,2,3,4
      '⠐': [0, 0, 0, 0, 1, 0], // Dot 5
      '⠑': [1, 0, 0, 0, 1, 0], // Dots 1,5
      '⠒': [0, 1, 0, 0, 1, 0], // Dots 2,5
      '⠓': [1, 1, 0, 0, 1, 0], // Dots 1,2,5
      '⠔': [0, 0, 1, 0, 1, 0], // Dots 3,5
      '⠕': [1, 0, 1, 0, 1, 0], // Dots 1,3,5
      '⠖': [0, 1, 1, 0, 1, 0], // Dots 2,3,5
      '⠗': [1, 1, 1, 0, 1, 0], // Dots 1,2,3,5
      '⠘': [0, 0, 0, 1, 1, 0], // Dots 4,5
      '⠙': [1, 0, 0, 1, 1, 0], // Dots 1,4,5
      '⠚': [0, 1, 0, 1, 1, 0], // Dots 2,4,5
      '⠛': [1, 1, 0, 1, 1, 0], // Dots 1,2,4,5
      '⠜': [0, 0, 1, 1, 1, 0], // Dots 3,4,5
      '⠝': [1, 0, 1, 1, 1, 0], // Dots 1,3,4,5
      '⠞': [0, 1, 1, 1, 1, 0], // Dots 2,3,4,5
      '⠟': [1, 1, 1, 1, 1, 0], // Dots 1,2,3,4,5
      '⠠': [0, 0, 0, 0, 0, 1], // Dot 6 (capital sign)
      '⠡': [1, 0, 0, 0, 0, 1], // Dots 1,6
      '⠢': [0, 1, 0, 0, 0, 1], // Dots 2,6
      '⠣': [1, 1, 0, 0, 0, 1], // Dots 1,2,6
      '⠤': [0, 0, 1, 0, 0, 1], // Dots 3,6
      '⠥': [1, 0, 1, 0, 0, 1], // Dots 1,3,6
      '⠦': [0, 1, 1, 0, 0, 1], // Dots 2,3,6
      '⠧': [1, 1, 1, 0, 0, 1], // Dots 1,2,3,6
      '⠨': [0, 0, 0, 1, 0, 1], // Dots 4,6
      '⠩': [1, 0, 0, 1, 0, 1], // Dots 1,4,6
      '⠪': [0, 1, 0, 1, 0, 1], // Dots 2,4,6
      '⠫': [1, 1, 0, 1, 0, 1], // Dots 1,2,4,6
      '⠬': [0, 0, 1, 1, 0, 1], // Dots 3,4,6
      '⠭': [1, 0, 1, 1, 0, 1], // Dots 1,3,4,6
      '⠮': [0, 1, 1, 1, 0, 1], // Dots 2,3,4,6
      '⠯': [1, 1, 1, 1, 0, 1], // Dots 1,2,3,4,6
      '⠰': [0, 0, 0, 0, 1, 1], // Dots 5,6
      '⠱': [1, 0, 0, 0, 1, 1], // Dots 1,5,6
      '⠲': [0, 1, 0, 0, 1, 1], // Dots 2,5,6
      '⠳': [1, 1, 0, 0, 1, 1], // Dots 1,2,5,6
      '⠴': [0, 0, 1, 0, 1, 1], // Dots 3,5,6
      '⠵': [1, 0, 1, 0, 1, 1], // Dots 1,3,5,6
      '⠶': [0, 1, 1, 0, 1, 1], // Dots 2,3,5,6
      '⠷': [1, 1, 1, 0, 1, 1], // Dots 1,2,3,5,6
      '⠸': [0, 0, 0, 1, 1, 1], // Dots 4,5,6
      '⠹': [1, 0, 0, 1, 1, 1], // Dots 1,4,5,6
      '⠺': [0, 1, 0, 1, 1, 1], // Dots 2,4,5,6
      '⠻': [1, 1, 0, 1, 1, 1], // Dots 1,2,4,5,6
      '⠼': [0, 0, 1, 1, 1, 1], // Dots 3,4,5,6 (number sign)
      '⠽': [1, 0, 1, 1, 1, 1], // Dots 1,3,4,5,6
      '⠾': [0, 1, 1, 1, 1, 1], // Dots 2,3,4,5,6
      '⠿': [1, 1, 1, 1, 1, 1]  // Dots 1,2,3,4,5,6
    };
    
    // For multi-character input, just return the pattern for the first character
    const firstChar = char.charAt(0);
    
    if (brailleDotPatterns[firstChar]) {
      return brailleDotPatterns[firstChar];
    }
    
    // If not a braille character, convert to braille first
    const brailleChar = this.getBraillePattern(firstChar);
    if (brailleChar && brailleDotPatterns[brailleChar.charAt(0)]) {
      return brailleDotPatterns[brailleChar.charAt(0)];
    }
    
    console.warn(`Could not get dot pattern for character: ${firstChar}`);
    return [0, 0, 0, 0, 0, 0]; // Default empty pattern
  }
}

// Create and export the handler
const universalBrailleHandler = new UniversalBrailleHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = universalBrailleHandler;
} else {
  // For browser environment
  window.universalBrailleHandler = universalBrailleHandler;
}
