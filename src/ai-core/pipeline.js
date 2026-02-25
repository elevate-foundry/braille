/**
 * DistillationPipeline - End-to-End Multi-Model Reasoning Distillation
 * 
 * Wires together the full pipeline:
 *   [Query] → ModelRouter → Distiller → EdgeRuntime → [Answer]
 * 
 * This is the single entry point for the swarm. Call pipeline.run(query)
 * and get back a distilled, compressed, edge-ready reasoning packet.
 * 
 * Modes:
 *   - 'full'   : Query models → distill → ingest into edge → return answer
 *   - 'distill' : Query models → distill → return packet (no edge ingest)
 *   - 'edge'   : Skip models, query local edge runtime only
 */

// Imports for Node.js
if (typeof require !== 'undefined') {
    var ModelRouter = require('./model-router').ModelRouter;
    var Distiller = require('./distiller').Distiller;
    var EdgeRuntime = require('./edge-runtime').EdgeRuntime;
}

class DistillationPipeline {
    /**
     * @param {Object} options
     * @param {string} options.mode - 'full' | 'distill' | 'edge' (default 'full')
     * @param {boolean} options.dryRun - Use mock API responses (default true)
     * @param {Object} options.routerOptions - Passed to ModelRouter
     * @param {Object} options.distillerOptions - Passed to Distiller
     * @param {Object} options.edgeOptions - Passed to EdgeRuntime
     */
    constructor(options = {}) {
        this.options = {
            mode: 'full',
            dryRun: true,
            ...options
        };

        // Initialize pipeline stages
        this.router = new ModelRouter({
            dryRun: this.options.dryRun,
            strategy: 'all',
            ...(this.options.routerOptions || {})
        });

        this.distiller = new Distiller({
            compressBBES: true,
            compressionTarget: 'balanced',
            ...(this.options.distillerOptions || {})
        });

        this.edge = new EdgeRuntime({
            maxMemoryKB: 512,
            maxConcepts: 2000,
            incrementalLearning: true,
            ...(this.options.edgeOptions || {})
        });

        // Pipeline execution log
        this.log = [];
    }

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Run the full pipeline for a query.
     * @param {string} query - Natural language query
     * @param {Object} context - Optional context for the query
     * @returns {Promise<Object>} - Pipeline result
     */
    async run(query, context = {}) {
        const startTime = Date.now();
        const mode = this.options.mode;
        const entry = { query, mode, startTime, stages: {} };

        try {
            // ── Stage: Edge-only mode ──
            if (mode === 'edge') {
                const edgeResult = this.edge.query(query);
                entry.stages.edge = { latencyMs: edgeResult.latencyMs };
                entry.totalMs = Date.now() - startTime;
                this.log.push(entry);

                return {
                    answer: edgeResult.answer,
                    confidence: edgeResult.confidence,
                    source: edgeResult.source,
                    mode,
                    pipeline: entry
                };
            }

            // ── Stage 1: Route to frontier models ──
            const routerResult = await this.router.query(query, context);
            entry.stages.router = {
                latencyMs: routerResult.meta.totalLatencyMs,
                providers: routerResult.meta.providerCount,
                responses: routerResult.meta.responseCount
            };

            // ── Stage 2: Distill into MOTL ──
            const distilled = this.distiller.distill(routerResult);
            entry.stages.distiller = {
                latencyMs: distilled.meta.latencyMs,
                concepts: distilled.meta.conceptCount,
                mergedConcepts: distilled.meta.mergedConceptCount,
                compressionRatio: distilled.meta.compressionRatio,
                motlSize: distilled.motlEncoded.size
            };

            // ── Stage 3: Ingest into edge (full mode only) ──
            if (mode === 'full') {
                const ingestResult = this.edge.ingest(distilled);
                entry.stages.edge = {
                    latencyMs: ingestResult.latencyMs,
                    conceptsAdded: ingestResult.conceptsAdded,
                    totalConcepts: ingestResult.totalConcepts,
                    memoryKB: ingestResult.memoryKB
                };
            }

            entry.totalMs = Date.now() - startTime;
            this.log.push(entry);

            return {
                answer: routerResult.aggregated.answer,
                confidence: routerResult.aggregated.confidence,
                consensus: routerResult.aggregated.consensus,
                source: mode === 'full' ? 'pipeline+edge' : 'pipeline',
                mode,
                distilled: {
                    motlSize: distilled.motlEncoded.size,
                    bbes: distilled.compressed.bbes,
                    compressionRatio: distilled.meta.compressionRatio,
                    conceptCount: distilled.meta.mergedConceptCount
                },
                pipeline: entry
            };

        } catch (error) {
            entry.error = error.message;
            entry.totalMs = Date.now() - startTime;
            this.log.push(entry);

            return {
                answer: null,
                confidence: 0,
                source: 'error',
                mode,
                error: error.message,
                pipeline: entry
            };
        }
    }

    /**
     * Run multiple queries in sequence, building up edge knowledge.
     * @param {Array<string>} queries
     * @returns {Promise<Array<Object>>}
     */
    async runBatch(queries) {
        const results = [];
        for (const query of queries) {
            results.push(await this.run(query));
        }
        return results;
    }

    /**
     * After running queries in 'full' mode, switch to edge-only and test.
     * @param {string} query
     * @returns {Object}
     */
    queryEdge(query) {
        return this.edge.query(query);
    }

    /**
     * Export the edge runtime's knowledge base for transfer to another device.
     * @returns {Object}
     */
    exportKnowledge() {
        return this.edge.export();
    }

    /**
     * Import a knowledge base into the edge runtime.
     * @param {Object} data
     */
    importKnowledge(data) {
        this.edge.import(data);
    }

    /**
     * Get full pipeline statistics.
     * @returns {Object}
     */
    getStats() {
        return {
            pipeline: {
                mode: this.options.mode,
                dryRun: this.options.dryRun,
                totalRuns: this.log.length,
                avgLatencyMs: this.log.length > 0
                    ? this.log.reduce((sum, e) => sum + (e.totalMs || 0), 0) / this.log.length
                    : 0
            },
            distiller: this.distiller.getStats(),
            edge: this.edge.getStats()
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DistillationPipeline };
} else if (typeof window !== 'undefined') {
    window.DistillationPipeline = DistillationPipeline;
}
