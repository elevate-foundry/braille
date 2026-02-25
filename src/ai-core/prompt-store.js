/**
 * PromptStore - Persistent Request/Response Storage for OpenRouter Queries
 * 
 * Logs every prompt sent to frontier models and every response received,
 * with metadata (model, timestamp, latency, tokens). Supports:
 *   - File-based persistence (JSON lines)
 *   - In-memory index for fast retrieval
 *   - Query by model, prompt type, timestamp range
 *   - Export for analysis / fine-tuning datasets
 * 
 * Storage format (one JSON object per line in .jsonl):
 *   { id, timestamp, model, promptType, request, response, meta }
 */

// Node.js imports
if (typeof require !== 'undefined') {
    var fs = require('fs');
    var path = require('path');
}

class PromptStore {
    /**
     * @param {Object} options
     * @param {string} options.storePath - Path to the .jsonl storage file
     * @param {boolean} options.persist - Write to disk (default true in Node, false in browser)
     */
    constructor(options = {}) {
        const defaultPath = typeof __dirname !== 'undefined'
            ? path.join(__dirname, '..', '..', 'data', 'prompt-store.jsonl')
            : null;

        this.options = {
            storePath: options.storePath || defaultPath,
            persist: options.persist !== undefined ? options.persist : (typeof fs !== 'undefined'),
            ...options
        };

        // In-memory index
        this.entries = [];
        this.idCounter = 0;

        // Load existing entries from disk
        if (this.options.persist && this.options.storePath) {
            this._loadFromDisk();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  WRITE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Log a request/response pair.
     * @param {Object} entry
     * @param {string} entry.model - Model identifier (e.g. 'openai/gpt-4o')
     * @param {string} entry.promptType - Category (e.g. 'semantic-engine', 'atlas-rank', 'atlas-assign')
     * @param {Object} entry.request - The full request payload { system, user }
     * @param {Object} entry.response - The full response { content, usage, ... }
     * @param {Object} entry.meta - Extra metadata { latencyMs, dryRun, ... }
     * @returns {Object} - The stored entry with id and timestamp
     */
    log(entry) {
        const record = {
            id: `pr_${++this.idCounter}_${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            model: entry.model || 'unknown',
            promptType: entry.promptType || 'general',
            request: entry.request || {},
            response: entry.response || {},
            meta: {
                latencyMs: entry.meta?.latencyMs || 0,
                dryRun: entry.meta?.dryRun || false,
                tokensIn: entry.meta?.tokensIn || entry.response?.usage?.prompt_tokens || 0,
                tokensOut: entry.meta?.tokensOut || entry.response?.usage?.completion_tokens || 0,
                ...(entry.meta || {})
            }
        };

        this.entries.push(record);

        if (this.options.persist) {
            this._appendToDisk(record);
        }

        return record;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  QUERY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get all entries.
     * @returns {Array<Object>}
     */
    getAll() {
        return [...this.entries];
    }

    /**
     * Get entries by prompt type.
     * @param {string} promptType
     * @returns {Array<Object>}
     */
    getByType(promptType) {
        return this.entries.filter(e => e.promptType === promptType);
    }

    /**
     * Get entries by model.
     * @param {string} model
     * @returns {Array<Object>}
     */
    getByModel(model) {
        return this.entries.filter(e => e.model === model);
    }

    /**
     * Get the most recent N entries.
     * @param {number} n
     * @returns {Array<Object>}
     */
    getRecent(n = 10) {
        return this.entries.slice(-n);
    }

    /**
     * Get entries by timestamp range.
     * @param {string|Date} from
     * @param {string|Date} to
     * @returns {Array<Object>}
     */
    getByDateRange(from, to) {
        const fromMs = new Date(from).getTime();
        const toMs = new Date(to).getTime();
        return this.entries.filter(e => {
            const ts = new Date(e.timestamp).getTime();
            return ts >= fromMs && ts <= toMs;
        });
    }

    /**
     * Get a single entry by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    getById(id) {
        return this.entries.find(e => e.id === id) || null;
    }

    /**
     * Search response content for a string.
     * @param {string} query
     * @returns {Array<Object>}
     */
    search(query) {
        const lower = query.toLowerCase();
        return this.entries.filter(e => {
            const content = typeof e.response === 'string'
                ? e.response
                : JSON.stringify(e.response);
            return content.toLowerCase().includes(lower);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  STATS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get store statistics.
     * @returns {Object}
     */
    getStats() {
        const byType = {};
        const byModel = {};
        let totalTokensIn = 0;
        let totalTokensOut = 0;
        let totalLatency = 0;

        for (const e of this.entries) {
            byType[e.promptType] = (byType[e.promptType] || 0) + 1;
            byModel[e.model] = (byModel[e.model] || 0) + 1;
            totalTokensIn += e.meta?.tokensIn || 0;
            totalTokensOut += e.meta?.tokensOut || 0;
            totalLatency += e.meta?.latencyMs || 0;
        }

        return {
            totalEntries: this.entries.length,
            byType,
            byModel,
            totalTokensIn,
            totalTokensOut,
            totalTokens: totalTokensIn + totalTokensOut,
            avgLatencyMs: this.entries.length > 0
                ? (totalLatency / this.entries.length).toFixed(1)
                : 0,
            storePath: this.options.storePath,
            persisting: this.options.persist
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Export all entries as a JSON array (for analysis, fine-tuning, etc.)
     * @returns {string} - JSON string
     */
    exportJSON() {
        return JSON.stringify(this.entries, null, 2);
    }

    /**
     * Export as OpenAI fine-tuning format (system/user/assistant).
     * @param {string} promptType - Filter by type (optional)
     * @returns {Array<Object>} - Array of { messages } objects
     */
    exportFineTuning(promptType) {
        const filtered = promptType ? this.getByType(promptType) : this.entries;
        return filtered.map(e => ({
            messages: [
                { role: 'system', content: e.request?.system || '' },
                { role: 'user', content: e.request?.user || '' },
                { role: 'assistant', content: typeof e.response === 'string' ? e.response : (e.response?.content || '') }
            ]
        }));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _ensureDir() {
        if (!fs || !this.options.storePath) return;
        const dir = path.dirname(this.options.storePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /** @private */
    _appendToDisk(record) {
        if (!fs || !this.options.storePath) return;
        try {
            this._ensureDir();
            fs.appendFileSync(this.options.storePath, JSON.stringify(record) + '\n');
        } catch (err) {
            console.error('PromptStore: failed to write to disk:', err.message);
        }
    }

    /** @private */
    _loadFromDisk() {
        if (!fs || !this.options.storePath) return;
        if (!fs.existsSync(this.options.storePath)) return;

        try {
            const data = fs.readFileSync(this.options.storePath, 'utf-8');
            const lines = data.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const record = JSON.parse(line);
                    this.entries.push(record);
                    this.idCounter++;
                } catch (_) {
                    // Skip malformed lines
                }
            }
        } catch (err) {
            console.error('PromptStore: failed to load from disk:', err.message);
        }
    }

    /**
     * Clear all entries (memory and disk).
     */
    clear() {
        this.entries = [];
        this.idCounter = 0;
        if (this.options.persist && fs && this.options.storePath) {
            try {
                if (fs.existsSync(this.options.storePath)) {
                    fs.unlinkSync(this.options.storePath);
                }
            } catch (_) {}
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PromptStore };
} else if (typeof window !== 'undefined') {
    window.PromptStore = PromptStore;
}
