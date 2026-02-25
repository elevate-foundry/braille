/**
 * ⡂⡲⡡⡩⡬⡬⡥ Compiler — Transpiles Braille AST to JavaScript
 * 
 * Walks the AST and emits equivalent JavaScript code.
 * AI primitives are compiled to async function calls that use the
 * BrailleLang runtime library.
 */

class Compiler {
    constructor(options = {}) {
        this.options = {
            indent: '  ',
            includeRuntime: true,
            targetModule: 'commonjs', // 'commonjs' | 'esm'
            ...options,
        };
        this.depth = 0;
    }

    /**
     * Compile an AST to JavaScript source code.
     * @param {ASTNode} ast - Program node
     * @returns {string} - JavaScript source
     */
    compile(ast) {
        let code = '';

        if (this.options.includeRuntime) {
            code += this._emitRuntime();
        }

        code += this._compileNode(ast);
        return code;
    }

    _compileNode(node) {
        if (!node) return 'null';

        switch (node.type) {
            case 'Program':           return this._compileProgram(node);
            case 'Block':             return this._compileBlock(node);
            case 'Declaration':       return this._compileDeclaration(node);
            case 'Assignment':        return this._compileAssignment(node);
            case 'FunctionDef':       return this._compileFunctionDef(node);
            case 'LambdaDef':         return this._compileLambda(node);
            case 'ClassDef':          return this._compileClass(node);
            case 'IfStatement':       return this._compileIf(node);
            case 'WhileLoop':         return this._compileWhile(node);
            case 'ForeverLoop':       return this._compileForever(node);
            case 'ForEach':           return this._compileForEach(node);
            case 'TryCatch':          return this._compileTryCatch(node);
            case 'AsyncBlock':        return `await (${this._compileNode(node.body)})`;
            case 'Return':            return `return ${node.value ? this._compileNode(node.value) : ''}`;
            case 'Yield':             return `yield ${node.value ? this._compileNode(node.value) : ''}`;
            case 'Print':             return this._compilePrint(node);
            case 'Import':            return this._compileImport(node);
            case 'Halt':              return 'process.exit(0)';
            case 'Switch':            return this._compileSwitch(node);
            case 'ExpressionStatement': return this._compileNode(node.expression);

            // Expressions
            case 'BinaryExpr':        return this._compileBinary(node);
            case 'UnaryExpr':         return `(${node.operator}${this._compileNode(node.operand)})`;
            case 'CallExpr':          return this._compileCall(node);
            case 'MemberExpr':        return `${this._compileNode(node.object)}.${node.property.name}`;
            case 'IndexExpr':         return `${this._compileNode(node.object)}[${this._compileNode(node.index)}]`;
            case 'PipeExpression':    return this._compilePipe(node);
            case 'AIPrimitive':       return this._compileAIPrimitive(node);
            case 'AwaitExpr':         return `await ${this._compileNode(node.expression)}`;
            case 'NewExpr':           return `new ${this._compileNode(node.callee)}()`;
            case 'TypeofExpr':        return `typeof ${this._compileNode(node.operand)}`;

            // Literals
            case 'NumberLiteral':     return String(node.value);
            case 'StringLiteral':     return JSON.stringify(node.value);
            case 'NullLiteral':       return 'null';
            case 'ThisExpr':          return 'this';
            case 'ArrayLiteral':      return `[${node.elements.map(e => this._compileNode(e)).join(', ')}]`;
            case 'MapLiteral':        return this._compileMapLiteral(node);
            case 'Identifier':        return this._sanitizeId(node.name);

            default:
                return `/* unknown: ${node.type} */`;
        }
    }

    _compileProgram(node) {
        const lines = node.body.map(stmt => this._compileNode(stmt) + ';');
        return lines.join('\n');
    }

    _compileBlock(node) {
        this.depth++;
        const indent = this.options.indent.repeat(this.depth);
        const lines = node.statements.map(stmt => indent + this._compileNode(stmt) + ';');
        this.depth--;
        return '{\n' + lines.join('\n') + '\n' + this.options.indent.repeat(this.depth) + '}';
    }

    _compileDeclaration(node) {
        const keyword = node.isConst ? 'const' : 'let';
        const name = this._sanitizeId(node.name.name || node.name);
        if (node.init) {
            return `${keyword} ${name} = ${this._compileNode(node.init)}`;
        }
        return `${keyword} ${name}`;
    }

    _compileAssignment(node) {
        return `${this._compileNode(node.target)} = ${this._compileNode(node.value)}`;
    }

    _compileFunctionDef(node) {
        const name = this._sanitizeId(node.name.name || node.name);
        const params = node.params.map(p => this._sanitizeId(p.name || p)).join(', ');
        const asyncPrefix = node.isAsync ? 'async ' : '';
        const body = this._compileNode(node.body);
        return `${asyncPrefix}function ${name}(${params}) ${body}`;
    }

    _compileLambda(node) {
        const params = (node.params || []).map(p => this._sanitizeId(p.name || p)).join(', ');
        if (node.body.type === 'Block') {
            return `(${params}) => ${this._compileNode(node.body)}`;
        }
        return `(${params}) => (${this._compileNode(node.body)})`;
    }

    _compileClass(node) {
        const name = this._sanitizeId(node.name.name || node.name);
        const ext = node.parent ? ` extends ${this._sanitizeId(node.parent.name || node.parent)}` : '';
        const body = this._compileNode(node.body);
        return `class ${name}${ext} ${body}`;
    }

    _compileIf(node) {
        let code = `if (${this._compileNode(node.condition)}) ${this._compileNode(node.consequent)}`;
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                code += ` else ${this._compileNode(node.alternate)}`;
            } else {
                code += ` else ${this._compileNode(node.alternate)}`;
            }
        }
        return code;
    }

    _compileWhile(node) {
        return `while (${this._compileNode(node.condition)}) ${this._compileNode(node.body)}`;
    }

    _compileForever(node) {
        return `while (true) ${this._compileNode(node.body)}`;
    }

    _compileForEach(node) {
        const item = this._sanitizeId(node.item.name || node.item);
        return `for (const ${item} of ${this._compileNode(node.iterable)}) ${this._compileNode(node.body)}`;
    }

    _compileTryCatch(node) {
        let code = `try ${this._compileNode(node.tryBlock)}`;
        if (node.catchBlock) {
            const errVar = node.errorVar ? this._sanitizeId(node.errorVar.name || 'e') : 'e';
            code += ` catch (${errVar}) ${this._compileNode(node.catchBlock)}`;
        }
        return code;
    }

    _compilePrint(node) {
        const args = node.args.map(a => this._compileNode(a)).join(', ');
        return `console.log(${args})`;
    }

    _compileImport(node) {
        const name = this._sanitizeId(node.module.name || node.module);
        if (this.options.targetModule === 'esm') {
            return `import ${name} from '${name}'`;
        }
        return `const ${name} = require('${name}')`;
    }

    _compileSwitch(node) {
        return `/* switch */ { const __val = ${this._compileNode(node.discriminant)}; ${this._compileNode(node.body)} }`;
    }

    _compileBinary(node) {
        return `(${this._compileNode(node.left)} ${node.operator} ${this._compileNode(node.right)})`;
    }

    _compileCall(node) {
        const callee = this._compileNode(node.callee);
        const args = node.args.map(a => this._compileNode(a)).join(', ');
        return `${callee}(${args})`;
    }

    _compilePipe(node) {
        // Compile pipe as function application: right(left)
        const left = this._compileNode(node.left);
        const right = this._compileNode(node.right);
        return `${right}(${left})`;
    }

    _compileAIPrimitive(node) {
        const args = node.args.map(a => this._compileNode(a)).join(', ');
        switch (node.name) {
            case 'INFER':   return `await __braille_infer(${args})`;
            case 'EMBED':   return `await __braille_embed(${args})`;
            case 'PROMPT':  return `__braille_prompt(${args})`;
            case 'PIPE':    return `__braille_pipe(${args})`;
            case 'REFLECT': return `eval(${args})`;
            case 'SEARCH':  return `__braille_search(${args})`;
            default:        return `/* unknown AI: ${node.name} */`;
        }
    }

    _compileMapLiteral(node) {
        const entries = node.entries.map(e =>
            `[${this._compileNode(e.key)}, ${this._compileNode(e.value)}]`
        ).join(', ');
        return `new Map([${entries}])`;
    }

    /**
     * Sanitize identifier names: braille decoded names might have
     * non-JS-safe characters. Replace them.
     */
    _sanitizeId(name) {
        if (!name) return '_anon';
        // Replace non-alphanumeric chars with underscore, but keep unicode letters
        return name.replace(/[^a-zA-Z0-9_$\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/g, '_');
    }

    /**
     * Emit the runtime support library for compiled AI primitives.
     */
    _emitRuntime() {
        return `// ⡂⡲⡡⡩⡬⡬⡥ Runtime — Auto-generated by BrailleLang Compiler
const __BRAILLE_API_KEY = process.env.OPENROUTER_API_KEY || '';
const __BRAILLE_MODEL = process.env.BRAILLE_MODEL || 'openai/gpt-4o-mini';
const __BRAILLE_BASE = 'https://openrouter.ai/api/v1';

async function __braille_infer(prompt, options = {}) {
  if (!__BRAILLE_API_KEY) return '[⠠ INFER: no API key]';
  const res = await fetch(__BRAILLE_BASE + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + __BRAILLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || __BRAILLE_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1024,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '[⠠ error]';
}

async function __braille_embed(text) {
  if (!__BRAILLE_API_KEY) return [];
  const res = await fetch(__BRAILLE_BASE + '/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + __BRAILLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text }),
  });
  const data = await res.json();
  return data.data?.[0]?.embedding || [];
}

function __braille_prompt(template, vars = {}) {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp('\\\\{' + k + '\\\\}', 'g'), String(v));
  }
  return result;
}

function __braille_pipe(...fns) {
  return async (input) => {
    let result = input;
    for (const fn of fns) result = await fn(result);
    return result;
  };
}

function __braille_search(query, corpus) {
  const terms = query.toLowerCase().split(/\\s+/);
  return corpus
    .map((doc, i) => ({ doc, score: terms.filter(t => String(doc).toLowerCase().includes(t)).length }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.doc);
}

// ─── Program ───────────────────────────────────────────
`;
    }
}

module.exports = { Compiler };
