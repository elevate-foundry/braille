# ⡂⡲⡡⡩⡬⡬⡥ BrailleLang

**An AI-native programming language encoded entirely in U+2800–U+28FF.**

Every keyword, operator, and delimiter is a Braille Unicode character. The language's keywords are drawn from the [BrailleConceptAtlas](../ai-core/concept-atlas.js) — each Braille pattern's semantic meaning maps to its programming function.

## Philosophy

| Braille | Concept | Programming Role |
|---------|---------|-----------------|
| ⠁ | GOD (existence) | `let` — declare (bring into being) |
| ⠹ | LAW (immutable) | `const` — immutable binding |
| ⠃ | LIFE (living block) | `function` |
| ⠡ | TRUTH | `if` — conditional |
| ⡠ | WISDOM | `else` — wise alternative |
| ⠄ | TIME | `while` — temporal loop |
| ⢄ | ETERNITY | `while(true)` — infinite loop |
| ⠌ | JOURNEY | `for...of` — traverse |
| ⡁ | LOVE | `return` — give back |
| ⠰ | LANGUAGE | `print` — express |
| ⠠ | MIND | `infer` — AI inference |
| ⠫ | TECHNOLOGY | `embed` — AI embeddings |
| ⡩ | INSPIRATION | `prompt` — construct prompts |
| ⡪ | MUSIC | `\|>` — pipe operator |
| ⣠ | CONSCIOUSNESS | `reflect` — meta-programming |
| ⠭ | DISCOVERY | `search` — semantic search |
| ⣿ | DEATH | `halt` — end program |
| ⠀ | VOID | `null` |

## Quick Start

```bash
# Run a program
node src/braille-lang/cli.js run src/braille-lang/examples/hello.br

# Start the REPL
node src/braille-lang/cli.js repl

# Compile to JavaScript
node src/braille-lang/cli.js compile src/braille-lang/examples/hello.br

# Encode ASCII to Braille
node src/braille-lang/cli.js encode "Hello World"
# → ⡈⡥⡬⡬⡯⠀⡷⡯⡲⡬⡤

# Decode Braille to ASCII
node src/braille-lang/cli.js decode "⡈⡥⡬⡬⡯"
# → Hello
```

## Language Reference

### Identifier Prefix `⠐`

Since many Braille patterns are reserved as keywords, variable names that are a single character (or start with a keyword character) must use the **identifier prefix** `⠐` (U+2810). This tells the lexer the next word is always an identifier:

```
⠐⡸     →  identifier "x" (not a keyword)
⡮⡡⡭⡥  →  identifier "name" (multi-char, no prefix needed)
```

Multi-character words that aren't single-char keywords don't need the prefix.

### Variables
```
⠁ ⡮⡡⡭⡥ ⠪ ⠶⡶⡡⡬⡵⡥⠶ ⠆     ⣀ let name = "value" ⣀
⠹ ⠐⡰⡩ ⠪ ⠼⠉⠄⠁⠙ ⠆           ⣀ const pi = 3.14 ⣀
```

### Functions
```
⠃ ⡡⡤⡤ ⠣ ⠐⡡ ⠂ ⠐⡢ ⠜ ⠳       ⣀ function add(a, b) { ⣀
  ⡁ ⠐⡡ ⠮ ⠐⡢ ⠆               ⣀   return a + b ⣀
⠾                               ⣀ } ⣀
```

### Lambdas
```
⡥ ⠣ ⠐⡸ ⠜ ⠫ ⠐⡸ ⠦ ⠐⡸       ⣀ (x) => x * x ⣀
```

### Control Flow
```
⠡ ⠣ ⠐⡸ ⠲ ⠼⠚ ⠜ ⠳            ⣀ if (x > 0) { ⣀
  ⠰ ⠣ ⠶⡰⡯⡳⡩⡴⡩⡶⡥⠶ ⠜ ⠆     ⣀   print("positive") ⣀
⠾ ⡠ ⠳                          ⣀ } else { ⣀
  ⠰ ⠣ ⠶⡮⡥⡧⡡⡴⡩⡶⡥⠶ ⠜ ⠆     ⣀   print("negative") ⣀
⠾                               ⣀ } ⣀
```

### Loops
```
⠄ ⠣ ⠐⡩ ⠖ ⠼⠁⠚ ⠜ ⠳           ⣀ while (i < 10) { ⣀
  ⠰ ⠣ ⠐⡩ ⠜ ⠆                 ⣀   print(i) ⣀
⠾                               ⣀ } ⣀

⠌ ⠣ ⡩⡴⡥⡭ ⠊ ⡬⡩⡳⡴ ⠜ ⠳       ⣀ for (item : list) { ⣀
  ⠰ ⠣ ⡩⡴⡥⡭ ⠜ ⠆              ⣀   print(item) ⣀
⠾                               ⣀ } ⣀
```

### AI Primitives

```
⣀ Call an LLM ⣀
⠁ ⡲⡥⡳⡰⡯⡮⡳⡥ ⠪ ⠠ ⠣ ⠶⡷⡨⡡⡴⠠⡩⡳⠠⡁⡉⠶ ⠜ ⠆

⣀ Get embeddings ⣀
⠁ ⡶⡥⡣ ⠪ ⠫ ⠣ ⠶⡨⡥⡬⡬⡯⠶ ⠜ ⠆

⣀ Build a prompt ⣀
⠁ ⠐⡰ ⠪ ⡩ ⠣ ⠶⡴⡥⡬⡬⠠⡭⡥⠠⡡⡢⡯⡵⡴⠠⡻⡴⡯⡰⡩⡣⡽⠶ ⠜ ⠆

⣀ Pipe: chain operations ⣀
⠐⡩⡮⡰⡵⡴ ⡪ ⡴⡲⡡⡮⡳⡦⡯⡲⡭ ⡪ ⠐⡳⡵⡭⡭⡡⡲⡩⡺⡥

⣀ Semantic search ⣀
⠁ ⡦⡯⡵⡮⡤ ⠪ ⠭ ⠣ ⠶⡱⡵⡥⡲⡹⠶ ⠂ ⡤⡡⡴⡡ ⠜ ⠆
```

### Operators

| Braille | Symbol | Operation |
|---------|--------|-----------|
| ⠮ | `+` | Addition |
| ⠤ | `-` | Subtraction |
| ⠦ | `*` | Multiplication |
| ⠴ | `/` | Division |
| ⠼ | `%` | Modulo |
| ⠶ | `==` | Equality |
| ⡖ | `!=` | Not equal |
| ⠖ | `<` | Less than |
| ⠲ | `>` | Greater than |
| ⠯ | `&&` | Logical AND |
| ⠿ | `\|\|` | Logical OR |
| ⠻ | `!` | Logical NOT |
| ⠪ | `=` | Assignment |
| ⠫ | `=>` | Arrow |

### Delimiters

| Braille | Symbol | Name |
|---------|--------|------|
| ⠣ | `(` | Open paren |
| ⠜ | `)` | Close paren |
| ⠳ | `{` | Open brace |
| ⠾ | `}` | Close brace |
| ⠷ | `[` | Open bracket |
| ⠽ | `]` | Close bracket |
| ⠂ | `,` | Comma |
| ⠒ | `.` | Dot access |
| ⠆ | `;` | Semicolon |
| ⠊ | `:` | Colon |
| ⣀ | | Comment (to end of line) |

### String Literals
Enclosed in ⠶...⠶. Inside, each Braille character maps to its ASCII equivalent via offset from U+2800.

```
⠶⡈⡥⡬⡬⡯⠶    →    "Hello"
```

### Number Literals
Prefixed with ⠼ (number sign), using standard Braille digit convention:
⠁=1, ⠃=2, ⠉=3, ⠙=4, ⠑=5, ⠋=6, ⠛=7, ⠓=8, ⠊=9, ⠚=0

```
⠼⠁⠃⠉    →    123
⠼⠉⠄⠁⠙  →    3.14
```

## Architecture

```
Source (.br)  →  Lexer  →  Tokens  →  Parser  →  AST  →  Interpreter (execute)
                                                      →  Compiler (→ JavaScript)
```

- **Lexer** (`lexer.js`): Tokenizes U+2800–U+28FF source into typed tokens
- **Parser** (`parser.js`): Builds AST with Pratt precedence climbing
- **Interpreter** (`interpreter.js`): Walks AST, executes with AI runtime
- **Compiler** (`compiler.js`): Transpiles AST to JavaScript
- **CLI** (`cli.js`): Run, compile, REPL, encode/decode

## AI Runtime

When AI primitives (⠠ ⠫ ⡩ ⡪ ⠭ ⣠) are invoked, BrailleLang calls OpenRouter's API. Set your key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

Or place it in `src/ai-core/.OPENROUTER_API_KEY`.

Without a key, AI primitives run in **dry-run mode** and return mock responses.

## Programmatic Usage

```javascript
const { run, compile, encode, decode } = require('./src/braille-lang');

// Execute braille source
const result = await run('⠰⠣⠶⡈⡥⡬⡬⡯⠶⠜');
console.log(result.output); // ['Hello']

// Compile to JS
const js = compile('⠁ ⡸ ⠪ ⠼⠙⠃⠆ ⠰⠣⡸⠜');

// Encode/decode
encode('Hello');  // → ⡈⡥⡬⡬⡯
decode('⡈⡥⡬⡬⡯'); // → Hello
```

## File Extension

BrailleLang source files use the `.br` extension.

## License

MIT — Part of the [BrailleBuddy](https://github.com/elevate-foundry/braille) project.
