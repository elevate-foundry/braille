/**
 * EdgeRuntime - Lightweight MOTL Reasoning Runtime for Edge Devices
 * 
 * Loads compressed MOTL packets produced by the Distiller and executes
 * reasoning locally without requiring API calls or heavy compute.
 * 
 * Pipeline position:  Distiller → [compressed MOTL] → EdgeRuntime → [answers]
 * 
 * Design goals:
 *   - Zero external dependencies (runs in browser, Node, or embedded JS)
 *   - Sub-millisecond concept lookup from pre-built encoding tables
 *   - Incremental learning: feed new packets to refine local knowledge
 *   - Memory budget enforcement for constrained devices
 */

// Imports for Node.js
if (typeof require !== 'undefined') {
    var SemanticCodec = require('./semantic-codec').SemanticCodec;
    var BBESCodec = require('../braille-core/bbes-codec').BBESCodec;
}

class EdgeRuntime {
    /**
     * @param {Object} options
     * @param {number} options.maxMemoryKB - Soft memory budget in KB (default 512)
     * @param {number} options.maxConcepts - Max concepts to retain (default 2000)
     * @param {boolean} options.incrementalLearning - Refine tables on each packet (default true)
     */
    constructor(options = {}) {
        this.options = {
            maxMemoryKB: 512,
            maxConcepts: 2000,
            incrementalLearning: true,
            ...options
        };

        // Local knowledge base — built up from ingested packets
        this.knowledgeBase = {
            concepts: new Map(),       // concept → { confidence, frequency, relations }
            relations: [],             // { source, target, type }
            conclusions: new Map(),    // queryHash → { answer, confidence, timestamp }
            encodingTable: new Map()   // concept → bitString (from SemanticCodec)
        };

        // SemanticCodec instance for decoding/encoding
        this.codec = new SemanticCodec({ adaptiveEncoding: true });

        // Performance counters
        this.stats = {
            packetsIngested: 0,
            queriesAnswered: 0,
            cacheHits: 0,
            avgLookupMs: 0,
            memoryEstimateKB: 0
        };
    }

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Ingest a distilled MOTL packet into the local knowledge base.
     * @param {Object} packet - Output from Distiller.distill() or Distiller.distillCompact()
     * @returns {Object} - { conceptsAdded, relationsAdded, memoryKB }
     */
    ingest(packet) {
        const startTime = Date.now();

        // Extract the thought structure from the packet
        const thought = this._extractThought(packet);
        if (!thought) {
            return { conceptsAdded: 0, relationsAdded: 0, memoryKB: this.stats.memoryEstimateKB };
        }

        let conceptsAdded = 0;
        let relationsAdded = 0;

        // Ingest concepts
        if (thought.concepts) {
            for (const concept of thought.concepts) {
                const name = concept.name || concept;
                const existing = this.knowledgeBase.concepts.get(name);

                if (existing) {
                    // Update existing concept with new evidence
                    existing.frequency += (concept.frequency || 1);
                    existing.confidence = Math.max(existing.confidence, concept.confidence || 0.5);
                    existing.providerCount = Math.max(existing.providerCount || 1, concept.providerCount || 1);
                } else {
                    // Add new concept
                    this.knowledgeBase.concepts.set(name, {
                        frequency: concept.frequency || 1,
                        confidence: concept.confidence || 0.5,
                        providerCount: concept.providerCount || 1,
                        types: concept.types || [],
                        addedAt: Date.now()
                    });
                    conceptsAdded++;
                }
            }
        }

        // Ingest relations
        if (thought.relations) {
            for (const rel of thought.relations) {
                this.knowledgeBase.relations.push({
                    source: rel.source,
                    target: rel.target,
                    type: rel.type || 'RELATED'
                });
                relationsAdded++;
            }
        }

        // Cache the conclusion for fast lookup
        if (thought.query && thought.conclusion) {
            const key = this._hashQuery(thought.query);
            this.knowledgeBase.conclusions.set(key, {
                query: thought.query,
                answer: thought.conclusion.answer,
                confidence: thought.conclusion.confidence,
                consensus: thought.conclusion.consensus,
                timestamp: Date.now()
            });
        }

        // Update encoding table via SemanticCodec
        if (this.options.incrementalLearning) {
            this._updateEncodingTable();
        }

        // Enforce memory budget
        this._enforceMemoryBudget();

        this.stats.packetsIngested++;
        this.stats.memoryEstimateKB = this._estimateMemory();

        return {
            conceptsAdded,
            relationsAdded,
            totalConcepts: this.knowledgeBase.concepts.size,
            totalRelations: this.knowledgeBase.relations.length,
            memoryKB: this.stats.memoryEstimateKB,
            latencyMs: Date.now() - startTime
        };
    }

    /**
     * Query the local knowledge base for an answer.
     * @param {string} query - Natural language query
     * @returns {Object} - { answer, confidence, source, latencyMs }
     */
    query(query) {
        const startTime = Date.now();

        // Check conclusion cache first
        const cacheKey = this._hashQuery(query);
        const cached = this.knowledgeBase.conclusions.get(cacheKey);

        if (cached) {
            this.stats.cacheHits++;
            this.stats.queriesAnswered++;
            const latencyMs = Date.now() - startTime;
            this._updateAvgLookup(latencyMs);

            return {
                answer: cached.answer,
                confidence: cached.confidence,
                consensus: cached.consensus,
                source: 'cache',
                latencyMs
            };
        }

        // Attempt concept-based reasoning from knowledge base
        const concepts = this._extractQueryConcepts(query);
        const relatedKnowledge = this._findRelatedKnowledge(concepts);

        this.stats.queriesAnswered++;
        const latencyMs = Date.now() - startTime;
        this._updateAvgLookup(latencyMs);

        if (relatedKnowledge.bestMatch) {
            return {
                answer: relatedKnowledge.bestMatch.answer,
                confidence: relatedKnowledge.confidence,
                source: 'knowledge_base',
                matchedConcepts: relatedKnowledge.matchedConcepts,
                latencyMs
            };
        }

        return {
            answer: null,
            confidence: 0,
            source: 'none',
            suggestion: 'Query not found in local knowledge. Requires upstream distillation.',
            latencyMs
        };
    }

    /**
     * Get the current concept encoding table for inspection or export.
     * @returns {Object}
     */
    getEncodingTable() {
        return Object.fromEntries(this.knowledgeBase.encodingTable);
    }

    /**
     * Export the entire knowledge base as a serializable object.
     * @returns {Object}
     */
    export() {
        return {
            concepts: Array.from(this.knowledgeBase.concepts.entries()),
            relations: this.knowledgeBase.relations,
            conclusions: Array.from(this.knowledgeBase.conclusions.entries()),
            encodingTable: Array.from(this.knowledgeBase.encodingTable.entries()),
            stats: { ...this.stats }
        };
    }

    /**
     * Import a previously exported knowledge base.
     * @param {Object} data - Output from export()
     */
    import(data) {
        if (data.concepts) this.knowledgeBase.concepts = new Map(data.concepts);
        if (data.relations) this.knowledgeBase.relations = data.relations;
        if (data.conclusions) this.knowledgeBase.conclusions = new Map(data.conclusions);
        if (data.encodingTable) this.knowledgeBase.encodingTable = new Map(data.encodingTable);
        this.stats.memoryEstimateKB = this._estimateMemory();
    }

    /**
     * Get runtime statistics.
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            totalConcepts: this.knowledgeBase.concepts.size,
            totalRelations: this.knowledgeBase.relations.length,
            totalConclusions: this.knowledgeBase.conclusions.size,
            codecStats: this.codec.getStats()
        };
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    /**
     * Extract thought structure from various packet formats.
     * @private
     */
    _extractThought(packet) {
        // Full distill() output
        if (packet.thought) return packet.thought;

        // Compact packet — reconstruct minimal thought
        if (packet.answer) {
            return {
                concepts: [],
                relations: [],
                conclusion: { answer: packet.answer, confidence: packet.confidence || 0.5 }
            };
        }

        return null;
    }

    /**
     * Simple query hashing for cache lookup.
     * @private
     */
    _hashQuery(query) {
        const normalized = query.toLowerCase().trim().replace(/[^\w\s]/g, '');
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
            hash |= 0;
        }
        return `q_${Math.abs(hash).toString(36)}`;
    }

    /**
     * Extract concepts from a query string (lightweight NLP).
     * @private
     */
    _extractQueryConcepts(query) {
        const tokens = query.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'but', 'not', 'this', 'that', 'it']);
        return tokens.filter(t => t.length > 2 && !stopWords.has(t));
    }

    /**
     * Find knowledge related to the query concepts.
     * @private
     */
    _findRelatedKnowledge(queryConcepts) {
        let bestMatch = null;
        let bestScore = 0;
        const matchedConcepts = [];

        // Score each cached conclusion by concept overlap
        for (const [key, conclusion] of this.knowledgeBase.conclusions) {
            const conclusionConcepts = this._extractQueryConcepts(conclusion.query);
            const overlap = queryConcepts.filter(c => conclusionConcepts.includes(c));
            const score = overlap.length / Math.max(1, queryConcepts.length);

            if (score > bestScore && score >= 0.4) {
                bestScore = score;
                bestMatch = conclusion;
                matchedConcepts.length = 0;
                matchedConcepts.push(...overlap);
            }
        }

        // Also check concept-level knowledge
        for (const concept of queryConcepts) {
            if (this.knowledgeBase.concepts.has(concept)) {
                matchedConcepts.push(concept);
            }
        }

        return {
            bestMatch,
            confidence: bestScore,
            matchedConcepts: [...new Set(matchedConcepts)]
        };
    }

    /**
     * Update the SemanticCodec encoding table with current concept frequencies.
     * @private
     */
    _updateEncodingTable() {
        const sorted = Array.from(this.knowledgeBase.concepts.entries())
            .sort((a, b) => (b[1].frequency * b[1].confidence) - (a[1].frequency * a[1].confidence))
            .map(([name]) => name);

        // Feed sorted concepts into SemanticCodec
        this.codec.reassignBitDepths(sorted.slice(0, 30)); // top 30 get optimal bit depths

        // Copy encoding table locally
        for (const [concept, bits] of this.codec.encodingTables.dynamicConcepts) {
            this.knowledgeBase.encodingTable.set(concept, bits);
        }
    }

    /**
     * Estimate current memory usage in KB.
     * @private
     */
    _estimateMemory() {
        let bytes = 0;
        // Rough estimate: 100 bytes per concept, 50 per relation, 200 per conclusion
        bytes += this.knowledgeBase.concepts.size * 100;
        bytes += this.knowledgeBase.relations.length * 50;
        bytes += this.knowledgeBase.conclusions.size * 200;
        bytes += this.knowledgeBase.encodingTable.size * 20;
        return Math.ceil(bytes / 1024);
    }

    /**
     * Enforce memory budget by evicting lowest-value concepts.
     * @private
     */
    _enforceMemoryBudget() {
        if (this.stats.memoryEstimateKB <= this.options.maxMemoryKB &&
            this.knowledgeBase.concepts.size <= this.options.maxConcepts) {
            return;
        }

        // Sort concepts by value score (frequency × confidence), evict lowest
        const sorted = Array.from(this.knowledgeBase.concepts.entries())
            .sort((a, b) => (a[1].frequency * a[1].confidence) - (b[1].frequency * b[1].confidence));

        const toRemove = Math.max(
            this.knowledgeBase.concepts.size - this.options.maxConcepts,
            Math.ceil(this.knowledgeBase.concepts.size * 0.1) // evict 10%
        );

        for (let i = 0; i < toRemove && i < sorted.length; i++) {
            this.knowledgeBase.concepts.delete(sorted[i][0]);
        }

        // Prune relations referencing removed concepts
        const remaining = this.knowledgeBase.concepts;
        this.knowledgeBase.relations = this.knowledgeBase.relations.filter(
            r => remaining.has(r.source) || remaining.has(r.target)
        );

        this.stats.memoryEstimateKB = this._estimateMemory();
    }

    /**
     * @private
     */
    _updateAvgLookup(latencyMs) {
        const n = this.stats.queriesAnswered;
        this.stats.avgLookupMs = (this.stats.avgLookupMs * (n - 1) + latencyMs) / n;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EdgeRuntime };
} else if (typeof window !== 'undefined') {
    window.EdgeRuntime = EdgeRuntime;
}
