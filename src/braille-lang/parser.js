/**
 * ⡂⡲⡡⡩⡬⡬⡥ Parser — AST Generator for Braille source code
 * 
 * Takes a token stream from the Lexer and produces an Abstract Syntax Tree.
 * 
 * AST Node types:
 *   Program, Declaration, Assignment, FunctionDef, LambdaDef,
 *   ClassDef, IfStatement, WhileLoop, ForEach, ForeverLoop,
 *   TryCatch, AsyncBlock, Return, Print, InferCall, EmbedCall,
 *   PromptCall, PipeExpression, SearchCall, ReflectCall,
 *   BinaryExpr, UnaryExpr, CallExpr, MemberExpr,
 *   Identifier, NumberLiteral, StringLiteral, ArrayLiteral,
 *   MapLiteral, Block, Halt
 */

const { KEYWORDS, OPERATORS, DELIMITERS } = require('./spec');

class ASTNode {
    constructor(type, props = {}) {
        this.type = type;
        Object.assign(this, props);
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens.filter(t => t.type !== 'COMMENT');
        this.pos = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    parse() {
        const body = [];
        while (!this._isAtEnd()) {
            this._skipSemicolons();
            if (this._isAtEnd()) break;
            const stmt = this._parseStatement();
            if (stmt) body.push(stmt);
        }
        return new ASTNode('Program', { body });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  STATEMENTS
    // ═══════════════════════════════════════════════════════════════════════

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
                case 'PRINT':     return this._parsePrint();
                case 'LOG':       return this._parsePrint(); // alias
                case 'IMPORT':    return this._parseImport();
                case 'HALT':      return this._parseHalt();
                case 'YIELD':     return this._parseYield();
                case 'CHANGE':    return this._parseSwitch();
                default:          break;
            }

            // AI primitives as statements
            if (tok.meta.role === 'ai') {
                return this._parseExpressionStatement();
            }
        }

        return this._parseExpressionStatement();
    }

    // ── Declaration: ⠁ <ident> ⠪ <expr> ──
    _parseDeclaration(isConst) {
        this._advance(); // skip ⠁ or ⠹
        const name = this._parseIdentifier();
        let init = null;
        if (this._matchOperator('ASSIGN')) {
            init = this._parseExpression();
        }
        this._optionalSemicolon();
        return new ASTNode('Declaration', { name, init, isConst });
    }

    // ── Function: ⠃ <name> ⠣ <params> ⠜ ⠳ <body> ⠾ ──
    _parseFunctionDef() {
        this._advance(); // skip ⠃
        const name = this._parseIdentifier();
        this._expectDelimiter('LPAREN');
        const params = this._parseParamList();
        this._expectDelimiter('RPAREN');
        const body = this._parseBlock();
        return new ASTNode('FunctionDef', { name, params, body });
    }

    // ── Class: ⠑ <name> ⠳ <members> ⠾ ──
    _parseClassDef() {
        this._advance(); // skip ⠑
        const name = this._parseIdentifier();
        let parent = null;
        // Optional inheritance with ⠫ (ARROW/extends)
        if (this._matchOperator('ARROW')) {
            parent = this._parseIdentifier();
        }
        const body = this._parseBlock();
        return new ASTNode('ClassDef', { name, parent, body });
    }

    // ── If: ⠡ ⠣ <cond> ⠜ ⠳ <then> ⠾ [⡠ ⠳ <else> ⠾] ──
    _parseIf() {
        this._advance(); // skip ⠡
        this._expectDelimiter('LPAREN');
        const condition = this._parseExpression();
        this._expectDelimiter('RPAREN');
        const consequent = this._parseBlock();
        let alternate = null;
        if (this._matchKeyword('ELSE')) {
            if (this._peekKeyword('IF')) {
                alternate = this._parseIf();
            } else {
                alternate = this._parseBlock();
            }
        }
        return new ASTNode('IfStatement', { condition, consequent, alternate });
    }

    // ── While: ⠄ ⠣ <cond> ⠜ ⠳ <body> ⠾ ──
    _parseWhile() {
        this._advance(); // skip ⠄
        this._expectDelimiter('LPAREN');
        const condition = this._parseExpression();
        this._expectDelimiter('RPAREN');
        const body = this._parseBlock();
        return new ASTNode('WhileLoop', { condition, body });
    }

    // ── Forever: ⢄ ⠳ <body> ⠾ ──
    _parseForever() {
        this._advance(); // skip ⢄
        const body = this._parseBlock();
        return new ASTNode('ForeverLoop', { body });
    }

    // ── ForEach: ⠌ ⠣ <item> ⠊ <iterable> ⠜ ⠳ <body> ⠾ ──
    _parseForEach() {
        this._advance(); // skip ⠌
        this._expectDelimiter('LPAREN');
        const item = this._parseIdentifier();
        this._expectDelimiter('COLON'); // ⠊ as separator (item : iterable)
        const iterable = this._parseExpression();
        this._expectDelimiter('RPAREN');
        const body = this._parseBlock();
        return new ASTNode('ForEach', { item, iterable, body });
    }

    // ── TryCatch: ⡀ ⠳ <try> ⠾ ⡐ ⠣ <err> ⠜ ⠳ <catch> ⠾ ──
    _parseTryCatch() {
        this._advance(); // skip ⡀
        const tryBlock = this._parseBlock();
        let catchBlock = null;
        let errorVar = null;
        if (this._matchKeyword('CATCH')) {
            if (this._matchDelimiter('LPAREN')) {
                errorVar = this._parseIdentifier();
                this._expectDelimiter('RPAREN');
            }
            catchBlock = this._parseBlock();
        }
        return new ASTNode('TryCatch', { tryBlock, catchBlock, errorVar });
    }

    // ── Async: ⢀ ⠃ <name> ⠣ <params> ⠜ ⠳ <body> ⠾ ──
    _parseAsync() {
        this._advance(); // skip ⢀
        if (this._peekKeyword('FUNC')) {
            const fn = this._parseFunctionDef();
            fn.isAsync = true;
            return fn;
        }
        // Async expression / await
        const expr = this._parseExpression();
        this._optionalSemicolon();
        return new ASTNode('AsyncBlock', { body: expr });
    }

    // ── Return: ⡁ [<expr>] ──
    _parseReturn() {
        this._advance(); // skip ⡁
        let value = null;
        if (!this._isAtEnd() && !this._peekDelimiter('RBRACE') && !this._peekSemicolon()) {
            value = this._parseExpression();
        }
        this._optionalSemicolon();
        return new ASTNode('Return', { value });
    }

    // ── Print: ⠰ ⠣ <exprs> ⠜ ──
    _parsePrint() {
        this._advance(); // skip ⠰
        this._expectDelimiter('LPAREN');
        const args = this._parseArgList();
        this._expectDelimiter('RPAREN');
        this._optionalSemicolon();
        return new ASTNode('Print', { args });
    }

    // ── Import: ⠉ <name> ──
    _parseImport() {
        this._advance(); // skip ⠉
        const module = this._parseIdentifier();
        this._optionalSemicolon();
        return new ASTNode('Import', { module });
    }

    // ── Halt: ⣿ ──
    _parseHalt() {
        this._advance(); // skip ⣿
        this._optionalSemicolon();
        return new ASTNode('Halt', {});
    }

    // ── Yield: ⢁ [<expr>] ──
    _parseYield() {
        this._advance(); // skip ⢁
        let value = null;
        if (!this._isAtEnd() && !this._peekDelimiter('RBRACE') && !this._peekSemicolon()) {
            value = this._parseExpression();
        }
        this._optionalSemicolon();
        return new ASTNode('Yield', { value });
    }

    // ── Switch: ⠍ ⠣ <expr> ⠜ ⠳ ... ⠾ ──
    _parseSwitch() {
        this._advance(); // skip ⠍
        this._expectDelimiter('LPAREN');
        const discriminant = this._parseExpression();
        this._expectDelimiter('RPAREN');
        const body = this._parseBlock();
        return new ASTNode('Switch', { discriminant, body });
    }

    _parseExpressionStatement() {
        const expr = this._parseExpression();
        this._optionalSemicolon();
        return new ASTNode('ExpressionStatement', { expression: expr });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  EXPRESSIONS (Pratt parser / precedence climbing)
    // ═══════════════════════════════════════════════════════════════════════

    _parseExpression(minPrec = 0) {
        let left = this._parsePrimary();

        while (!this._isAtEnd()) {
            const tok = this._peek();

            // Pipe operator ⡪
            if (tok.type === 'KEYWORD' && tok.meta.name === 'PIPE') {
                this._advance();
                const right = this._parsePrimary();
                left = new ASTNode('PipeExpression', { left, right });
                continue;
            }

            // Binary operators
            if (tok.type === 'OPERATOR') {
                const prec = tok.meta.precedence;
                if (prec < minPrec) break;

                // Assignment is right-associative
                if (tok.meta.name === 'ASSIGN') {
                    this._advance();
                    const right = this._parseExpression(prec);
                    left = new ASTNode('Assignment', { target: left, value: right });
                    continue;
                }

                // Arrow / lambda
                if (tok.meta.name === 'ARROW') {
                    this._advance();
                    const body = this._parseExpression(prec);
                    left = new ASTNode('LambdaDef', {
                        params: left.type === 'Identifier' ? [left] :
                                left.type === 'ArgList' ? left.args : [left],
                        body
                    });
                    continue;
                }

                this._advance();
                const right = this._parseExpression(prec + 1);
                left = new ASTNode('BinaryExpr', {
                    operator: tok.meta.symbol,
                    operatorName: tok.meta.name,
                    left,
                    right,
                });
                continue;
            }

            // Member access (⠒ DOT)
            if (tok.type === 'DELIMITER' && tok.meta.name === 'DOT') {
                this._advance();
                const prop = this._parseIdentifier();
                left = new ASTNode('MemberExpr', { object: left, property: prop });
                continue;
            }

            // Function call (⠣ LPAREN)
            if (tok.type === 'DELIMITER' && tok.meta.name === 'LPAREN') {
                this._advance();
                const args = this._parseArgList();
                this._expectDelimiter('RPAREN');
                left = new ASTNode('CallExpr', { callee: left, args });
                continue;
            }

            // Index access (⠷ LBRACKET)
            if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACKET') {
                this._advance();
                const index = this._parseExpression();
                this._expectDelimiter('RBRACKET');
                left = new ASTNode('IndexExpr', { object: left, index });
                continue;
            }

            break;
        }

        return left;
    }

    _parsePrimary() {
        const tok = this._peek();

        // Unary NOT
        if (tok.type === 'OPERATOR' && tok.meta.name === 'NOT') {
            this._advance();
            const operand = this._parsePrimary();
            return new ASTNode('UnaryExpr', { operator: '!', operand });
        }

        // Number literal
        if (tok.type === 'NUMBER') {
            this._advance();
            return new ASTNode('NumberLiteral', { value: tok.meta.numericValue, raw: tok.value });
        }

        // String literal
        if (tok.type === 'STRING') {
            this._advance();
            return new ASTNode('StringLiteral', { value: tok.meta.decoded, raw: tok.value });
        }

        // Parenthesized expression
        if (tok.type === 'DELIMITER' && tok.meta.name === 'LPAREN') {
            this._advance();
            const expr = this._parseExpression();
            this._expectDelimiter('RPAREN');
            return expr;
        }

        // Array literal: ⠷ <exprs> ⠽
        if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACKET') {
            return this._parseArrayLiteral();
        }

        // Map literal: ⠳ <key>⠊<val>, ... ⠾
        if (tok.type === 'DELIMITER' && tok.meta.name === 'LBRACE') {
            return this._parseMapLiteral();
        }

        // Lambda: ⡥ ⠣ <params> ⠜ ⠫ <body>
        if (tok.type === 'KEYWORD' && tok.meta.name === 'LAMBDA') {
            return this._parseLambda();
        }

        // AI primitives
        if (tok.type === 'KEYWORD' && tok.meta.role === 'ai') {
            return this._parseAIPrimitive();
        }

        // Await expression
        if (tok.type === 'KEYWORD' && tok.meta.name === 'AWAIT') {
            this._advance();
            const expr = this._parsePrimary();
            return new ASTNode('AwaitExpr', { expression: expr });
        }

        // New expression
        if (tok.type === 'KEYWORD' && tok.meta.name === 'NEW') {
            this._advance();
            const callee = this._parsePrimary();
            return new ASTNode('NewExpr', { callee });
        }

        // Typeof
        if (tok.type === 'KEYWORD' && tok.meta.name === 'TYPEOF') {
            this._advance();
            const operand = this._parsePrimary();
            return new ASTNode('TypeofExpr', { operand });
        }

        // VOID literal
        if (tok.type === 'KEYWORD' && tok.meta.name === 'VOID') {
            this._advance();
            return new ASTNode('NullLiteral', {});
        }

        // THIS
        if (tok.type === 'KEYWORD' && tok.meta.name === 'THIS') {
            this._advance();
            return new ASTNode('ThisExpr', {});
        }

        // Identifier
        if (tok.type === 'IDENTIFIER') {
            this._advance();
            return new ASTNode('Identifier', {
                name: tok.meta.decoded || tok.value,
                braille: tok.value,
            });
        }

        // Fallback: consume unknown token as identifier
        this._advance();
        return new ASTNode('Identifier', {
            name: tok.value,
            braille: tok.value,
        });
    }

    // ── Array literal: ⠷ expr, expr, ... ⠽ ──
    _parseArrayLiteral() {
        this._advance(); // skip ⠷
        const elements = [];
        while (!this._isAtEnd() && !this._peekDelimiter('RBRACKET')) {
            elements.push(this._parseExpression());
            if (!this._matchDelimiter('COMMA')) break;
        }
        this._expectDelimiter('RBRACKET');
        return new ASTNode('ArrayLiteral', { elements });
    }

    // ── Map literal: ⠳ key⠊val, ... ⠾ ──
    _parseMapLiteral() {
        this._advance(); // skip ⠳
        const entries = [];
        while (!this._isAtEnd() && !this._peekDelimiter('RBRACE')) {
            const key = this._parseExpression();
            this._expectDelimiter('COLON');
            const value = this._parseExpression();
            entries.push({ key, value });
            if (!this._matchDelimiter('COMMA')) break;
        }
        this._expectDelimiter('RBRACE');
        return new ASTNode('MapLiteral', { entries });
    }

    // ── Lambda: ⡥ ⠣ params ⠜ ⠫ expr ──
    _parseLambda() {
        this._advance(); // skip ⡥
        let params = [];
        if (this._matchDelimiter('LPAREN')) {
            params = this._parseParamList();
            this._expectDelimiter('RPAREN');
        }
        this._expectOperator('ARROW');
        let body;
        if (this._peekDelimiter('LBRACE')) {
            body = this._parseBlock();
        } else {
            body = this._parseExpression();
        }
        return new ASTNode('LambdaDef', { params, body });
    }

    // ── AI Primitives ──
    _parseAIPrimitive() {
        const tok = this._advance();
        const name = tok.meta.name;
        this._expectDelimiter('LPAREN');
        const args = this._parseArgList();
        this._expectDelimiter('RPAREN');
        return new ASTNode('AIPrimitive', { name, args, concept: tok.meta.concept });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    _parseBlock() {
        this._expectDelimiter('LBRACE');
        const stmts = [];
        while (!this._isAtEnd() && !this._peekDelimiter('RBRACE')) {
            this._skipSemicolons();
            if (this._peekDelimiter('RBRACE')) break;
            const stmt = this._parseStatement();
            if (stmt) stmts.push(stmt);
        }
        this._expectDelimiter('RBRACE');
        return new ASTNode('Block', { statements: stmts });
    }

    _parseParamList() {
        const params = [];
        while (!this._isAtEnd() && !this._peekDelimiter('RPAREN')) {
            params.push(this._parseIdentifier());
            if (!this._matchDelimiter('COMMA')) break;
        }
        return params;
    }

    _parseArgList() {
        const args = [];
        while (!this._isAtEnd() && !this._peekDelimiter('RPAREN') && !this._peekDelimiter('RBRACKET')) {
            args.push(this._parseExpression());
            if (!this._matchDelimiter('COMMA')) break;
        }
        return args;
    }

    _parseIdentifier() {
        const tok = this._advance();
        if (tok.type === 'IDENTIFIER') {
            return new ASTNode('Identifier', {
                name: tok.meta.decoded || tok.value,
                braille: tok.value,
            });
        }
        // Allow keywords to be used as identifiers in certain contexts
        return new ASTNode('Identifier', {
            name: tok.meta?.name || tok.value,
            braille: tok.value,
        });
    }

    // ── Token navigation ──

    _peek() {
        return this.tokens[this.pos] || new (require('./lexer').Token)('EOF', '', -1, -1, -1);
    }

    _advance() {
        const tok = this.tokens[this.pos];
        if (this.pos < this.tokens.length) this.pos++;
        return tok;
    }

    _isAtEnd() {
        return this.pos >= this.tokens.length || this.tokens[this.pos].type === 'EOF';
    }

    _matchKeyword(name) {
        const tok = this._peek();
        if (tok.type === 'KEYWORD' && tok.meta.name === name) {
            this._advance();
            return true;
        }
        return false;
    }

    _matchOperator(name) {
        const tok = this._peek();
        if (tok.type === 'OPERATOR' && tok.meta.name === name) {
            this._advance();
            return true;
        }
        return false;
    }

    _matchDelimiter(name) {
        const tok = this._peek();
        if (tok.type === 'DELIMITER' && tok.meta.name === name) {
            this._advance();
            return true;
        }
        return false;
    }

    _peekKeyword(name) {
        const tok = this._peek();
        return tok.type === 'KEYWORD' && tok.meta.name === name;
    }

    _peekDelimiter(name) {
        const tok = this._peek();
        return tok.type === 'DELIMITER' && tok.meta.name === name;
    }

    _peekSemicolon() {
        const tok = this._peek();
        return tok.type === 'DELIMITER' && tok.meta.name === 'SEMICOLON';
    }

    _expectDelimiter(name) {
        if (!this._matchDelimiter(name)) {
            const tok = this._peek();
            throw new SyntaxError(
                `Expected delimiter ${name} but got ${tok.type}:${tok.meta?.name || tok.value} at L${tok.line}:${tok.col}`
            );
        }
    }

    _expectOperator(name) {
        if (!this._matchOperator(name)) {
            const tok = this._peek();
            throw new SyntaxError(
                `Expected operator ${name} but got ${tok.type}:${tok.meta?.name || tok.value} at L${tok.line}:${tok.col}`
            );
        }
    }

    _expectKeyword(name) {
        if (!this._matchKeyword(name)) {
            const tok = this._peek();
            throw new SyntaxError(
                `Expected keyword ${name} but got ${tok.type}:${tok.meta?.name || tok.value} at L${tok.line}:${tok.col}`
            );
        }
    }

    _skipSemicolons() {
        while (this._peekSemicolon()) {
            this._advance();
        }
    }

    _optionalSemicolon() {
        this._matchDelimiter('SEMICOLON');
    }
}

module.exports = { Parser, ASTNode };
