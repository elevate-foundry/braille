/**
 * ⡂⡲⡡⡩⡬⡬⡥ Language Specification
 * 
 * An AI-native programming language encoded entirely in U+2800–U+28FF.
 * 
 * DESIGN PHILOSOPHY:
 *   Every keyword is a Braille pattern whose semantic meaning (from BrailleConceptAtlas)
 *   maps to its programming function. The language IS the concept atlas.
 *
 *   ⠀ (VOID)       → null / no-op
 *   ⠁ (GOD)        → declare / create (bring into existence)
 *   ⠃ (LIFE)       → function definition (a living block)
 *   ⠄ (TIME)       → loop / repeat (temporal iteration)
 *   ⠅ (BIRTH)      → new / instantiate
 *   ⠈ (SPACE)      → array / list (a spatial container)
 *   ⠉ (WORLD)      → module / import (the outer world)
 *   ⠐ (OTHER)      → parameter / argument (the other value)
 *   ⠑ (PERSON)     → class / object type
 *   ⠠ (MIND)       → infer / AI call (cognitive act)
 *   ⠡ (TRUTH)      → if / conditional (test of truth)
 *   ⠢ (SENSE)      → input / read (perceive)
 *   ⠰ (LANGUAGE)   → print / output (express)
 *   ⡀ (HEART)      → try / catch (emotional resilience)
 *   ⡁ (LOVE)       → return (give back)
 *   ⢀ (SOUL)       → async / await (transcend synchrony)
 *   ⢁ (SPIRIT)     → yield / generator
 *   ⠌ (JOURNEY)    → iterate / for-each (travel through)
 *   ⠘ (HOME)       → this / self reference
 *   ⠤ (MEMORY)     → variable / store (remember)
 *   ⠨ (ORDER)      → sort / organize
 *   ⠬ (SCIENCE)    → typeof / inspect
 *   ⡈ (BEAUTY)     → format / pretty-print
 *   ⠎ (EVOLUTION)  → mutate / transform
 *   ⠆ (GROWTH)     → append / push (grow)
 *   ⠊ (EARTH)      → map (ground-level transform)
 *   ⠔ (HISTORY)    → log / record
 *   ⡄ (LONGING)    → await (wait with longing)
 *   ⢄ (ETERNITY)   → while-true / infinite loop
 *   ⡠ (WISDOM)     → else (wise alternative)
 *   ⠸ (JUSTICE)    → assert / equality test
 *   ⠱ (COMMUNICATION) → send / emit (message passing)
 *   ⡐ (COMPASSION) → catch (handle errors with grace)
 *   ⠏ (HUMANITY)   → string type
 *   ⠗ (CIVILIZATION) → object type
 *   ⠫ (TECHNOLOGY) → embed / AI embedding
 *   ⠭ (DISCOVERY)  → search / find
 *   ⠹ (LAW)        → const / immutable binding
 *   ⠿ (REASON)     → eval / compute
 *   ⣿ (DEATH)      → halt / exit / end
 *   ⠒ (TOUCH)      → dot access (reach into)
 *   ⠙ (COMMUNITY)  → spread / destructure
 *   ⡃ (JOY)        → success callback
 *   ⡅ (HOPE)       → promise / future
 *   ⡉ (WONDER)     → debug / inspect
 *   ⡑ (KINDNESS)   → default value
 *   ⠛ (NATION)     → namespace
 *   ⠝ (PROGRESS)   → increment (++)
 *   ⠞ (SOCIETY)    → map type / dictionary
 *   ⢈ (HEAVEN)     → global scope
 *   ⡬ (POETRY)     → template literal / interpolation
 *   ⡪ (MUSIC)      → pipe operator (|>)
 *   ⡫ (SYMPHONY)   → compose / chain
 *   ⡥ (CREATIVITY) → lambda / arrow function
 *   ⡩ (INSPIRATION)→ prompt (AI prompt construction)
 *   ⣠ (CONSCIOUSNESS) → reflect / meta-program
 *
 * OPERATORS (single Braille characters):
 *   Arithmetic:
 *     ⠖ (0x16, WORK)       → + (addition, the work of combining)
 *     — uses standard: ⠤ context → - (subtraction)
 *     ⠦ (0x26, SKILL)      → * (multiplication, skilled combination)
 *     ⠌ (0x0C, JOURNEY)    → / (division, splitting a journey)
 *     ⠼ (0x3C, POLITICS)   → % (modulo, political remainder)
 *
 *   Comparison:
 *     ⠶ (custom)           → == (equals)
 *     ⠴ (custom)           → != (not equals)
 *     ⠢ (custom pair)      → <
 *     ⠲ (custom pair)      → >
 *     ⠔ (custom pair)      → <=
 *     ⠒ (custom pair)      → >=
 *
 *   Logical:
 *     ⠯ (custom)           → && (and)
 *     ⠿ (custom)           → || (or)
 *     ⠻ (custom)           → ! (not)
 *
 *   Assignment:
 *     ⠪ (custom)           → = (assign)
 *     ⠫ (custom)           → => (arrow / bind)
 *
 * DELIMITERS:
 *     ⠣ (0x23)             → ( open paren
 *     ⠜ (0x1C)             → ) close paren
 *     ⠳ (0x33)             → { open brace / block start
 *     ⠾ (0x3E)             → } close brace / block end
 *     ⠷ (0x37)             → [ open bracket
 *     ⠻ (0x3B)             → ] close bracket
 *     ⠂ (0x02)             → , comma / separator
 *     ⠄ (0x04)             → . dot accessor
 *     ⠆ (0x06)             → ; statement end
 *     ⡪ (0x6A)             → |> pipe
 *
 * NUMBER LITERALS: Braille number sign ⠼ followed by braille digits
 * STRING LITERALS: Enclosed in ⠶...⠶ (double-cell delimiters)
 *
 * AI-NATIVE PRIMITIVES:
 *   ⠠ (MIND)   → infer(prompt, options)    — call an LLM
 *   ⠫ (TECHNOLOGY) → embed(text)           — get embeddings
 *   ⡩ (INSPIRATION) → prompt(template)     — construct prompts
 *   ⡪ (MUSIC)  → pipe(stages...)           — pipeline composition
 *   ⣠ (CONSCIOUSNESS) → reflect(code)      — meta-programming / self-modification
 *   ⠭ (DISCOVERY) → search(query, corpus)  — semantic search
 */

const KEYWORDS = {
    // ── Core declarations ──
    0x01: { name: 'DECLARE',    role: 'keyword',   js: 'let',        concept: 'GOD' },
    0x39: { name: 'CONST',      role: 'keyword',   js: 'const',      concept: 'LAW' },
    0x03: { name: 'FUNC',       role: 'keyword',   js: 'function',   concept: 'LIFE' },
    0x65: { name: 'LAMBDA',     role: 'keyword',   js: '=>',         concept: 'CREATIVITY' },
    0x11: { name: 'CLASS',      role: 'keyword',   js: 'class',      concept: 'PERSON' },
    0x05: { name: 'NEW',        role: 'keyword',   js: 'new',        concept: 'BIRTH' },

    // ── Control flow ──
    0x21: { name: 'IF',         role: 'keyword',   js: 'if',         concept: 'TRUTH' },
    0x60: { name: 'ELSE',       role: 'keyword',   js: 'else',       concept: 'WISDOM' },
    0x04: { name: 'LOOP',       role: 'keyword',   js: 'while',      concept: 'TIME' },
    0x84: { name: 'FOREVER',    role: 'keyword',   js: 'while(true)',concept: 'ETERNITY' },
    0x0C: { name: 'FOREACH',    role: 'keyword',   js: 'for...of',   concept: 'JOURNEY' },
    0x0D: { name: 'CHANGE',     role: 'keyword',   js: 'switch',     concept: 'CHANGE' },

    // ── Values ──
    0x00: { name: 'VOID',       role: 'literal',   js: 'null',       concept: 'VOID' },
    0x41: { name: 'RETURN',     role: 'keyword',   js: 'return',     concept: 'LOVE' },
    0x51: { name: 'DEFAULT',    role: 'keyword',   js: 'default',    concept: 'KINDNESS' },

    // ── Error handling ──
    0x40: { name: 'TRY',        role: 'keyword',   js: 'try',        concept: 'HEART' },
    0x50: { name: 'CATCH',      role: 'keyword',   js: 'catch',      concept: 'COMPASSION' },

    // ── Async ──
    0x80: { name: 'ASYNC',      role: 'keyword',   js: 'async',      concept: 'SOUL' },
    0x44: { name: 'AWAIT',      role: 'keyword',   js: 'await',      concept: 'LONGING' },
    0x45: { name: 'PROMISE',    role: 'keyword',   js: 'Promise',    concept: 'HOPE' },
    0x81: { name: 'YIELD',      role: 'keyword',   js: 'yield',      concept: 'SPIRIT' },

    // ── I/O ──
    0x30: { name: 'PRINT',      role: 'builtin',   js: 'console.log',concept: 'LANGUAGE' },
    0x22: { name: 'INPUT',      role: 'builtin',   js: 'readline',   concept: 'SENSE' },
    0x14: { name: 'LOG',        role: 'builtin',   js: 'console.log',concept: 'HISTORY' },

    // ── Data structures ──
    0x08: { name: 'ARRAY',      role: 'type',      js: 'Array',      concept: 'SPACE' },
    0x1E: { name: 'MAP',        role: 'type',      js: 'Map',        concept: 'SOCIETY' },
    0x0F: { name: 'STRING',     role: 'type',      js: 'String',     concept: 'HUMANITY' },
    0x17: { name: 'OBJECT',     role: 'type',      js: 'Object',     concept: 'CIVILIZATION' },

    // ── AI-native primitives ──
    0x20: { name: 'INFER',      role: 'ai',        js: '__infer',    concept: 'MIND' },
    0x2B: { name: 'EMBED',      role: 'ai',        js: '__embed',    concept: 'TECHNOLOGY' },
    0x69: { name: 'PROMPT',     role: 'ai',        js: '__prompt',   concept: 'INSPIRATION' },
    0x6A: { name: 'PIPE',       role: 'ai',        js: '__pipe',     concept: 'MUSIC' },
    0xE0: { name: 'REFLECT',    role: 'ai',        js: '__reflect',  concept: 'CONSCIOUSNESS' },
    0x2D: { name: 'SEARCH',     role: 'ai',        js: '__search',   concept: 'DISCOVERY' },

    // ── Module system ──
    0x09: { name: 'IMPORT',     role: 'keyword',   js: 'import',     concept: 'WORLD' },
    0x1B: { name: 'NAMESPACE',  role: 'keyword',   js: 'namespace',  concept: 'NATION' },
    0x88: { name: 'GLOBAL',     role: 'keyword',   js: 'globalThis', concept: 'HEAVEN' },

    // ── Introspection ──
    0x2C: { name: 'TYPEOF',     role: 'builtin',   js: 'typeof',     concept: 'SCIENCE' },
    0x49: { name: 'DEBUG',      role: 'builtin',   js: 'debugger',   concept: 'WONDER' },
    0x48: { name: 'FORMAT',     role: 'builtin',   js: '__format',   concept: 'BEAUTY' },

    // ── References ──
    0x18: { name: 'THIS',       role: 'keyword',   js: 'this',       concept: 'HOME' },

    // ── Terminal ──
    0xFF: { name: 'HALT',       role: 'keyword',   js: 'process.exit',concept: 'DEATH' },
};

const OPERATORS = {
    // Arithmetic
    0x2E: { symbol: '+',   name: 'ADD',        precedence: 4, concept: 'MEDICINE' },
    0x24: { symbol: '-',   name: 'SUB',        precedence: 4, concept: 'MEMORY' },
    0x26: { symbol: '*',   name: 'MUL',        precedence: 5, concept: 'SKILL' },
    0x34: { symbol: '/',   name: 'DIV',        precedence: 5, concept: 'TRADITION' },
    0x3C: { symbol: '%',   name: 'MOD',        precedence: 5, concept: 'POLITICS' },

    // Comparison
    0x36: { symbol: '==',  name: 'EQ',         precedence: 3, concept: 'EQUALS' },
    0x56: { symbol: '!=',  name: 'NEQ',        precedence: 3, concept: 'NOT_EQUALS' },
    0x16: { symbol: '<',   name: 'LT',         precedence: 3, concept: 'WORK' },
    0x32: { symbol: '>',   name: 'GT',         precedence: 3, concept: 'TEACHING' },
    0x15: { symbol: '<=',  name: 'LTE',        precedence: 3, concept: 'GENERATION' },
    0x31: { symbol: '>=',  name: 'GTE',        precedence: 3, concept: 'COMMUNICATION' },

    // Logical
    0x2F: { symbol: '&&',  name: 'AND',        precedence: 2, concept: 'AND' },
    0x3F: { symbol: '||',  name: 'OR',         precedence: 1, concept: 'REASON' },
    0x3B: { symbol: '!',   name: 'NOT',        precedence: 6, concept: 'CONSTITUTION' },

    // Assignment
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

// Braille digit mapping (after number indicator ⠼)
const DIGITS = {
    0x01: 0, // ⠁ → 0 (a=1, but in number context = 0... actually standard braille: a=1)
    // Use standard braille number convention:
    // ⠁=1, ⠃=2, ⠉=3, ⠙=4, ⠑=5, ⠋=6, ⠛=7, ⠓=8, ⠊=9, ⠚=0
};

// Number sign that prefixes numeric literals
const NUMBER_SIGN = 0x3C; // ⠼

// Identifier sign — prefixes identifier words to avoid keyword collision
// When the lexer sees ⠐, the following braille word is always an identifier.
const IDENT_SIGN = 0x10; // ⠐ (OTHER)

// String delimiter
const STRING_DELIM = 0x36; // ⠶...⠶

// Comment marker (single line)
const COMMENT = 0xC0; // ⣀ (AWE) — comments are moments of awe

// Newline / statement separator
const NEWLINE = 0x06; // ⠆ (GROWTH) — each statement grows the program

/**
 * Check if a braille code point offset is a keyword
 */
function isKeyword(offset) {
    return KEYWORDS.hasOwnProperty(offset);
}

/**
 * Check if a braille code point offset is an operator
 */
function isOperator(offset) {
    return OPERATORS.hasOwnProperty(offset);
}

/**
 * Check if a braille code point offset is a delimiter
 */
function isDelimiter(offset) {
    return DELIMITERS.hasOwnProperty(offset);
}

/**
 * Get the braille character for a given offset
 */
function toBraille(offset) {
    return String.fromCodePoint(0x2800 + offset);
}

/**
 * Get the offset for a braille character
 */
function fromBraille(char) {
    return char.codePointAt(0) - 0x2800;
}

/**
 * Check if a code point is in the braille range
 */
function isBraille(codePoint) {
    return codePoint >= 0x2800 && codePoint <= 0x28FF;
}

module.exports = {
    KEYWORDS,
    OPERATORS,
    DELIMITERS,
    DIGITS,
    NUMBER_SIGN,
    IDENT_SIGN,
    STRING_DELIM,
    COMMENT,
    NEWLINE,
    isKeyword,
    isOperator,
    isDelimiter,
    toBraille,
    fromBraille,
    isBraille,
};
