/**
 * CRDTDistiller - Multi-Teacher Distillation Pipeline on ℤ₂⁸ with CRDTs
 * 
 * Orchestrates parallel distillation from multiple frontier models:
 * 
 *   1. Query N frontier models via AtlasBuilder/OpenRouter
 *   2. Compile each response to DistillationIR (braille byte streams)
 *   3. Store IR artifacts in CRDT structures:
 *      - constraints → ORSet (union of all teacher constraints)
 *      - best answer → LWWRegister (highest-scored answer wins)
 *      - reasoning traces → RGASequence (mergeable edit history)
 *      - raw chunks → MerkleChunkedLog (content-addressed dedup)
 *   4. Merge all replicas into a single consistent curriculum
 *   5. Export the merged corpus for student training
 * 
 * The key insight: each teacher is a CRDT replica. Their outputs merge
 * commutatively — no coordination required, no conflicts, eventual
 * consistency guaranteed by the CRDT properties.
 * 
 * All data flows through braille bytes. No English internally.
 */

if (typeof require !== 'undefined') {
    var { ORSet, LWWRegister, RGASequence, MerkleChunkedLog } = require('./crdt');
    var { DistillationIR } = require('./distillation-ir');
    var { BrailleConceptAtlas } = require('./concept-atlas');
    var { SemanticEngine } = require('./semantic-engine');
    var { AtlasBuilder } = require('./atlas-builder');
    var { PromptStore } = require('./prompt-store');
}

class CRDTDistiller {
    /**
     * @param {Object} options
     * @param {AtlasBuilder} options.builder - AtlasBuilder instance (for OpenRouter)
     * @param {BrailleConceptAtlas} options.atlas - Concept atlas
     * @param {boolean} options.dryRun - Use mock responses (default true)
     */
    constructor(options = {}) {
        this.atlas = options.atlas || new BrailleConceptAtlas();
        this.ir = new DistillationIR({ atlas: this.atlas });
        this.engine = new SemanticEngine({ atlas: this.atlas });

        this.builder = options.builder || new AtlasBuilder({
            dryRun: options.dryRun !== undefined ? options.dryRun : true,
            store: options.store || new PromptStore({ persist: false })
        });

        // CRDT structures — one per distillation session
        this.constraints = new ORSet('master');
        this.bestAnswer = new LWWRegister('master');
        this.traces = new RGASequence('master');
        this.log = new MerkleChunkedLog('master');

        // Session tracking
        this.sessions = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  DISTILL — The main pipeline
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Run a full multi-teacher distillation session.
     * 
     * @param {string} query - The question/task to distill
     * @param {Object} options
     * @param {Array<string>} options.models - Override models to query
     * @param {string} options.promptType - 'reasoning' | 'factual' | 'creative'
     * @returns {Promise<Object>} - { merged, perTeacher, stats }
     */
    async distill(query, options = {}) {
        const startTime = Date.now();
        const sessionId = `s_${Date.now().toString(36)}`;

        // Phase 1: Query frontier models
        const teacherResponses = await this._queryTeachers(query, options);

        // Phase 2: Compile each teacher's output to IR
        const teacherArtifacts = [];
        for (const response of teacherResponses) {
            const artifact = this._compileTeacher(response, sessionId);
            teacherArtifacts.push(artifact);
        }

        // Phase 3: Merge via CRDTs
        const merged = this._mergeArtifacts(teacherArtifacts);

        // Phase 4: Build compact corpus
        const corpus = this._buildCorpus(merged, query);

        const session = {
            id: sessionId,
            query,
            teacherCount: teacherResponses.length,
            merged,
            corpus,
            stats: {
                latencyMs: Date.now() - startTime,
                teacherCount: teacherResponses.length,
                constraintCount: this.constraints.size,
                traceLength: this.traces.length,
                logChunks: this.log.size,
                logBytes: this.log.totalBytes,
                corpusBytes: corpus.bytes.length,
                compressionRatio: this._compressionRatio(teacherResponses, corpus)
            }
        };

        this.sessions.push(session);
        return session;
    }

    /**
     * Distill from pre-existing teacher outputs (no API call).
     * Useful for offline / cached distillation.
     * 
     * @param {Array<Object>} teacherOutputs - Array of { model, reasoning, constraints, answer, score }
     * @param {string} query
     * @returns {Object}
     */
    distillOffline(teacherOutputs, query = '') {
        const startTime = Date.now();
        const sessionId = `s_${Date.now().toString(36)}`;

        const teacherArtifacts = teacherOutputs.map((output, i) => {
            const model = output.model || `teacher_${i}`;
            return this._compileTeacher({
                model,
                content: JSON.stringify(output),
                latencyMs: 0
            }, sessionId);
        });

        const merged = this._mergeArtifacts(teacherArtifacts);
        const corpus = this._buildCorpus(merged, query);

        return {
            id: sessionId,
            query,
            teacherCount: teacherOutputs.length,
            merged,
            corpus,
            stats: {
                latencyMs: Date.now() - startTime,
                teacherCount: teacherOutputs.length,
                constraintCount: this.constraints.size,
                traceLength: this.traces.length,
                logChunks: this.log.size,
                logBytes: this.log.totalBytes,
                corpusBytes: corpus.bytes.length
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  QUERY TEACHERS
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    async _queryTeachers(query, options = {}) {
        const prompt = {
            system: `You are a reasoning engine. Respond to the query with a structured JSON object:
{
  "reasoning": ["step 1 description", "step 2 description", ...],
  "constraints": ["fact/rule 1", "fact/rule 2", ...],
  "answer": "final answer text",
  "score": 0.0 to 1.0 confidence,
  "tool_calls": [{"tool": "name", "args": ["arg1"]}]
}
Be precise. Each reasoning step should identify key concepts. Constraints should be verifiable facts.`,
            user: query
        };

        // Use AtlasBuilder's model infrastructure
        const results = await Promise.allSettled(
            this.builder.options.models.map(model =>
                this.builder._callModel(model, prompt, 'crdt-distill', { max_tokens: 4096 })
            )
        );

        return results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return {
                model: this.builder.options.models[i],
                content: '{}',
                error: r.reason?.message || String(r.reason)
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  COMPILE TEACHER → IR + CRDTs
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _compileTeacher(response, sessionId) {
        const model = response.model || 'unknown';
        const replicaId = model.replace(/[^a-z0-9]/gi, '_');

        // Parse teacher output
        let output;
        try {
            output = JSON.parse(response.content);
        } catch (_) {
            output = {
                reasoning: [response.content || ''],
                constraints: [],
                answer: response.content || '',
                score: 0.1
            };
        }

        // Compile to IR
        const irBytes = this.ir.compile(output, model);

        // Create per-teacher CRDT replicas
        const teacherConstraints = new ORSet(replicaId);
        const teacherAnswer = new LWWRegister(replicaId);
        const teacherTrace = new RGASequence(replicaId);
        const teacherLog = new MerkleChunkedLog(replicaId);

        // Populate constraints (OR-Set)
        if (output.constraints) {
            for (const constraint of output.constraints) {
                const conceptBytes = this._textToConcepts(constraint);
                if (conceptBytes.length > 0) {
                    teacherConstraints.add(conceptBytes);
                }
            }
        }

        // Populate best answer (LWW-Register)
        if (output.answer) {
            const answerBytes = this._textToConcepts(output.answer);
            if (answerBytes.length > 0) {
                const score = typeof output.score === 'number' ? output.score : 0.5;
                teacherAnswer.set(
                    new Uint8Array(answerBytes),
                    score,
                    Date.now()
                );
            }
        }

        // Populate reasoning trace (RGA)
        for (const b of irBytes) {
            teacherTrace.append(b);
        }

        // Store in content-addressed log
        teacherLog.append(irBytes);

        return {
            model,
            replicaId,
            irBytes,
            output,
            crdts: {
                constraints: teacherConstraints,
                answer: teacherAnswer,
                trace: teacherTrace,
                log: teacherLog
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  MERGE — CRDT convergence
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _mergeArtifacts(artifacts) {
        for (const artifact of artifacts) {
            this.constraints.merge(artifact.crdts.constraints);
            this.bestAnswer.merge(artifact.crdts.answer);
            this.traces.merge(artifact.crdts.trace);
            this.log.merge(artifact.crdts.log);
        }

        return {
            constraints: this.constraints.values(),
            bestAnswer: this.bestAnswer.get(),
            bestScore: this.bestAnswer.score,
            bestSource: this.bestAnswer.source,
            traceBytes: this.traces.toBytes(),
            traceBraille: this.traces.toBraille(),
            logHashes: this.log.getHashes(),
            logBytes: this.log.totalBytes
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  CORPUS — Compact output for student training
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _buildCorpus(merged, query) {
        const b = this.ir.builder();

        // Header: query concepts
        const queryConcepts = this._textToConcepts(query);
        if (queryConcepts.length > 0) {
            b.trace(0, queryConcepts);
        }

        // Merged constraints
        for (const constraint of merged.constraints) {
            b.assert(Array.from(constraint));
        }

        // Best answer
        if (merged.bestAnswer) {
            b.score(merged.bestScore);
            b.ret(Array.from(merged.bestAnswer));
        }

        b.end();
        const bytes = b.build();

        // Braille representation
        let braille = '';
        for (const byte of bytes) braille += String.fromCodePoint(0x2800 + byte);

        // Decode for human-readable summary
        const decoded = this.ir.decode(bytes);

        return {
            bytes,
            braille,
            decoded,
            constraintCount: merged.constraints.length,
            answerScore: merged.bestScore,
            answerSource: merged.bestSource
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Extract concept byte indices from text.
     * @private
     */
    _textToConcepts(text) {
        if (!text) return [];
        const words = text.toUpperCase().split(/\s+/);
        const concepts = [];
        for (const word of words) {
            const clean = word.replace(/[^A-Z_]/g, '');
            const idx = this.atlas.getIndex(clean);
            if (idx !== null) concepts.push(idx);
        }
        return concepts;
    }

    /**
     * Compute compression ratio.
     * @private
     */
    _compressionRatio(teacherResponses, corpus) {
        const rawBytes = teacherResponses.reduce((s, r) =>
            s + new TextEncoder().encode(r.content || '').length, 0);
        if (rawBytes === 0) return 0;
        return (rawBytes / corpus.bytes.length).toFixed(1);
    }

    /**
     * Reset all CRDTs for a fresh session.
     */
    reset() {
        this.constraints = new ORSet('master');
        this.bestAnswer = new LWWRegister('master');
        this.traces = new RGASequence('master');
        this.log = new MerkleChunkedLog('master');
    }

    /**
     * Export the full CRDT state.
     * @returns {Object}
     */
    exportState() {
        return {
            constraints: this.constraints.export(),
            bestAnswer: this.bestAnswer.export(),
            traces: this.traces.export(),
            log: this.log.export(),
            sessions: this.sessions.length
        };
    }

    /**
     * Import CRDT state (resume from checkpoint).
     * @param {Object} state
     */
    importState(state) {
        if (state.constraints) this.constraints = ORSet.from(state.constraints);
        if (state.bestAnswer) this.bestAnswer = LWWRegister.from(state.bestAnswer);
        if (state.traces) this.traces = RGASequence.from(state.traces);
        if (state.log) this.log = MerkleChunkedLog.from(state.log);
    }

    /**
     * Get pipeline stats.
     * @returns {Object}
     */
    getStats() {
        return {
            sessions: this.sessions.length,
            constraints: this.constraints.size,
            traceLength: this.traces.length,
            logChunks: this.log.size,
            logBytes: this.log.totalBytes,
            hasAnswer: this.bestAnswer.get() !== null,
            answerScore: this.bestAnswer.score,
            store: this.builder.getStore().getStats()
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CRDTDistiller };
} else if (typeof window !== 'undefined') {
    window.CRDTDistiller = CRDTDistiller;
}
