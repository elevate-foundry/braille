#!/usr/bin/env node

/**
 * ⡂⡲⡡⡩⡬⡬⡥ CLI — Command-line interface for BrailleLang
 * 
 * Usage:
 *   braille-lang run <file.br>        — Execute a .br source file
 *   braille-lang compile <file.br>    — Transpile to JavaScript
 *   braille-lang repl                 — Interactive REPL
 *   braille-lang encode <text>        — Encode ASCII to Braille source
 *   braille-lang decode <braille>     — Decode Braille source to ASCII
 *   braille-lang ast <file.br>        — Print the AST
 *   braille-lang tokens <file.br>     — Print the token stream
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Interpreter } = require('./interpreter');
const { Compiler } = require('./compiler');

// ─── Load API key ───
function loadApiKey() {
    // Check various locations
    const locations = [
        path.join(__dirname, '..', 'ai-core', '.OPENROUTER_API_KEY'),
        path.join(__dirname, '..', '..', '.env'),
        path.join(process.env.HOME || '', '.env'),
    ];

    for (const loc of locations) {
        try {
            const content = fs.readFileSync(loc, 'utf8').trim();
            const match = content.match(/OPENROUTER_API_KEY=(.+)/);
            if (match) return match[1].trim();
            if (content.startsWith('sk-')) return content;
        } catch (_) {}
    }

    return process.env.OPENROUTER_API_KEY || null;
}

// ─── Read source file ───
function readSource(filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        console.error(`⠻ File not found: ${resolved}`);
        process.exit(1);
    }
    return fs.readFileSync(resolved, 'utf8');
}

// ─── Run ───
async function runFile(filePath, options = {}) {
    const source = readSource(filePath);
    const apiKey = loadApiKey();

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const interpreter = new Interpreter({
        apiKey,
        dryRun: !apiKey,
        ...options,
    });

    try {
        const result = await interpreter.execute(ast);
        console.log('\n⠸ Execution complete');
        console.log(`  Statements: ${result.stats.statementsExecuted}`);
        console.log(`  AI calls:   ${result.stats.aiCalls}`);
        console.log(`  Duration:   ${result.stats.durationMs}ms`);
        if (result.result !== null && result.result !== undefined) {
            console.log(`  Result:     ${JSON.stringify(result.result)}`);
        }
    } catch (e) {
        console.error(`\n⠻ Runtime error: ${e.message}`);
        if (options.debug) console.error(e.stack);
        process.exit(1);
    }
}

// ─── Compile ───
function compileFile(filePath, options = {}) {
    const source = readSource(filePath);

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const compiler = new Compiler(options);
    const js = compiler.compile(ast);

    if (options.output) {
        fs.writeFileSync(options.output, js, 'utf8');
        console.log(`⠸ Compiled to: ${options.output}`);
    } else {
        const outPath = filePath.replace(/\.br$/, '.js');
        fs.writeFileSync(outPath, js, 'utf8');
        console.log(`⠸ Compiled to: ${outPath}`);
    }

    return js;
}

// ─── Show AST ───
function showAst(filePath) {
    const source = readSource(filePath);
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    console.log(JSON.stringify(ast, null, 2));
}

// ─── Show Tokens ───
function showTokens(filePath) {
    const source = readSource(filePath);
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    for (const tok of tokens) {
        const meta = tok.meta.name || tok.meta.decoded || tok.meta.numStr || '';
        console.log(`  ${tok.type.padEnd(12)} ${tok.value.padEnd(4)} ${meta}`);
    }
}

// ─── Encode ───
function encodeText(text) {
    const braille = Lexer.asciiToBraille(text);
    console.log(braille);
    return braille;
}

// ─── Decode ───
function decodeText(braille) {
    const ascii = Lexer.brailleToAscii(braille);
    console.log(ascii);
    return ascii;
}

// ─── REPL ───
async function startRepl() {
    const apiKey = loadApiKey();
    const interpreter = new Interpreter({
        apiKey,
        dryRun: !apiKey,
    });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  ⡂⡲⡡⡩⡬⡬⡥  BrailleLang REPL v0.1.0                      ║
║  AI-native programming in U+2800–U+28FF                  ║
║                                                           ║
║  API: ${apiKey ? '⠡ Connected (OpenRouter)' : '⠻ Dry-run mode (no API key)'}${apiKey ? '       ' : '  '}║
║                                                           ║
║  Commands:                                                ║
║    .help     — Show help                                  ║
║    .encode   — Encode ASCII to Braille                    ║
║    .decode   — Decode Braille to ASCII                    ║
║    .ast      — Show AST of last input                     ║
║    .tokens   — Show tokens of last input                  ║
║    .clear    — Clear environment                          ║
║    .exit     — Exit REPL                                  ║
║                                                           ║
║  Example: ⠰⠣⠶⡈⡥⡬⡬⡯⠶⠜                                    ║
║  (prints "Hello")                                         ║
╚═══════════════════════════════════════════════════════════╝
`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '⠸ ',
    });

    let lastSource = '';

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        // Meta commands
        if (input === '.exit' || input === '.quit') {
            console.log('⣿ Halt');
            process.exit(0);
        }

        if (input === '.help') {
            console.log(`
  ⠁ <name> ⠪ <value>              — Declare variable (let)
  ⠹ <name> ⠪ <value>              — Declare constant
  ⠃ <name> ⠣<params>⠜ ⠳<body>⠾   — Define function
  ⠡ ⠣<cond>⠜ ⠳<then>⠾ [⡠ ⠳<else>⠾] — If/else
  ⠄ ⠣<cond>⠜ ⠳<body>⠾            — While loop
  ⠌ ⠣<item> ⠐ <iterable>⠜ ⠳<body>⠾ — For each
  ⠰ ⠣<args>⠜                      — Print
  ⠠ ⠣<prompt>⠜                    — AI: Infer (call LLM)
  ⠫ ⠣<text>⠜                      — AI: Embed
  ⡩ ⠣<template>⠜                  — AI: Prompt
  ⡪                                — Pipe operator
  ⣿                                — Halt
  ⠶...⠶                            — String literal
  ⠼⠁⠃⠉                            — Number (123)
`);
            rl.prompt();
            return;
        }

        if (input === '.clear') {
            interpreter.global = new (require('./interpreter').Environment)();
            interpreter._initGlobals();
            console.log('⠀ Environment cleared');
            rl.prompt();
            return;
        }

        if (input.startsWith('.encode ')) {
            const text = input.slice(8);
            console.log('  ' + Lexer.asciiToBraille(text));
            rl.prompt();
            return;
        }

        if (input.startsWith('.decode ')) {
            const br = input.slice(8);
            console.log('  ' + Lexer.brailleToAscii(br));
            rl.prompt();
            return;
        }

        if (input === '.ast') {
            if (lastSource) {
                try {
                    const lexer = new Lexer(lastSource);
                    const tokens = lexer.tokenize();
                    const parser = new Parser(tokens);
                    const ast = parser.parse();
                    console.log(JSON.stringify(ast, null, 2));
                } catch (e) {
                    console.error(`  ⠻ ${e.message}`);
                }
            }
            rl.prompt();
            return;
        }

        if (input === '.tokens') {
            if (lastSource) {
                try {
                    const lexer = new Lexer(lastSource);
                    const tokens = lexer.tokenize();
                    for (const tok of tokens) {
                        const meta = tok.meta.name || tok.meta.decoded || tok.meta.numStr || '';
                        console.log(`  ${tok.type.padEnd(12)} ${tok.value.padEnd(4)} ${meta}`);
                    }
                } catch (e) {
                    console.error(`  ⠻ ${e.message}`);
                }
            }
            rl.prompt();
            return;
        }

        // Execute braille code
        lastSource = input;
        try {
            const lexer = new Lexer(input);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const ast = parser.parse();
            const result = await interpreter.execute(ast);

            if (result.result !== null && result.result !== undefined) {
                console.log('  → ' + interpreter._stringify(result.result));
            }
        } catch (e) {
            console.error(`  ⠻ ${e.message}`);
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\n⣿ Halt');
        process.exit(0);
    });
}

// ─── Argument parsing ───
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'repl' || command === '-i') {
        startRepl();
        return;
    }

    switch (command) {
        case 'run':
        case 'exec':
            if (!args[1]) {
                console.error('Usage: braille-lang run <file.br>');
                process.exit(1);
            }
            runFile(args[1], {
                debug: args.includes('--debug'),
            });
            break;

        case 'compile':
        case 'build':
            if (!args[1]) {
                console.error('Usage: braille-lang compile <file.br>');
                process.exit(1);
            }
            compileFile(args[1], {
                output: args[3] || null,
            });
            break;

        case 'ast':
            if (!args[1]) {
                console.error('Usage: braille-lang ast <file.br>');
                process.exit(1);
            }
            showAst(args[1]);
            break;

        case 'tokens':
            if (!args[1]) {
                console.error('Usage: braille-lang tokens <file.br>');
                process.exit(1);
            }
            showTokens(args[1]);
            break;

        case 'encode':
            encodeText(args.slice(1).join(' '));
            break;

        case 'decode':
            decodeText(args.slice(1).join(' '));
            break;

        case 'help':
        case '--help':
        case '-h':
            console.log(`
⡂⡲⡡⡩⡬⡬⡥ BrailleLang — AI-native programming in U+2800–U+28FF

Usage:
  braille-lang run <file.br>        Execute a .br source file
  braille-lang compile <file.br>    Transpile to JavaScript
  braille-lang repl                 Interactive REPL
  braille-lang encode <text>        Encode ASCII text to Braille
  braille-lang decode <braille>     Decode Braille to ASCII
  braille-lang ast <file.br>        Show AST
  braille-lang tokens <file.br>     Show token stream
  braille-lang help                 This help message

Environment:
  OPENROUTER_API_KEY    API key for AI primitives (⠠ ⠫ ⡩)
  BRAILLE_MODEL         Default model (default: openai/gpt-4o-mini)
`);
            break;

        default:
            // Assume it's a filename
            if (fs.existsSync(args[0])) {
                runFile(args[0]);
            } else {
                console.error(`Unknown command: ${command}`);
                console.error('Run "braille-lang help" for usage');
                process.exit(1);
            }
    }
}

main();
