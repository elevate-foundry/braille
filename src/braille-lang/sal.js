/**
 * ⣠ SAL — Symbolic Abstraction Layer
 * 
 * The control plane for stochastic computation in BrailleLang.
 * 
 * SAL wraps every AI primitive (⠠ INFER, ⠫ EMBED, ⡩ PROMPT, ⡪ PIPE, ⣠ REFLECT, ⠭ SEARCH)
 * with deterministic instrumentation:
 * 
 *   1. AUDIT TRAIL  — Every AI call is hashed, timestamped, and logged
 *   2. CACHE LAYER  — Identical inputs produce identical outputs (deterministic replay)
 *   3. TRACE GRAPH  — Execution flows are recorded as a DAG of deterministic + stochastic nodes
 *   4. BOUNDARY MAP — Explicit markers for where human decides vs where machine guesses
 *   5. COST TRACKING — Token usage, latency, model selection per call
 * 
 * Philosophy:
 *   BrailleLang doesn't compete with frontier LLMs at being smarter.
 *   SAL makes AI behavior controllable, auditable, and reproducible.
 *   It's the accountability wrapper for stochastic computation.
 * 
 * Architecture:
 *   ┌─────────────────────────────────────────┐
 *   │  BrailleLang Source (.br)               │
 *   │  ⠁ ⡲ ⠪ ⠠ ⠣ ⠶query⠶ ⠜ ⠆              │
 *   └──────────────┬──────────────────────────┘
 *                  │
 *   ┌──────────────▼──────────────────────────┐
 *   │  SAL Intercept Layer                    │
 *   │  ┌─────────┐ ┌──────┐ ┌──────────────┐ │
 *   │  │ Hash    │ │Cache │ │ Trace Node   │ │
 *   │  │ Input   │→│Check │→│ Record       │ │
 *   │  └─────────┘ └──────┘ └──────────────┘ │
 *   └──────────────┬──────────────────────────┘
 *                  │
 *   ┌──────────────▼──────────────────────────┐
 *   │  AI Backend (OpenRouter / dry-run)      │
 *   └──────────────┬──────────────────────────┘
 *                  │
 *   ┌──────────────▼──────────────────────────┐
 *   │  SAL Post-Processing                    │
 *   │  ┌─────────┐ ┌──────┐ ┌──────────────┐ │
 *   │  │ Hash    │ │Cache │ │ Cost/Latency │ │
 *   │  │ Output  │→│Store │→│ Tally        │ │
 *   │  └─────────┘ └──────┘ └──────────────┘ │
 *   └────────────────────────────────────────┘
 */

'use strict';

// ═════════════════════════════════════════════════════════════════════════════
// §1  TRACE NODE — A single node in the execution DAG
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Execution domain classification.
 * Every operation in BrailleLang is either deterministic or stochastic.
 * SAL makes this boundary explicit and inspectable.
 */
const Domain = Object.freeze({
    DETERMINISTIC: '⠁',   // GOD — existence, certainty
    STOCHASTIC:    '⠠',   // MIND — inference, probability
    HYBRID:        '⡪',   // MUSIC — composition of both
});

/**
 * A TraceNode records a single operation in the execution graph.
 */
class TraceNode {
    constructor({ id, type, domain, primitive, inputHash, outputHash, input, output,
                  parentId, timestamp, latencyMs, cached, model, tokens, cost, metadata }) {
        this.id = id;                     // Unique node ID (monotonic counter)
        this.type = type;                 // 'ai_call' | 'deterministic' | 'pipe_stage' | 'boundary'
        this.domain = domain;             // Domain enum
        this.primitive = primitive;       // 'INFER' | 'EMBED' | 'PROMPT' | 'PIPE' | 'REFLECT' | 'SEARCH' | null
        this.inputHash = inputHash;       // SHA-256 of serialized input
        this.outputHash = outputHash;     // SHA-256 of serialized output
        this.input = input;               // The actual input (truncated for large payloads)
        this.output = output;             // The actual output (truncated for large payloads)
        this.parentId = parentId;         // Parent node in the trace DAG
        this.timestamp = timestamp;       // ISO 8601
        this.latencyMs = latencyMs;       // Execution time in ms
        this.cached = cached;             // Whether result was served from cache
        this.model = model;               // LLM model used (null for deterministic ops)
        this.tokens = tokens;             // { prompt: N, completion: N } or null
        this.cost = cost;                 // Estimated cost in USD or null
        this.metadata = metadata || {};   // Extensible metadata
    }

    /**
     * Compact representation for logging.
     */
    toCompact() {
        const cache = this.cached ? '⠹' : '⠅';  // CONST (cached) vs NEW
        const dom = this.domain;
        return `${dom}${cache} #${this.id} ${this.primitive || this.type} [${this.inputHash.slice(0,8)}→${this.outputHash.slice(0,8)}] ${this.latencyMs}ms`;
    }

    toJSON() {
        return {
            id: this.id, type: this.type, domain: this.domain,
            primitive: this.primitive, inputHash: this.inputHash,
            outputHash: this.outputHash, input: this.input,
            output: this.output, parentId: this.parentId,
            timestamp: this.timestamp, latencyMs: this.latencyMs,
            cached: this.cached, model: this.model,
            tokens: this.tokens, cost: this.cost,
            metadata: this.metadata,
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// §2  SAL CACHE — Deterministic replay for stochastic calls
// ═════════════════════════════════════════════════════════════════════════════

class SALCache {
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 1000;
        this.ttlMs = options.ttlMs || 3600000; // 1 hour default
        this.store = new Map(); // inputHash → { output, outputHash, timestamp, hits }
        this.hits = 0;
        this.misses = 0;
    }

    get(inputHash) {
        const entry = this.store.get(inputHash);
        if (!entry) { this.misses++; return null; }
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.store.delete(inputHash);
            this.misses++;
            return null;
        }
        entry.hits++;
        this.hits++;
        return entry;
    }

    set(inputHash, output, outputHash) {
        if (this.store.size >= this.maxEntries) {
            // Evict oldest entry
            const oldest = this.store.keys().next().value;
            this.store.delete(oldest);
        }
        this.store.set(inputHash, {
            output, outputHash,
            timestamp: Date.now(),
            hits: 0,
        });
    }

    clear() { this.store.clear(); this.hits = 0; this.misses = 0; }

    getStats() {
        return {
            entries: this.store.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits + this.misses > 0
                ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) + '%'
                : '0%',
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// §3  SAL CORE ENGINE
// ═════════════════════════════════════════════════════════════════════════════

class SAL {
    constructor(options = {}) {
        this.options = {
            cacheEnabled: options.cacheEnabled !== false,
            traceEnabled: options.traceEnabled !== false,
            maxTraceNodes: options.maxTraceNodes || 10000,
            truncateAt: options.truncateAt || 500,    // Max chars to store for input/output
            costPerInputToken: options.costPerInputToken || 0.00000015,   // GPT-4o-mini pricing
            costPerOutputToken: options.costPerOutputToken || 0.0000006,
            ...options,
        };

        // Execution trace — ordered list of TraceNodes
        this.trace = [];
        this.nodeCounter = 0;

        // Active parent stack for nested calls
        this.parentStack = [];

        // Cache
        this.cache = new SALCache({
            maxEntries: options.cacheMaxEntries || 1000,
            ttlMs: options.cacheTtlMs || 3600000,
        });

        // Aggregate stats
        this.stats = {
            totalCalls: 0,
            byPrimitive: { INFER: 0, EMBED: 0, PROMPT: 0, PIPE: 0, REFLECT: 0, SEARCH: 0 },
            totalLatencyMs: 0,
            totalTokens: { prompt: 0, completion: 0 },
            totalCost: 0,
            cacheHits: 0,
            cacheMisses: 0,
            deterministicOps: 0,
            stochasticOps: 0,
        };

        // Session metadata
        this.session = {
            id: this._generateSessionId(),
            startedAt: new Date().toISOString(),
            endedAt: null,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.1  INTERCEPT — Wrap an AI call with full instrumentation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Intercept an AI primitive call. This is the core SAL function.
     * 
     * @param {string} primitive — 'INFER' | 'EMBED' | 'PROMPT' | 'PIPE' | 'REFLECT' | 'SEARCH'
     * @param {any[]} args — The arguments to the AI call
     * @param {Function} executeFn — The actual AI call function (async)
     * @param {Object} context — { model, env } optional context
     * @returns {Promise<{result: any, node: TraceNode}>}
     */
    async intercept(primitive, args, executeFn, context = {}) {
        const startTime = Date.now();
        const inputStr = this._serialize(args);
        const inputHash = await this._hash(inputStr);
        const parentId = this.parentStack.length > 0 ? this.parentStack[this.parentStack.length - 1] : null;

        this.stats.totalCalls++;
        this.stats.byPrimitive[primitive] = (this.stats.byPrimitive[primitive] || 0) + 1;

        // ── Cache check ──
        if (this.options.cacheEnabled) {
            const cached = this.cache.get(inputHash);
            if (cached) {
                this.stats.cacheHits++;
                const node = this._createNode({
                    type: 'ai_call', domain: Domain.STOCHASTIC, primitive,
                    inputHash, outputHash: cached.outputHash,
                    input: this._truncate(inputStr), output: this._truncate(this._serialize(cached.output)),
                    parentId, latencyMs: 0, cached: true,
                    model: context.model || null, tokens: null, cost: 0,
                });
                return { result: cached.output, node };
            }
            this.stats.cacheMisses++;
        }

        // ── Execute the actual AI call ──
        this.parentStack.push(this.nodeCounter);
        let result, error;
        try {
            result = await executeFn(args);
        } catch (e) {
            error = e;
        }
        this.parentStack.pop();

        const latencyMs = Date.now() - startTime;
        const outputStr = error ? `ERROR: ${error.message}` : this._serialize(result);
        const outputHash = await this._hash(outputStr);

        // ── Estimate cost ──
        let tokens = null, cost = 0;
        if (primitive === 'INFER' && typeof result === 'string') {
            const promptTokens = Math.ceil(inputStr.length / 4);
            const completionTokens = Math.ceil(result.length / 4);
            tokens = { prompt: promptTokens, completion: completionTokens };
            cost = promptTokens * this.options.costPerInputToken +
                   completionTokens * this.options.costPerOutputToken;
            this.stats.totalTokens.prompt += promptTokens;
            this.stats.totalTokens.completion += completionTokens;
            this.stats.totalCost += cost;
        }

        // ── Cache store ──
        if (this.options.cacheEnabled && !error) {
            this.cache.set(inputHash, result, outputHash);
        }

        // ── Record trace node ──
        this.stats.totalLatencyMs += latencyMs;
        this.stats.stochasticOps++;

        const node = this._createNode({
            type: 'ai_call', domain: Domain.STOCHASTIC, primitive,
            inputHash, outputHash,
            input: this._truncate(inputStr), output: this._truncate(outputStr),
            parentId, latencyMs, cached: false,
            model: context.model || null, tokens, cost,
        });

        if (error) throw error;
        return { result, node };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.2  RECORD — Log a deterministic operation boundary
    // ─────────────────────────────────────────────────────────────────────────

    recordDeterministic(type, input, output) {
        this.stats.deterministicOps++;
        const inputStr = this._serialize(input);
        const outputStr = this._serialize(output);
        return this._createNode({
            type, domain: Domain.DETERMINISTIC, primitive: null,
            inputHash: this._hashSync(inputStr), outputHash: this._hashSync(outputStr),
            input: this._truncate(inputStr), output: this._truncate(outputStr),
            parentId: this.parentStack.length > 0 ? this.parentStack[this.parentStack.length - 1] : null,
            latencyMs: 0, cached: false, model: null, tokens: null, cost: 0,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.3  BOUNDARY MARKERS — Explicit human/AI decision points
    // ─────────────────────────────────────────────────────────────────────────

    markBoundary(label, domain = Domain.HYBRID) {
        return this._createNode({
            type: 'boundary', domain, primitive: null,
            inputHash: this._hashSync(label), outputHash: this._hashSync(label),
            input: label, output: label,
            parentId: this.parentStack.length > 0 ? this.parentStack[this.parentStack.length - 1] : null,
            latencyMs: 0, cached: false, model: null, tokens: null, cost: 0,
            metadata: { boundary: true, label },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.4  ANALYSIS — Query the execution trace
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get the full execution trace as a structured report.
     */
    getReport() {
        this.session.endedAt = new Date().toISOString();
        return {
            session: this.session,
            stats: {
                ...this.stats,
                cache: this.cache.getStats(),
            },
            trace: this.trace.map(n => n.toJSON()),
            boundaries: this.trace.filter(n => n.type === 'boundary').map(n => n.toJSON()),
            stochasticNodes: this.trace.filter(n => n.domain === Domain.STOCHASTIC).map(n => n.toCompact()),
            deterministicNodes: this.trace.filter(n => n.domain === Domain.DETERMINISTIC).length,
        };
    }

    /**
     * Get compact trace log — human-readable.
     */
    getTraceLog() {
        return this.trace.map(n => n.toCompact()).join('\n');
    }

    /**
     * Get the execution DAG as edges for visualization.
     */
    getDAG() {
        const nodes = this.trace.map(n => ({
            id: n.id,
            label: `${n.primitive || n.type}`,
            domain: n.domain,
            cached: n.cached,
        }));
        const edges = this.trace
            .filter(n => n.parentId !== null)
            .map(n => ({ from: n.parentId, to: n.id }));
        return { nodes, edges };
    }

    /**
     * Find all calls with a specific input hash (for replay).
     */
    findByInputHash(hash) {
        return this.trace.filter(n => n.inputHash === hash);
    }

    /**
     * Get deterministic-stochastic boundary summary.
     */
    getBoundaryMap() {
        const boundaries = [];
        let lastDomain = null;
        for (const node of this.trace) {
            if (node.domain !== lastDomain) {
                boundaries.push({
                    nodeId: node.id,
                    from: lastDomain,
                    to: node.domain,
                    at: node.primitive || node.type,
                    timestamp: node.timestamp,
                });
                lastDomain = node.domain;
            }
        }
        return boundaries;
    }

    /**
     * Export the full trace for replay.
     */
    exportForReplay() {
        return {
            version: '1.0.0',
            session: this.session,
            cache: Array.from(this.cache.store.entries()).map(([hash, entry]) => ({
                inputHash: hash,
                output: entry.output,
                outputHash: entry.outputHash,
            })),
            trace: this.trace.map(n => n.toJSON()),
        };
    }

    /**
     * Import a replay file — pre-populate cache for deterministic re-execution.
     */
    importForReplay(replayData) {
        if (replayData.cache) {
            for (const entry of replayData.cache) {
                this.cache.set(entry.inputHash, entry.output, entry.outputHash);
            }
        }
    }

    /**
     * Reset SAL state for a new execution.
     */
    reset() {
        this.trace = [];
        this.nodeCounter = 0;
        this.parentStack = [];
        this.stats = {
            totalCalls: 0,
            byPrimitive: { INFER: 0, EMBED: 0, PROMPT: 0, PIPE: 0, REFLECT: 0, SEARCH: 0 },
            totalLatencyMs: 0,
            totalTokens: { prompt: 0, completion: 0 },
            totalCost: 0,
            cacheHits: 0,
            cacheMisses: 0,
            deterministicOps: 0,
            stochasticOps: 0,
        };
        this.session = {
            id: this._generateSessionId(),
            startedAt: new Date().toISOString(),
            endedAt: null,
        };
        // Cache persists across resets for replay
    }

    // ─────────────────────────────────────────────────────────────────────────
    // §3.5  INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    _createNode(props) {
        const node = new TraceNode({
            id: this.nodeCounter++,
            timestamp: new Date().toISOString(),
            ...props,
        });
        if (this.options.traceEnabled && this.trace.length < this.options.maxTraceNodes) {
            this.trace.push(node);
        }
        return node;
    }

    async _hash(str) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const buf = new TextEncoder().encode(str);
            const hashBuf = await crypto.subtle.digest('SHA-256', buf);
            return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback: FNV-1a 64-bit
        return this._hashSync(str);
    }

    _hashSync(str) {
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
        return n.toString(16).padStart(16, '0');
    }

    _serialize(value) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return JSON.stringify(value);
        if (value instanceof Map) return JSON.stringify(Array.from(value.entries()));
        try { return JSON.stringify(value); } catch { return String(value); }
    }

    _truncate(str) {
        if (str.length <= this.options.truncateAt) return str;
        return str.slice(0, this.options.truncateAt) + `…[${str.length - this.options.truncateAt} more]`;
    }

    _generateSessionId() {
        const t = Date.now().toString(36);
        const r = Math.random().toString(36).slice(2, 8);
        return `sal_${t}_${r}`;
    }
}

module.exports = { SAL, SALCache, TraceNode, Domain };
