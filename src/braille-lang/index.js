/**
 * ⡂⡲⡡⡩⡬⡬⡥ BrailleLang — AI-native programming language in U+2800–U+28FF
 * 
 * Main entry point. Exports all modules for programmatic use.
 */

const { KEYWORDS, OPERATORS, DELIMITERS, toBraille, fromBraille, isBraille } = require('./spec');
const { Lexer, Token } = require('./lexer');
const { Parser, ASTNode } = require('./parser');
const { Interpreter, Environment, BrailleFunction, BrailleClass, BrailleInstance } = require('./interpreter');
const { Compiler } = require('./compiler');

/**
 * Quick-run: parse and execute a braille source string.
 * @param {string} source - Braille source code
 * @param {Object} options - Interpreter options
 * @returns {Promise<Object>} - { output, result, stats }
 */
async function run(source, options = {}) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter(options);
    return interpreter.execute(ast);
}

/**
 * Quick-compile: parse and transpile braille source to JavaScript.
 * @param {string} source - Braille source code
 * @param {Object} options - Compiler options
 * @returns {string} - JavaScript source
 */
function compile(source, options = {}) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler(options);
    return compiler.compile(ast);
}

/**
 * Encode ASCII text to Braille (for writing source code).
 */
function encode(text) {
    return Lexer.asciiToBraille(text);
}

/**
 * Decode Braille back to ASCII (for reading source code).
 */
function decode(braille) {
    return Lexer.brailleToAscii(braille);
}

module.exports = {
    // Quick API
    run,
    compile,
    encode,
    decode,

    // Classes
    Lexer,
    Token,
    Parser,
    ASTNode,
    Interpreter,
    Compiler,
    Environment,
    BrailleFunction,
    BrailleClass,
    BrailleInstance,

    // Spec
    KEYWORDS,
    OPERATORS,
    DELIMITERS,
    toBraille,
    fromBraille,
    isBraille,
};
