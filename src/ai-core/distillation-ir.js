/**
 * DistillationIR - Minimal Intermediate Representation on ℤ₂⁸
 * 
 * A compact instruction set for encoding distillation artifacts
 * (traces, rationales, plans, tool-call scripts, state transitions)
 * as braille byte streams.
 * 
 * Opcodes (first byte of each instruction):
 * 
 *   0x00  NOP        No operation (padding/alignment)
 *   0x01  OP         Operator application: OP <opId> <arity> <arg>...
 *   0x02  ASSERT     Constraint/fact: ASSERT <conceptBytes>...  <END>
 *   0x03  REF        Reference to prior result: REF <index>
 *   0x04  SCORE      Quality score: SCORE <high> <low>  (16-bit, big-endian)
 *   0x05  TRACE      Reasoning step: TRACE <stepType> <conceptBytes>... <END>
 *   0x06  STATE      State transition: STATE <fromByte> <toByte>
 *   0x07  COMPOSE    XOR composition: COMPOSE <a> <b> → result
 *   0x08  BRANCH     Conditional: BRANCH <condition> <thenLen> <then>... <elseLen> <else>...
 *   0x09  MERGE      Merge point: MERGE <sourceCount> <sourceIds>...
 *   0x0A  CALL       Tool/function call: CALL <toolId> <argCount> <args>... <END>
 *   0x0B  RETURN     Return value: RETURN <bytes>... <END>
 *   0xFF  END        End-of-sequence marker
 * 
 * All values are braille bytes (0–255). Variable-length arguments
 * are terminated by END (0xFF) or prefixed with a length byte.
 * 
 * This IR is the substrate for CRDT-based multi-teacher distillation:
 * each teacher's output is compiled to IR, then merged via CRDTs.
 */

if (typeof require !== 'undefined') {
    var BrailleConceptAtlas = require('./concept-atlas').BrailleConceptAtlas;
    var SemanticEngine = require('./semantic-engine').SemanticEngine;
}

// Opcode constants
const OPC = {
    NOP:     0x00,
    OP:      0x01,
    ASSERT:  0x02,
    REF:     0x03,
    SCORE:   0x04,
    TRACE:   0x05,
    STATE:   0x06,
    COMPOSE: 0x07,
    BRANCH:  0x08,
    MERGE:   0x09,
    CALL:    0x0A,
    RETURN:  0x0B,
    END:     0xFF
};

const OPC_NAMES = Object.fromEntries(Object.entries(OPC).map(([k, v]) => [v, k]));

class DistillationIR {
    constructor(options = {}) {
        this.atlas = options.atlas || new BrailleConceptAtlas();
        this.engine = options.engine || new SemanticEngine({ atlas: this.atlas });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  EMIT — Build IR programs
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create an IR program builder.
     * @returns {IRBuilder}
     */
    builder() {
        return new IRBuilder(this.atlas);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  COMPILE — Teacher output → IR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compile a structured teacher output (JSON) into IR bytes.
     * 
     * Expected format (from frontier model, prompted to output strict JSON):
     * {
     *   "reasoning": ["step1", "step2", ...],
     *   "constraints": ["fact1", "fact2", ...],
     *   "answer": "final answer text",
     *   "score": 0.95,
     *   "tool_calls": [{ "tool": "search", "args": ["query"] }]
     * }
     * 
     * @param {Object} teacherOutput - Structured JSON from teacher
     * @param {string} sourceId - Teacher/model identifier
     * @returns {Uint8Array} - Compiled IR bytes
     */
    compile(teacherOutput, sourceId = 'teacher') {
        const b = this.builder();

        // Encode source as a MERGE marker
        const sourceBytes = new TextEncoder().encode(sourceId);
        b.raw(OPC.MERGE);
        b.raw(1); // source count
        for (const byte of sourceBytes) b.raw(byte);
        b.raw(OPC.END);

        // Reasoning trace
        if (teacherOutput.reasoning && Array.isArray(teacherOutput.reasoning)) {
            for (let i = 0; i < teacherOutput.reasoning.length; i++) {
                const step = teacherOutput.reasoning[i];
                const concepts = this._extractConcepts(step);
                b.trace(i, concepts);
            }
        }

        // Constraints / assertions
        if (teacherOutput.constraints && Array.isArray(teacherOutput.constraints)) {
            for (const constraint of teacherOutput.constraints) {
                const concepts = this._extractConcepts(constraint);
                b.assert(concepts);
            }
        }

        // Tool calls
        if (teacherOutput.tool_calls && Array.isArray(teacherOutput.tool_calls)) {
            for (const call of teacherOutput.tool_calls) {
                const toolId = this._hashString(call.tool || 'unknown');
                const args = (call.args || []).map(a => this._extractConcepts(String(a)));
                b.call(toolId, args);
            }
        }

        // Score
        if (typeof teacherOutput.score === 'number') {
            b.score(teacherOutput.score);
        }

        // Answer / return value
        if (teacherOutput.answer) {
            const concepts = this._extractConcepts(teacherOutput.answer);
            b.ret(concepts);
        }

        b.end();
        return b.build();
    }

    /**
     * Compile raw natural language text into IR (less structured).
     * @param {string} text
     * @param {string} sourceId
     * @returns {Uint8Array}
     */
    compileText(text, sourceId = 'teacher') {
        // Split into sentences as reasoning steps
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const output = {
            reasoning: sentences,
            constraints: [],
            answer: sentences[sentences.length - 1] || '',
            score: 0.5
        };

        return this.compile(output, sourceId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  DECODE — IR bytes → structured representation
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Decode IR bytes into a structured representation.
     * @param {Uint8Array} bytes
     * @returns {Object} - { instructions: Array<Object>, stats }
     */
    decode(bytes) {
        const instructions = [];
        let i = 0;

        while (i < bytes.length) {
            const opcode = bytes[i];

            if (opcode === OPC.END) {
                instructions.push({ op: 'END', offset: i });
                break;
            }

            if (opcode === OPC.NOP) {
                instructions.push({ op: 'NOP', offset: i });
                i++;
                continue;
            }

            if (opcode === OPC.OP) {
                const opId = bytes[i + 1] || 0;
                const arity = bytes[i + 2] || 0;
                const args = [];
                i += 3;
                for (let a = 0; a < arity && i < bytes.length; a++) {
                    args.push(bytes[i++]);
                }
                instructions.push({ op: 'OP', opId, arity, args, offset: i });
                continue;
            }

            if (opcode === OPC.ASSERT) {
                i++;
                const concepts = [];
                while (i < bytes.length && bytes[i] !== OPC.END) {
                    concepts.push(bytes[i++]);
                }
                if (i < bytes.length) i++; // skip END
                instructions.push({
                    op: 'ASSERT',
                    concepts,
                    decoded: concepts.map(c => this.atlas.getConcept(c) || `?${c}`),
                    offset: i
                });
                continue;
            }

            if (opcode === OPC.REF) {
                const index = bytes[i + 1] || 0;
                instructions.push({ op: 'REF', index, offset: i });
                i += 2;
                continue;
            }

            if (opcode === OPC.SCORE) {
                const high = bytes[i + 1] || 0;
                const low = bytes[i + 2] || 0;
                const score = ((high << 8) | low) / 65535;
                instructions.push({ op: 'SCORE', score, raw: { high, low }, offset: i });
                i += 3;
                continue;
            }

            if (opcode === OPC.TRACE) {
                const stepType = bytes[i + 1] || 0;
                i += 2;
                const concepts = [];
                while (i < bytes.length && bytes[i] !== OPC.END) {
                    concepts.push(bytes[i++]);
                }
                if (i < bytes.length) i++;
                instructions.push({
                    op: 'TRACE',
                    stepType,
                    concepts,
                    decoded: concepts.map(c => this.atlas.getConcept(c) || `?${c}`),
                    offset: i
                });
                continue;
            }

            if (opcode === OPC.STATE) {
                const from = bytes[i + 1] || 0;
                const to = bytes[i + 2] || 0;
                instructions.push({
                    op: 'STATE',
                    from, to,
                    fromConcept: this.atlas.getConcept(from),
                    toConcept: this.atlas.getConcept(to),
                    offset: i
                });
                i += 3;
                continue;
            }

            if (opcode === OPC.COMPOSE) {
                const a = bytes[i + 1] || 0;
                const b = bytes[i + 2] || 0;
                const result = (a ^ b) & 0xFF;
                instructions.push({
                    op: 'COMPOSE',
                    a, b, result,
                    aConcept: this.atlas.getConcept(a),
                    bConcept: this.atlas.getConcept(b),
                    resultConcept: this.atlas.getConcept(result),
                    offset: i
                });
                i += 3;
                continue;
            }

            if (opcode === OPC.MERGE) {
                const sourceCount = bytes[i + 1] || 0;
                i += 2;
                const sourceBytes = [];
                while (i < bytes.length && bytes[i] !== OPC.END) {
                    sourceBytes.push(bytes[i++]);
                }
                if (i < bytes.length) i++;
                instructions.push({
                    op: 'MERGE',
                    sourceCount,
                    source: new TextDecoder().decode(new Uint8Array(sourceBytes)),
                    offset: i
                });
                continue;
            }

            if (opcode === OPC.CALL) {
                const toolId = bytes[i + 1] || 0;
                const argCount = bytes[i + 2] || 0;
                i += 3;
                const args = [];
                let currentArg = [];
                while (i < bytes.length && bytes[i] !== OPC.END) {
                    currentArg.push(bytes[i++]);
                }
                if (currentArg.length > 0) args.push(currentArg);
                if (i < bytes.length) i++;
                instructions.push({ op: 'CALL', toolId, argCount, args, offset: i });
                continue;
            }

            if (opcode === OPC.RETURN) {
                i++;
                const concepts = [];
                while (i < bytes.length && bytes[i] !== OPC.END) {
                    concepts.push(bytes[i++]);
                }
                if (i < bytes.length) i++;
                instructions.push({
                    op: 'RETURN',
                    concepts,
                    decoded: concepts.map(c => this.atlas.getConcept(c) || `?${c}`),
                    offset: i
                });
                continue;
            }

            // Unknown opcode — skip
            instructions.push({ op: 'UNKNOWN', byte: opcode, offset: i });
            i++;
        }

        return {
            instructions,
            stats: {
                totalBytes: bytes.length,
                instructionCount: instructions.length,
                opcodes: this._countOpcodes(instructions),
                conceptCount: instructions.reduce((s, ins) =>
                    s + (ins.concepts ? ins.concepts.length : 0), 0)
            }
        };
    }

    /**
     * Convert IR bytes to a braille string representation.
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    toBraille(bytes) {
        let s = '';
        for (const b of bytes) s += String.fromCodePoint(0x2800 + b);
        return s;
    }

    /**
     * Convert braille string back to IR bytes.
     * @param {string} braille
     * @returns {Uint8Array}
     */
    fromBraille(braille) {
        const bytes = new Uint8Array(braille.length);
        for (let i = 0; i < braille.length; i++) {
            bytes[i] = braille.codePointAt(i) - 0x2800;
        }
        return bytes;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Extract atlas concept indices from a text string.
     * @private
     * @param {string} text
     * @returns {Array<number>} - Array of concept byte values
     */
    _extractConcepts(text) {
        const words = text.toUpperCase().split(/\s+/);
        const concepts = [];
        for (const word of words) {
            const clean = word.replace(/[^A-Z_]/g, '');
            const idx = this.atlas.getIndex(clean);
            if (idx !== null) {
                concepts.push(idx);
            }
        }
        return concepts;
    }

    /**
     * Simple hash of a string to a single byte.
     * @private
     */
    _hashString(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h) & 0xFF;
    }

    /**
     * Count opcodes in decoded instructions.
     * @private
     */
    _countOpcodes(instructions) {
        const counts = {};
        for (const ins of instructions) {
            counts[ins.op] = (counts[ins.op] || 0) + 1;
        }
        return counts;
    }
}

// ═══════════════════════════════════════════════════════════════════════════

class IRBuilder {
    /**
     * Fluent builder for IR byte programs.
     * @param {BrailleConceptAtlas} atlas
     */
    constructor(atlas) {
        this.atlas = atlas;
        this.bytes = [];
    }

    /** Emit a raw byte. */
    raw(byte) { this.bytes.push(byte & 0xFF); return this; }

    /** NOP */
    nop() { return this.raw(OPC.NOP); }

    /** OP <opId> <arity> <args...> */
    op(opId, args = []) {
        this.raw(OPC.OP).raw(opId).raw(args.length);
        for (const a of args) this.raw(a);
        return this;
    }

    /** ASSERT <concept bytes...> END */
    assert(conceptBytes) {
        this.raw(OPC.ASSERT);
        for (const b of conceptBytes) this.raw(b);
        return this.raw(OPC.END);
    }

    /** REF <index> */
    ref(index) { return this.raw(OPC.REF).raw(index); }

    /** SCORE <float 0–1 encoded as 16-bit> */
    score(value) {
        const quantized = Math.round(Math.min(1, Math.max(0, value)) * 65535);
        return this.raw(OPC.SCORE).raw((quantized >> 8) & 0xFF).raw(quantized & 0xFF);
    }

    /** TRACE <stepType> <concept bytes...> END */
    trace(stepType, conceptBytes) {
        this.raw(OPC.TRACE).raw(stepType);
        for (const b of conceptBytes) this.raw(b);
        return this.raw(OPC.END);
    }

    /** STATE <from> <to> */
    state(from, to) { return this.raw(OPC.STATE).raw(from).raw(to); }

    /** COMPOSE <a> <b> */
    compose(a, b) { return this.raw(OPC.COMPOSE).raw(a).raw(b); }

    /** CALL <toolId> <argCount> <flatArgs...> END */
    call(toolId, argArrays = []) {
        this.raw(OPC.CALL).raw(toolId).raw(argArrays.length);
        for (const argArr of argArrays) {
            for (const b of argArr) this.raw(b);
        }
        return this.raw(OPC.END);
    }

    /** RETURN <concept bytes...> END */
    ret(conceptBytes) {
        this.raw(OPC.RETURN);
        for (const b of conceptBytes) this.raw(b);
        return this.raw(OPC.END);
    }

    /** END marker */
    end() { return this.raw(OPC.END); }

    /** Build the final Uint8Array. */
    build() { return new Uint8Array(this.bytes); }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DistillationIR, IRBuilder, OPC, OPC_NAMES };
} else if (typeof window !== 'undefined') {
    window.DistillationIR = DistillationIR;
    window.IRBuilder = IRBuilder;
    window.OPC = OPC;
}
