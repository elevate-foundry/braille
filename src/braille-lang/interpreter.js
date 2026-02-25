/**
 * ⡂⡲⡡⡩⡬⡬⡥ Interpreter — Runtime for Braille AST
 * 
 * Walks the AST and executes the program. Includes built-in AI primitives
 * that call OpenRouter for LLM inference, embeddings, and semantic search.
 * 
 * Environment model: lexically scoped, with closures.
 * AI primitives are async — the interpreter supports both sync and async execution.
 */

const fs = require('fs');
const path = require('path');

class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.bindings = new Map();
    }

    define(name, value, isConst = false) {
        this.bindings.set(name, { value, isConst });
    }

    get(name) {
        if (this.bindings.has(name)) {
            return this.bindings.get(name).value;
        }
        if (this.parent) return this.parent.get(name);
        throw new ReferenceError(`⠻ Undefined: ${name}`);
    }

    set(name, value) {
        if (this.bindings.has(name)) {
            const binding = this.bindings.get(name);
            if (binding.isConst) {
                throw new TypeError(`⠹ Cannot reassign constant: ${name}`);
            }
            binding.value = value;
            return;
        }
        if (this.parent) return this.parent.set(name, value);
        throw new ReferenceError(`⠻ Undefined: ${name}`);
    }

    has(name) {
        if (this.bindings.has(name)) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }
}

// Sentinel values for control flow
const RETURN_SIGNAL = Symbol('RETURN');
const BREAK_SIGNAL = Symbol('BREAK');
const CONTINUE_SIGNAL = Symbol('CONTINUE');
const HALT_SIGNAL = Symbol('HALT');

class ReturnValue {
    constructor(value) { this.value = value; this.signal = RETURN_SIGNAL; }
}

class BrailleFunction {
    constructor(name, params, body, closure, isAsync = false) {
        this.name = name;
        this.params = params;
        this.body = body;
        this.closure = closure;
        this.isAsync = isAsync;
    }
    toString() { return `⠃[${this.name}]`; }
}

class BrailleClass {
    constructor(name, methods, parent = null) {
        this.name = name;
        this.methods = methods;
        this.parent = parent;
    }
    toString() { return `⠑[${this.name}]`; }
}

class BrailleInstance {
    constructor(klass) {
        this.klass = klass;
        this.fields = new Map();
    }
    toString() { return `⠅[${this.klass.name}]`; }
}

class Interpreter {
    constructor(options = {}) {
        this.options = {
            apiKey: options.apiKey || process.env.OPENROUTER_API_KEY || null,
            model: options.model || 'openai/gpt-4o-mini',
            embedModel: options.embedModel || 'openai/text-embedding-3-small',
            baseUrl: options.baseUrl || 'https://openrouter.ai/api/v1',
            dryRun: options.dryRun !== undefined ? options.dryRun : false,
            maxInferTokens: options.maxInferTokens || 1024,
            ...options,
        };

        // Output buffer (for PRINT)
        this.output = [];

        // Global environment
        this.global = new Environment();
        this._initGlobals();

        // Execution stats
        this.stats = {
            statementsExecuted: 0,
            aiCalls: 0,
            startTime: null,
            endTime: null,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Execute an AST (Program node).
     * @param {ASTNode} ast
     * @returns {Promise<{output: string[], result: any, stats: Object}>}
     */
    async execute(ast) {
        this.stats.startTime = Date.now();
        this.output = [];
        let result = null;

        try {
            result = await this._execNode(ast, this.global);
        } catch (e) {
            if (e === HALT_SIGNAL) {
                // Normal halt
            } else {
                throw e;
            }
        }

        this.stats.endTime = Date.now();
        return {
            output: this.output,
            result,
            stats: {
                ...this.stats,
                durationMs: this.stats.endTime - this.stats.startTime,
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  AST EXECUTION
    // ═══════════════════════════════════════════════════════════════════════

    async _execNode(node, env) {
        if (!node) return null;
        this.stats.statementsExecuted++;

        switch (node.type) {
            case 'Program':           return this._execProgram(node, env);
            case 'Block':             return this._execBlock(node, env);
            case 'Declaration':       return this._execDeclaration(node, env);
            case 'Assignment':        return this._execAssignment(node, env);
            case 'FunctionDef':       return this._execFunctionDef(node, env);
            case 'LambdaDef':         return this._execLambdaDef(node, env);
            case 'ClassDef':          return this._execClassDef(node, env);
            case 'IfStatement':       return this._execIf(node, env);
            case 'WhileLoop':         return this._execWhile(node, env);
            case 'ForeverLoop':       return this._execForever(node, env);
            case 'ForEach':           return this._execForEach(node, env);
            case 'TryCatch':          return this._execTryCatch(node, env);
            case 'AsyncBlock':        return this._execNode(node.body, env);
            case 'Return':            return this._execReturn(node, env);
            case 'Yield':             return this._execReturn(node, env); // simplified
            case 'Print':             return this._execPrint(node, env);
            case 'Import':            return this._execImport(node, env);
            case 'Halt':              throw HALT_SIGNAL;
            case 'Switch':            return this._execSwitch(node, env);
            case 'ExpressionStatement': return this._execNode(node.expression, env);

            // Expressions
            case 'BinaryExpr':        return this._execBinary(node, env);
            case 'UnaryExpr':         return this._execUnary(node, env);
            case 'CallExpr':          return this._execCall(node, env);
            case 'MemberExpr':        return this._execMember(node, env);
            case 'IndexExpr':         return this._execIndex(node, env);
            case 'PipeExpression':    return this._execPipe(node, env);
            case 'AIPrimitive':       return this._execAIPrimitive(node, env);
            case 'AwaitExpr':         return this._execNode(node.expression, env);
            case 'NewExpr':           return this._execNew(node, env);
            case 'TypeofExpr':        return typeof (await this._execNode(node.operand, env));

            // Literals
            case 'NumberLiteral':     return node.value;
            case 'StringLiteral':     return node.value;
            case 'NullLiteral':       return null;
            case 'ThisExpr':          return env.get('this');
            case 'ArrayLiteral':      return this._execArray(node, env);
            case 'MapLiteral':        return this._execMap(node, env);
            case 'Identifier':        return env.get(node.name);

            default:
                throw new Error(`⠻ Unknown AST node: ${node.type}`);
        }
    }

    async _execProgram(node, env) {
        let result = null;
        for (const stmt of node.body) {
            result = await this._execNode(stmt, env);
            if (result instanceof ReturnValue) return result.value;
        }
        return result;
    }

    async _execBlock(node, env) {
        const blockEnv = new Environment(env);
        let result = null;
        for (const stmt of node.statements) {
            result = await this._execNode(stmt, blockEnv);
            if (result instanceof ReturnValue) return result;
        }
        return result;
    }

    async _execDeclaration(node, env) {
        const name = node.name.name || node.name;
        const value = node.init ? await this._execNode(node.init, env) : null;
        env.define(name, value, node.isConst);
        return value;
    }

    async _execAssignment(node, env) {
        const value = await this._execNode(node.value, env);
        if (node.target.type === 'Identifier') {
            env.set(node.target.name, value);
        } else if (node.target.type === 'MemberExpr') {
            const obj = await this._execNode(node.target.object, env);
            const prop = node.target.property.name;
            if (obj instanceof BrailleInstance) {
                obj.fields.set(prop, value);
            } else if (typeof obj === 'object' && obj !== null) {
                obj[prop] = value;
            }
        } else if (node.target.type === 'IndexExpr') {
            const obj = await this._execNode(node.target.object, env);
            const idx = await this._execNode(node.target.index, env);
            obj[idx] = value;
        }
        return value;
    }

    async _execFunctionDef(node, env) {
        const name = node.name.name || node.name;
        const paramNames = node.params.map(p => p.name || p);
        const fn = new BrailleFunction(name, paramNames, node.body, env, node.isAsync);
        env.define(name, fn);
        return fn;
    }

    async _execLambdaDef(node, env) {
        const paramNames = (node.params || []).map(p => p.name || p);
        return new BrailleFunction('⡥', paramNames, node.body, env);
    }

    async _execClassDef(node, env) {
        const name = node.name.name || node.name;
        const classEnv = new Environment(env);
        const methods = new Map();

        // Execute class body to collect methods
        if (node.body && node.body.statements) {
            for (const stmt of node.body.statements) {
                if (stmt.type === 'FunctionDef') {
                    const mName = stmt.name.name || stmt.name;
                    const paramNames = stmt.params.map(p => p.name || p);
                    methods.set(mName, new BrailleFunction(mName, paramNames, stmt.body, classEnv));
                }
            }
        }

        let parentClass = null;
        if (node.parent) {
            parentClass = env.get(node.parent.name || node.parent);
        }

        const klass = new BrailleClass(name, methods, parentClass);
        env.define(name, klass);
        return klass;
    }

    async _execIf(node, env) {
        const cond = await this._execNode(node.condition, env);
        if (this._isTruthy(cond)) {
            return this._execNode(node.consequent, env);
        } else if (node.alternate) {
            return this._execNode(node.alternate, env);
        }
        return null;
    }

    async _execWhile(node, env) {
        let result = null;
        while (this._isTruthy(await this._execNode(node.condition, env))) {
            result = await this._execNode(node.body, env);
            if (result instanceof ReturnValue) return result;
        }
        return result;
    }

    async _execForever(node, env) {
        let result = null;
        let iterations = 0;
        const MAX = 10000; // safety limit
        while (iterations++ < MAX) {
            result = await this._execNode(node.body, env);
            if (result instanceof ReturnValue) return result;
        }
        this.output.push('⢄ Forever loop hit safety limit (10000 iterations)');
        return result;
    }

    async _execForEach(node, env) {
        const iterable = await this._execNode(node.iterable, env);
        const itemName = node.item.name || node.item;
        const loopEnv = new Environment(env);
        let result = null;

        if (Array.isArray(iterable)) {
            for (const item of iterable) {
                loopEnv.define(itemName, item);
                result = await this._execNode(node.body, loopEnv);
                if (result instanceof ReturnValue) return result;
            }
        } else if (iterable instanceof Map) {
            for (const [k, v] of iterable) {
                loopEnv.define(itemName, [k, v]);
                result = await this._execNode(node.body, loopEnv);
                if (result instanceof ReturnValue) return result;
            }
        } else if (typeof iterable === 'string') {
            for (const ch of iterable) {
                loopEnv.define(itemName, ch);
                result = await this._execNode(node.body, loopEnv);
                if (result instanceof ReturnValue) return result;
            }
        }
        return result;
    }

    async _execTryCatch(node, env) {
        try {
            return await this._execNode(node.tryBlock, env);
        } catch (e) {
            if (e === HALT_SIGNAL) throw e;
            if (node.catchBlock) {
                const catchEnv = new Environment(env);
                if (node.errorVar) {
                    catchEnv.define(node.errorVar.name || 'error', e.message || String(e));
                }
                return await this._execNode(node.catchBlock, catchEnv);
            }
        }
        return null;
    }

    async _execReturn(node, env) {
        const value = node.value ? await this._execNode(node.value, env) : null;
        return new ReturnValue(value);
    }

    async _execPrint(node, env) {
        const values = [];
        for (const arg of node.args) {
            values.push(await this._execNode(arg, env));
        }
        const line = values.map(v => this._stringify(v)).join(' ');
        this.output.push(line);
        if (typeof process !== 'undefined') {
            process.stdout.write('⠰ ' + line + '\n');
        }
        return line;
    }

    async _execImport(node, env) {
        const moduleName = node.module.name || node.module;
        // Built-in module system
        const builtins = {
            'math': { PI: Math.PI, E: Math.E, sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, random: Math.random },
            'string': { length: (s) => s.length, upper: (s) => s.toUpperCase(), lower: (s) => s.toLowerCase(), split: (s, d) => s.split(d) },
            'array': { length: (a) => a.length, push: (a, v) => { a.push(v); return a; }, reverse: (a) => [...a].reverse(), sort: (a) => [...a].sort() },
        };
        if (builtins[moduleName]) {
            env.define(moduleName, builtins[moduleName]);
            return builtins[moduleName];
        }
        this.output.push(`⠉ Module not found: ${moduleName}`);
        return null;
    }

    async _execSwitch(node, env) {
        // Simplified: execute body with discriminant available
        const val = await this._execNode(node.discriminant, env);
        const switchEnv = new Environment(env);
        switchEnv.define('__switch__', val);
        return this._execNode(node.body, switchEnv);
    }

    // ── Expression execution ──

    async _execBinary(node, env) {
        const left = await this._execNode(node.left, env);
        const right = await this._execNode(node.right, env);

        switch (node.operator) {
            case '+':  return (typeof left === 'string' || typeof right === 'string')
                              ? String(left) + String(right) : left + right;
            case '-':  return left - right;
            case '*':  return left * right;
            case '/':  if (right === 0) throw new Error('⠻ Division by void'); return left / right;
            case '%':  return left % right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '<':  return left < right;
            case '>':  return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&&': return left && right;
            case '||': return left || right;
            default:   throw new Error(`⠻ Unknown operator: ${node.operator}`);
        }
    }

    async _execUnary(node, env) {
        const val = await this._execNode(node.operand, env);
        switch (node.operator) {
            case '!': return !val;
            case '-': return -val;
            default:  throw new Error(`⠻ Unknown unary: ${node.operator}`);
        }
    }

    async _execCall(node, env) {
        const callee = await this._execNode(node.callee, env);
        const args = [];
        for (const arg of node.args) {
            args.push(await this._execNode(arg, env));
        }

        // Native JS function
        if (typeof callee === 'function') {
            return callee(...args);
        }

        // Braille function
        if (callee instanceof BrailleFunction) {
            const callEnv = new Environment(callee.closure);
            for (let i = 0; i < callee.params.length; i++) {
                callEnv.define(callee.params[i], args[i] !== undefined ? args[i] : null);
            }
            const result = await this._execNode(callee.body, callEnv);
            if (result instanceof ReturnValue) return result.value;
            return result;
        }

        // Class instantiation
        if (callee instanceof BrailleClass) {
            const instance = new BrailleInstance(callee);
            const init = callee.methods.get('init') || callee.methods.get('⠅');
            if (init) {
                const initEnv = new Environment(init.closure);
                initEnv.define('this', instance);
                for (let i = 0; i < init.params.length; i++) {
                    initEnv.define(init.params[i], args[i] !== undefined ? args[i] : null);
                }
                await this._execNode(init.body, initEnv);
            }
            return instance;
        }

        throw new TypeError(`⠻ Not callable: ${this._stringify(callee)}`);
    }

    async _execMember(node, env) {
        const obj = await this._execNode(node.object, env);
        const prop = node.property.name;

        if (obj instanceof BrailleInstance) {
            if (obj.fields.has(prop)) return obj.fields.get(prop);
            const method = obj.klass.methods.get(prop);
            if (method) {
                // Bind 'this'
                return new BrailleFunction(method.name, method.params, method.body, (() => {
                    const e = new Environment(method.closure);
                    e.define('this', obj);
                    return e;
                })());
            }
            return undefined;
        }

        if (typeof obj === 'object' && obj !== null) {
            if (obj instanceof Map) return obj.get(prop);
            return obj[prop];
        }

        // String/Array methods
        if (typeof obj === 'string') {
            const stringMethods = {
                length: obj.length,
                upper: () => obj.toUpperCase(),
                lower: () => obj.toLowerCase(),
                split: (d) => obj.split(d),
                includes: (s) => obj.includes(s),
                trim: () => obj.trim(),
            };
            return stringMethods[prop];
        }

        if (Array.isArray(obj)) {
            const arrayMethods = {
                length: obj.length,
                push: (v) => { obj.push(v); return obj; },
                pop: () => obj.pop(),
                map: (fn) => obj.map(fn),
                filter: (fn) => obj.filter(fn),
                reduce: (fn, init) => obj.reduce(fn, init),
                join: (sep) => obj.join(sep),
            };
            return arrayMethods[prop];
        }

        return undefined;
    }

    async _execIndex(node, env) {
        const obj = await this._execNode(node.object, env);
        const idx = await this._execNode(node.index, env);
        if (Array.isArray(obj) || typeof obj === 'string') return obj[idx];
        if (obj instanceof Map) return obj.get(idx);
        if (typeof obj === 'object' && obj !== null) return obj[idx];
        return undefined;
    }

    async _execPipe(node, env) {
        const left = await this._execNode(node.left, env);
        // Right should be a callable — call it with left as argument
        const right = await this._execNode(node.right, env);
        if (typeof right === 'function') return right(left);
        if (right instanceof BrailleFunction) {
            const callEnv = new Environment(right.closure);
            if (right.params.length > 0) {
                callEnv.define(right.params[0], left);
            }
            const result = await this._execNode(right.body, callEnv);
            if (result instanceof ReturnValue) return result.value;
            return result;
        }
        throw new TypeError('⠻ Pipe target is not callable');
    }

    async _execNew(node, env) {
        const callee = await this._execNode(node.callee, env);
        if (callee instanceof BrailleClass) {
            return new BrailleInstance(callee);
        }
        throw new TypeError('⠻ Cannot instantiate non-class');
    }

    async _execArray(node, env) {
        const elements = [];
        for (const el of node.elements) {
            elements.push(await this._execNode(el, env));
        }
        return elements;
    }

    async _execMap(node, env) {
        const map = new Map();
        for (const entry of node.entries) {
            const key = await this._execNode(entry.key, env);
            const value = await this._execNode(entry.value, env);
            map.set(key, value);
        }
        return map;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  AI-NATIVE PRIMITIVES
    // ═══════════════════════════════════════════════════════════════════════

    async _execAIPrimitive(node, env) {
        const args = [];
        for (const arg of node.args) {
            args.push(await this._execNode(arg, env));
        }
        this.stats.aiCalls++;

        switch (node.name) {
            case 'INFER':   return this._aiInfer(args);
            case 'EMBED':   return this._aiEmbed(args);
            case 'PROMPT':  return this._aiPrompt(args);
            case 'PIPE':    return this._aiPipe(args);
            case 'REFLECT': return this._aiReflect(args, env);
            case 'SEARCH':  return this._aiSearch(args);
            default:
                throw new Error(`⠻ Unknown AI primitive: ${node.name}`);
        }
    }

    /**
     * ⠠ INFER — Call an LLM via OpenRouter
     * Usage: ⠠⠣⠶prompt⠶⠜ or ⠠⠣⠶prompt⠶⠂ options⠜
     */
    async _aiInfer(args) {
        const prompt = String(args[0] || '');
        const options = args[1] || {};

        if (this.options.dryRun || !this.options.apiKey) {
            return `[⠠ INFER dry-run] prompt="${prompt.substring(0, 100)}"`;
        }

        try {
            const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.options.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://braille-lang.dev',
                    'X-Title': 'BrailleLang Interpreter',
                },
                body: JSON.stringify({
                    model: options.model || this.options.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || this.options.maxInferTokens,
                    temperature: options.temperature || 0.7,
                }),
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            return `[⠠ INFER error] ${JSON.stringify(data.error || data)}`;
        } catch (e) {
            return `[⠠ INFER error] ${e.message}`;
        }
    }

    /**
     * ⠫ EMBED — Get text embeddings
     */
    async _aiEmbed(args) {
        const text = String(args[0] || '');

        if (this.options.dryRun || !this.options.apiKey) {
            // Return a mock 8D embedding (like braille vector space!)
            const hash = this._simpleHash(text);
            return Array.from({ length: 8 }, (_, i) => ((hash >> i) & 1) ? 1.0 : 0.0);
        }

        try {
            const response = await fetch(`${this.options.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.options.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.options.embedModel,
                    input: text,
                }),
            });

            const data = await response.json();
            if (data.data && data.data[0]) {
                return data.data[0].embedding;
            }
            return [];
        } catch (e) {
            return `[⠫ EMBED error] ${e.message}`;
        }
    }

    /**
     * ⡩ PROMPT — Construct a prompt from a template and variables
     * Usage: ⡩⠣⠶template with {var}⠶⠂ vars_map⠜
     */
    async _aiPrompt(args) {
        let template = String(args[0] || '');
        const vars = args[1] || {};

        if (vars instanceof Map) {
            for (const [k, v] of vars) {
                template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            }
        } else if (typeof vars === 'object') {
            for (const [k, v] of Object.entries(vars)) {
                template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            }
        }
        return template;
    }

    /**
     * ⡪ PIPE — Pipeline composition: chain AI calls
     * Usage: ⡪⠣fn1⠂ fn2⠂ fn3⠜ — returns a function that chains them
     */
    async _aiPipe(args) {
        const fns = args;
        return async (input) => {
            let result = input;
            for (const fn of fns) {
                if (typeof fn === 'function') {
                    result = await fn(result);
                } else if (fn instanceof BrailleFunction) {
                    const callEnv = new Environment(fn.closure);
                    if (fn.params.length > 0) callEnv.define(fn.params[0], result);
                    const r = await this._execNode(fn.body, callEnv);
                    result = (r instanceof ReturnValue) ? r.value : r;
                } else if (typeof fn === 'string') {
                    // Treat string as prompt template
                    result = await this._aiInfer([fn.replace('{input}', String(result))]);
                }
            }
            return result;
        };
    }

    /**
     * ⣠ REFLECT — Meta-programming: inspect or modify the running program
     * Usage: ⣠⠣⠶code_string⠶⠜ — parse and execute braille code at runtime
     */
    async _aiReflect(args, env) {
        const code = String(args[0] || '');
        // Dynamic execution of braille code
        const { Lexer } = require('./lexer');
        const { Parser } = require('./parser');
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        return this._execNode(ast, env);
    }

    /**
     * ⠭ SEARCH — Semantic search over a corpus
     * Usage: ⠭⠣⠶query⠶⠂ corpus_array⠜
     */
    async _aiSearch(args) {
        const query = String(args[0] || '');
        const corpus = args[1] || [];

        if (!Array.isArray(corpus) || corpus.length === 0) {
            return [];
        }

        // Simple TF-IDF-ish search (no API needed)
        const queryTerms = query.toLowerCase().split(/\s+/);
        const scored = corpus.map((doc, i) => {
            const text = String(doc).toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                if (text.includes(term)) score++;
            }
            return { index: i, doc, score };
        });

        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.doc);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  GLOBAL BUILTINS
    // ═══════════════════════════════════════════════════════════════════════

    _initGlobals() {
        // Constants
        this.global.define('true', true, true);
        this.global.define('false', false, true);
        this.global.define('null', null, true);
        this.global.define('⠀', null, true);    // VOID
        this.global.define('⣿', HALT_SIGNAL, true); // DEATH

        // Math
        this.global.define('PI', Math.PI, true);
        this.global.define('E', Math.E, true);
        this.global.define('sqrt', Math.sqrt);
        this.global.define('abs', Math.abs);
        this.global.define('floor', Math.floor);
        this.global.define('ceil', Math.ceil);
        this.global.define('round', Math.round);
        this.global.define('random', Math.random);
        this.global.define('min', Math.min);
        this.global.define('max', Math.max);
        this.global.define('pow', Math.pow);

        // String utilities
        this.global.define('str', (v) => String(v));
        this.global.define('num', (v) => Number(v));
        this.global.define('len', (v) => {
            if (typeof v === 'string' || Array.isArray(v)) return v.length;
            if (v instanceof Map) return v.size;
            return 0;
        });

        // Array utilities
        this.global.define('range', (start, end, step = 1) => {
            if (end === undefined) { end = start; start = 0; }
            const arr = [];
            for (let i = start; i < end; i += step) arr.push(i);
            return arr;
        });

        // Type checking
        this.global.define('type', (v) => {
            if (v === null) return 'void';
            if (v instanceof BrailleFunction) return 'function';
            if (v instanceof BrailleClass) return 'class';
            if (v instanceof BrailleInstance) return 'instance';
            if (Array.isArray(v)) return 'array';
            if (v instanceof Map) return 'map';
            return typeof v;
        });

        // Braille utilities
        this.global.define('toBraille', (ascii) => {
            const { Lexer } = require('./lexer');
            return Lexer.asciiToBraille(String(ascii));
        });
        this.global.define('fromBraille', (braille) => {
            const { Lexer } = require('./lexer');
            return Lexer.brailleToAscii(String(braille));
        });

        // Time
        this.global.define('now', () => Date.now());
        this.global.define('sleep', (ms) => new Promise(r => setTimeout(r, ms)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    _isTruthy(value) {
        if (value === null || value === undefined || value === false || value === 0 || value === '') return false;
        return true;
    }

    _stringify(value) {
        if (value === null || value === undefined) return '⠀'; // VOID
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? '⠡' : '⠻'; // TRUTH : NOT
        if (Array.isArray(value)) return '⠷' + value.map(v => this._stringify(v)).join('⠂') + '⠽';
        if (value instanceof Map) {
            const entries = [];
            for (const [k, v] of value) entries.push(`${this._stringify(k)}⠊${this._stringify(v)}`);
            return '⠳' + entries.join('⠂') + '⠾';
        }
        if (value instanceof BrailleFunction) return value.toString();
        if (value instanceof BrailleClass) return value.toString();
        if (value instanceof BrailleInstance) return value.toString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) & 0xFF;
    }
}

module.exports = { Interpreter, Environment, BrailleFunction, BrailleClass, BrailleInstance };
