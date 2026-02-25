/**
 * ⡂⡲⡡⡩⡬⡬⡥ Lexer — Tokenizer for Braille source code
 * 
 * Reads a string of U+2800–U+28FF characters and produces a token stream.
 * 
 * Token types:
 *   KEYWORD, OPERATOR, DELIMITER, NUMBER, STRING, IDENTIFIER, 
 *   AI_PRIMITIVE, COMMENT, EOF
 */

const {
    KEYWORDS, OPERATORS, DELIMITERS,
    NUMBER_SIGN, IDENT_SIGN, STRING_DELIM, COMMENT,
    isKeyword, isOperator, isDelimiter,
    fromBraille, toBraille, isBraille
} = require('./spec');

class Token {
    constructor(type, value, offset, line, col, meta = {}) {
        this.type = type;
        this.value = value;       // The braille string
        this.offset = offset;     // Character offset in source
        this.line = line;
        this.col = col;
        this.meta = meta;         // Additional info (resolved keyword, concept, etc.)
    }

    toString() {
        return `Token(${this.type}, ${JSON.stringify(this.value)}, L${this.line}:${this.col})`;
    }
}

class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.tokens = [];
    }

    /**
     * Tokenize the entire source and return the token array.
     * @returns {Token[]}
     */
    tokenize() {
        this.tokens = [];
        while (this.pos < this.source.length) {
            const token = this._nextToken();
            if (token) {
                this.tokens.push(token);
            }
        }
        this.tokens.push(new Token('EOF', '', this.pos, this.line, this.col));
        return this.tokens;
    }

    /**
     * Read the next token from the source.
     * 
     * TOKENIZATION STRATEGY: Whitespace-delimited.
     * A contiguous run of braille characters (no spaces/newlines between them)
     * is read as a single "word". Then:
     *   - If the word is exactly 1 char and matches a keyword/operator/delimiter → that token
     *   - If the word starts with a comment marker → comment
     *   - If the word starts with a string delimiter → string literal
     *   - If the word starts with a number sign → number literal
     *   - Otherwise → identifier (the whole multi-char word)
     * 
     * This prevents keyword characters inside multi-char identifiers from
     * being misinterpreted (e.g. ⡮⡡⡭⡥ = "name" won't split at ⡥=LAMBDA).
     *
     * @returns {Token|null}
     */
    _nextToken() {
        // Skip whitespace (non-braille characters like actual spaces/newlines)
        this._skipWhitespace();

        if (this.pos >= this.source.length) return null;

        const startPos = this.pos;
        const startLine = this.line;
        const startCol = this.col;
        const char = this.source[this.pos];
        const cp = char.codePointAt(0);

        // Check if it's a braille character
        if (!isBraille(cp)) {
            // Non-braille: skip
            this._advance();
            return null;
        }

        const offset = cp - 0x2800;

        // ── Comment (⣀ AWE) — always handled first ──
        if (offset === COMMENT) {
            return this._readComment(startPos, startLine, startCol);
        }

        // ── String literal (⠶...⠶) — always handled first ──
        if (offset === STRING_DELIM) {
            return this._readString(startPos, startLine, startCol);
        }

        // ── Identifier prefix (⠐ IDENT_SIGN) — next word is always an identifier ──
        if (offset === IDENT_SIGN) {
            return this._readPrefixedIdentifier(startPos, startLine, startCol);
        }

        // ── Number literal (⠼ followed by braille digits) ──
        if (offset === NUMBER_SIGN) {
            return this._readNumber(startPos, startLine, startCol);
        }

        // ── Read the full contiguous braille word ──
        const word = this._readBrailleWord();

        // Single-character word: classify as keyword, operator, delimiter, or identifier
        if (word.length === 1) {
            const off = word.codePointAt(0) - 0x2800;

            if (isKeyword(off)) {
                const kw = KEYWORDS[off];
                return new Token('KEYWORD', word, startPos, startLine, startCol, {
                    name: kw.name,
                    role: kw.role,
                    js: kw.js,
                    concept: kw.concept,
                    offset: off,
                });
            }

            if (isOperator(off)) {
                const op = OPERATORS[off];
                return new Token('OPERATOR', word, startPos, startLine, startCol, {
                    symbol: op.symbol,
                    name: op.name,
                    precedence: op.precedence,
                    concept: op.concept,
                    offset: off,
                });
            }

            if (isDelimiter(off)) {
                const delim = DELIMITERS[off];
                return new Token('DELIMITER', word, startPos, startLine, startCol, {
                    symbol: delim.symbol,
                    name: delim.name,
                    concept: delim.concept,
                    offset: off,
                });
            }
        }

        // Multi-character word: always an identifier
        const offsets = [];
        for (const ch of word) {
            offsets.push(ch.codePointAt(0) - 0x2800);
        }
        const decoded = offsets.map(o => String.fromCharCode(o)).join('');

        return new Token('IDENTIFIER', word, startPos, startLine, startCol, {
            decoded: decoded,
            offsets: offsets,
        });
    }

    /**
     * Read a prefixed identifier: ⠐ followed by the next braille word.
     * The ⠐ is consumed, then the following braille characters (up to whitespace)
     * are read as an identifier regardless of keyword collisions.
     * If ⠐ is followed by a space, read the next braille word after the space.
     */
    _readPrefixedIdentifier(startPos, startLine, startCol) {
        this._advance(); // skip ⠐

        // Optionally skip whitespace between ⠐ and the identifier word
        this._skipWhitespace();

        // Read the identifier word
        let value = '';
        let offsets = [];
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            const cp = ch.codePointAt(0);
            if (!isBraille(cp)) break;
            value += ch;
            offsets.push(cp - 0x2800);
            this._advance();
        }

        if (value.length === 0) {
            return new Token('IDENTIFIER', '⠐', startPos, startLine, startCol, {
                decoded: '\x10',
                offsets: [0x10],
            });
        }

        const decoded = offsets.map(o => String.fromCharCode(o)).join('');
        return new Token('IDENTIFIER', value, startPos, startLine, startCol, {
            decoded: decoded,
            offsets: offsets,
        });
    }

    /**
     * Read a contiguous run of braille characters (no whitespace between them).
     * Returns the full braille word as a string.
     */
    _readBrailleWord() {
        let word = '';
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            const cp = ch.codePointAt(0);
            if (!isBraille(cp)) break;
            word += ch;
            this._advance();
        }
        return word;
    }

    /**
     * Read a comment: from ⣀ to end of line (next real newline or another ⣀).
     */
    _readComment(startPos, startLine, startCol) {
        this._advance(); // skip ⣀
        let text = '';
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            if (ch === '\n') break;
            const cp = ch.codePointAt(0);
            if (isBraille(cp) && (cp - 0x2800) === COMMENT) {
                this._advance();
                break;
            }
            text += ch;
            this._advance();
        }
        return new Token('COMMENT', text, startPos, startLine, startCol);
    }

    /**
     * Read a string literal: ⠶ ... ⠶
     * Inside, braille characters are decoded using the ASCII-offset mapping:
     *   U+2800 + ASCII_byte → that ASCII character
     */
    _readString(startPos, startLine, startCol) {
        this._advance(); // skip opening ⠶
        let brailleChars = '';
        let decoded = '';
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            const cp = ch.codePointAt(0);
            if (isBraille(cp) && (cp - 0x2800) === STRING_DELIM) {
                this._advance(); // skip closing ⠶
                break;
            }
            brailleChars += ch;
            if (isBraille(cp)) {
                // Decode: braille offset = ASCII code point
                decoded += String.fromCharCode(cp - 0x2800);
            } else {
                decoded += ch;
            }
            this._advance();
        }
        return new Token('STRING', brailleChars, startPos, startLine, startCol, {
            decoded: decoded,
        });
    }

    /**
     * Read a number literal: ⠼ followed by braille digit characters.
     * Standard braille number convention:
     *   ⠁=1, ⠃=2, ⠉=3, ⠙=4, ⠑=5, ⠋=6, ⠛=7, ⠓=8, ⠊=9, ⠚=0
     * Also supports ⠄ as decimal point.
     */
    _readNumber(startPos, startLine, startCol) {
        this._advance(); // skip ⠼

        const BRAILLE_DIGITS = {
            0x01: '1', 0x03: '2', 0x09: '3', 0x19: '4', 0x11: '5',
            0x0B: '6', 0x1B: '7', 0x13: '8', 0x0A: '9', 0x1A: '0',
        };
        const DECIMAL = 0x04; // ⠄

        let raw = '';
        let numStr = '';

        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            const cp = ch.codePointAt(0);
            if (!isBraille(cp)) break;
            const off = cp - 0x2800;

            if (BRAILLE_DIGITS.hasOwnProperty(off)) {
                raw += ch;
                numStr += BRAILLE_DIGITS[off];
                this._advance();
            } else if (off === DECIMAL) {
                raw += ch;
                numStr += '.';
                this._advance();
            } else {
                break;
            }
        }

        const value = numStr.includes('.') ? parseFloat(numStr) : parseInt(numStr, 10);
        return new Token('NUMBER', raw, startPos, startLine, startCol, {
            numericValue: value,
            numStr: numStr,
        });
    }

    /**
     * Read an identifier: a sequence of braille characters that aren't
     * keywords, operators, or delimiters.
     * Identifiers in ⡂⡲⡡⡩⡬⡬⡥ are sequences of braille cells that
     * represent variable/function names.
     */
    _readIdentifier(startPos, startLine, startCol) {
        let value = '';
        let offsets = [];

        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            const cp = ch.codePointAt(0);
            if (!isBraille(cp)) break;
            const off = cp - 0x2800;

            // Stop at keywords, operators, delimiters, special chars
            if (isKeyword(off) || isOperator(off) || isDelimiter(off)) {
                // But allow first char to be anything if nothing was read yet
                if (value.length > 0) break;
            }

            // If first char is a keyword/op/delim, it was already handled above
            // This shouldn't happen, but safety check
            if (value.length === 0 && (isKeyword(off) || isOperator(off) || isDelimiter(off))) {
                // Single unrecognized — treat as identifier
            }

            value += ch;
            offsets.push(off);
            this._advance();

            // Single-character identifiers are fine, but keep reading if next is also an identifier char
            if (this.pos < this.source.length) {
                const nextCp = this.source[this.pos].codePointAt(0);
                if (!isBraille(nextCp)) break;
                const nextOff = nextCp - 0x2800;
                if (isKeyword(nextOff) || isOperator(nextOff) || isDelimiter(nextOff) ||
                    nextOff === COMMENT || nextOff === STRING_DELIM || nextOff === NUMBER_SIGN) {
                    break;
                }
            }
        }

        if (value.length === 0) {
            this._advance();
            return null;
        }

        // Decode identifier to a readable name using ASCII mapping
        const decoded = offsets.map(o => String.fromCharCode(o)).join('');

        return new Token('IDENTIFIER', value, startPos, startLine, startCol, {
            decoded: decoded,
            offsets: offsets,
        });
    }

    _advance() {
        if (this.pos < this.source.length) {
            if (this.source[this.pos] === '\n') {
                this.line++;
                this.col = 1;
            } else {
                this.col++;
            }
            this.pos++;
        }
    }

    _skipWhitespace() {
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
                this._advance();
            } else {
                break;
            }
        }
    }

    /**
     * Utility: encode an ASCII string into braille for use in source code.
     * @param {string} ascii
     * @returns {string} braille-encoded string
     */
    static asciiToBraille(ascii) {
        let result = '';
        for (let i = 0; i < ascii.length; i++) {
            result += String.fromCodePoint(0x2800 + ascii.charCodeAt(i));
        }
        return result;
    }

    /**
     * Utility: decode braille back to ASCII.
     * @param {string} braille
     * @returns {string}
     */
    static brailleToAscii(braille) {
        let result = '';
        for (const ch of braille) {
            const cp = ch.codePointAt(0);
            if (isBraille(cp)) {
                result += String.fromCharCode(cp - 0x2800);
            } else {
                result += ch;
            }
        }
        return result;
    }
}

module.exports = { Lexer, Token };
