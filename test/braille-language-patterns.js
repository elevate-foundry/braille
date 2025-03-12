/**
 * Comprehensive Braille Language Patterns
 * Contains patterns for multiple languages and braille codes
 * to ensure universal braille support beyond just English/UEB
 */

const brailleLanguagePatterns = {
  // Universal Braille Elements
  universal: {
    numberSign: "⠼",
    capitalSign: "⠠",
    capitalWordSign: "⠨⠠",
    grade2Indicator: "⠰",
    // Common punctuation
    period: "⠲",
    comma: "⠂",
    questionMark: "⠢",
    exclamationMark: "⠖",
    openingBracket: "⠦",
    closingBracket: "⠴",
    apostrophe: "⠄",
    hyphen: "⠤",
    colon: "⠒",
    semicolon: "⠆"
  },
  
  // English/UEB (Unified English Braille)
  english: {
    // Letters
    alphabet: {
      a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
      k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
      u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵"
    },
    // Numbers (preceded by number sign ⠼)
    numbers: {
      "1": "⠁", "2": "⠃", "3": "⠉", "4": "⠙", "5": "⠑",
      "6": "⠋", "7": "⠛", "8": "⠓", "9": "⠊", "0": "⠚"
    },
    // Common contractions
    contractions: {
      and: "⠯",
      for: "⠿",
      of: "⠷",
      the: "⠮",
      with: "⠾",
      ch: "⠡",
      gh: "⠣",
      sh: "⠩",
      th: "⠹",
      wh: "⠱",
      ed: "⠫",
      er: "⠻",
      ou: "⠳",
      ow: "⠪",
      st: "⠌"
    },
    // Sample phrases
    samplePhrases: [
      { text: "Hello World", braille: "⠠⠓⠑⠇⠇⠕ ⠠⠺⠕⠗⠇⠙" },
      { text: "I love braille", braille: "⠠⠊ ⠇⠕⠧⠑ ⠃⠗⠁⠊⠇⠇⠑" },
      { text: "Number 123", braille: "⠠⠝⠥⠍⠃⠑⠗ ⠼⠁⠃⠉" },
      { text: "THE QUICK BROWN FOX", braille: "⠨⠠⠞⠓⠑ ⠨⠠⠟⠥⠊⠉⠅ ⠨⠠⠃⠗⠕⠺⠝ ⠨⠠⠋⠕⠭" }
    ]
  },
  
  // French Braille
  french: {
    // Special French characters
    specialChars: {
      à: "⠷",
      â: "⠡",
      ç: "⠯",
      é: "⠿",
      è: "⠮",
      ê: "⠣",
      ë: "⠫",
      î: "⠩",
      ï: "⠻",
      ô: "⠹",
      ù: "⠾",
      û: "⠱",
      ü: "⠳"
    },
    // Sample phrases
    samplePhrases: [
      { text: "Bonjour le monde", braille: "⠠⠃⠕⠝⠚⠕⠥⠗ ⠇⠑ ⠍⠕⠝⠙⠑" },
      { text: "J'aime le français", braille: "⠠⠚⠄⠁⠊⠍⠑ ⠇⠑ ⠋⠗⠁⠝⠯⠁⠊⠎" }
    ]
  },
  
  // Spanish Braille
  spanish: {
    // Special Spanish characters
    specialChars: {
      á: "⠷",
      é: "⠿",
      í: "⠌",
      ñ: "⠻",
      ó: "⠮",
      ú: "⠾",
      ü: "⠳",
      "¿": "⠢⠢",
      "¡": "⠖⠖"
    },
    // Sample phrases
    samplePhrases: [
      { text: "Hola mundo", braille: "⠠⠓⠕⠇⠁ ⠍⠥⠝⠙⠕" },
      { text: "¿Cómo estás?", braille: "⠢⠢⠠⠉⠮⠍⠕ ⠑⠎⠞⠷⠎⠢" }
    ]
  },
  
  // German Braille
  german: {
    // Special German characters
    specialChars: {
      ä: "⠜",
      ö: "⠪",
      ü: "⠳",
      ß: "⠮"
    },
    // Sample phrases
    samplePhrases: [
      { text: "Guten Tag", braille: "⠠⠛⠥⠞⠑⠝ ⠠⠞⠁⠛" },
      { text: "Wie geht's?", braille: "⠠⠺⠊⠑ ⠛⠑⠓⠞⠄⠎⠢" }
    ]
  },
  
  // Japanese Braille (basic representation)
  japanese: {
    // Basic Japanese characters (hiragana)
    basicChars: {
      あ: "⠁", い: "⠃", う: "⠉", え: "⠋", お: "⠊",
      か: "⠡", き: "⠣", く: "⠩", け: "⠹", こ: "⠱",
      さ: "⠎", し: "⠞", す: "⠥", せ: "⠵", そ: "⠮"
    },
    // Sample phrases
    samplePhrases: [
      { text: "こんにちは", braille: "⠱⠴⠝⠗⠪⠓" },
      { text: "ありがとう", braille: "⠁⠗⠡⠞⠳" }
    ]
  },
  
  // Arabic Braille (basic representation)
  arabic: {
    // Basic Arabic characters
    basicChars: {
      ا: "⠁", ب: "⠃", ت: "⠞", ث: "⠹", ج: "⠚",
      ح: "⠱", خ: "⠭", د: "⠙", ذ: "⠮", ر: "⠗"
    },
    // Sample phrases
    samplePhrases: [
      { text: "مرحبا", braille: "⠍⠗⠱⠃⠁" },
      { text: "شكرا", braille: "⠩⠅⠗⠁" }
    ]
  },
  
  // Complex test patterns (including the one provided by the user)
  testPatterns: {
    windsurf: "⠨⠠⠺⠊⠝⠙⠎⠥⠗⠋", // Capitalized word "Windsurf"
    numbers: "⠼⠁⠃⠉⠙",         // Numbers "1234" with number sign
    contractions: "⠰⠮",         // Contraction "the" with grade 2 indicator
    punctuation: "⠲⠢⠖",         // Period, question mark, exclamation point
    brackets: "⠦⠴",             // Opening and closing brackets
    specialChars: "⠦⠔",         // Special characters
    complexPhrase: "⠦⠲⠔⠠⠊⠎ ⠣⠑⠎⠞ ⠩⠊⠝⠊⠞ ⠜⠻⠋ ⠠⠠⠎⠑⠎⠎⠊⠕⠝", // Complex phrase with mixed elements
    userExample: "⠨⠠⠺⠊⠝⠙⠎⠥⠗⠋ ⠼⠁⠃⠉⠙ ⠰⠮ ⠲⠢⠖ ⠦⠴ ⠦⠔ ⠦⠲⠔⠠⠊⠎ ⠣⠑⠎⠞ ⠩⠊⠝⠊⠞ ⠜⠻⠋ ⠠⠠⠎⠑⠎⠎⠊⠕⠝" // Full user-provided example
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = brailleLanguagePatterns;
}
