/**
 * Nemeth Code Implementation for Mathematics
 * 
 * Provides mathematical notation in braille using Nemeth Code
 * Supports operators, symbols, fractions, exponents, and more
 */

class NemethCode {
    constructor() {
        this.unicode = new Braille8DotUnicode();
        
        // Initialize mathematical symbol mappings
        this.mathSymbols = this.initializeMathSymbols();
        this.greekLetters = this.initializeGreekLetters();
        this.operators = this.initializeOperators();
        this.indicators = this.initializeIndicators();
    }

    /**
     * Initialize basic mathematical symbols
     */
    initializeMathSymbols() {
        return {
            // Basic operators
            '+': [3, 4, 6],           // Plus
            '−': [3, 6],              // Minus (different from hyphen)
            '×': [1, 6],              // Times/multiply
            '÷': [3, 4],              // Divide
            '=': [1, 2, 3, 4, 5, 6],  // Equals
            
            // Comparison
            '<': [1, 2, 6],           // Less than
            '>': [3, 4, 5],           // Greater than
            '≤': [1, 2, 6, 8],        // Less than or equal
            '≥': [3, 4, 5, 8],        // Greater than or equal
            '≠': [1, 2, 3, 4, 5, 6, 8], // Not equal
            
            // Fractions and division
            '/': [3, 4],              // Fraction line
            '⁄': [4, 5, 6],           // Solidus (inline fraction)
            
            // Powers and roots
            '^': [4, 5],              // Superscript indicator
            '_': [5, 6],              // Subscript indicator
            '√': [3, 4, 5, 6],        // Square root
            '∛': [3, 4, 5, 6, 7],     // Cube root
            
            // Calculus
            '∫': [2, 3, 4, 6],        // Integral
            '∑': [2, 3, 4, 5, 6],     // Summation
            '∏': [1, 2, 3, 4, 6],     // Product
            '∂': [4, 7],              // Partial derivative
            '∇': [1, 4, 6, 7],        // Nabla/del
            
            // Set theory
            '∈': [4, 5, 1, 2, 3, 5, 6], // Element of
            '∉': [4, 5, 1, 2, 3, 5, 6, 8], // Not element of
            '⊂': [1, 2, 6, 7],        // Subset
            '⊃': [3, 4, 5, 7],        // Superset
            '∪': [2, 3, 4, 6, 7],     // Union
            '∩': [2, 3, 5, 6, 7],     // Intersection
            '∅': [4, 5, 6, 7, 8],     // Empty set
            
            // Logic
            '∧': [3, 4, 6, 7],        // Logical AND
            '∨': [2, 3, 6, 7],        // Logical OR
            '¬': [3, 4, 5, 6, 7],     // Logical NOT
            '⇒': [1, 2, 3, 5, 6, 7],  // Implies
            '⇔': [1, 2, 3, 4, 5, 6, 7], // If and only if
            
            // Infinity and limits
            '∞': [1, 2, 3, 4, 5, 6, 7], // Infinity
            '→': [1, 2, 5, 6, 7],     // Arrow/approaches
            '←': [2, 4, 6, 7],        // Left arrow
            
            // Parentheses and brackets
            '(': [1, 2, 3, 5, 6],     // Left parenthesis
            ')': [2, 3, 4, 5, 6],     // Right parenthesis
            '[': [2, 4, 6],           // Left bracket
            ']': [1, 2, 4, 5, 6],     // Right bracket
            '{': [2, 4, 6, 7],        // Left brace
            '}': [1, 2, 4, 5, 6, 7],  // Right brace
            
            // Special
            '°': [3, 5, 6],           // Degree
            '%': [1, 4, 6],           // Percent
            '‰': [1, 4, 6, 7],        // Per mille
            '±': [3, 4, 6, 8],        // Plus-minus
            '∓': [3, 6, 8],           // Minus-plus
        };
    }

    /**
     * Initialize Greek letters
     */
    initializeGreekLetters() {
        return {
            // Lowercase Greek
            'α': [1],      // alpha
            'β': [1, 2],   // beta
            'γ': [1, 2, 4, 5], // gamma
            'δ': [1, 4, 5], // delta
            'ε': [1, 5],   // epsilon
            'ζ': [1, 3, 5, 6], // zeta
            'η': [1, 5, 6], // eta
            'θ': [1, 4, 5, 6], // theta
            'ι': [2, 4],   // iota
            'κ': [1, 3],   // kappa
            'λ': [1, 2, 3], // lambda
            'μ': [1, 3, 4], // mu
            'ν': [1, 3, 4, 5], // nu
            'ξ': [1, 3, 4, 6], // xi
            'ο': [1, 3, 5], // omicron
            'π': [1, 2, 3, 4], // pi
            'ρ': [1, 2, 3, 5], // rho
            'σ': [2, 3, 4], // sigma
            'τ': [2, 3, 4, 5], // tau
            'υ': [1, 3, 6], // upsilon
            'φ': [1, 2, 4], // phi
            'χ': [1, 3, 4, 6], // chi
            'ψ': [1, 3, 4, 5, 6], // psi
            'ω': [2, 4, 5, 6], // omega
            
            // Uppercase Greek (add dot 6)
            'Α': [1, 6],   // Alpha
            'Β': [1, 2, 6], // Beta
            'Γ': [1, 2, 4, 5, 6], // Gamma
            'Δ': [1, 4, 5, 6], // Delta
            'Θ': [1, 4, 5, 6, 6], // Theta
            'Λ': [1, 2, 3, 6], // Lambda
            'Π': [1, 2, 3, 4, 6], // Pi
            'Σ': [2, 3, 4, 6], // Sigma
            'Φ': [1, 2, 4, 6], // Phi
            'Ω': [2, 4, 5, 6, 6], // Omega
        };
    }

    /**
     * Initialize mathematical operators
     */
    initializeOperators() {
        return {
            'sin': [2, 3, 4],
            'cos': [1, 4],
            'tan': [2, 3, 4, 5],
            'log': [1, 2, 3],
            'ln': [1, 2, 3, 4, 5],
            'exp': [1, 5],
            'lim': [1, 2, 3],
            'max': [1, 3, 4],
            'min': [1, 3, 4],
            'det': [1, 4, 5],
            'dim': [1, 4, 5],
        };
    }

    /**
     * Initialize Nemeth indicators
     */
    initializeIndicators() {
        return {
            'number': [3, 4, 5, 6],        // Number indicator
            'letter': [5, 6],              // Letter indicator
            'capital': [6],                // Capital letter indicator
            'greek': [4, 6],               // Greek letter indicator
            'superscript_start': [4, 5],   // Superscript opening
            'superscript_end': [4, 5],     // Superscript closing
            'subscript_start': [5, 6],     // Subscript opening
            'subscript_end': [5, 6],       // Subscript closing
            'fraction_start': [1, 4, 5, 6], // Fraction opening
            'fraction_line': [3, 4],       // Fraction line
            'fraction_end': [3, 4, 5, 6],  // Fraction closing
            'radical_start': [3, 4, 5, 6], // Radical opening
            'radical_end': [1, 2, 4, 5, 6], // Radical closing
            'matrix_start': [1, 2, 4, 6],  // Matrix opening
            'matrix_end': [3, 4, 5, 6],    // Matrix closing
        };
    }

    /**
     * Convert mathematical expression to Nemeth braille
     */
    expressionToBraille(expression) {
        // This is a simplified version - full implementation would need a parser
        let result = [];
        let i = 0;
        
        while (i < expression.length) {
            const char = expression[i];
            
            // Check for multi-character operators
            if (i < expression.length - 2) {
                const threeChar = expression.substr(i, 3);
                if (this.operators[threeChar]) {
                    result.push(this.unicode.dotsToUnicode(this.operators[threeChar]));
                    i += 3;
                    continue;
                }
            }
            
            // Check for two-character operators
            if (i < expression.length - 1) {
                const twoChar = expression.substr(i, 2);
                if (this.operators[twoChar]) {
                    result.push(this.unicode.dotsToUnicode(this.operators[twoChar]));
                    i += 2;
                    continue;
                }
            }
            
            // Single character
            if (this.mathSymbols[char]) {
                result.push(this.unicode.dotsToUnicode(this.mathSymbols[char]));
            } else if (this.greekLetters[char]) {
                // Add Greek indicator
                result.push(this.unicode.dotsToUnicode(this.indicators.greek));
                result.push(this.unicode.dotsToUnicode(this.greekLetters[char]));
            } else if (char >= '0' && char <= '9') {
                // Numbers
                const digitDots = this.getDigitDots(char);
                result.push(this.unicode.dotsToUnicode(digitDots));
            } else if (char >= 'a' && char <= 'z') {
                // Lowercase letters
                const letterDots = this.getLetterDots(char);
                result.push(this.unicode.dotsToUnicode(letterDots));
            } else if (char >= 'A' && char <= 'Z') {
                // Uppercase letters
                result.push(this.unicode.dotsToUnicode(this.indicators.capital));
                const letterDots = this.getLetterDots(char.toLowerCase());
                result.push(this.unicode.dotsToUnicode(letterDots));
            } else if (char === ' ') {
                result.push('⠀'); // Space
            }
            
            i++;
        }
        
        return result.join('');
    }

    /**
     * Get braille dots for a digit
     */
    getDigitDots(digit) {
        const digitMap = {
            '0': [3, 5, 6],
            '1': [2],
            '2': [2, 3],
            '3': [2, 5],
            '4': [2, 5, 6],
            '5': [2, 6],
            '6': [2, 3, 5],
            '7': [2, 3, 5, 6],
            '8': [2, 3, 6],
            '9': [3, 5]
        };
        return digitMap[digit] || [];
    }

    /**
     * Get braille dots for a letter
     */
    getLetterDots(letter) {
        const letterMap = {
            'a': [1], 'b': [1, 2], 'c': [1, 4], 'd': [1, 4, 5], 'e': [1, 5],
            'f': [1, 2, 4], 'g': [1, 2, 4, 5], 'h': [1, 2, 5], 'i': [2, 4], 'j': [2, 4, 5],
            'k': [1, 3], 'l': [1, 2, 3], 'm': [1, 3, 4], 'n': [1, 3, 4, 5], 'o': [1, 3, 5],
            'p': [1, 2, 3, 4], 'q': [1, 2, 3, 4, 5], 'r': [1, 2, 3, 5], 's': [2, 3, 4], 't': [2, 3, 4, 5],
            'u': [1, 3, 6], 'v': [1, 2, 3, 6], 'w': [2, 4, 5, 6], 'x': [1, 3, 4, 6], 'y': [1, 3, 4, 5, 6], 'z': [1, 3, 5, 6]
        };
        return letterMap[letter] || [];
    }

    /**
     * Create a fraction in Nemeth
     */
    createFraction(numerator, denominator) {
        const result = [];
        
        // Opening fraction indicator
        result.push(this.unicode.dotsToUnicode(this.indicators.fraction_start));
        
        // Numerator
        result.push(this.expressionToBraille(numerator));
        
        // Fraction line
        result.push(this.unicode.dotsToUnicode(this.indicators.fraction_line));
        
        // Denominator
        result.push(this.expressionToBraille(denominator));
        
        // Closing fraction indicator
        result.push(this.unicode.dotsToUnicode(this.indicators.fraction_end));
        
        return result.join('');
    }

    /**
     * Create a superscript (exponent)
     */
    createSuperscript(base, exponent) {
        const result = [];
        
        result.push(this.expressionToBraille(base));
        result.push(this.unicode.dotsToUnicode(this.indicators.superscript_start));
        result.push(this.expressionToBraille(exponent));
        result.push(this.unicode.dotsToUnicode(this.indicators.superscript_end));
        
        return result.join('');
    }

    /**
     * Create a subscript
     */
    createSubscript(base, subscript) {
        const result = [];
        
        result.push(this.expressionToBraille(base));
        result.push(this.unicode.dotsToUnicode(this.indicators.subscript_start));
        result.push(this.expressionToBraille(subscript));
        result.push(this.unicode.dotsToUnicode(this.indicators.subscript_end));
        
        return result.join('');
    }

    /**
     * Create a square root
     */
    createSquareRoot(radicand) {
        const result = [];
        
        result.push(this.unicode.dotsToUnicode(this.indicators.radical_start));
        result.push(this.expressionToBraille(radicand));
        result.push(this.unicode.dotsToUnicode(this.indicators.radical_end));
        
        return result.join('');
    }

    /**
     * Get symbol information
     */
    getSymbolInfo(symbol) {
        let dots = null;
        let category = 'Unknown';
        
        if (this.mathSymbols[symbol]) {
            dots = this.mathSymbols[symbol];
            category = 'Mathematical Symbol';
        } else if (this.greekLetters[symbol]) {
            dots = this.greekLetters[symbol];
            category = 'Greek Letter';
        } else if (this.operators[symbol]) {
            dots = this.operators[symbol];
            category = 'Mathematical Operator';
        }
        
        if (dots) {
            return {
                symbol: symbol,
                category: category,
                dots: dots,
                unicode: this.unicode.dotsToUnicode(dots),
                description: this.getSymbolDescription(symbol)
            };
        }
        
        return null;
    }

    /**
     * Get symbol description
     */
    getSymbolDescription(symbol) {
        const descriptions = {
            '+': 'Plus / Addition',
            '−': 'Minus / Subtraction',
            '×': 'Times / Multiplication',
            '÷': 'Divide / Division',
            '=': 'Equals',
            '<': 'Less than',
            '>': 'Greater than',
            '≤': 'Less than or equal to',
            '≥': 'Greater than or equal to',
            '≠': 'Not equal to',
            '√': 'Square root',
            '∫': 'Integral',
            '∑': 'Summation',
            '∏': 'Product',
            '∂': 'Partial derivative',
            '∈': 'Element of',
            '⊂': 'Subset of',
            '∪': 'Union',
            '∩': 'Intersection',
            '∞': 'Infinity',
            'π': 'Pi',
            'α': 'Alpha',
            'β': 'Beta',
            'γ': 'Gamma',
            'δ': 'Delta',
            'θ': 'Theta',
            'λ': 'Lambda',
            'μ': 'Mu',
            'σ': 'Sigma',
            'ω': 'Omega'
        };
        
        return descriptions[symbol] || symbol;
    }

    /**
     * Get all mathematical symbols
     */
    getAllSymbols() {
        const all = [];
        
        for (const [symbol, dots] of Object.entries(this.mathSymbols)) {
            all.push(this.getSymbolInfo(symbol));
        }
        
        return all;
    }

    /**
     * Get all Greek letters
     */
    getAllGreekLetters() {
        const all = [];
        
        for (const [letter, dots] of Object.entries(this.greekLetters)) {
            all.push(this.getSymbolInfo(letter));
        }
        
        return all;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NemethCode;
}
