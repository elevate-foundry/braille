/**
 * BrailleBuddy Language Manager
 * 
 * This module manages different braille standards and languages,
 * allowing for multilingual support and universal braille.
 */

class BrailleLanguageManager {
    constructor() {
        this.languages = {};
        this.currentLanguage = 'en';
        this.currentCode = 'ueb';
        
        // Initialize with English UEB by default
        this.initializeLanguages();
        
        // Load user preference if available
        this.loadUserPreference();
    }
    
    /**
     * Initialize supported languages and braille codes
     */
    initializeLanguages() {
        // English - Unified English Braille (UEB)
        this.addLanguage('en', 'English', {
            'ueb': {
                name: 'Unified English Braille',
                description: 'Modern standard for English braille',
                alphabet: this.getUEBAlphabet(),
                numbers: this.getUEBNumbers(),
                punctuation: this.getUEBPunctuation()
            }
        });
        
        // Spanish - Spanish Braille
        this.addLanguage('es', 'Español', {
            'spanish': {
                name: 'Spanish Braille',
                description: 'Standard braille code for Spanish',
                alphabet: this.getSpanishAlphabet(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getSpanishPunctuation()
            }
        });
        
        // French - French Braille
        this.addLanguage('fr', 'Français', {
            'french': {
                name: 'French Braille',
                description: 'Standard braille code for French',
                alphabet: this.getFrenchAlphabet(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getFrenchPunctuation()
            }
        });
        
        // Russian - Cyrillic Braille
        this.addLanguage('ru', 'Русский', {
            'cyrillic': {
                name: 'Cyrillic Braille',
                description: 'Standard braille code for Russian and other Cyrillic languages',
                alphabet: this.getCyrillicAlphabet(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getUEBPunctuation() // Using standard punctuation for now
            }
        });
        
        // Japanese - Japanese Braille (Kana-based)
        this.addLanguage('ja', '日本語', {
            'japanese': {
                name: 'Japanese Braille',
                description: 'Kana-based braille code for Japanese',
                alphabet: this.getJapaneseBraille(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getUEBPunctuation() // Using standard punctuation for now
            }
        });
        
        // Arabic - Arabic Braille
        this.addLanguage('ar', 'العربية', {
            'arabic': {
                name: 'Arabic Braille',
                description: 'Right-to-left braille code for Arabic',
                alphabet: this.getArabicBraille(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getUEBPunctuation() // Using standard punctuation for now
            }
        });
        
        // Chinese - Mandarin Braille (Pinyin-based)
        this.addLanguage('zh', '中文', {
            'mandarin': {
                name: 'Mandarin Braille',
                description: 'Pinyin-based braille code for Mandarin Chinese',
                alphabet: this.getChineseBraille(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getUEBPunctuation() // Using standard punctuation for now
            }
        });
        
        // Korean - Korean Braille (Jamo-based)
        this.addLanguage('ko', '한국어', {
            'korean': {
                name: 'Korean Braille',
                description: 'Jamo-based braille code for Korean',
                alphabet: this.getKoreanBraille(),
                numbers: this.getUEBNumbers(), // Numbers are often the same
                punctuation: this.getUEBPunctuation() // Using standard punctuation for now
            }
        });
    }
    
    /**
     * Add a language to the supported languages
     * @param {string} code - Language code (e.g., 'en', 'es', 'fr')
     * @param {string} name - Language name
     * @param {Object} brailleCodes - Object containing braille codes for this language
     */
    addLanguage(code, name, brailleCodes) {
        this.languages[code] = {
            name: name,
            brailleCodes: brailleCodes
        };
    }
    
    /**
     * Set the current language and braille code
     * @param {string} languageCode - Language code to set
     * @param {string} brailleCode - Braille code to set
     * @returns {boolean} - Success status
     */
    setLanguage(languageCode, brailleCode) {
        if (!this.languages[languageCode]) {
            console.error(`Language ${languageCode} not supported`);
            return false;
        }
        
        if (!this.languages[languageCode].brailleCodes[brailleCode]) {
            console.error(`Braille code ${brailleCode} not supported for language ${languageCode}`);
            return false;
        }
        
        this.currentLanguage = languageCode;
        this.currentCode = brailleCode;
        
        // Save user preference
        this.saveUserPreference();
        
        // Trigger event for language change
        this.triggerLanguageChangeEvent();
        
        return true;
    }
    
    /**
     * Get the current language code
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Get the current braille code
     * @returns {string} - Current braille code
     */
    getCurrentBrailleCode() {
        return this.currentCode;
    }
    
    /**
     * Get the braille pattern for a character in the current language/code
     * @param {string} char - Character to get pattern for
     * @returns {Array} - Braille dot pattern or null if not found
     */
    getBraillePattern(char) {
        const langData = this.languages[this.currentLanguage];
        if (!langData) return null;
        
        const codeData = langData.brailleCodes[this.currentCode];
        if (!codeData) return null;
        
        // Check in alphabet
        if (codeData.alphabet[char.toLowerCase()]) {
            return codeData.alphabet[char.toLowerCase()];
        }
        
        // Check in numbers
        if (codeData.numbers[char]) {
            return codeData.numbers[char];
        }
        
        // Check in punctuation
        if (codeData.punctuation[char]) {
            return codeData.punctuation[char];
        }
        
        return null;
    }
    
    /**
     * Get all supported languages
     * @returns {Object} - All supported languages
     */
    getSupportedLanguages() {
        const result = {};
        for (const [code, data] of Object.entries(this.languages)) {
            result[code] = data.name;
        }
        return result;
    }
    
    /**
     * Get all supported braille codes for a language
     * @param {string} languageCode - Language code
     * @returns {Object} - All supported braille codes for the language
     */
    getSupportedBrailleCodes(languageCode) {
        if (!this.languages[languageCode]) {
            return {};
        }
        
        const result = {};
        for (const [code, data] of Object.entries(this.languages[languageCode].brailleCodes)) {
            result[code] = data.name;
        }
        return result;
    }
    
    /**
     * Get the alphabet for the current language/code
     * @returns {Object} - Alphabet mapping for current language/code
     */
    getCurrentAlphabet() {
        const langData = this.languages[this.currentLanguage];
        if (!langData) return {};
        
        const codeData = langData.brailleCodes[this.currentCode];
        if (!codeData) return {};
        
        return codeData.alphabet;
    }
    
    /**
     * Save user language preference to localStorage
     */
    saveUserPreference() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('brailleBuddyLanguage', this.currentLanguage);
            localStorage.setItem('brailleBuddyBrailleCode', this.currentCode);
        }
    }
    
    /**
     * Load user language preference from localStorage
     */
    loadUserPreference() {
        if (typeof localStorage !== 'undefined') {
            const savedLanguage = localStorage.getItem('brailleBuddyLanguage');
            const savedCode = localStorage.getItem('brailleBuddyBrailleCode');
            
            if (savedLanguage && this.languages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
            
            if (savedCode && 
                this.languages[this.currentLanguage] && 
                this.languages[this.currentLanguage].brailleCodes[savedCode]) {
                this.currentCode = savedCode;
            }
        }
    }
    
    /**
     * Trigger a custom event for language change
     */
    triggerLanguageChangeEvent() {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('brailleLanguageChanged', {
                detail: {
                    language: this.currentLanguage,
                    brailleCode: this.currentCode
                }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Get UEB alphabet patterns
     * @returns {Object} - UEB alphabet patterns
     */
    getUEBAlphabet() {
        return {
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
            'ñ': [1, 1, 0, 1, 1, 1] // Spanish letter
        };
    }
    
    /**
     * Get UEB number patterns
     * @returns {Object} - UEB number patterns
     */
    getUEBNumbers() {
        return {
            '1': [1, 0, 0, 0, 0, 0],
            '2': [1, 1, 0, 0, 0, 0],
            '3': [1, 0, 0, 1, 0, 0],
            '4': [1, 0, 0, 1, 1, 0],
            '5': [1, 0, 0, 0, 1, 0],
            '6': [1, 1, 0, 1, 0, 0],
            '7': [1, 1, 0, 1, 1, 0],
            '8': [1, 1, 0, 0, 1, 0],
            '9': [0, 1, 0, 1, 0, 0],
            '0': [0, 1, 0, 1, 1, 0]
        };
    }
    
    /**
     * Get UEB punctuation patterns
     * @returns {Object} - UEB punctuation patterns
     */
    getUEBPunctuation() {
        return {
            '.': [0, 0, 1, 1, 0, 0],
            ',': [0, 1, 0, 0, 0, 0],
            ';': [0, 1, 1, 0, 0, 0],
            ':': [0, 1, 0, 0, 1, 0],
            '?': [0, 1, 0, 0, 0, 1],
            '!': [0, 1, 1, 0, 1, 0],
            "'": [0, 0, 1, 0, 0, 0],
            '-': [0, 0, 1, 0, 0, 1],
            '/': [0, 0, 1, 1, 0, 1]
        };
    }
    
    /**
     * Get Spanish alphabet patterns
     * @returns {Object} - Spanish alphabet patterns
     */
    getSpanishAlphabet() {
        // Start with UEB as base
        const spanishAlphabet = this.getUEBAlphabet();
        
        // Add or modify Spanish-specific characters
        spanishAlphabet['á'] = [1, 0, 0, 0, 0, 1]; // a with accent
        spanishAlphabet['é'] = [1, 0, 0, 0, 1, 1]; // e with accent
        spanishAlphabet['í'] = [0, 1, 0, 1, 0, 1]; // i with accent
        spanishAlphabet['ó'] = [1, 0, 1, 0, 1, 1]; // o with accent
        spanishAlphabet['ú'] = [1, 0, 1, 0, 0, 1]; // u with accent
        spanishAlphabet['ü'] = [1, 1, 0, 1, 1, 1]; // u with diaeresis
        spanishAlphabet['ñ'] = [1, 1, 0, 1, 1, 1]; // n with tilde
        
        return spanishAlphabet;
    }
    
    /**
     * Get Spanish punctuation patterns
     * @returns {Object} - Spanish punctuation patterns
     */
    getSpanishPunctuation() {
        // Start with UEB as base
        const spanishPunctuation = this.getUEBPunctuation();
        
        // Add Spanish-specific punctuation
        spanishPunctuation['¿'] = [0, 1, 0, 0, 1, 1]; // inverted question mark
        spanishPunctuation['¡'] = [0, 1, 1, 0, 1, 1]; // inverted exclamation mark
        
        return spanishPunctuation;
    }
    
    /**
     * Get French alphabet patterns
     * @returns {Object} - French alphabet patterns
     */
    getFrenchAlphabet() {
        // Start with UEB as base
        const frenchAlphabet = this.getUEBAlphabet();
        
        // Add or modify French-specific characters
        frenchAlphabet['à'] = [1, 0, 0, 0, 0, 1]; // a with grave accent
        frenchAlphabet['â'] = [1, 0, 0, 0, 1, 1]; // a with circumflex
        frenchAlphabet['ç'] = [1, 0, 0, 1, 0, 1]; // c with cedilla
        frenchAlphabet['é'] = [1, 0, 0, 0, 1, 1]; // e with acute accent
        frenchAlphabet['è'] = [1, 1, 0, 0, 1, 1]; // e with grave accent
        frenchAlphabet['ê'] = [1, 1, 0, 1, 0, 1]; // e with circumflex
        frenchAlphabet['ë'] = [1, 1, 0, 1, 1, 1]; // e with diaeresis
        frenchAlphabet['î'] = [0, 1, 0, 1, 0, 1]; // i with circumflex
        frenchAlphabet['ï'] = [0, 1, 0, 1, 1, 1]; // i with diaeresis
        frenchAlphabet['ô'] = [1, 0, 1, 0, 1, 1]; // o with circumflex
        frenchAlphabet['ù'] = [1, 0, 1, 0, 0, 1]; // u with grave accent
        frenchAlphabet['û'] = [1, 0, 1, 1, 0, 1]; // u with circumflex
        frenchAlphabet['ü'] = [1, 0, 1, 1, 1, 1]; // u with diaeresis
        
        return frenchAlphabet;
    }
    
    /**
     * Get French punctuation patterns
     * @returns {Object} - French punctuation patterns
     */
    getFrenchPunctuation() {
        // Start with UEB as base
        const frenchPunctuation = this.getUEBPunctuation();
        
        // Add French-specific punctuation
        frenchPunctuation['«'] = [0, 0, 1, 1, 1, 0]; // left guillemet
        frenchPunctuation['»'] = [0, 0, 1, 1, 1, 1]; // right guillemet
        
        return frenchPunctuation;
    }
    
    /**
     * Get Cyrillic alphabet patterns (Russian and other Cyrillic languages)
     * @returns {Object} - Cyrillic alphabet patterns
     */
    getCyrillicAlphabet() {
        return {
            'а': [1, 0, 0, 0, 0, 0],  'б': [1, 1, 0, 0, 0, 0],
            'в': [0, 1, 0, 1, 0, 0],  'г': [1, 1, 0, 1, 0, 0],
            'д': [1, 0, 0, 1, 1, 0],  'е': [1, 0, 0, 0, 1, 0],
            'ё': [1, 0, 0, 0, 1, 1],  'ж': [0, 1, 0, 1, 1, 0],
            'з': [1, 0, 1, 1, 0, 0],  'и': [0, 1, 1, 0, 0, 0],
            'й': [1, 2, 4, 0, 0, 0],  'к': [1, 0, 1, 0, 0, 0],
            'л': [1, 1, 1, 0, 0, 0],  'м': [1, 0, 1, 1, 0, 0],
            'н': [1, 0, 1, 1, 1, 0],  'о': [1, 0, 1, 0, 1, 0],
            'п': [1, 1, 1, 1, 0, 0],  'р': [1, 1, 1, 0, 1, 0],
            'с': [0, 1, 1, 1, 0, 0],  'т': [0, 1, 1, 1, 1, 0],
            'у': [1, 0, 1, 0, 0, 1],  'ф': [1, 1, 0, 1, 0, 0],
            'х': [1, 0, 0, 1, 0, 0],  'ц': [1, 0, 0, 1, 0, 1],
            'ч': [1, 1, 0, 1, 1, 1],  'ш': [1, 0, 0, 0, 1, 1],
            'щ': [1, 0, 1, 1, 0, 1],  'ъ': [1, 1, 1, 0, 1, 1],
            'ы': [0, 1, 1, 0, 1, 0],  'ь': [0, 1, 1, 0, 1, 1],
            'э': [0, 1, 0, 0, 1, 0],  'ю': [1, 1, 0, 0, 1, 1],
            'я': [1, 0, 1, 0, 1, 1]
        };
    }
    
    /**
     * Get Japanese Braille patterns (Kana-based)
     * @returns {Object} - Japanese Braille patterns for Kana
     */
    getJapaneseBraille() {
        return {
            // Hiragana - basic syllables
            'あ': [1, 0, 0, 0, 0, 0],  'い': [1, 0, 0, 1, 0, 0],
            'う': [1, 1, 0, 0, 0, 0],  'え': [1, 0, 0, 0, 1, 0],
            'お': [1, 0, 0, 1, 1, 0],  'か': [0, 1, 0, 0, 0, 0],
            'き': [0, 1, 0, 1, 0, 0],  'く': [0, 1, 1, 0, 0, 0],
            'け': [0, 1, 0, 0, 1, 0],  'こ': [0, 1, 0, 1, 1, 0],
            'さ': [0, 0, 0, 1, 0, 0],  'し': [0, 0, 0, 1, 1, 0],
            'す': [0, 0, 1, 1, 0, 0],  'せ': [0, 0, 0, 1, 0, 1],
            'そ': [0, 0, 0, 1, 1, 1],  'た': [0, 0, 1, 0, 0, 0],
            'ち': [0, 0, 1, 0, 1, 0],  'つ': [0, 0, 1, 0, 0, 1],
            'て': [0, 0, 1, 0, 1, 1],  'と': [0, 0, 1, 1, 0, 1],
            'な': [1, 1, 0, 0, 1, 0],  'に': [1, 1, 0, 1, 0, 0],
            'ぬ': [1, 1, 1, 0, 0, 0],  'ね': [1, 1, 0, 0, 1, 1],
            'の': [1, 1, 0, 1, 0, 1],  'は': [1, 0, 1, 0, 0, 0],
            'ひ': [1, 0, 1, 0, 1, 0],  'ふ': [1, 0, 1, 0, 0, 1],
            'へ': [1, 0, 1, 0, 1, 1],  'ほ': [1, 0, 1, 1, 0, 1],
            'ま': [1, 0, 1, 1, 0, 0],  'み': [1, 0, 1, 1, 1, 0],
            'む': [1, 0, 1, 1, 0, 1],  'め': [1, 0, 1, 1, 1, 1],
            'も': [1, 0, 1, 1, 1, 1],  'や': [0, 1, 1, 0, 1, 0],
            'ゆ': [0, 1, 1, 0, 1, 1],  'よ': [0, 1, 1, 1, 0, 1],
            'ら': [0, 1, 1, 1, 0, 0],  'り': [0, 1, 1, 1, 1, 0],
            'る': [0, 1, 1, 1, 0, 1],  'れ': [0, 1, 1, 1, 1, 1],
            'ろ': [0, 1, 1, 1, 1, 1],  'わ': [0, 0, 1, 1, 1, 0],
            'を': [0, 0, 1, 1, 1, 1],  'ん': [0, 0, 1, 1, 1, 1]
        };
    }
    
    /**
     * Get Arabic Braille patterns
     * @returns {Object} - Arabic Braille patterns
     */
    getArabicBraille() {
        return {
            'ا': [1, 0, 0, 0, 0, 0],  'ب': [1, 1, 0, 0, 0, 0],
            'ت': [0, 1, 0, 1, 0, 0],  'ث': [1, 1, 1, 0, 0, 0],
            'ج': [0, 1, 0, 1, 1, 0],  'ح': [1, 0, 0, 1, 0, 0],
            'خ': [1, 0, 0, 1, 1, 0],  'د': [1, 0, 0, 0, 1, 0],
            'ذ': [1, 1, 0, 1, 0, 0],  'ر': [1, 1, 0, 1, 1, 0],
            'ز': [1, 1, 0, 0, 1, 0],  'س': [0, 1, 0, 0, 0, 0],
            'ش': [1, 0, 1, 0, 0, 0],  'ص': [1, 1, 1, 0, 0, 0],
            'ض': [1, 0, 1, 1, 0, 0],  'ط': [1, 0, 1, 1, 1, 0],
            'ظ': [1, 0, 1, 0, 1, 0],  'ع': [1, 1, 1, 1, 0, 0],
            'غ': [1, 1, 1, 0, 1, 0],  'ف': [0, 1, 1, 1, 0, 0],
            'ق': [0, 1, 1, 1, 1, 0],  'ك': [1, 0, 1, 0, 0, 1],
            'ل': [1, 1, 1, 0, 0, 1],  'م': [0, 1, 0, 1, 1, 1],
            'ن': [1, 0, 1, 1, 0, 1],  'ه': [1, 0, 1, 0, 1, 1],
            'و': [0, 1, 1, 0, 1, 1],  'ي': [0, 1, 0, 0, 1, 1],
            'ء': [0, 0, 1, 0, 0, 1],  'ة': [1, 1, 0, 0, 1, 1]
        };
    }
    
    /**
     * Get Chinese Braille patterns (Pinyin-based with tones)
     * @returns {Object} - Chinese Braille patterns for common pinyin syllables
     */
    getChineseBraille() {
        // This is a simplified implementation focusing on common syllables with tones
        // In a full implementation, we would have a more comprehensive mapping
        return {
            // Common syllables with tone 1 (high level) - examples
            'ma1': [1, 0, 0, 0, 0, 1],  // mā (妈 - mother)
            'ba1': [1, 1, 0, 0, 0, 1],  // bā
            'ta1': [1, 0, 0, 1, 0, 1],  // tā
            'da1': [1, 0, 0, 1, 1, 1],  // dā
            'na1': [1, 0, 0, 0, 1, 1],  // nā
            
            // Common syllables with tone 2 (rising) - examples
            'ma2': [1, 0, 0, 0, 0, 2],  // má (麻 - hemp)
            'ba2': [1, 1, 0, 0, 0, 2],  // bá
            'ta2': [1, 0, 0, 1, 0, 2],  // tá
            'da2': [1, 0, 0, 1, 1, 2],  // dá
            'na2': [1, 0, 0, 0, 1, 2],  // ná
            
            // Common syllables with tone 3 (falling-rising) - examples
            'ma3': [1, 0, 0, 0, 0, 3],  // mǎ (马 - horse)
            'ba3': [1, 1, 0, 0, 0, 3],  // bǎ
            'ta3': [1, 0, 0, 1, 0, 3],  // tǎ
            'da3': [1, 0, 0, 1, 1, 3],  // dǎ
            'na3': [1, 0, 0, 0, 1, 3],  // nǎ
            
            // Common syllables with tone 4 (falling) - examples
            'ma4': [1, 0, 0, 0, 0, 4],  // mà (骂 - scold)
            'ba4': [1, 1, 0, 0, 0, 4],  // bà
            'ta4': [1, 0, 0, 1, 0, 4],  // tà
            'da4': [1, 0, 0, 1, 1, 4],  // dà
            'na4': [1, 0, 0, 0, 1, 4],  // nà
            
            // Neutral tone examples
            'ma0': [1, 0, 0, 0, 0, 0],  // ma (neutral tone)
            'ba0': [1, 1, 0, 0, 0, 0],  // ba (neutral tone)
            'ta0': [1, 0, 0, 1, 0, 0],  // ta (neutral tone)
            'da0': [1, 0, 0, 1, 1, 0],  // da (neutral tone)
            'na0': [1, 0, 0, 0, 1, 0]   // na (neutral tone)
        };
    }
    
    /**
     * Get Korean Braille patterns (Jamo-based)
     * @returns {Object} - Korean Braille patterns for Jamo (consonants and vowels)
     */
    getKoreanBraille() {
        return {
            // Consonants (초성/자음)
            'ㄱ': [1, 0, 0, 0, 0, 0],  // g/k
            'ㄴ': [0, 1, 0, 0, 0, 0],  // n
            'ㄷ': [0, 0, 1, 0, 0, 0],  // d/t
            'ㄹ': [0, 0, 0, 1, 0, 0],  // r/l
            'ㅁ': [0, 0, 0, 0, 1, 0],  // m
            'ㅂ': [0, 0, 0, 0, 0, 1],  // b/p
            'ㅅ': [0, 0, 1, 1, 0, 0],  // s
            'ㅇ': [1, 1, 1, 1, 1, 1],  // ng (silent when initial)
            'ㅈ': [0, 0, 0, 1, 1, 0],  // j
            'ㅊ': [0, 0, 0, 0, 1, 1],  // ch
            'ㅋ': [1, 1, 0, 0, 0, 0],  // k
            'ㅌ': [1, 0, 1, 0, 0, 0],  // t
            'ㅍ': [1, 0, 0, 1, 0, 0],  // p
            'ㅎ': [0, 1, 0, 1, 0, 0],  // h
            
            // Vowels (중성/모음)
            'ㅏ': [1, 0, 0, 0, 1, 0],  // a
            'ㅑ': [0, 1, 0, 0, 1, 0],  // ya
            'ㅓ': [0, 1, 0, 0, 1, 1],  // eo
            'ㅕ': [1, 0, 0, 0, 1, 1],  // yeo
            'ㅗ': [1, 0, 1, 0, 1, 0],  // o
            'ㅛ': [0, 1, 1, 0, 1, 0],  // yo
            'ㅜ': [1, 0, 1, 0, 1, 1],  // u
            'ㅠ': [0, 1, 1, 0, 1, 1],  // yu
            'ㅡ': [0, 1, 0, 1, 1, 0],  // eu
            'ㅣ': [1, 0, 0, 1, 1, 0],  // i
            'ㅐ': [1, 1, 0, 0, 1, 0],  // ae
            'ㅒ': [1, 1, 0, 0, 1, 1],  // yae
            'ㅔ': [0, 1, 1, 1, 1, 0],  // e
            'ㅖ': [1, 0, 1, 1, 1, 0],  // ye
            'ㅘ': [1, 1, 1, 0, 1, 0],  // wa
            'ㅙ': [1, 1, 1, 0, 1, 1],  // wae
            'ㅚ': [0, 1, 1, 1, 1, 1],  // oe
            'ㅝ': [1, 1, 1, 1, 1, 0],  // wo
            'ㅞ': [1, 1, 1, 1, 1, 1],  // we
            'ㅟ': [0, 1, 0, 1, 1, 1],  // wi
            'ㅢ': [1, 0, 0, 1, 1, 1]   // ui
        };
    }
    
    /**
     * Get haptic feedback patterns for common contractions and phonemes
     * @returns {Object} - Haptic patterns for contractions
     */
    getHapticPatterns() {
        return {
            // English contractions
            "th": [50, 100, 50],     // Short pulse, long pulse, short
            "ing": [100, 200, 100], // Rising intensity
            "the": [150, 50, 150],   // Wave-like
            "and": [100, 100, 100],  // Equal pulses
            "er": [200, 50],        // Long-short
            "ou": [50, 200],        // Short-long
            
            // Phonetic patterns for tones (Chinese)
            "tone1": [200],           // High level tone - single long pulse
            "tone2": [50, 150],       // Rising tone - short then long
            "tone3": [100, 50, 100],  // Falling-rising tone - medium, short, medium
            "tone4": [150, 50],       // Falling tone - long then short
            
            // Japanese syllabic patterns
            "kana": [50, 50, 50],     // Three short pulses for syllabic nature
            "kanji": [150, 100, 150], // Complex pattern for kanji characters
            
            // Korean jamo combinations
            "jamo": [30, 60, 90],     // Increasing intensity for jamo combinations
            "batchim": [100, 30]      // Pattern for final consonants (받침)
        };
    }
    
    /**
     * Convert text to braille patterns based on current language
     * @param {string} text - Text to convert to braille
     * @returns {Array} - Array of braille patterns
     */
    convertTextToBraille(text) {
        const currentAlphabet = this.getCurrentAlphabet();
        const patterns = [];
        
        // Handle different languages differently
        switch(this.currentLanguage) {
            case 'zh': // Chinese needs special handling for pinyin
                // This would require a pinyin converter in a real implementation
                // For now, we'll just handle basic characters as a placeholder
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    // In a real implementation, we would convert to pinyin with tone
                    // and look up the corresponding pattern
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
                break;
                
            case 'ko': // Korean needs special handling for Hangul decomposition
                // This would require Hangul decomposition into Jamo in a real implementation
                // For now, we'll just handle basic characters as a placeholder
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    // In a real implementation, we would decompose Hangul into Jamo
                    // and combine the corresponding patterns
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
                break;
                
            default: // Default character-by-character conversion
                for (let i = 0; i < text.length; i++) {
                    const char = text[i].toLowerCase();
                    patterns.push(currentAlphabet[char] || [0, 0, 0, 0, 0, 0]);
                }
        }
        
        return patterns;
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.brailleLanguageManager = new BrailleLanguageManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleLanguageManager;
}
