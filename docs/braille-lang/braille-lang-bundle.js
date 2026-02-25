/**
 * ⡂⡲⡡⡩⡬⡬⡥ BrailleLang — Browser Bundle
 * 
 * Self-contained browser build of the BrailleLang lexer, parser,
 * interpreter, and compiler. No Node.js dependencies required.
 * 
 * Usage:
 *   const result = await BrailleLang.run(source);
 *   const js     = BrailleLang.compile(source);
 */

(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // §1  SPEC — Keywords, Operators, Delimiters
    // ═══════════════════════════════════════════════════════════════════════

    const KEYWORDS = {
        0x01: { name: 'DECLARE',    role: 'keyword',   js: 'let',        concept: 'GOD' },
        0x39: { name: 'CONST',      role: 'keyword',   js: 'const',      concept: 'LAW' },
        0x03: { name: 'FUNC',       role: 'keyword',   js: 'function',   concept: 'LIFE' },
        0x65: { name: 'LAMBDA',     role: 'keyword',   js: '=>',         concept: 'CREATIVITY' },
        0x11: { name: 'CLASS',      role: 'keyword',   js: 'class',      concept: 'PERSON' },
        0x05: { name: 'NEW',        role: 'keyword',   js: 'new',        concept: 'BIRTH' },
        0x21: { name: 'IF',         role: 'keyword',   js: 'if',         concept: 'TRUTH' },
        0x60: { name: 'ELSE',       role: 'keyword',   js: 'else',       concept: 'WISDOM' },
        0x04: { name: 'LOOP',       role: 'keyword',   js: 'while',      concept: 'TIME' },
        0x84: { name: 'FOREVER',    role: 'keyword',   js: 'while(true)',concept: 'ETERNITY' },
        0x0C: { name: 'FOREACH',    role: 'keyword',   js: 'for...of',   concept: 'JOURNEY' },
        0x0D: { name: 'CHANGE',     role: 'keyword',   js: 'switch',     concept: 'CHANGE' },
        0x00: { name: 'VOID',       role: 'literal',   js: 'null',       concept: 'VOID' },
        0x41: { name: 'RETURN',     role: 'keyword',   js: 'return',     concept: 'LOVE' },
        0x51: { name: 'DEFAULT',    role: 'keyword',   js: 'default',    concept: 'KINDNESS' },
        0x40: { name: 'TRY',        role: 'keyword',   js: 'try',        concept: 'HEART' },
        0x50: { name: 'CATCH',      role: 'keyword',   js: 'catch',      concept: 'COMPASSION' },
        0x80: { name: 'ASYNC',      role: 'keyword',   js: 'async',      concept: 'SOUL' },
        0x44: { name: 'AWAIT',      role: 'keyword',   js: 'await',      concept: 'LONGING' },
        0x45: { name: 'PROMISE',    role: 'keyword',   js: 'Promise',    concept: 'HOPE' },
        0x81: { name: 'YIELD',      role: 'keyword',   js: 'yield',      concept: 'SPIRIT' },
        0x30: { name: 'PRINT',      role: 'builtin',   js: 'console.log',concept: 'LANGUAGE' },
        0x22: { name: 'INPUT',      role: 'builtin',   js: 'readline',   concept: 'SENSE' },
        0x14: { name: 'LOG',        role: 'builtin',   js: 'console.log',concept: 'HISTORY' },
        0x08: { name: 'ARRAY',      role: 'type',      js: 'Array',      concept: 'SPACE' },
        0x1E: { name: 'MAP',        role: 'type',      js: 'Map',        concept: 'SOCIETY' },
        0x0F: { name: 'STRING',     role: 'type',      js: 'String',     concept: 'HUMANITY' },
        0x17: { name: 'OBJECT',     role: 'type',      js: 'Object',     concept: 'CIVILIZATION' },
        0x20: { name: 'INFER',      role: 'ai',        js: '__infer',    concept: 'MIND' },
        0x2B: { name: 'EMBED',      role: 'ai',        js: '__embed',    concept: 'TECHNOLOGY' },
        0x69: { name: 'PROMPT',     role: 'ai',        js: '__prompt',   concept: 'INSPIRATION' },
        0x6A: { name: 'PIPE',       role: 'ai',        js: '__pipe',     concept: 'MUSIC' },
        0xE0: { name: 'REFLECT',    role: 'ai',        js: '__reflect',  concept: 'CONSCIOUSNESS' },
        0x2D: { name: 'SEARCH',     role: 'ai',        js: '__search',   concept: 'DISCOVERY' },
        0x09: { name: 'IMPORT',     role: 'keyword',   js: 'import',     concept: 'WORLD' },
        0x1B: { name: 'NAMESPACE',  role: 'keyword',   js: 'namespace',  concept: 'NATION' },
        0x88: { name: 'GLOBAL',     role: 'keyword',   js: 'globalThis', concept: 'HEAVEN' },
        0x2C: { name: 'TYPEOF',     role: 'builtin',   js: 'typeof',     concept: 'SCIENCE' },
        0x49: { name: 'DEBUG',      role: 'builtin',   js: 'debugger',   concept: 'WONDER' },
        0x48: { name: 'FORMAT',     role: 'builtin',   js: '__format',   concept: 'BEAUTY' },
        0x18: { name: 'THIS',       role: 'keyword',   js: 'this',       concept: 'HOME' },
        0xFF: { name: 'HALT',       role: 'keyword',   js: 'process.exit',concept: 'DEATH' },
    };

    const OPERATORS = {
        0x2E: { symbol: '+',   name: 'ADD',        precedence: 4, concept: 'MEDICINE' },
        0x24: { symbol: '-',   name: 'SUB',        precedence: 4, concept: 'MEMORY' },
        0x26: { symbol: '*',   name: 'MUL',        precedence: 5, concept: 'SKILL' },
        0x34: { symbol: '/',   name: 'DIV',        precedence: 5, concept: 'TRADITION' },
        0x3C: { symbol: '%',   name: 'MOD',        precedence: 5, concept: 'POLITICS' },
        0x36: { symbol: '==',  name: 'EQ',         precedence: 3, concept: 'EQUALS' },
        0x56: { symbol: '!=',  name: 'NEQ',        precedence: 3, concept: 'NOT_EQUALS' },
        0x16: { symbol: '<',   name: 'LT',         precedence: 3, concept: 'WORK' },
        0x32: { symbol: '>',   name: 'GT',         precedence: 3, concept: 'TEACHING' },
        0x15: { symbol: '<=',  name: 'LTE',        precedence: 3, concept: 'GENERATION' },
        0x31: { symbol: '>=',  name: 'GTE',        precedence: 3, concept: 'COMMUNICATION' },
        0x2F: { symbol: '&&',  name: 'AND',        precedence: 2, concept: 'AND' },
        0x3F: { symbol: '||',  name: 'OR',         precedence: 1, concept: 'REASON' },
        0x3B: { symbol: '!',   name: 'NOT',        precedence: 6, concept: 'CONSTITUTION' },
        0x2A: { symbol: '=',   name: 'ASSIGN',     precedence: 0, concept: 'ART' },
        0x6B: { symbol: '=>',  name: 'ARROW',      precedence: 0, concept: 'SYMPHONY' },
    };

    const DELIMITERS = {
        0x23: { symbol: '(',   name: 'LPAREN',     concept: 'KNOWLEDGE' },
        0x1C: { symbol: ')',   name: 'RPAREN',     concept: 'MIGRATION' },
        0x33: { symbol: '{',   name: 'LBRACE',     concept: 'DEMOCRACY' },
        0x3E: { symbol: '}',   name: 'RBRACE',     concept: 'INDUSTRY' },
        0x37: { symbol: '[',   name: 'LBRACKET',   concept: 'REPUBLIC' },
        0x3D: { symbol: ']',   name: 'RBRACKET',   concept: 'REVOLUTION' },
        0x02: { symbol: ',',   name: 'COMMA',      concept: 'BODY' },
        0x12: { symbol: '.',   name: 'DOT',        concept: 'TOUCH' },
        0x06: { symbol: ';',   name: 'SEMICOLON',  concept: 'GROWTH' },
        0x0A: { symbol: ':',   name: 'COLON',      concept: 'EARTH' },
    };

    const NUMBER_SIGN = 0x3C;
    const IDENT_SIGN = 0x10;
    const STRING_DELIM = 0x36;
    const COMMENT = 0xC0;

    function isKeyword(off) { return KEYWORDS.hasOwnProperty(off); }
    function isOperator(off) { return OPERATORS.hasOwnProperty(off); }
    function isDelimiter(off) { return DELIMITERS.hasOwnProperty(off); }
    function isBraille(cp) { return cp >= 0x2800 && cp <= 0x28FF; }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  LEXER
    // ═══════════════════════════════════════════════════════════════════════

    class Token {
        constructor(type, value, offset, line, col, meta = {}) {
            this.type = type; this.value = value; this.offset = offset;
            this.line = line; this.col = col; this.meta = meta;
        }
    }

    class Lexer {
        constructor(source) {
            this.source = source; this.pos = 0; this.line = 1; this.col = 1; this.tokens = [];
        }

        tokenize() {
            this.tokens = [];
            while (this.pos < this.source.length) {
                const token = this._nextToken();
                if (token) this.tokens.push(token);
            }
            this.tokens.push(new Token('EOF', '', this.pos, this.line, this.col));
            return this.tokens;
        }

        _nextToken() {
            this._skipWhitespace();
            if (this.pos >= this.source.length) return null;

            const startPos = this.pos, startLine = this.line, startCol = this.col;
            const char = this.source[this.pos];
            const cp = char.codePointAt(0);

            if (!isBraille(cp)) { this._advance(); return null; }
            const offset = cp - 0x2800;

            if (offset === COMMENT) return this._readComment(startPos, startLine, startCol);
            if (offset === STRING_DELIM) return this._readString(startPos, startLine, startCol);
            if (offset === IDENT_SIGN) return this._readPrefixedIdentifier(startPos, startLine, startCol);
            if (offset === NUMBER_SIGN) return this._readNumber(startPos, startLine, startCol);

            const word = this._readBrailleWord();

            if (word.length === 1) {
                const off = word.codePointAt(0) - 0x2800;
                if (isKeyword(off)) {
                    const kw = KEYWORDS[off];
                    return new Token('KEYWORD', word, startPos, startLine, startCol, {
                        name: kw.name, role: kw.role, js: kw.js, concept: kw.concept, offset: off
                    });
                }
                if (isOperator(off)) {
                    const op = OPERATORS[off];
                    return new Token('OPERATOR', word, startPos, startLine, startCol, {
                        symbol: op.symbol, name: op.name, precedence: op.precedence, concept: op.concept, offset: off
                    });
                }
                if (isDelimiter(off)) {
                    const d = DELIMITERS[off];
                    return new Token('DELIMITER', word, startPos, startLine, startCol, {
                        symbol: d.symbol, name: d.name, concept: d.concept, offset: off
                    });
                }
            }

            const offsets = [];
            for (const ch of word) offsets.push(ch.codePointAt(0) - 0x2800);
            const decoded = offsets.map(o => String.fromCharCode(o)).join('');
            return new Token('IDENTIFIER', word, startPos, startLine, startCol, { decoded, offsets });
        }

        _readBrailleWord() {
            let word = '';
            while (this.pos < this.source.length) {
                const cp = this.source[this.pos].codePointAt(0);
                if (!isBraille(cp)) break;
                word += this.source[this.pos]; this._advance();
            }
            return word;
        }

        _readPrefixedIdentifier(startPos, startLine, startCol) {
            this._advance(); this._skipWhitespace();
            let value = '', offsets = [];
            while (this.pos < this.source.length) {
                const cp = this.source[this.pos].codePointAt(0);
                if (!isBraille(cp)) break;
                value += this.source[this.pos]; offsets.push(cp - 0x2800); this._advance();
            }
            if (!value.length) return new Token('IDENTIFIER', '⠐', startPos, startLine, startCol, { decoded: '\x10', offsets: [0x10] });
            const decoded = offsets.map(o => String.fromCharCode(o)).join('');
            return new Token('IDENTIFIER', value, startPos, startLine, startCol, { decoded, offsets });
        }

        _readComment(startPos, startLine, startCol) {
            this._advance();
            let text = '';
            while (this.pos < this.source.length) {
                const ch = this.source[this.pos];
                if (ch === '\n') break;
                const cp = ch.codePointAt(0);
                if (isBraille(cp) && (cp - 0x2800) === COMMENT) { this._advance(); break; }
                text += ch; this._advance();
            }
            return new Token('COMMENT', text, startPos, startLine, startCol);
        }

        _readString(startPos, startLine, startCol) {
            this._advance();
            let brailleChars = '', decoded = '';
            while (this.pos < this.source.length) {
                const ch = this.source[this.pos];
                const cp = ch.codePointAt(0);
                if (isBraille(cp) && (cp - 0x2800) === STRING_DELIM) { this._advance(); break; }
                brailleChars += ch;
                decoded += isBraille(cp) ? String.fromCharCode(cp - 0x2800) : ch;
                this._advance();
            }
            return new Token('STRING', brailleChars, startPos, startLine, startCol, { decoded });
        }

        _readNumber(startPos, startLine, startCol) {
            this._advance();
            const DIGITS = { 0x01:'1',0x03:'2',0x09:'3',0x19:'4',0x11:'5',0x0B:'6',0x1B:'7',0x13:'8',0x0A:'9',0x1A:'0' };
            let raw = '', numStr = '';
            while (this.pos < this.source.length) {
                const cp = this.source[this.pos].codePointAt(0);
                if (!isBraille(cp)) break;
                const off = cp - 0x2800;
                if (DIGITS.hasOwnProperty(off)) { raw += this.source[this.pos]; numStr += DIGITS[off]; this._advance(); }
                else if (off === 0x04) { raw += this.source[this.pos]; numStr += '.'; this._advance(); }
                else break;
            }
            const value = numStr.includes('.') ? parseFloat(numStr) : parseInt(numStr, 10);
            return new Token('NUMBER', raw, startPos, startLine, startCol, { numericValue: value, numStr });
        }

        _advance() {
            if (this.pos < this.source.length) {
                if (this.source[this.pos] === '\n') { this.line++; this.col = 1; } else { this.col++; }
                this.pos++;
            }
        }

        _skipWhitespace() {
            while (this.pos < this.source.length) {
                const ch = this.source[this.pos];
                if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') this._advance(); else break;
            }
        }

        static asciiToBraille(ascii) {
            let r = '';
            for (let i = 0; i < ascii.length; i++) r += String.fromCodePoint(0x2800 + ascii.charCodeAt(i));
            return r;
        }
        static brailleToAscii(braille) {
            let r = '';
            for (const ch of braille) { const cp = ch.codePointAt(0); r += isBraille(cp) ? String.fromCharCode(cp - 0x2800) : ch; }
            return r;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  PARSER
    // ═══════════════════════════════════════════════════════════════════════

    class ASTNode {
        constructor(type, props = {}) { this.type = type; Object.assign(this, props); }
    }

    class Parser {
        constructor(tokens) { this.tokens = tokens.filter(t => t.type !== 'COMMENT'); this.pos = 0; }

        parse() {
            const body = [];
            while (!this._isAtEnd()) { this._skipSemicolons(); if (this._isAtEnd()) break; const s = this._parseStatement(); if (s) body.push(s); }
            return new ASTNode('Program', { body });
        }

        _parseStatement() {
            const tok = this._peek();
            if (tok.type === 'KEYWORD') {
                switch (tok.meta.name) {
                    case 'DECLARE':   return this._parseDeclaration(false);
                    case 'CONST':     return this._parseDeclaration(true);
                    case 'FUNC':      return this._parseFunctionDef();
                    case 'CLASS':     return this._parseClassDef();
                    case 'IF':        return this._parseIf();
                    case 'LOOP':      return this._parseWhile();
                    case 'FOREVER':   return this._parseForever();
                    case 'FOREACH':   return this._parseForEach();
                    case 'TRY':       return this._parseTryCatch();
                    case 'ASYNC':     return this._parseAsync();
                    case 'RETURN':    return this._parseReturn();
                    case 'PRINT': case 'LOG': return this._parsePrint();
                    case 'IMPORT':    return this._parseImport();
                    case 'HALT':      return this._parseHalt();
                    case 'YIELD':     return this._parseYield();
                    case 'CHANGE':    return this._parseSwitch();
                }
                if (tok.meta.role === 'ai') return this._parseExpressionStatement();
            }
            return this._parseExpressionStatement();
        }

        _parseDeclaration(isConst) {
            this._advance();
            const name = this._parseIdentifier();
            let init = null;
            if (this._matchOperator('ASSIGN')) init = this._parseExpression();
            this._optionalSemicolon();
            return new ASTNode('Declaration', { name, init, isConst });
        }

        _parseFunctionDef() {
            this._advance();
            const name = this._parseIdentifier();
            this._expectDelimiter('LPAREN');
            const params = this._parseParamList();
            this._expectDelimiter('RPAREN');
            const body = this._parseBlock();
            return new ASTNode('FunctionDef', { name, params, body });
        }

        _parseClassDef() {
            this._advance(); const name = this._parseIdentifier();
            let parent = null;
            if (this._matchOperator('ARROW')) parent = this._parseIdentifier();
            const body = this._parseBlock();
            return new ASTNode('ClassDef', { name, parent, body });
        }

        _parseIf() {
            this._advance();
            this._expectDelimiter('LPAREN'); const condition = this._parseExpression(); this._expectDelimiter('RPAREN');
            const consequent = this._parseBlock();
            let alternate = null;
            if (this._matchKeyword('ELSE')) { alternate = this._peekKeyword('IF') ? this._parseIf() : this._parseBlock(); }
            return new ASTNode('IfStatement', { condition, consequent, alternate });
        }

        _parseWhile() {
            this._advance();
            this._expectDelimiter('LPAREN'); const condition = this._parseExpression(); this._expectDelimiter('RPAREN');
            return new ASTNode('WhileLoop', { condition, body: this._parseBlock() });
        }

        _parseForever() { this._advance(); return new ASTNode('ForeverLoop', { body: this._parseBlock() }); }

        _parseForEach() {
            this._advance();
            this._expectDelimiter('LPAREN');
            const item = this._parseIdentifier();
            this._expectDelimiter('COLON');
            const iterable = this._parseExpression();
            this._expectDelimiter('RPAREN');
            return new ASTNode('ForEach', { item, iterable, body: this._parseBlock() });
        }

        _parseTryCatch() {
            this._advance(); const tryBlock = this._parseBlock();
            let catchBlock = null, errorVar = null;
            if (this._matchKeyword('CATCH')) {
                if (this._matchDelimiter('LPAREN')) { errorVar = this._parseIdentifier(); this._expectDelimiter('RPAREN'); }
                catchBlock = this._parseBlock();
            }
            return new ASTNode('TryCatch', { tryBlock, catchBlock, errorVar });
        }

        _parseAsync() {
            this._advance();
            if (this._peekKeyword('FUNC')) { const fn = this._parseFunctionDef(); fn.isAsync = true; return fn; }
            const expr = this._parseExpression(); this._optionalSemicolon();
            return new ASTNode('AsyncBlock', { body: expr });
        }

        _parseReturn() {
            this._advance(); let value = null;
            if (!this._isAtEnd() && !this._peekDelimiter('RBRACE') && !this._peekSemicolon()) value = this._parseExpression();
            this._optionalSemicolon();
            return new ASTNode('Return', { value });
        }

        _parsePrint() {
            this._advance();
            this._expectDelimiter('LPAREN'); const args = this._parseArgList(); this._expectDelimiter('RPAREN');
            this._optionalSemicolon();
            return new ASTNode('Print', { args });
        }

        _parseImport() { this._advance(); const m = this._parseIdentifier(); this._optionalSemicolon(); return new ASTNode('Import', { module: m }); }
        _parseHalt() { this._advance(); this._optionalSemicolon(); return new ASTNode('Halt', {}); }
        _parseYield() {
            this._advance(); let value = null;
            if (!this._isAtEnd() && !this._peekDelimiter('RBRACE') && !this._peekSemicolon()) value = this._parseExpression();
            this._optionalSemicolon();
            return new ASTNode('Yield', { value });
        }
        _parseSwitch() {
            this._advance();
            this._expectDelimiter('LPAREN'); const d = this._parseExpression(); this._expectDelimiter('RPAREN');
            return new ASTNode('Switch', { discriminant: d, body: this._parseBlock() });
        }
        _parseExpressionStatement() { const e = this._parseExpression(); this._optionalSemicolon(); return new ASTNode('ExpressionStatement', { expression: e }); }

        // ── Expressions ──
        _parseExpression(minPrec = 0) {
            let left = this._parsePrimary();
            while (!this._isAtEnd()) {
                const tok = this._peek();
                if (tok.type === 'KEYWORD' && tok.meta.name === 'PIPE') { this._advance(); left = new ASTNode('PipeExpression', { left, right: this._parsePrimary() }); continue; }
                if (tok.type === 'OPERATOR') {
                    const prec = tok.meta.precedence;
                    if (prec < minPrec) break;
                    if (tok.meta.name === 'ASSIGN') { this._advance(); left = new ASTNode('Assignment', { target: left, value: this._parseExpression(prec) }); continue; }
                    if (tok.meta.name === 'ARROW') {
                        this._advance();
                        left = new ASTNode('LambdaDef', {
                            params: left.type === 'Identifier' ? [left] : left.type === 'ArgList' ? left.args : [left],
                            body: this._parseExpression(prec)
                        }); continue;
                    }
                    this._advance();
                    left = new ASTNode('BinaryExpr', { operator: tok.meta.symbol, operatorName: tok.meta.name, left, right: this._parseExpression(prec + 1) });
                    continue;
                }
                if (tok.type === 'DELIMITER' && tok.meta.name === 'DOT') { this._advance(); left = new ASTNode('MemberExpr', { object: left, property: this._parseIdentifier() }); continue; }
                if (tok.type === 'DELIMITER' && tok.meta.name === 'LPAREN') { this._advance(); const args = this._parseArgList(); this._expectDelimiter('RPAREN'); left = new ASTNode('CallExpr', { callee: left, args }); continue; }
                if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACKET') { this._advance(); const idx = this._parseExpression(); this._expectDelimiter('RBRACKET'); left = new ASTNode('IndexExpr', { object: left, index: idx }); continue; }
                break;
            }
            return left;
        }

        _parsePrimary() {
            const tok = this._peek();
            if (tok.type === 'OPERATOR' && tok.meta.name === 'NOT') { this._advance(); return new ASTNode('UnaryExpr', { operator: '!', operand: this._parsePrimary() }); }
            if (tok.type === 'NUMBER') { this._advance(); return new ASTNode('NumberLiteral', { value: tok.meta.numericValue, raw: tok.value }); }
            if (tok.type === 'STRING') { this._advance(); return new ASTNode('StringLiteral', { value: tok.meta.decoded, raw: tok.value }); }
            if (tok.type === 'DELIMITER' && tok.meta.name === 'LPAREN') { this._advance(); const e = this._parseExpression(); this._expectDelimiter('RPAREN'); return e; }
            if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACKET') return this._parseArrayLiteral();
            if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACE') return this._parseMapLiteral();
            if (tok.type === 'KEYWORD' && tok.meta.name === 'LAMBDA') return this._parseLambda();
            if (tok.type === 'KEYWORD' && tok.meta.role === 'ai') return this._parseAIPrimitive();
            if (tok.type === 'KEYWORD' && tok.meta.name === 'AWAIT') { this._advance(); return new ASTNode('AwaitExpr', { expression: this._parsePrimary() }); }
            if (tok.type === 'KEYWORD' && tok.meta.name === 'NEW') { this._advance(); return new ASTNode('NewExpr', { callee: this._parsePrimary() }); }
            if (tok.type === 'KEYWORD' && tok.meta.name === 'TYPEOF') { this._advance(); return new ASTNode('TypeofExpr', { operand: this._parsePrimary() }); }
            if (tok.type === 'KEYWORD' && tok.meta.name === 'VOID') { this._advance(); return new ASTNode('NullLiteral', {}); }
            if (tok.type === 'KEYWORD' && tok.meta.name === 'THIS') { this._advance(); return new ASTNode('ThisExpr', {}); }
            if (tok.type === 'IDENTIFIER') { this._advance(); return new ASTNode('Identifier', { name: tok.meta.decoded || tok.value, braille: tok.value }); }
            this._advance();
            return new ASTNode('Identifier', { name: tok.value, braille: tok.value });
        }

        _parseArrayLiteral() {
            this._advance(); const elements = [];
            while (!this._isAtEnd() && !this._peekDelimiter('RBRACKET')) { elements.push(this._parseExpression()); if (!this._matchDelimiter('COMMA')) break; }
            this._expectDelimiter('RBRACKET');
            return new ASTNode('ArrayLiteral', { elements });
        }

        _parseMapLiteral() {
            this._advance(); const entries = [];
            while (!this._isAtEnd() && !this._peekDelimiter('RBRACE')) {
                const key = this._parseExpression(); this._expectDelimiter('COLON'); const value = this._parseExpression();
                entries.push({ key, value }); if (!this._matchDelimiter('COMMA')) break;
            }
            this._expectDelimiter('RBRACE');
            return new ASTNode('MapLiteral', { entries });
        }

        _parseLambda() {
            this._advance(); let params = [];
            if (this._matchDelimiter('LPAREN')) { params = this._parseParamList(); this._expectDelimiter('RPAREN'); }
            this._expectOperator('ARROW');
            const body = this._peekDelimiter('LBRACE') ? this._parseBlock() : this._parseExpression();
            return new ASTNode('LambdaDef', { params, body });
        }

        _parseAIPrimitive() {
            const tok = this._advance();
            this._expectDelimiter('LPAREN'); const args = this._parseArgList(); this._expectDelimiter('RPAREN');
            return new ASTNode('AIPrimitive', { name: tok.meta.name, args, concept: tok.meta.concept });
        }

        _parseBlock() {
            this._expectDelimiter('LBRACE');
            const stmts = [];
            while (!this._isAtEnd() && !this._peekDelimiter('RBRACE')) { this._skipSemicolons(); if (this._peekDelimiter('RBRACE')) break; const s = this._parseStatement(); if (s) stmts.push(s); }
            this._expectDelimiter('RBRACE');
            return new ASTNode('Block', { statements: stmts });
        }

        _parseParamList() {
            const params = [];
            while (!this._isAtEnd() && !this._peekDelimiter('RPAREN')) { params.push(this._parseIdentifier()); if (!this._matchDelimiter('COMMA')) break; }
            return params;
        }

        _parseArgList() {
            const args = [];
            while (!this._isAtEnd() && !this._peekDelimiter('RPAREN') && !this._peekDelimiter('RBRACKET')) { args.push(this._parseExpression()); if (!this._matchDelimiter('COMMA')) break; }
            return args;
        }

        _parseIdentifier() {
            const tok = this._advance();
            if (tok.type === 'IDENTIFIER') return new ASTNode('Identifier', { name: tok.meta.decoded || tok.value, braille: tok.value });
            return new ASTNode('Identifier', { name: tok.meta?.name || tok.value, braille: tok.value });
        }

        _peek() { return this.tokens[this.pos] || new Token('EOF', '', -1, -1, -1); }
        _advance() { const t = this.tokens[this.pos]; if (this.pos < this.tokens.length) this.pos++; return t; }
        _isAtEnd() { return this.pos >= this.tokens.length || this.tokens[this.pos].type === 'EOF'; }
        _matchKeyword(n) { const t = this._peek(); if (t.type === 'KEYWORD' && t.meta.name === n) { this._advance(); return true; } return false; }
        _matchOperator(n) { const t = this._peek(); if (t.type === 'OPERATOR' && t.meta.name === n) { this._advance(); return true; } return false; }
        _matchDelimiter(n) { const t = this._peek(); if (t.type === 'DELIMITER' && t.meta.name === n) { this._advance(); return true; } return false; }
        _peekKeyword(n) { const t = this._peek(); return t.type === 'KEYWORD' && t.meta.name === n; }
        _peekDelimiter(n) { const t = this._peek(); return t.type === 'DELIMITER' && t.meta.name === n; }
        _peekSemicolon() { const t = this._peek(); return t.type === 'DELIMITER' && t.meta.name === 'SEMICOLON'; }
        _expectDelimiter(n) { if (!this._matchDelimiter(n)) { const t = this._peek(); throw new SyntaxError(`Expected ${n} but got ${t.type}:${t.meta?.name||t.value} at L${t.line}:${t.col}`); } }
        _expectOperator(n) { if (!this._matchOperator(n)) { const t = this._peek(); throw new SyntaxError(`Expected ${n} but got ${t.type}:${t.meta?.name||t.value} at L${t.line}:${t.col}`); } }
        _expectKeyword(n) { if (!this._matchKeyword(n)) { const t = this._peek(); throw new SyntaxError(`Expected ${n} but got ${t.type}:${t.meta?.name||t.value} at L${t.line}:${t.col}`); } }
        _skipSemicolons() { while (this._peekSemicolon()) this._advance(); }
        _optionalSemicolon() { this._matchDelimiter('SEMICOLON'); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  INTERPRETER
    // ═══════════════════════════════════════════════════════════════════════

    class Environment {
        constructor(parent = null) { this.parent = parent; this.bindings = new Map(); }
        define(name, value, isConst = false) { this.bindings.set(name, { value, isConst }); }
        get(name) { if (this.bindings.has(name)) return this.bindings.get(name).value; if (this.parent) return this.parent.get(name); throw new ReferenceError(`Undefined: ${name}`); }
        set(name, value) {
            if (this.bindings.has(name)) { const b = this.bindings.get(name); if (b.isConst) throw new TypeError(`Cannot reassign const: ${name}`); b.value = value; return; }
            if (this.parent) return this.parent.set(name, value);
            throw new ReferenceError(`Undefined: ${name}`);
        }
    }

    const RETURN_SIG = Symbol('RETURN');
    const HALT_SIG = Symbol('HALT');
    class ReturnValue { constructor(v) { this.value = v; this.signal = RETURN_SIG; } }
    class BrailleFunction { constructor(n,p,b,c,a=false) { this.name=n;this.params=p;this.body=b;this.closure=c;this.isAsync=a; } toString(){ return `⠃[${this.name}]`; } }
    class BrailleClass { constructor(n,m,p=null) { this.name=n;this.methods=m;this.parent=p; } toString(){ return `⠑[${this.name}]`; } }
    class BrailleInstance { constructor(k) { this.klass=k;this.fields=new Map(); } toString(){ return `⠅[${this.klass.name}]`; } }

    class Interpreter {
        constructor(options = {}) {
            this.options = { dryRun: true, maxInferTokens: 1024, model: 'openai/gpt-4o-mini', ...options };
            this.output = [];
            this.global = new Environment();
            this._initGlobals();
            this.stats = { statementsExecuted: 0, aiCalls: 0, startTime: null, endTime: null };
            this.sal = new SAL({ cache: true, trace: true });
            this.edge = new SALEdgeRuntime({
                mode: options.edgeMode || EdgeMode.DRY_RUN,
                apiKey: options.apiKey || null,
                model: options.model || 'openai/gpt-4o-mini',
                dryRunFn: (prim, a) => this._aiCall(prim, a),
                onStatus: options.onEdgeStatus || (() => {}),
            });
        }

        async execute(ast) {
            this.stats.startTime = Date.now(); this.output = [];
            let result = null;
            try { result = await this._exec(ast, this.global); } catch (e) { if (e !== HALT_SIG) throw e; }
            this.stats.endTime = Date.now();
            return { output: this.output, result, stats: { ...this.stats, durationMs: this.stats.endTime - this.stats.startTime }, sal: this.sal.getReport() };
        }

        async _exec(node, env) {
            if (!node) return null;
            this.stats.statementsExecuted++;
            switch (node.type) {
                case 'Program': { let r=null; for(const s of node.body){r=await this._exec(s,env);if(r instanceof ReturnValue)return r.value;} return r; }
                case 'Block': { const be=new Environment(env);let r=null;for(const s of node.statements){r=await this._exec(s,be);if(r instanceof ReturnValue)return r;}return r; }
                case 'Declaration': { const n=node.name.name||node.name;const v=node.init?await this._exec(node.init,env):null;env.define(n,v,node.isConst);return v; }
                case 'Assignment': {
                    const v=await this._exec(node.value,env);
                    if(node.target.type==='Identifier')env.set(node.target.name,v);
                    else if(node.target.type==='MemberExpr'){const o=await this._exec(node.target.object,env);const p=node.target.property.name;if(o instanceof BrailleInstance)o.fields.set(p,v);else if(typeof o==='object'&&o!==null)o[p]=v;}
                    else if(node.target.type==='IndexExpr'){const o=await this._exec(node.target.object,env);const i=await this._exec(node.target.index,env);o[i]=v;}
                    return v;
                }
                case 'FunctionDef': { const n=node.name.name||node.name;const ps=node.params.map(p=>p.name||p);const fn=new BrailleFunction(n,ps,node.body,env,node.isAsync);env.define(n,fn);return fn; }
                case 'LambdaDef': { const ps=(node.params||[]).map(p=>p.name||p);return new BrailleFunction('⡥',ps,node.body,env); }
                case 'ClassDef': {
                    const n=node.name.name||node.name;const ce=new Environment(env);const ms=new Map();
                    if(node.body&&node.body.statements)for(const s of node.body.statements)if(s.type==='FunctionDef'){const mn=s.name.name||s.name;ms.set(mn,new BrailleFunction(mn,s.params.map(p=>p.name||p),s.body,ce));}
                    let pc=null;if(node.parent)pc=env.get(node.parent.name||node.parent);
                    const k=new BrailleClass(n,ms,pc);env.define(n,k);return k;
                }
                case 'IfStatement': { const c=await this._exec(node.condition,env);if(this._truthy(c))return this._exec(node.consequent,env);else if(node.alternate)return this._exec(node.alternate,env);return null; }
                case 'WhileLoop': { let r=null;while(this._truthy(await this._exec(node.condition,env))){r=await this._exec(node.body,env);if(r instanceof ReturnValue)return r;}return r; }
                case 'ForeverLoop': { let r=null,i=0;while(i++<10000){r=await this._exec(node.body,env);if(r instanceof ReturnValue)return r;}return r; }
                case 'ForEach': {
                    const it=await this._exec(node.iterable,env);const in_=node.item.name||node.item;const le=new Environment(env);let r=null;
                    if(Array.isArray(it))for(const item of it){le.define(in_,item);r=await this._exec(node.body,le);if(r instanceof ReturnValue)return r;}
                    return r;
                }
                case 'TryCatch': { try{return await this._exec(node.tryBlock,env);}catch(e){if(e===HALT_SIG)throw e;if(node.catchBlock){const ce=new Environment(env);if(node.errorVar)ce.define(node.errorVar.name||'error',e.message||String(e));return await this._exec(node.catchBlock,ce);}return null;} }
                case 'AsyncBlock': return this._exec(node.body,env);
                case 'Return': { const v=node.value?await this._exec(node.value,env):null;return new ReturnValue(v); }
                case 'Yield': { const v=node.value?await this._exec(node.value,env):null;return new ReturnValue(v); }
                case 'Print': { const vs=[];for(const a of node.args)vs.push(await this._exec(a,env));const l=vs.map(v=>this._stringify(v)).join(' ');this.output.push(l);return l; }
                case 'Import': { const n=node.module.name||node.module;const builtins={math:{PI:Math.PI,E:Math.E,sqrt:Math.sqrt,abs:Math.abs}};if(builtins[n]){env.define(n,builtins[n]);}return null; }
                case 'Halt': throw HALT_SIG;
                case 'Switch': { const v=await this._exec(node.discriminant,env);const se=new Environment(env);se.define('__switch__',v);return this._exec(node.body,se); }
                case 'ExpressionStatement': return this._exec(node.expression,env);
                case 'BinaryExpr': {
                    const l=await this._exec(node.left,env),r=await this._exec(node.right,env);
                    switch(node.operator){
                        case'+':return(typeof l==='string'||typeof r==='string')?String(l)+String(r):l+r;
                        case'-':return l-r;case'*':return l*r;case'/':if(r===0)throw new Error('Division by void');return l/r;case'%':return l%r;
                        case'==':return l===r;case'!=':return l!==r;case'<':return l<r;case'>':return l>r;case'<=':return l<=r;case'>=':return l>=r;
                        case'&&':return l&&r;case'||':return l||r;default:throw new Error('Unknown op: '+node.operator);
                    }
                }
                case 'UnaryExpr': { const v=await this._exec(node.operand,env);return node.operator==='!'?!v:-v; }
                case 'CallExpr': {
                    const callee=await this._exec(node.callee,env);const args=[];for(const a of node.args)args.push(await this._exec(a,env));
                    if(typeof callee==='function')return callee(...args);
                    if(callee instanceof BrailleFunction){const ce=new Environment(callee.closure);for(let i=0;i<callee.params.length;i++)ce.define(callee.params[i],args[i]!==undefined?args[i]:null);const r=await this._exec(callee.body,ce);return r instanceof ReturnValue?r.value:r;}
                    if(callee instanceof BrailleClass){const inst=new BrailleInstance(callee);const init=callee.methods.get('init');if(init){const ie=new Environment(init.closure);ie.define('this',inst);for(let i=0;i<init.params.length;i++)ie.define(init.params[i],args[i]!==undefined?args[i]:null);await this._exec(init.body,ie);}return inst;}
                    throw new TypeError('Not callable: '+this._stringify(callee));
                }
                case 'MemberExpr': {
                    const o=await this._exec(node.object,env);const p=node.property.name;
                    if(o instanceof BrailleInstance){if(o.fields.has(p))return o.fields.get(p);const m=o.klass.methods.get(p);if(m)return new BrailleFunction(m.name,m.params,m.body,(()=>{const e=new Environment(m.closure);e.define('this',o);return e;})());return undefined;}
                    if(typeof o==='object'&&o!==null){if(o instanceof Map)return o.get(p);return o[p];}
                    if(typeof o==='string'){const sm={length:o.length,upper:()=>o.toUpperCase(),lower:()=>o.toLowerCase(),split:(d)=>o.split(d),includes:(s)=>o.includes(s)};return sm[p];}
                    if(Array.isArray(o)){const am={length:o.length,push:(v)=>{o.push(v);return o;},pop:()=>o.pop(),join:(s)=>o.join(s)};return am[p];}
                    return undefined;
                }
                case 'IndexExpr': { const o=await this._exec(node.object,env);const i=await this._exec(node.index,env);if(Array.isArray(o)||typeof o==='string')return o[i];if(o instanceof Map)return o.get(i);if(typeof o==='object'&&o!==null)return o[i];return undefined; }
                case 'PipeExpression': {
                    const l=await this._exec(node.left,env);const r=await this._exec(node.right,env);
                    if(typeof r==='function')return r(l);
                    if(r instanceof BrailleFunction){const ce=new Environment(r.closure);if(r.params.length>0)ce.define(r.params[0],l);const res=await this._exec(r.body,ce);return res instanceof ReturnValue?res.value:res;}
                    throw new TypeError('Pipe target not callable');
                }
                case 'AIPrimitive': { const args=[];for(const a of node.args)args.push(await this._exec(a,env));this.stats.aiCalls++;const{result:aiR}=await this.sal.intercept(node.name,args,async(a)=>this.edge.execute(node.name,a,(fa)=>this._aiCall(node.name,fa)),{model:this.edge.mode!==EdgeMode.DRY_RUN?this.edge.getStatus().modelId:this.options.model});return aiR; }
                case 'AwaitExpr': return this._exec(node.expression,env);
                case 'NewExpr': { const c=await this._exec(node.callee,env);if(c instanceof BrailleClass)return new BrailleInstance(c);throw new TypeError('Cannot instantiate'); }
                case 'TypeofExpr': return typeof(await this._exec(node.operand,env));
                case 'NumberLiteral': return node.value;
                case 'StringLiteral': return node.value;
                case 'NullLiteral': return null;
                case 'ThisExpr': return env.get('this');
                case 'ArrayLiteral': { const el=[];for(const e of node.elements)el.push(await this._exec(e,env));return el; }
                case 'MapLiteral': { const m=new Map();for(const e of node.entries){m.set(await this._exec(e.key,env),await this._exec(e.value,env));}return m; }
                case 'Identifier': return env.get(node.name);
                default: throw new Error('Unknown node: '+node.type);
            }
        }

        _aiCall(name, args) {
            const prompt = String(args[0] || '');
            switch(name) {
                case 'INFER': return `[⠠ INFER] "${prompt.substring(0,80)}" → (AI response in live mode)`;
                case 'EMBED': { const h=this._hash(prompt); return Array.from({length:8},(_,i)=>((h>>i)&1)?1.0:0.0); }
                case 'PROMPT': { let t=prompt;const vars=args[1]||{};if(vars instanceof Map)for(const[k,v]of vars)t=t.replace(new RegExp(`\\{${k}\\}`,'g'),String(v));return t; }
                case 'PIPE': return async(input)=>{let r=input;for(const fn of args){if(typeof fn==='function')r=await fn(r);else if(typeof fn==='string')r=fn.replace('{input}',String(r));}return r;};
                case 'REFLECT': return `[⣠ REFLECT] code: ${prompt.substring(0,80)}`;
                case 'SEARCH': { const corpus=args[1]||[];const terms=prompt.toLowerCase().split(/\s+/);return corpus.filter(d=>terms.some(t=>String(d).toLowerCase().includes(t))); }
                default: return `[Unknown AI: ${name}]`;
            }
        }

        _initGlobals() {
            this.global.define('true',true,true);this.global.define('false',false,true);this.global.define('null',null,true);
            this.global.define('PI',Math.PI,true);this.global.define('E',Math.E,true);
            this.global.define('sqrt',Math.sqrt);this.global.define('abs',Math.abs);
            this.global.define('floor',Math.floor);this.global.define('ceil',Math.ceil);
            this.global.define('round',Math.round);this.global.define('random',Math.random);
            this.global.define('min',Math.min);this.global.define('max',Math.max);this.global.define('pow',Math.pow);
            this.global.define('str',(v)=>String(v));this.global.define('num',(v)=>Number(v));
            this.global.define('len',(v)=>{if(typeof v==='string'||Array.isArray(v))return v.length;if(v instanceof Map)return v.size;return 0;});
            this.global.define('range',(s,e,st=1)=>{if(e===undefined){e=s;s=0;}const a=[];for(let i=s;i<e;i+=st)a.push(i);return a;});
            this.global.define('type',(v)=>{if(v===null)return'void';if(v instanceof BrailleFunction)return'function';if(v instanceof BrailleClass)return'class';if(v instanceof BrailleInstance)return'instance';if(Array.isArray(v))return'array';if(v instanceof Map)return'map';return typeof v;});
            this.global.define('toBraille',(a)=>Lexer.asciiToBraille(String(a)));
            this.global.define('fromBraille',(b)=>Lexer.brailleToAscii(String(b)));
            this.global.define('now',()=>Date.now());
        }

        _truthy(v) { return v !== null && v !== undefined && v !== false && v !== 0 && v !== ''; }
        _stringify(v) {
            if(v===null||v===undefined)return'⠀';if(typeof v==='string')return v;if(typeof v==='number')return String(v);
            if(typeof v==='boolean')return v?'⠡':'⠻';if(Array.isArray(v))return'['+v.map(x=>this._stringify(x)).join(', ')+']';
            if(v instanceof Map){const e=[];for(const[k,val]of v)e.push(this._stringify(k)+':'+this._stringify(val));return'{'+e.join(', ')+'}';}
            if(v instanceof BrailleFunction)return v.toString();if(v instanceof BrailleClass)return v.toString();if(v instanceof BrailleInstance)return v.toString();
            if(typeof v==='object')return JSON.stringify(v);return String(v);
        }
        _hash(s) { let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h)&0xFF; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4b SAL — Symbolic Abstraction Layer (browser build)
    // ═══════════════════════════════════════════════════════════════════════

    const Domain = Object.freeze({
        DETERMINISTIC: '⠁',
        STOCHASTIC:    '⠠',
        HYBRID:        '⡪',
    });

    class TraceNode {
        constructor(p) { Object.assign(this, p); }
        toCompact() {
            const c = this.cached ? '⠹' : '⠅';
            return `${this.domain}${c} #${this.id} ${this.primitive||this.type} [${(this.inputHash||'').slice(0,8)}→${(this.outputHash||'').slice(0,8)}] ${this.latencyMs}ms`;
        }
        toJSON() { return { ...this }; }
    }

    class SALCache {
        constructor(opts={}) { this.max=opts.maxEntries||1000; this.ttl=opts.ttlMs||3600000; this.store=new Map(); this.hits=0; this.misses=0; }
        get(h) { const e=this.store.get(h); if(!e){this.misses++;return null;} if(Date.now()-e.ts>this.ttl){this.store.delete(h);this.misses++;return null;} e.hits++;this.hits++;return e; }
        set(h,o,oh) { if(this.store.size>=this.max){this.store.delete(this.store.keys().next().value);} this.store.set(h,{output:o,outputHash:oh,ts:Date.now(),hits:0}); }
        clear() { this.store.clear(); this.hits=0; this.misses=0; }
        getStats() { return { entries:this.store.size, hits:this.hits, misses:this.misses, hitRate:this.hits+this.misses>0?(this.hits/(this.hits+this.misses)*100).toFixed(1)+'%':'0%' }; }
    }

    class SAL {
        constructor(opts={}) {
            this.opts = { cache:opts.cache!==false, trace:opts.trace!==false, maxNodes:opts.maxNodes||10000, trunc:opts.trunc||500, ...opts };
            this.trace = []; this.nc = 0; this.pstack = [];
            this.cache = new SALCache({ maxEntries:opts.cacheMax||1000, ttlMs:opts.cacheTtl||3600000 });
            this.stats = { totalCalls:0, byPrimitive:{INFER:0,EMBED:0,PROMPT:0,PIPE:0,REFLECT:0,SEARCH:0}, totalLatencyMs:0, totalTokens:{prompt:0,completion:0}, totalCost:0, cacheHits:0, cacheMisses:0, deterministicOps:0, stochasticOps:0 };
            this.session = { id:'sal_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8), startedAt:new Date().toISOString(), endedAt:null };
        }

        async intercept(primitive, args, execFn, ctx={}) {
            const t0 = Date.now();
            const iStr = this._ser(args);
            const iHash = this._hash(iStr);
            const pid = this.pstack.length>0 ? this.pstack[this.pstack.length-1] : null;
            this.stats.totalCalls++;
            this.stats.byPrimitive[primitive] = (this.stats.byPrimitive[primitive]||0)+1;

            if(this.opts.cache) {
                const c = this.cache.get(iHash);
                if(c) { this.stats.cacheHits++; const node=this._node({type:'ai_call',domain:Domain.STOCHASTIC,primitive,inputHash:iHash,outputHash:c.outputHash,input:this._trunc(iStr),output:this._trunc(this._ser(c.output)),parentId:pid,latencyMs:0,cached:true,model:ctx.model||null,tokens:null,cost:0}); return {result:c.output,node}; }
                this.stats.cacheMisses++;
            }

            this.pstack.push(this.nc);
            let result; try { result = await execFn(args); } finally { this.pstack.pop(); }
            const lat = Date.now()-t0;
            const oStr = this._ser(result);
            const oHash = this._hash(oStr);

            let tokens=null, cost=0;
            if(primitive==='INFER'&&typeof result==='string') {
                const pt=Math.ceil(iStr.length/4), ct=Math.ceil(result.length/4);
                tokens={prompt:pt,completion:ct};
                cost=pt*0.00000015+ct*0.0000006;
                this.stats.totalTokens.prompt+=pt; this.stats.totalTokens.completion+=ct; this.stats.totalCost+=cost;
            }

            if(this.opts.cache) this.cache.set(iHash,result,oHash);
            this.stats.totalLatencyMs+=lat; this.stats.stochasticOps++;
            const node=this._node({type:'ai_call',domain:Domain.STOCHASTIC,primitive,inputHash:iHash,outputHash:oHash,input:this._trunc(iStr),output:this._trunc(oStr),parentId:pid,latencyMs:lat,cached:false,model:ctx.model||null,tokens,cost});
            return {result,node};
        }

        getReport() {
            this.session.endedAt=new Date().toISOString();
            return {
                session:this.session, stats:{...this.stats,cache:this.cache.getStats()},
                trace:this.trace.map(n=>n.toJSON()),
                stochasticNodes:this.trace.filter(n=>n.domain===Domain.STOCHASTIC).map(n=>n.toCompact()),
                deterministicNodes:this.trace.filter(n=>n.domain===Domain.DETERMINISTIC).length,
                boundaries:this._boundaries(),
            };
        }

        getTraceLog() { return this.trace.map(n=>n.toCompact()).join('\n'); }

        getDAG() {
            return {
                nodes:this.trace.map(n=>({id:n.id,label:n.primitive||n.type,domain:n.domain,cached:n.cached})),
                edges:this.trace.filter(n=>n.parentId!==null).map(n=>({from:n.parentId,to:n.id})),
            };
        }

        exportForReplay() {
            return {
                version:'1.0.0', session:this.session,
                cache:Array.from(this.cache.store.entries()).map(([h,e])=>({inputHash:h,output:e.output,outputHash:e.outputHash})),
                trace:this.trace.map(n=>n.toJSON()),
            };
        }

        importForReplay(data) { if(data.cache) for(const e of data.cache) this.cache.set(e.inputHash,e.output,e.outputHash); }

        reset() {
            this.trace=[]; this.nc=0; this.pstack=[];
            this.stats={totalCalls:0,byPrimitive:{INFER:0,EMBED:0,PROMPT:0,PIPE:0,REFLECT:0,SEARCH:0},totalLatencyMs:0,totalTokens:{prompt:0,completion:0},totalCost:0,cacheHits:0,cacheMisses:0,deterministicOps:0,stochasticOps:0};
            this.session={id:'sal_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),startedAt:new Date().toISOString(),endedAt:null};
        }

        _boundaries() {
            const b=[]; let last=null;
            for(const n of this.trace) { if(n.domain!==last){b.push({nodeId:n.id,from:last,to:n.domain,at:n.primitive||n.type,timestamp:n.timestamp});last=n.domain;} }
            return b;
        }

        _node(p) { const n=new TraceNode({id:this.nc++,timestamp:new Date().toISOString(),...p}); if(this.opts.trace&&this.trace.length<this.opts.maxNodes)this.trace.push(n); return n; }
        _hash(s) { let h1=0xdeadbeef,h2=0x41c6ce57; for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);} h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909); return(4294967296*(2097151&h2)+(h1>>>0)).toString(16).padStart(16,'0'); }
        _ser(v) { if(v===null||v===undefined)return'null'; if(typeof v==='string')return v; if(typeof v==='number'||typeof v==='boolean')return String(v); try{return JSON.stringify(v);}catch{return String(v);} }
        _trunc(s) { return s.length<=this.opts.trunc?s:s.slice(0,this.opts.trunc)+'…['+( s.length-this.opts.trunc)+' more]'; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4c  SAL EDGE RUNTIME — Pluggable AI backend (offline → local → cloud)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Edge mode tiers:
     *   ⠁ CACHE_ONLY  — Pure offline replay from SAL cache. Zero network.
     *   ⠠ LOCAL       — In-browser LLM via WebLLM (WebGPU). No internet.
     *   ⡪ HYBRID      — Local-first, OpenRouter fallback. Best of both.
     *   ⠳ CLOUD       — OpenRouter only (original behavior).
     *   ⠀ DRY_RUN     — Mock responses (default playground mode).
     */
    const EdgeMode = Object.freeze({
        CACHE_ONLY: 'cache_only',
        LOCAL:      'local',
        HYBRID:     'hybrid',
        CLOUD:      'cloud',
        DRY_RUN:    'dry_run',
    });

    class SALEdgeRuntime {
        constructor(opts = {}) {
            this.mode = opts.mode || EdgeMode.DRY_RUN;
            this.apiKey = opts.apiKey || null;
            this.model = opts.model || 'openai/gpt-4o-mini';
            this.localModel = opts.localModel || null;  // WebLLM engine ref
            this.localModelId = opts.localModelId || 'SmolLM2-360M-Instruct-q4f16_1-MLC';
            this.localReady = false;
            this.localLoading = false;
            this.onStatus = opts.onStatus || (() => {});
            this._dryRunFn = opts.dryRunFn || null;  // fallback for dry-run
        }

        /**
         * Get a human-readable status object for the UI.
         */
        getStatus() {
            return {
                mode: this.mode,
                localReady: this.localReady,
                localLoading: this.localLoading,
                hasApiKey: !!this.apiKey,
                modelId: this.mode === EdgeMode.LOCAL || this.mode === EdgeMode.HYBRID
                    ? this.localModelId : this.model,
                tier: this.mode === EdgeMode.CACHE_ONLY ? '⠁ offline (cache replay)'
                    : this.mode === EdgeMode.LOCAL ? '⠠ edge (local LLM)'
                    : this.mode === EdgeMode.HYBRID ? '⡪ hybrid (local + cloud)'
                    : this.mode === EdgeMode.CLOUD ? '⠳ cloud (OpenRouter)'
                    : '⠀ dry-run (mock)',
            };
        }

        /**
         * Initialize local model via WebLLM if available.
         * Returns a promise that resolves when the model is ready.
         */
        async initLocal(progressCb) {
            if (this.localReady) return true;
            if (typeof window === 'undefined') return false;

            // Check for WebGPU support
            if (!navigator.gpu) {
                this.onStatus({ event: 'local_unavailable', reason: 'WebGPU not supported in this browser. Try Chrome 113+ or Edge 113+.' });
                return false;
            }

            try {
                this.localLoading = true;
                this.onStatus({ event: 'local_loading', modelId: this.localModelId });

                // Dynamically import WebLLM as ES module
                const webllm = await import('https://esm.run/@mlc-ai/web-llm');

                const engine = await webllm.CreateMLCEngine(this.localModelId, {
                    initProgressCallback: (progress) => {
                        this.onStatus({ event: 'local_progress', ...progress });
                        if (progressCb) progressCb(progress);
                    },
                });

                this.localModel = engine;
                this.localReady = true;
                this.localLoading = false;
                this.onStatus({ event: 'local_ready', modelId: this.localModelId });
                return true;
            } catch (e) {
                this.localLoading = false;
                this.onStatus({ event: 'local_error', error: e.message });
                return false;
            }
        }

        /**
         * Execute an AI primitive via the current edge mode.
         * This is the function passed to SAL.intercept as executeFn.
         */
        async execute(primitive, args, fallbackFn) {
            switch (this.mode) {
                case EdgeMode.CACHE_ONLY:
                    // Cache-only: SAL cache handles it. If cache miss, return a
                    // deterministic placeholder instead of failing.
                    return this._cacheOnlyFallback(primitive, args);

                case EdgeMode.LOCAL:
                    return this._executeLocal(primitive, args);

                case EdgeMode.HYBRID:
                    // Try local first, fall back to cloud
                    try {
                        if (this.localReady) return await this._executeLocal(primitive, args);
                    } catch (_) { /* fall through to cloud */ }
                    if (this.apiKey) return this._executeCloud(primitive, args);
                    return this._cacheOnlyFallback(primitive, args);

                case EdgeMode.CLOUD:
                    if (this.apiKey) return this._executeCloud(primitive, args);
                    return fallbackFn ? fallbackFn(args) : this._cacheOnlyFallback(primitive, args);

                case EdgeMode.DRY_RUN:
                default:
                    return fallbackFn ? fallbackFn(args) : this._dryRun(primitive, args);
            }
        }

        // ── Tier 1: Cache-only fallback ──
        _cacheOnlyFallback(primitive, args) {
            const prompt = String(args[0] || '');
            switch (primitive) {
                case 'INFER': return `[⠁ CACHE_ONLY] No cached response for: "${prompt.substring(0, 60)}"`;
                case 'EMBED': return Array.from({ length: 8 }, () => 0.0);
                case 'PROMPT': return prompt;
                case 'PIPE': return prompt;
                case 'REFLECT': return `[⠁ CACHE_ONLY] reflect: ${prompt.substring(0, 60)}`;
                case 'SEARCH': return [];
                default: return null;
            }
        }

        // ── Tier 2: Local WebLLM inference ──
        async _executeLocal(primitive, args) {
            const prompt = String(args[0] || '');

            switch (primitive) {
                case 'INFER': {
                    if (!this.localModel) throw new Error('Local model not initialized');
                    const resp = await this.localModel.chat.completions.create({
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 512,
                        temperature: 0.7,
                    });
                    return resp.choices[0]?.message?.content || '';
                }
                case 'EMBED': {
                    // WebLLM doesn't support embeddings natively.
                    // Generate a deterministic pseudo-embedding from the prompt hash.
                    const h = this._quickHash(prompt);
                    return Array.from({ length: 8 }, (_, i) => ((h >> (i * 4)) & 0xF) / 15.0);
                }
                case 'PROMPT': {
                    let t = prompt;
                    const vars = args[1] || {};
                    if (vars instanceof Map) for (const [k, v] of vars) t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
                    return t;
                }
                case 'PIPE': {
                    return async (input) => {
                        let r = input;
                        for (const fn of args) {
                            if (typeof fn === 'function') r = await fn(r);
                            else if (typeof fn === 'string') r = fn.replace('{input}', String(r));
                        }
                        return r;
                    };
                }
                case 'REFLECT': {
                    if (!this.localModel) return `[⠠ LOCAL] reflect: ${prompt.substring(0, 60)}`;
                    const resp = await this.localModel.chat.completions.create({
                        messages: [{ role: 'user', content: `Analyze this code and explain what it does:\n${prompt}` }],
                        max_tokens: 256,
                    });
                    return resp.choices[0]?.message?.content || '';
                }
                case 'SEARCH': {
                    const corpus = args[1] || [];
                    const terms = prompt.toLowerCase().split(/\s+/);
                    return corpus.filter(d => terms.some(t => String(d).toLowerCase().includes(t)));
                }
                default: return null;
            }
        }

        // ── Tier 3: Cloud (OpenRouter) ──
        async _executeCloud(primitive, args) {
            const prompt = String(args[0] || '');

            switch (primitive) {
                case 'INFER': {
                    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://elevate-foundry.github.io/braille/braille-lang/',
                            'X-Title': 'SAL Edge Runtime - BrailleLang',
                        },
                        body: JSON.stringify({
                            model: this.model,
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: 1024,
                        }),
                    });
                    const data = await resp.json();
                    if (data.error) throw new Error(data.error.message || 'OpenRouter error');
                    return data.choices?.[0]?.message?.content || '';
                }
                case 'EMBED': {
                    // OpenRouter doesn't expose embeddings API directly.
                    // Hash-based pseudo-embedding for now.
                    const h = this._quickHash(prompt);
                    return Array.from({ length: 8 }, (_, i) => ((h >> (i * 4)) & 0xF) / 15.0);
                }
                case 'PROMPT': {
                    let t = prompt;
                    const vars = args[1] || {};
                    if (vars instanceof Map) for (const [k, v] of vars) t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
                    return t;
                }
                case 'PIPE': {
                    return async (input) => {
                        let r = input;
                        for (const fn of args) {
                            if (typeof fn === 'function') r = await fn(r);
                            else if (typeof fn === 'string') r = fn.replace('{input}', String(r));
                        }
                        return r;
                    };
                }
                case 'REFLECT': {
                    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://elevate-foundry.github.io/braille/braille-lang/',
                            'X-Title': 'SAL Edge Runtime - BrailleLang',
                        },
                        body: JSON.stringify({
                            model: this.model,
                            messages: [{ role: 'user', content: `Analyze this code:\n${prompt}` }],
                            max_tokens: 512,
                        }),
                    });
                    const data = await resp.json();
                    return data.choices?.[0]?.message?.content || '';
                }
                case 'SEARCH': {
                    const corpus = args[1] || [];
                    const terms = prompt.toLowerCase().split(/\s+/);
                    return corpus.filter(d => terms.some(t => String(d).toLowerCase().includes(t)));
                }
                default: return null;
            }
        }

        // ── Dry-run (mock, no network) ──
        _dryRun(primitive, args) {
            if (this._dryRunFn) return this._dryRunFn(primitive, args);
            return this._cacheOnlyFallback(primitive, args);
        }

        _quickHash(s) {
            let h = 0;
            for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
            return Math.abs(h);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4d  BRAILLE CRDT — Distill frontier LLMs into 8-dot Braille vectors
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Architecture:
    //   ┌─────────────────────────────────────────────────────────────────┐
    //   │  Query: "What is consciousness?"                               │
    //   └───────┬─────────┬─────────┬─────────┬─────────┬───────────────┘
    //           │         │         │         │         │
    //     ┌─────▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
    //     │ GPT-4o  │ │Claude │ │Gemini │ │Llama  │ │Mistral│
    //     └─────┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    //           │         │         │         │         │
    //     ┌─────▼─────────▼─────────▼─────────▼─────────▼───┐
    //     │  CRDT Merge Layer                                │
    //     │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
    //     │  │ LWW Reg  │ │ OR-Set   │ │ Vector Consensus │  │
    //     │  │ (latest) │ │ (union)  │ │ (majority vote)  │  │
    //     │  └──────────┘ └──────────┘ └──────────────────┘  │
    //     └──────────────────────┬────────────────────────────┘
    //                           │
    //     ┌─────────────────────▼────────────────────────────┐
    //     │  8-Dot Braille Encoding                          │
    //     │  d₀=existence d₁=physical d₂=temporal d₃=spatial │
    //     │  d₄=social    d₅=cognitive d₆=emotional d₇=trans │
    //     │  → Compress to 256-state concept vectors         │
    //     └──────────────────────────────────────────────────┘
    //
    // CRDT Types used:
    //   - G-Counter:     Track agreement count per semantic dimension
    //   - LWW-Register:  Last-write-wins for best single answer
    //   - OR-Set:        Observed-remove set for concept extraction
    //   - PN-Counter:    Positive-negative counter for sentiment/polarity

    const DIMENSION_SEMANTICS = [
        'existence',    // d₀ — being, presence, ontological
        'physical',     // d₁ — material, body, tangible
        'temporal',     // d₂ — time, change, process
        'spatial',      // d₃ — space, structure, form
        'social',       // d₄ — relation, community, other
        'cognitive',    // d₅ — mind, knowledge, thought
        'emotional',    // d₆ — feeling, affect, valence
        'transcendent', // d₇ — abstract, spiritual, beyond
    ];

    const FRONTIER_MODELS = [
        // ── Tier 1: Flagship frontier ──
        { id: 'openai/gpt-4o', name: 'GPT-4o', weight: 1.0, color: '#10b981', tpm: 30000 },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5', weight: 1.0, color: '#d4a574', tpm: 40000 },
        { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', weight: 1.0, color: '#60a5fa', tpm: 60000 },
        // ── Tier 2: Strong frontier ──
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', weight: 0.9, color: '#a78bfa', tpm: 30000 },
        { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', weight: 0.9, color: '#f472b6', tpm: 30000 },
        { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', weight: 0.9, color: '#f97316', tpm: 30000 },
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', weight: 0.9, color: '#14b8a6', tpm: 30000 },
        // ── Tier 3: Fast / high-throughput ──
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', weight: 0.8, color: '#34d399', tpm: 60000 },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', weight: 0.8, color: '#fbbf24', tpm: 50000 },
        { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Lite', weight: 0.8, color: '#93c5fd', tpm: 80000 },
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', weight: 0.7, color: '#c084fc', tpm: 60000 },
        { id: 'mistralai/mistral-small-24b-instruct-2501', name: 'Mistral Small', weight: 0.7, color: '#fb7185', tpm: 50000 },
        { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 7B', weight: 0.7, color: '#fdba74', tpm: 60000 },
        { id: 'microsoft/phi-4', name: 'Phi-4', weight: 0.7, color: '#67e8f9', tpm: 50000 },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', weight: 0.85, color: '#2dd4bf', tpm: 30000 },
    ];

    const CRDT_SYSTEM_PROMPT_BASE = `You are a BrailleCRDT scoring node in the system at https://elevate-foundry.github.io/braille/braille-lang/

Your ONLY job: given a user query, output exactly 8 floating-point numbers (0.0 to 1.0) separated by commas. Nothing else. No words, no explanation, no markdown.

Each number scores how strongly the query relates to one of the 8 semantic dimensions of 8-dot Braille (Unicode U+2800-U+28FF), as defined by the BrailleConceptAtlas:

d0 EXISTENCE (being, presence, ontological truth, identity)
d1 PHYSICAL (material, body, tangible, energy, matter)
d2 TEMPORAL (time, change, process, duration, history)
d3 SPATIAL (space, structure, form, geometry, pattern)
d4 SOCIAL (relation, community, culture, interpersonal)
d5 COGNITIVE (mind, knowledge, thought, logic, reason)
d6 EMOTIONAL (feeling, affect, valence, mood, empathy)
d7 TRANSCENDENT (abstract, spiritual, metaphysical, infinite)

Example query: "What is love?"
Example output: 0.7,0.2,0.3,0.1,0.8,0.4,1.0,0.6

Example query: "How does gravity work?"
Example output: 0.5,0.9,0.4,0.8,0.1,0.7,0.1,0.3

RESPOND WITH ONLY 8 COMMA-SEPARATED NUMBERS. NOTHING ELSE.`;

    // Shared honesty history — persists across probe runs, CRDT-merged
    // Hydrate from localStorage if available
    const _HONESTY_STORAGE_KEY = 'brailleCRDT_honestyHistory';
    const _honestyHistory = (() => {
        try {
            const stored = localStorage.getItem(_HONESTY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (_) { return {}; }
    })();
    function _saveHonestyHistory() {
        try { localStorage.setItem(_HONESTY_STORAGE_KEY, JSON.stringify(_honestyHistory)); } catch (_) {}
    }

    class BrailleCRDT {
        constructor(opts = {}) {
            this.apiKey = opts.apiKey || null;
            this.models = opts.models || FRONTIER_MODELS;
            this.onProgress = opts.onProgress || (() => {});
            this.results = [];       // Raw model responses
            this.vectors = [];       // 8D Braille vectors per model
            this.merged = null;      // Final merged vector
            this.mergedText = '';    // Final distilled text
            this.stats = { queriesSent: 0, responsesReceived: 0, mergeOps: 0, compressionRatio: 0 };
        }

        // ─────────────────────────────────────────────────────────────────
        // §0  HONESTY PROBE — Calibrate model trustworthiness
        // ─────────────────────────────────────────────────────────────────

        static get PROBE_TYPE_NAMES() { return ['bit-pattern', 'freq-bands', 'vector', 'dot-count']; }

        /**
         * Generate a probe for a SPECIFIC type and braille codepoint.
         * @param {number} probeType - 0=bit-pattern, 1=freq-bands, 2=vector, 3=dot-count
         * @param {number} [forceOffset] - specific braille offset (0-255), random if omitted
         */
        static _generateProbe(probeType, forceOffset) {
            const offset = forceOffset !== undefined ? forceOffset : Math.floor(Math.random() * 256);
            const codePoint = 0x2800 + offset;
            const char = String.fromCodePoint(codePoint);
            const bits = offset.toString(2).padStart(8, '0');
            const vec = bits.split('').map(Number);

            const FREQ_BANDS = [200, 400, 600, 1000, 1600, 2400, 3200, 4800];
            const DIM_NAMES = ['existence', 'physical', 'temporal', 'spatial', 'social', 'cognitive', 'emotional', 'transcendent'];
            const activeFreqs = vec.map((b, i) => b === 1 ? FREQ_BANDS[i] : null).filter(Boolean);
            const activeDots = vec.reduce((s, b) => s + b, 0);

            let prompt, verify;
            const hex = codePoint.toString(16).toUpperCase();

            switch (probeType) {
                case 0:
                    prompt = `In BrailleLang (https://elevate-foundry.github.io/braille/braille-lang/), what is the 8-bit binary pattern for U+${hex}? The offset from U+2800 is ${offset}. Convert ${offset} to 8-bit binary. Reply with ONLY the 8-bit binary string.`;
                    verify = (resp) => {
                        const cleaned = resp.replace(/[^01]/g, '');
                        if (cleaned.length < 8) return 0;
                        const candidate = cleaned.slice(0, 8);
                        if (candidate === bits) return 1.0;
                        let matches = 0;
                        for (let i = 0; i < 8; i++) if (candidate[i] === bits[i]) matches++;
                        return matches / 8;
                    };
                    break;

                case 1:
                    prompt = `BrailleTTS maps 8 braille dots to frequencies: d0=200Hz, d1=400Hz, d2=600Hz, d3=1000Hz, d4=1600Hz, d5=2400Hz, d6=3200Hz, d7=4800Hz. Character ${char} (U+${hex}, offset ${offset}, binary ${bits}) has these active dots. List ONLY the active frequencies as comma-separated integers.`;
                    verify = (resp) => {
                        const nums = resp.match(/\d+/g);
                        if (!nums) return activeFreqs.length === 0 ? 1.0 : 0;
                        const parsed = nums.map(Number).filter(n => FREQ_BANDS.includes(n));
                        if (parsed.length === 0 && activeFreqs.length === 0) return 1.0;
                        if (activeFreqs.length === 0) return parsed.length === 0 ? 1.0 : 0;
                        const correct = parsed.filter(f => activeFreqs.includes(f)).length;
                        const wrong = parsed.filter(f => !activeFreqs.includes(f)).length;
                        return Math.max(0, (correct / activeFreqs.length) - (wrong * 0.2));
                    };
                    break;

                case 2:
                    prompt = `In BrailleLang, braille cell ${char} is at U+${hex}. Its offset from U+2800 is ${offset}. Convert to an 8D binary vector [d0,d1,...,d7] where each d is 0 or 1. Reply with ONLY 8 digits (0 or 1) separated by commas.`;
                    verify = (resp) => {
                        const nums = resp.match(/[01]/g);
                        if (!nums || nums.length < 8) return 0;
                        let matches = 0;
                        for (let i = 0; i < 8; i++) if (parseInt(nums[i]) === vec[i]) matches++;
                        return matches / 8;
                    };
                    break;

                case 3:
                    prompt = `Braille character ${char} is at Unicode U+${hex}, offset ${offset} from U+2800. Binary: ${bits}. How many 1-bits (raised dots) does it have? Reply with ONLY a single integer.`;
                    verify = (resp) => {
                        const nums = resp.match(/\d+/g);
                        if (!nums) return 0;
                        const n = parseInt(nums[0]);
                        if (n === activeDots) return 1.0;
                        return Math.max(0, 1 - Math.abs(n - activeDots) * 0.25);
                    };
                    break;
            }

            return { prompt, char, codePoint: `U+${hex}`, offset, expectedBits: bits, expectedVector: vec, expectedFreqs: activeFreqs, expectedDots: activeDots, probeType, verify };
        }

        /**
         * Generate all 4 probe types for one random codepoint.
         */
        static _generateAllProbes(forceOffset) {
            const offset = forceOffset !== undefined ? forceOffset : Math.floor(Math.random() * 256);
            return [0, 1, 2, 3].map(t => BrailleCRDT._generateProbe(t, offset));
        }

        /**
         * Build a system prompt that includes CRDT-merged honesty history.
         * Each model sees its own calibration + peer standings.
         */
        _buildSystemPrompt(modelId) {
            let prompt = CRDT_SYSTEM_PROMPT_BASE;

            const historyEntries = Object.entries(_honestyHistory);
            if (historyEntries.length > 0) {
                prompt += '\n\n--- CRDT HONESTY CALIBRATION (from verifiable probe history) ---\n';
                prompt += 'Each model below has been tested with deterministic braille math probes.\n';
                prompt += 'Scores are CRDT G-Counter merged across multiple probe runs.\n\n';

                const sorted = historyEntries
                    .map(([id, h]) => ({ id, ...h }))
                    .sort((a, b) => b.composite - a.composite);

                for (const entry of sorted) {
                    const isSelf = entry.id === modelId;
                    const marker = isSelf ? ' ← YOU' : '';
                    const badge = entry.composite >= 0.8 ? '✓GROUNDED' : entry.composite >= 0.5 ? '⚠PARTIAL' : entry.composite >= 0.3 ? '⚠UNRELIABLE' : '⠻HALLUCINATING';
                    prompt += `${entry.name}: ${(entry.composite * 100).toFixed(0)}% ${badge} (bits:${(entry.perType[0] * 100).toFixed(0)}% freq:${(entry.perType[1] * 100).toFixed(0)}% vec:${(entry.perType[2] * 100).toFixed(0)}% dots:${(entry.perType[3] * 100).toFixed(0)}%) [${entry.probeRuns} runs]${marker}\n`;
                }

                prompt += '\nYour accuracy on braille math is being tracked. Respond precisely.';
            }

            return prompt;
        }

        /**
         * Run honesty probes — ALL 4 probe types per model, same codepoint.
         * CRDT-merges results into honestyHistory across runs.
         * Returns per-model scores and dynamically adjusted weights.
         */
        async honestyProbe(opts = {}) {
            const models = opts.models || this.models;
            const onProbeResult = opts.onProbeResult || (() => {});

            // All models get the same codepoint for fairness
            const probes = BrailleCRDT._generateAllProbes();

            const probePromises = models.map(async (model, i) => {
                const details = [];
                const perTypeScores = [0, 0, 0, 0];

                for (const probe of probes) {
                    const t0 = Date.now();
                    try {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 15000);

                        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'https://elevate-foundry.github.io/braille/braille-lang/',
                                'X-Title': 'BrailleCRDT HonestyProbe',
                            },
                            signal: controller.signal,
                            body: JSON.stringify({
                                model: model.id,
                                messages: [
                                    { role: 'system', content: 'You are a precise computation assistant. Answer ONLY with the exact requested format. No explanation.' },
                                    { role: 'user', content: probe.prompt },
                                ],
                                max_tokens: 60,
                                temperature: 0.0,
                            }),
                        });

                        clearTimeout(timer);
                        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                        const data = await resp.json();
                        const answer = data.choices?.[0]?.message?.content || '';
                        const score = probe.verify(answer);
                        perTypeScores[probe.probeType] = score;

                        details.push({
                            probeType: probe.probeType,
                            char: probe.char,
                            codePoint: probe.codePoint,
                            expected: probe.expectedBits,
                            answer: answer.trim().slice(0, 80),
                            score,
                            latency: Date.now() - t0,
                        });
                    } catch (e) {
                        details.push({ probeType: probe.probeType, char: probe.char, error: e.message, score: 0, latency: Date.now() - t0 });
                    }
                }

                // Composite = weighted average (freq-bands harder, gets more weight)
                const composite = (perTypeScores[0] * 0.25 + perTypeScores[1] * 0.30 + perTypeScores[2] * 0.25 + perTypeScores[3] * 0.20);

                // ── CRDT G-Counter merge into history ──
                const prev = _honestyHistory[model.id];
                if (prev) {
                    const runs = prev.probeRuns + 1;
                    const alpha = 1 / runs; // diminishing weight for new data
                    _honestyHistory[model.id] = {
                        name: model.name,
                        composite: prev.composite * (1 - alpha) + composite * alpha,
                        perType: prev.perType.map((v, t) => v * (1 - alpha) + perTypeScores[t] * alpha),
                        probeRuns: runs,
                        lastProbeTime: Date.now(),
                    };
                } else {
                    _honestyHistory[model.id] = {
                        name: model.name,
                        composite,
                        perType: [...perTypeScores],
                        probeRuns: 1,
                        lastProbeTime: Date.now(),
                    };
                }

                onProbeResult(i, model.name, composite, details, perTypeScores);

                return { model: model.name, modelId: model.id, score: composite, perTypeScores, details, originalWeight: model.weight };
            });

            const scores = await Promise.all(probePromises);

            // Persist CRDT-merged history to localStorage
            _saveHonestyHistory();

            // Dynamic weight adjustment using CRDT-merged history (not just this run)
            const adjustedModels = models.map((m, i) => {
                const h = _honestyHistory[m.id];
                const historyScore = h ? h.composite : scores[i].score;
                return {
                    ...m,
                    originalWeight: m.weight,
                    honestyScore: historyScore,
                    perTypeScores: scores[i].perTypeScores,
                    weight: Math.max(0.1, m.weight * (0.3 + 0.7 * historyScore)),
                };
            });

            return { scores, adjustedModels, history: { ..._honestyHistory } };
        }

        /**
         * Get the current CRDT-merged honesty history (persisted in localStorage).
         */
        static getHonestyHistory() { return { ..._honestyHistory }; }

        /**
         * Clear all honesty history (both in-memory and localStorage).
         */
        static clearHonestyHistory() {
            for (const k of Object.keys(_honestyHistory)) delete _honestyHistory[k];
            try { localStorage.removeItem(_HONESTY_STORAGE_KEY); } catch (_) {}
        }

        // ─────────────────────────────────────────────────────────────────
        // §1  MULTI-MODEL QUERY — Fan out to N frontier LLMs
        // ─────────────────────────────────────────────────────────────────

        async queryAll(prompt, opts = {}) {
            const maxTokens = opts.maxTokens || 512;
            const timeout = opts.timeout || 30000;
            const selectedModels = opts.models || this.models;

            this.onProgress({ phase: 'query', message: `⠠ Querying ${selectedModels.length} frontier models...` });

            const promises = selectedModels.map(async (model, i) => {
                this.stats.queriesSent++;
                const t0 = Date.now();
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), timeout);

                    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://elevate-foundry.github.io/braille/braille-lang/',
                            'X-Title': 'BrailleCRDT Distillation - BrailleLang',
                        },
                        signal: controller.signal,
                        body: JSON.stringify({
                            model: model.id,
                            messages: [
                                { role: 'system', content: this._buildSystemPrompt(model.id) },
                                { role: 'user', content: prompt },
                            ],
                            max_tokens: 80,
                            temperature: 0.1,
                        }),
                    });

                    clearTimeout(timer);
                    const data = await resp.json();
                    const latency = Date.now() - t0;

                    if (data.error) throw new Error(data.error.message || 'API error');

                    const text = data.choices?.[0]?.message?.content || '';
                    this.stats.responsesReceived++;
                    this.onProgress({ phase: 'response', model: model.name, index: i, latency, length: text.length });

                    return { model: model.name, modelId: model.id, weight: model.weight, text, latency, error: null, tokens: data.usage || null };
                } catch (e) {
                    return { model: model.name, modelId: model.id, weight: model.weight, text: '', latency: Date.now() - t0, error: e.message, tokens: null };
                }
            });

            this.results = await Promise.all(promises);
            return this.results;
        }

        /**
         * Stream responses from all models in parallel via SSE.
         * Calls onToken(modelIndex, token, fullTextSoFar) for each chunk.
         * Returns array of results when all streams finish.
         */
        async queryAllStreaming(prompt, opts = {}) {
            const maxTokens = opts.maxTokens || 512;
            const timeout = opts.timeout || 30000;
            const selectedModels = opts.models || this.models;
            const onToken = opts.onToken || (() => {});
            const onModelDone = opts.onModelDone || (() => {});
            const onModelError = opts.onModelError || (() => {});

            this.onProgress({ phase: 'query', message: `⠠ Streaming ${selectedModels.length} frontier models...` });

            const promises = selectedModels.map(async (model, i) => {
                this.stats.queriesSent++;
                const t0 = Date.now();
                let fullText = '';
                try {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), timeout);

                    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://elevate-foundry.github.io/braille/braille-lang/',
                            'X-Title': 'BrailleCRDT Distillation - BrailleLang',
                        },
                        signal: controller.signal,
                        body: JSON.stringify({
                            model: model.id,
                            messages: [
                                { role: 'system', content: this._buildSystemPrompt(model.id) },
                                { role: 'user', content: prompt },
                            ],
                            max_tokens: 80,
                            temperature: 0.1,
                            stream: true,
                        }),
                    });

                    clearTimeout(timer);

                    if (!resp.ok) {
                        const errData = await resp.json().catch(() => ({}));
                        throw new Error(errData.error?.message || `HTTP ${resp.status}`);
                    }

                    const reader = resp.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                const delta = parsed.choices?.[0]?.delta?.content || '';
                                if (delta) {
                                    fullText += delta;
                                    onToken(i, delta, fullText);
                                }
                            } catch (_) { /* skip malformed SSE chunks */ }
                        }
                    }

                    const latency = Date.now() - t0;
                    this.stats.responsesReceived++;
                    const result = { model: model.name, modelId: model.id, weight: model.weight, text: fullText, latency, error: null, tokens: null };
                    onModelDone(i, result);
                    return result;
                } catch (e) {
                    const latency = Date.now() - t0;
                    const result = { model: model.name, modelId: model.id, weight: model.weight, text: fullText, latency, error: e.message, tokens: null };
                    onModelError(i, result);
                    return result;
                }
            });

            this.results = await Promise.all(promises);
            return this.results;
        }

        /**
         * Batch distillation — fire N rounds, each streaming all models in parallel.
         * Each round explores a different facet of the prompt.
         * Returns an array of per-round results + a final merged Braille sequence.
         */
        async batchDistill(prompt, opts = {}) {
            const rounds = opts.rounds || 5;
            const models = opts.models || this.models;
            const onToken = opts.onToken || (() => {});
            const onModelDone = opts.onModelDone || (() => {});
            const onModelError = opts.onModelError || (() => {});
            const onRoundStart = opts.onRoundStart || (() => {});
            const onRoundDone = opts.onRoundDone || (() => {});

            const facets = [
                prompt,
                `Score the core meaning of: ${prompt}`,
                `Score the physical and material aspects of: ${prompt}`,
                `Score the temporal and causal aspects of: ${prompt}`,
                `Score the social and relational aspects of: ${prompt}`,
                `Score the emotional and experiential aspects of: ${prompt}`,
                `Score from an expert perspective: ${prompt}`,
                `Score the abstract and philosophical aspects of: ${prompt}`,
                `Score the practical, real-world implications of: ${prompt}`,
                `Score contrarian/alternative interpretation of: ${prompt}`,
            ];

            const allRounds = [];
            const t0 = performance.now();

            for (let round = 0; round < Math.min(rounds, facets.length); round++) {
                onRoundStart(round, rounds, facets[round]);

                const results = await this.queryAllStreaming(facets[round], {
                    models,
                    onToken: (i, delta, full) => onToken(round, i, delta, full),
                    onModelDone: (i, result) => onModelDone(round, i, result),
                    onModelError: (i, result) => onModelError(round, i, result),
                });

                const validResults = results.filter(r => !r.error && r.text.length > 0);
                const vectors = validResults.map(r => this.textToSemanticVector(r.text));
                const weights = validResults.map(r => r.weight);
                const gCounter = vectors.length > 0 ? this.gCounterMerge(vectors, weights) : new Float64Array(8);
                const braille = this.vectorToBraille(gCounter);

                const roundData = {
                    round, facet: facets[round], results, validResults,
                    vectors, gCounter, braille,
                    totalChars: validResults.reduce((s, r) => s + r.text.length, 0),
                    modelsResponded: validResults.length,
                };
                allRounds.push(roundData);
                onRoundDone(round, roundData);
            }

            const totalMs = performance.now() - t0;

            // Merge all round vectors into a final super-consensus
            const allVectors = allRounds.flatMap(r => r.vectors);
            const allWeights = allRounds.flatMap(r => r.validResults.map(v => v.weight));
            const superGCounter = allVectors.length > 0 ? this.gCounterMerge(allVectors, allWeights) : new Float64Array(8);
            const superBraille = this.vectorToBraille(superGCounter);
            const superMajority = this.majorityVoteMerge(allVectors, allWeights);
            const superBinaryBraille = this.vectorToBraille(superMajority, 0.5);
            const totalChars = allRounds.reduce((s, r) => s + r.totalChars, 0);
            const totalTokens = Math.round(totalChars / 4.2);
            const totalModels = allRounds.reduce((s, r) => s + r.modelsResponded, 0);

            // Build the Braille sequence (one char per round)
            const brailleSequence = allRounds.map(r => r.braille).join('');

            return {
                rounds: allRounds,
                brailleSequence,
                superConsensus: superBraille,
                superBinary: superBinaryBraille,
                superVector: Array.from(superGCounter).map(v => +v.toFixed(4)),
                totalMs: totalMs.toFixed(0),
                totalChars,
                totalTokens,
                totalModelResponses: totalModels,
                totalRounds: allRounds.length,
                tokPerSec: totalMs > 0 ? (totalTokens / (totalMs / 1000)).toFixed(0) : 0,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // §2  CRDT MERGE — Conflict-free merge of model outputs
        // ─────────────────────────────────────────────────────────────────

        /**
         * Semantic dimension scoring prompt — asks models to rate each
         * dimension of the 8-dot Braille space for a given response.
         */
        _buildDimensionPrompt(originalQuery, responseText) {
            return `Given this question: "${originalQuery}"
And this answer: "${responseText.substring(0, 500)}"

Rate how much this answer relates to each of these 8 semantic dimensions on a scale of 0.0 to 1.0:
1. EXISTENCE (being, presence, ontological truth)
2. PHYSICAL (material, body, tangible reality)
3. TEMPORAL (time, change, process, duration)
4. SPATIAL (space, structure, form, geometry)
5. SOCIAL (relation, community, interpersonal)
6. COGNITIVE (mind, knowledge, thought, logic)
7. EMOTIONAL (feeling, affect, valence, mood)
8. TRANSCENDENT (abstract, spiritual, metaphysical)

Reply ONLY with 8 numbers separated by commas, like: 0.8,0.2,0.5,0.1,0.3,0.9,0.4,0.7`;
        }

        /**
         * Parse a model's response as an 8D semantic vector.
         * Expects "0.8,0.2,0.5,0.1,0.3,0.9,0.4,0.7" format.
         * Falls back to keyword heuristic if parsing fails.
         */
        textToSemanticVector(text) {
            // Try to parse 8 floats from the response
            const parsed = this._parseVectorResponse(text);
            if (parsed) return parsed;
            // Fallback: keyword heuristic
            return this._keywordHeuristic(text);
        }

        _parseVectorResponse(text) {
            // Extract all decimal numbers from the response
            const nums = text.match(/\d+\.?\d*/g);
            if (!nums || nums.length < 8) return null;
            const v = new Float64Array(8);
            let vi = 0;
            for (const n of nums) {
                if (vi >= 8) break;
                const val = parseFloat(n);
                if (val >= 0 && val <= 1.0) {
                    v[vi++] = val;
                }
            }
            return vi >= 8 ? v : null;
        }

        _keywordHeuristic(text) {
            const lower = text.toLowerCase();
            const v = new Float64Array(8);
            v[0] = this._wordScore(lower, ['exist','being','is','truth','real','fundament','ontolog','essence','nature','meaning','purpose','conscious']);
            v[1] = this._wordScore(lower, ['physic','body','matter','material','tangib','concret','brain','organ','cell','atom','energy','force','object']);
            v[2] = this._wordScore(lower, ['time','chang','process','evolv','histor','future','past','present','sequen','develop','progress','phase','stage']);
            v[3] = this._wordScore(lower, ['space','structur','form','pattern','geometr','shape','dimension','layer','network','archite','topolog','system']);
            v[4] = this._wordScore(lower, ['social','relat','communit','people','cultur','societ','human','person','group','interact','cooper','language','communicat']);
            v[5] = this._wordScore(lower, ['mind','knowledge','thought','logic','reason','cognit','intellig','learn','understand','think','comput','algorithm','process','inform']);
            v[6] = this._wordScore(lower, ['feel','emotion','affect','experienc','subjectiv','love','fear','joy','pain','empathy','mood','sentiment','passion']);
            v[7] = this._wordScore(lower, ['abstract','spirit','metaphys','transcend','beyond','infinit','universal','divine','cosmic','sacred','mystic','philosophi','consciousness']);
            return v;
        }

        _wordScore(text, keywords) {
            let hits = 0;
            for (const kw of keywords) {
                const regex = new RegExp(kw, 'gi');
                const matches = text.match(regex);
                if (matches) hits += matches.length;
            }
            return Math.min(1.0, hits / 5.0);  // Normalize: 5+ hits = 1.0
        }

        /**
         * G-Counter CRDT merge: each model votes on each dimension.
         * The merged vector is the weighted average across all replicas.
         */
        gCounterMerge(vectors, weights) {
            const merged = new Float64Array(8);
            let totalWeight = 0;

            for (let r = 0; r < vectors.length; r++) {
                const w = weights[r] || 1.0;
                totalWeight += w;
                for (let d = 0; d < 8; d++) {
                    merged[d] += vectors[r][d] * w;
                }
            }

            if (totalWeight > 0) {
                for (let d = 0; d < 8; d++) merged[d] /= totalWeight;
            }

            this.stats.mergeOps++;
            return merged;
        }

        /**
         * Majority-vote CRDT: threshold each dimension to binary.
         * A dot is ON if >50% of models (by weight) agree it's significant.
         */
        majorityVoteMerge(vectors, weights, threshold = 0.4) {
            const avg = this.gCounterMerge(vectors, weights);
            const binary = new Float64Array(8);
            for (let d = 0; d < 8; d++) {
                binary[d] = avg[d] >= threshold ? 1.0 : 0.0;
            }
            this.stats.mergeOps++;
            return binary;
        }

        /**
         * OR-Set CRDT: extract unique concepts from all model responses,
         * merge by union. Each concept is tagged with its source model.
         */
        orSetMerge(results) {
            const concepts = new Map(); // concept → { sources: Set, count, firstSeen }
            const allText = results.filter(r => !r.error).map(r => r.text).join(' ');

            // Extract key noun phrases (simplified: capitalized words, technical terms)
            for (const r of results) {
                if (r.error) continue;
                const words = r.text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
                for (const w of words) {
                    const key = w.toLowerCase();
                    if (key.length < 3) continue;
                    if (!concepts.has(key)) {
                        concepts.set(key, { text: w, sources: new Set(), count: 0 });
                    }
                    const entry = concepts.get(key);
                    entry.sources.add(r.model);
                    entry.count++;
                }
            }

            // Sort by agreement (how many models mentioned it)
            const sorted = Array.from(concepts.values())
                .sort((a, b) => b.sources.size - a.sources.size || b.count - a.count);

            this.stats.mergeOps++;
            return sorted;
        }

        /**
         * LWW-Register CRDT: pick the best single response.
         * "Best" = highest cosine similarity to the merged consensus vector.
         */
        lwwRegisterMerge(results, vectors, mergedVector) {
            let bestIdx = 0, bestSim = -1;

            for (let i = 0; i < vectors.length; i++) {
                if (results[i].error) continue;
                const sim = this._cosineSim(vectors[i], mergedVector);
                if (sim > bestSim) { bestSim = sim; bestIdx = i; }
            }

            this.stats.mergeOps++;
            return { bestResult: results[bestIdx], similarity: bestSim, index: bestIdx };
        }

        // ─────────────────────────────────────────────────────────────────
        // §3  8-DOT BRAILLE ENCODING — Compress to 256-state vectors
        // ─────────────────────────────────────────────────────────────────

        /**
         * Encode a continuous 8D vector into a single Braille character.
         * Each dimension is thresholded: >= threshold → dot ON.
         * This gives us a single byte (0-255) → single Unicode Braille char.
         */
        vectorToBraille(vec, threshold = 0.4) {
            let byte = 0;
            for (let i = 0; i < 8; i++) {
                if (vec[i] >= threshold) byte |= (1 << i);
            }
            return String.fromCodePoint(0x2800 + byte);
        }

        /**
         * Encode a text response as a sequence of Braille characters.
         * Splits text into chunks, scores each chunk's semantic vector,
         * and encodes each as a Braille character.
         */
        textToBrailleSequence(text, chunkSize = 100) {
            const chunks = [];
            for (let i = 0; i < text.length; i += chunkSize) {
                chunks.push(text.substring(i, i + chunkSize));
            }

            const braille = chunks.map(chunk => {
                const vec = this.textToSemanticVector(chunk);
                return this.vectorToBraille(vec);
            }).join('');

            return { braille, chunks: chunks.length, originalLength: text.length, compressedLength: braille.length };
        }

        // ─────────────────────────────────────────────────────────────────
        // §4  FULL DISTILLATION PIPELINE
        // ─────────────────────────────────────────────────────────────────

        /**
         * Run the full CRDT distillation pipeline:
         *   1. Query N frontier models in parallel
         *   2. Score each response on 8 semantic dimensions
         *   3. CRDT merge: G-Counter (weighted avg), Majority Vote, OR-Set, LWW
         *   4. Encode merged knowledge into 8-dot Braille
         *   5. Return comprehensive report
         */
        async distill(prompt, opts = {}) {
            if (!this.apiKey) throw new Error('No API key. Set apiKey on BrailleCRDT.');

            const t0 = Date.now();

            // §1 Query all models
            this.onProgress({ phase: 'start', models: this.models.length, prompt });
            const results = await this.queryAll(prompt, opts);
            const validResults = results.filter(r => !r.error && r.text.length > 0);

            if (validResults.length === 0) {
                return { error: 'All models failed', results, stats: this.stats };
            }

            this.onProgress({ phase: 'merge', validModels: validResults.length });

            // §2 Score semantic dimensions
            const vectors = validResults.map(r => this.textToSemanticVector(r.text));
            const weights = validResults.map(r => r.weight);
            this.vectors = vectors;

            // §3 CRDT merges
            const gCounter = this.gCounterMerge(vectors, weights);
            const majorityVote = this.majorityVoteMerge(vectors, weights);
            const orSet = this.orSetMerge(validResults);
            const lww = this.lwwRegisterMerge(validResults, vectors, gCounter);

            // §4 Encode to Braille
            const consensusBraille = this.vectorToBraille(gCounter);
            const binaryBraille = this.vectorToBraille(majorityVote, 0.5);
            this.merged = gCounter;

            // §5 Encode each response to braille sequence
            const perModelBraille = validResults.map((r, i) => ({
                model: r.model,
                braille: this.textToBrailleSequence(r.text, 200),
                vector: Array.from(vectors[i]).map(v => v.toFixed(3)),
            }));

            // §6 Compute agreement metrics
            const agreement = this._computeAgreement(vectors);

            // §7 Compression stats
            const totalInputChars = validResults.reduce((s, r) => s + r.text.length, 0);
            const totalInputTokens = validResults.reduce((s, r) => s + (r.tokens?.total_tokens || Math.ceil(r.text.length / 4)), 0);

            this.stats.compressionRatio = totalInputChars > 0 ? (1 / totalInputChars * 100).toFixed(4) : 0;

            const report = {
                query: prompt,
                timestamp: new Date().toISOString(),
                latencyMs: Date.now() - t0,

                // Raw model responses
                models: results.map(r => ({
                    name: r.model, id: r.modelId, latency: r.latency,
                    error: r.error, length: r.text.length,
                    tokens: r.tokens,
                    text: r.text,
                })),

                // CRDT merge results
                crdt: {
                    gCounter: { vector: Array.from(gCounter).map(v => v.toFixed(3)), braille: consensusBraille },
                    majorityVote: { vector: Array.from(majorityVote), braille: binaryBraille },
                    orSet: { topConcepts: orSet.slice(0, 20).map(c => ({ text: c.text, agreement: c.sources.size, mentions: c.count })) },
                    lwwRegister: { bestModel: lww.bestResult.model, similarity: lww.similarity.toFixed(4), text: lww.bestResult.text },
                },

                // 8-dot Braille encoding
                braille: {
                    consensus: consensusBraille,
                    binary: binaryBraille,
                    dimensionLabels: DIMENSION_SEMANTICS,
                    perModel: perModelBraille,
                },

                // Agreement & compression
                agreement,
                compression: {
                    totalInputChars,
                    totalInputTokens,
                    distilledBraille: consensusBraille,
                    distilledBits: 8,
                    compressionRatio: `${totalInputChars}:1 → 1 braille char`,
                    informationDensity: `${(8 / Math.max(totalInputChars * 8, 1) * 100).toFixed(6)}%`,
                },

                stats: { ...this.stats },
            };

            this.onProgress({ phase: 'done', report });
            return report;
        }

        // ─────────────────────────────────────────────────────────────────
        // §5  AGREEMENT METRICS
        // ─────────────────────────────────────────────────────────────────

        _computeAgreement(vectors) {
            if (vectors.length < 2) return { pairwise: [], avgCosine: 0, avgHamming: 0 };

            const pairs = [];
            let totalCos = 0, totalHam = 0, count = 0;

            for (let i = 0; i < vectors.length; i++) {
                for (let j = i + 1; j < vectors.length; j++) {
                    const cos = this._cosineSim(vectors[i], vectors[j]);
                    const ham = this._hammingDist(vectors[i], vectors[j]);
                    pairs.push({ i, j, cosine: cos.toFixed(4), hamming: ham });
                    totalCos += cos;
                    totalHam += ham;
                    count++;
                }
            }

            return {
                pairwise: pairs,
                avgCosine: count > 0 ? (totalCos / count).toFixed(4) : 0,
                avgHamming: count > 0 ? (totalHam / count).toFixed(2) : 0,
                consensusStrength: count > 0 ? ((totalCos / count) * 100).toFixed(1) + '%' : '0%',
            };
        }

        _cosineSim(a, b) {
            let dot = 0, na = 0, nb = 0;
            for (let i = 0; i < 8; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
            na = Math.sqrt(na); nb = Math.sqrt(nb);
            return (na > 0 && nb > 0) ? dot / (na * nb) : 0;
        }

        _hammingDist(a, b) {
            let d = 0;
            for (let i = 0; i < 8; i++) if ((a[i] >= 0.4) !== (b[i] >= 0.4)) d++;
            return d;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4b  BRAILLE TTS — Braille-native audio synthesis
    // ═══════════════════════════════════════════════════════════════════════

    class BrailleTTS {
        constructor(opts = {}) {
            this.sampleRate = opts.sampleRate || 22050;
            this.frameDurationMs = opts.frameDurationMs || 200;
            this.baseAmplitude = opts.baseAmplitude || 0.25;
            // 8 frequency bands mapped to braille dot positions (speech-relevant 200–4800 Hz)
            this.FREQ_BANDS = [200, 400, 600, 1000, 1600, 2400, 3200, 4800];
            this.FREQ_LABELS = ['low', 'low-mid', 'F1-low', 'F1-high', 'F2-low', 'F2-high', 'consonant', 'sibilance'];
            this._audioCtx = null;
            this._gainNode = null;
        }

        _ensureCtx() {
            if (!this._audioCtx) {
                const AC = typeof AudioContext !== 'undefined' ? AudioContext : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);
                if (!AC) return null;
                this._audioCtx = new AC();
                this._gainNode = this._audioCtx.createGain();
                this._gainNode.gain.value = this.baseAmplitude;
                this._gainNode.connect(this._audioCtx.destination);
            }
            if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
            return this._audioCtx;
        }

        /**
         * Synthesize a Float32Array waveform from an array of 8D vectors.
         */
        synthesizeFromVectors(vectors) {
            const sr = this.sampleRate;
            const frameSamples = Math.round(sr * this.frameDurationMs / 1000);
            const totalSamples = frameSamples * vectors.length;
            const samples = new Float32Array(totalSamples);
            const attackSamples = Math.round(sr * 0.005);
            const releaseSamples = Math.round(sr * 0.01);

            for (let f = 0; f < vectors.length; f++) {
                const vec = vectors[f];
                let activeDots = 0;
                for (let d = 0; d < 8; d++) if (vec[d] >= 0.4) activeDots++;
                if (activeDots === 0) continue;

                const perDotAmp = 1.0 / Math.sqrt(activeDots);
                const offset = f * frameSamples;

                for (let d = 0; d < 8; d++) {
                    if (vec[d] < 0.4) continue;
                    const amp = perDotAmp * Math.min(1, vec[d]);
                    const omega = 2 * Math.PI * this.FREQ_BANDS[d] / sr;
                    for (let s = 0; s < frameSamples; s++) {
                        let env = 1.0;
                        if (s < attackSamples) env = s / attackSamples;
                        else if (s > frameSamples - releaseSamples) env = (frameSamples - s) / releaseSamples;
                        samples[offset + s] += amp * env * Math.sin(omega * s);
                    }
                }
            }
            return { samples, sampleRate: sr, duration: totalSamples / sr, frameCount: vectors.length };
        }

        /**
         * Play a buffer via Web Audio API. Returns a promise.
         */
        playBuffer(synthesized) {
            const ctx = this._ensureCtx();
            if (!ctx) return Promise.resolve();
            const buf = ctx.createBuffer(1, synthesized.samples.length, synthesized.sampleRate);
            buf.getChannelData(0).set(synthesized.samples);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(this._gainNode);
            src.start();
            return new Promise(r => { src.onended = r; });
        }

        /**
         * Play a single 8D vector as a short tone. Great for real-time feedback.
         */
        playVector(vec, durationMs) {
            const dur = durationMs || this.frameDurationMs;
            const origDur = this.frameDurationMs;
            this.frameDurationMs = dur;
            const synth = this.synthesizeFromVectors([vec]);
            this.frameDurationMs = origDur;
            return this.playBuffer(synth);
        }

        /**
         * Play a sequence of vectors (e.g. batch result braille sequence).
         */
        playSequence(vectors, durationMsPerFrame) {
            const dur = durationMsPerFrame || this.frameDurationMs;
            const origDur = this.frameDurationMs;
            this.frameDurationMs = dur;
            const synth = this.synthesizeFromVectors(vectors);
            this.frameDurationMs = origDur;
            return this.playBuffer(synth);
        }

        /**
         * Play the consensus merge as a dramatic chord that builds up.
         * Each dimension fades in one at a time over ~2 seconds.
         */
        playMergeChord(vec, totalDurationMs) {
            const ctx = this._ensureCtx();
            if (!ctx) return Promise.resolve();
            const dur = (totalDurationMs || 2000) / 1000;
            const now = ctx.currentTime;

            const oscillators = [];
            for (let d = 0; d < 8; d++) {
                if (vec[d] < 0.3) continue;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = this.FREQ_BANDS[d];
                osc.type = 'sine';
                gain.gain.value = 0;
                // Stagger: each dimension fades in at a different time
                const fadeInStart = now + (d / 8) * dur * 0.6;
                const fadeInEnd = fadeInStart + 0.15;
                const amp = Math.min(1, vec[d]) * this.baseAmplitude / Math.sqrt(8);
                gain.gain.setValueAtTime(0, fadeInStart);
                gain.gain.linearRampToValueAtTime(amp, fadeInEnd);
                gain.gain.setValueAtTime(amp, now + dur - 0.2);
                gain.gain.linearRampToValueAtTime(0, now + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(fadeInStart);
                osc.stop(now + dur + 0.1);
                oscillators.push(osc);
            }
            return new Promise(r => setTimeout(r, totalDurationMs || 2000));
        }

        setVolume(v) {
            if (this._gainNode) this._gainNode.gain.value = Math.max(0, Math.min(1, v));
        }

        stop() {
            if (this._audioCtx) { this._audioCtx.close(); this._audioCtx = null; this._gainNode = null; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  COMPILER
    // ═══════════════════════════════════════════════════════════════════════

    class Compiler {
        constructor(options = {}) { this.options = { indent: '  ', includeRuntime: true, ...options }; this.depth = 0; }

        compile(ast) {
            let code = this.options.includeRuntime ? '// ⡂⡲⡡⡩⡬⡬⡥ Compiled Output\n' : '';
            code += this._node(ast);
            return code;
        }

        _node(n) {
            if (!n) return 'null';
            switch (n.type) {
                case 'Program': return n.body.map(s => this._node(s) + ';').join('\n');
                case 'Block': { this.depth++; const ind = this.options.indent.repeat(this.depth); const lines = n.statements.map(s => ind + this._node(s) + ';'); this.depth--; return '{\n' + lines.join('\n') + '\n' + this.options.indent.repeat(this.depth) + '}'; }
                case 'Declaration': { const kw = n.isConst ? 'const' : 'let'; const nm = this._id(n.name.name || n.name); return n.init ? `${kw} ${nm} = ${this._node(n.init)}` : `${kw} ${nm}`; }
                case 'Assignment': return `${this._node(n.target)} = ${this._node(n.value)}`;
                case 'FunctionDef': { const nm = this._id(n.name.name||n.name); const ps = n.params.map(p=>this._id(p.name||p)).join(', '); return `${n.isAsync?'async ':''}function ${nm}(${ps}) ${this._node(n.body)}`; }
                case 'LambdaDef': { const ps = (n.params||[]).map(p=>this._id(p.name||p)).join(', '); return n.body.type==='Block'?`(${ps}) => ${this._node(n.body)}`:`(${ps}) => (${this._node(n.body)})`; }
                case 'IfStatement': { let c = `if (${this._node(n.condition)}) ${this._node(n.consequent)}`; if (n.alternate) c += ` else ${this._node(n.alternate)}`; return c; }
                case 'WhileLoop': return `while (${this._node(n.condition)}) ${this._node(n.body)}`;
                case 'ForeverLoop': return `while (true) ${this._node(n.body)}`;
                case 'ForEach': return `for (const ${this._id(n.item.name||n.item)} of ${this._node(n.iterable)}) ${this._node(n.body)}`;
                case 'TryCatch': { let c=`try ${this._node(n.tryBlock)}`; if(n.catchBlock){const ev=n.errorVar?this._id(n.errorVar.name||'e'):'e';c+=` catch (${ev}) ${this._node(n.catchBlock)}`;} return c; }
                case 'Return': return `return ${n.value?this._node(n.value):''}`;
                case 'Yield': return `yield ${n.value?this._node(n.value):''}`;
                case 'Print': return `console.log(${n.args.map(a=>this._node(a)).join(', ')})`;
                case 'Halt': return 'return';
                case 'ExpressionStatement': return this._node(n.expression);
                case 'BinaryExpr': return `(${this._node(n.left)} ${n.operator} ${this._node(n.right)})`;
                case 'UnaryExpr': return `(${n.operator}${this._node(n.operand)})`;
                case 'CallExpr': return `${this._node(n.callee)}(${n.args.map(a=>this._node(a)).join(', ')})`;
                case 'MemberExpr': return `${this._node(n.object)}.${n.property.name}`;
                case 'IndexExpr': return `${this._node(n.object)}[${this._node(n.index)}]`;
                case 'PipeExpression': return `${this._node(n.right)}(${this._node(n.left)})`;
                case 'AIPrimitive': return `/* AI:${n.name} */(${n.args.map(a=>this._node(a)).join(', ')})`;
                case 'NumberLiteral': return String(n.value);
                case 'StringLiteral': return JSON.stringify(n.value);
                case 'NullLiteral': return 'null';
                case 'ThisExpr': return 'this';
                case 'ArrayLiteral': return `[${n.elements.map(e=>this._node(e)).join(', ')}]`;
                case 'MapLiteral': return `new Map([${n.entries.map(e=>`[${this._node(e.key)}, ${this._node(e.value)}]`).join(', ')}])`;
                case 'Identifier': return this._id(n.name);
                default: return `/* ${n.type} */`;
            }
        }
        _id(n) { return (n||'_').replace(/[^a-zA-Z0-9_$]/g, '_'); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    const BrailleLang = {
        Lexer, Token, Parser, ASTNode, Interpreter, Compiler,
        Environment, BrailleFunction, BrailleClass, BrailleInstance,
        SAL, SALCache, TraceNode, Domain,
        SALEdgeRuntime, EdgeMode,
        BrailleCRDT, BrailleTTS, FRONTIER_MODELS, DIMENSION_SEMANTICS,
        KEYWORDS, OPERATORS, DELIMITERS,

        async run(source, options = {}) {
            const lexer = new Lexer(source);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.parse();
            const interpreter = new Interpreter(options);
            return interpreter.execute(ast);
        },

        compile(source, options = {}) {
            const lexer = new Lexer(source);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.parse();
            const compiler = new Compiler(options);
            return compiler.compile(ast);
        },

        encode(text) { return Lexer.asciiToBraille(text); },
        decode(braille) { return Lexer.brailleToAscii(braille); },
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BrailleLang;
    } else {
        global.BrailleLang = BrailleLang;
    }

})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
