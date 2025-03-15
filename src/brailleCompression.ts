// Braille contractions and rules for multiple writing systems
const contractions = {
  // English contractions (unchanged)
  'about': 'ab',
  'above': 'abv',
  'according': 'ac',
  'across': 'acr',
  'after': 'af',
  'afternoon': 'afn',
  'afterward': 'afw',
  'again': 'ag',
  'against': 'agst',
  'almost': 'alm',
  'already': 'alr',
  'also': 'al',
  'although': 'alt',
  'altogether': 'alt',
  'always': 'alw',
  'because': 'bec',
  'before': 'bef',
  'behind': 'beh',
  'below': 'bel',
  'beneath': 'ben',
  'beside': 'bes',
  'between': 'bet',
  'beyond': 'bey',
  'blind': 'bl',
  'braille': 'brl',
  
  // Common letter groups
  'ch': '⠡',
  'sh': '⠩',
  'th': '⠹',
  'wh': '⠱',
  'ou': '⠳',
  'ow': '⠪',
  'er': '⠻',
  'ar': '⠜',
  'ing': '⠬',
  'ed': '⠫',
  'ound': '⠿',
  'ance': '⠁⠝⠉',
  'tion': '⠰⠝',
  'ness': '⠰⠎',
  'ment': '⠰⠍',
  
  // Single character contractions
  'and': '⠯',
  'for': '⠿',
  'of': '⠷',
  'the': '⠮',
  'with': '⠾',
  'in': '⠔',
  'was': '⠴',
  'were': '⠶'
};

// Extended language-specific contraction maps
const languageContractions: { [key: string]: { [key: string]: string } } = {
  'es': {
    // Spanish contractions
    'que': 'q',
    'porque': 'pq',
    'para': 'pa',
    'como': 'cm',
    'estar': 'est',
    'este': 'es',
    'esta': 'ea',
  },
  'fr': {
    // French contractions
    'avec': 'av',
    'beaucoup': 'bcp',
    'comme': 'cm',
    'dans': 'ds',
    'pendant': 'pdt',
    'pour': 'pr',
    'quelque': 'qlq',
  },
  'ru': {
    // Russian contractions (using Cyrillic)
    'что': 'ч',
    'потому': 'пч',
    'когда': 'кг',
    'который': 'кт',
    'говорить': 'гв',
  },
  'ar': {
    // Arabic contractions
    'من': 'م',
    'في': 'ف',
    'على': 'ع',
    'إلى': 'ا',
    'عن': 'ع',
  },
  'zh': {
    // Chinese common characters (simplified)
    '的': '⠙',
    '是': '⠩',
    '不': '⠃',
    '了': '⠇',
    '在': '⠵',
  },
  'ja': {
    // Japanese common characters
    'です': '⠙',
    'ます': '⠍',
    'から': '⠅',
    'まで': '⠍⠙',
    'として': '⠞',
  },
  'ko': {
    // Korean common syllables
    '습니다': '습',
    '입니다': '입',
    '니다': '니',
    '하다': '하',
    '있다': '있',
  }
};

// Script detection patterns
const scriptPatterns = {
  latin: /^[\u0000-\u007F\u0080-\u00FF]+$/,
  cyrillic: /[\u0400-\u04FF]/,
  arabic: /[\u0600-\u06FF]/,
  chinese: /[\u4E00-\u9FFF]/,
  japanese: /[\u3040-\u309F\u30A0-\u30FF]/,
  korean: /[\uAC00-\uD7AF\u1100-\u11FF]/,
};

/**
 * Detects the script of the input text
 * @param text Input text
 * @returns Script identifier
 */
function detectScript(text: string): string {
  for (const [script, pattern] of Object.entries(scriptPatterns)) {
    if (pattern.test(text)) return script;
  }
  return 'latin'; // default
}

/**
 * Compresses text using braille contractions and semantic patterns
 * @param text The input text to compress
 * @param language The ISO 639-1 language code
 * @returns Compressed braille text
 */
export function compressBrailleText(text: string, language: string = 'en'): string {
  let compressedText = text;
  const script = detectScript(text);
  
  // Get language-specific contractions
  const currentContractions = language === 'en' ? contractions : 
    { ...contractions, ...(languageContractions[language] || {}) };
  
  const sortedCurrentContractions = Object.entries(currentContractions)
    .sort((a, b) => b[0].length - a[0].length);
  
  // Special handling for non-Latin scripts
  if (script !== 'latin') {
    // Apply script-specific compression rules
    switch (script) {
      case 'chinese':
      case 'japanese':
      case 'korean':
        // Apply character-by-character compression for CJK
        for (const [pattern, replacement] of sortedCurrentContractions) {
          compressedText = compressedText.replace(new RegExp(pattern, 'g'), replacement);
        }
        break;
      
      case 'arabic':
        // Handle RTL text and Arabic-specific patterns
        compressedText = compressedText
          .split('')
          .reverse()
          .join('');
        for (const [pattern, replacement] of sortedCurrentContractions) {
          compressedText = compressedText.replace(new RegExp(pattern, 'g'), replacement);
        }
        break;
      
      case 'cyrillic':
        // Apply Cyrillic-specific contractions
        for (const [pattern, replacement] of sortedCurrentContractions) {
          const regex = new RegExp(`\\b${pattern}\\b`, 'g');
          compressedText = compressedText.replace(regex, replacement);
        }
        break;
    }
  } else {
    // Latin script compression (original logic)
    // Apply word-level contractions first
    for (const [pattern, replacement] of sortedCurrentContractions) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'g');
      compressedText = compressedText.replace(regex, replacement);
    }
    
    // Apply letter group contractions within words
    for (const [pattern, replacement] of Object.entries(currentContractions)) {
      if (pattern.length <= 3) {
        const regex = new RegExp(pattern, 'g');
        compressedText = compressedText.replace(regex, replacement);
      }
    }
  }
  
  return compressedText;
}

/**
 * Decompresses braille text back to regular text
 * @param compressedText The compressed braille text
 * @param language The ISO 639-1 language code
 * @returns Decompressed text
 */
export function decompressBrailleText(compressedText: string, language: string = 'en'): string {
  let decompressedText = compressedText;
  const script = detectScript(compressedText);
  
  // Get language-specific contractions
  const currentContractions = language === 'en' ? contractions : 
    { ...contractions, ...(languageContractions[language] || {}) };
  
  // Create reverse mapping
  const reverseContractions = Object.fromEntries(
    Object.entries(currentContractions).map(([k, v]) => [v, k])
  );
  
  // Sort by length of replacement (longest first)
  const sortedReverseContractions = Object.entries(reverseContractions)
    .sort((a, b) => b[0].length - a[0].length);
  
  // Special handling for non-Latin scripts
  if (script !== 'latin') {
    switch (script) {
      case 'arabic':
        // Handle RTL text decompression
        for (const [compressed, original] of sortedReverseContractions) {
          decompressedText = decompressedText.replace(new RegExp(compressed, 'g'), original);
        }
        decompressedText = decompressedText
          .split('')
          .reverse()
          .join('');
        break;
      
      default:
        // Default decompression for other scripts
        for (const [compressed, original] of sortedReverseContractions) {
          decompressedText = decompressedText.replace(new RegExp(compressed, 'g'), original);
        }
    }
  } else {
    // Latin script decompression (original logic)
    for (const [compressed, original] of sortedReverseContractions) {
      const regex = new RegExp(compressed, 'g');
      decompressedText = decompressedText.replace(regex, original);
    }
  }
  
  return decompressedText;
}

/**
 * Calculates compression ratio
 * @param original Original text
 * @param compressed Compressed text
 * @returns Compression ratio as a percentage
 */
export function getCompressionRatio(original: string, compressed: string): number {
  return (1 - (compressed.length / original.length)) * 100;
}

/**
 * Translates and compresses text
 * @param text Text to translate and compress
 * @param targetLanguage Target language code
 * @returns Promise with compressed translated text
 */
export async function translateAndCompress(
  text: string, 
  targetLanguage: string
): Promise<{ 
  translated: string, 
  compressed: string, 
  ratio: number 
}> {
  const {Translate} = await import('@google-cloud/translate/build/src/v2/index.js');
  const translate = new Translate();
  
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    const compressed = compressBrailleText(translation, targetLanguage);
    const ratio = getCompressionRatio(translation, compressed);
    
    return {
      translated: translation,
      compressed,
      ratio
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Translation failed: ${errorMessage}`);
  }
}