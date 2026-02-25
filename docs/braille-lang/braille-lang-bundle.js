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
        }

        async execute(ast) {
            this.stats.startTime = Date.now(); this.output = [];
            let result = null;
            try { result = await this._exec(ast, this.global); } catch (e) { if (e !== HALT_SIG) throw e; }
            this.stats.endTime = Date.now();
            return { output: this.output, result, stats: { ...this.stats, durationMs: this.stats.endTime - this.stats.startTime } };
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
                case 'AIPrimitive': { const args=[];for(const a of node.args)args.push(await this._exec(a,env));this.stats.aiCalls++;return this._aiCall(node.name,args); }
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
