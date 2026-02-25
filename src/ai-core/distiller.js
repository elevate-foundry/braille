/**
 * Distiller - Multi-Model Response → MOTL Thought Structure
 * 
 * Takes the aggregated responses from ModelRouter and distills them into
 * compact MOTL-encoded reasoning chains that can be compressed and shipped
 * to edge devices.
 * 
 * Pipeline position:  ModelRouter → Distiller → [MOTL packets] → EdgeRuntime
 * 
 * Stages:
 *   1. Parse reasoning chains from multiple providers
 *   2. Extract semantic concepts + relations (concept graph)
 *   3. Merge overlapping reasoning across providers (consensus distillation)
 *   4. Encode into MOTL thought structure
 *   5. Compress via M2MCompression / BBESCodec for wire transfer
 */

// Imports for Node.js
if (typeof require !== 'undefined') {
    var SemanticCodec = require('./semantic-codec').SemanticCodec;
    var MOTLProtocol = require('./motl-protocol').MOTLProtocol;
    var M2MCompression = require('./m2m-compression').M2MCompression;
    var BBESCodec = require('../braille-core/bbes-codec').BBESCodec;
}

class Distiller {
    /**
     * @param {Object} options
     * @param {number} options.mergeThreshold - Similarity threshold for merging concepts (0-1, default 0.7)
     * @param {boolean} options.compressBBES - Also pack final output through BBESCodec (default true)
     * @param {string} options.compressionTarget - 'size' | 'speed' | 'balanced' (default 'balanced')
     */
    constructor(options = {}) {
        this.options = {
            mergeThreshold: 0.7,
            compressBBES: true,
            compressionTarget: 'balanced',
            ...options
        };

        // MOTL encoder for thought-structure encoding
        this.motl = new MOTLProtocol({
            adaptiveEncoding: true,
            reinforcementLearning: true,
            optimizeFor: this.options.compressionTarget
        });

        // M2M compressor for semantic-level compression
        this.m2m = new M2MCompression({
            semanticCompression: true,
            dynamicEncoding: true
        });

        // Running stats
        this.stats = {
            distillations: 0,
            totalConceptsExtracted: 0,
            totalConceptsMerged: 0,
            avgCompressionRatio: 0
        };
    }

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Distill a ModelRouter result into a compressed MOTL packet.
     * @param {Object} routerResult - Output from ModelRouter.query()
     * @returns {Object} - { thought, motlEncoded, compressed, meta }
     */
    distill(routerResult) {
        const startTime = Date.now();

        // Stage 1: Extract reasoning steps from each provider
        const reasoningSteps = this._extractReasoningSteps(routerResult);

        // Stage 2: Build concept graph from all reasoning chains
        const conceptGraph = this._buildConceptGraph(reasoningSteps);

        // Stage 3: Merge overlapping concepts across providers
        const mergedGraph = this._mergeConceptGraph(conceptGraph);

        // Stage 4: Build MOTL thought structure
        const thought = this._buildThoughtStructure(mergedGraph, routerResult);

        // Stage 5: Encode with MOTL
        const motlEncoded = this.motl.encode(thought);

        // Stage 6: Compress with M2M
        const m2mResult = this.m2m.compress(thought);

        // Stage 7: Optional BBES binary packing
        let bbesPacket = null;
        if (this.options.compressBBES && typeof BBESCodec !== 'undefined') {
            bbesPacket = BBESCodec.createBBES(m2mResult.compressed);
        }

        // Update stats
        const latencyMs = Date.now() - startTime;
        this._updateStats(conceptGraph, mergedGraph, motlEncoded);

        return {
            thought,
            motlEncoded: {
                bitString: motlEncoded.encoded,
                size: motlEncoded.size,
                structure: motlEncoded.structure
            },
            compressed: {
                m2m: m2mResult.compressed,
                m2mMeta: m2mResult.metadata,
                bbes: bbesPacket
            },
            meta: {
                latencyMs,
                reasoningStepCount: reasoningSteps.length,
                conceptCount: conceptGraph.concepts.size,
                mergedConceptCount: mergedGraph.concepts.size,
                compressionRatio: m2mResult.metadata.compressionRatio,
                providers: routerResult.responses.map(r => r.provider)
            }
        };
    }

    /**
     * Distill and return only the compact packet (for wire transfer).
     * @param {Object} routerResult
     * @returns {Object} - Minimal { bbes, motlSize, confidence }
     */
    distillCompact(routerResult) {
        const full = this.distill(routerResult);
        return {
            bbes: full.compressed.bbes,
            m2m: full.compressed.m2m,
            motlSize: full.motlEncoded.size,
            confidence: routerResult.aggregated.confidence,
            answer: routerResult.aggregated.answer
        };
    }

    /**
     * Get distillation statistics.
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats, motlStats: this.motl.getStats(), m2mStats: this.m2m.getStats() };
    }

    // ─── Stage 1: Extract Reasoning Steps ─────────────────────────────────

    /**
     * Parse reasoning chains from router responses into discrete steps.
     * @private
     */
    _extractReasoningSteps(routerResult) {
        const steps = [];

        for (const response of routerResult.responses) {
            if (response.error) continue;

            const rawReasoning = response.reasoning || response.content || '';
            const providerSteps = this._parseReasoningText(rawReasoning, response.provider);

            steps.push({
                provider: response.provider,
                confidence: response.confidence,
                steps: providerSteps,
                answer: response.answer
            });
        }

        return steps;
    }

    /**
     * Split raw reasoning text into individual logical steps.
     * @private
     */
    _parseReasoningText(text, provider) {
        if (!text) return [];

        // Split on common reasoning delimiters
        const lines = text.split(/\n|(?:Step \d+:)|(?:- )/g)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return lines.map((line, i) => ({
            index: i,
            provider,
            text: line,
            concepts: this._extractConceptsFromText(line),
            type: this._classifyStepType(line)
        }));
    }

    /**
     * Extract semantic concepts from a reasoning step.
     * @private
     */
    _extractConceptsFromText(text) {
        const concepts = new Set();
        const lower = text.toLowerCase();

        // Extract quoted terms as explicit concepts
        const quoted = text.match(/"([^"]+)"/g) || [];
        quoted.forEach(q => concepts.add(q.replace(/"/g, '')));

        // Match known fundamental concept patterns
        const conceptPatterns = {
            'ENTITY': /\b(entity|object|item|instance|thing|element)\b/i,
            'ACTION': /\b(action|do|perform|execute|run|process|compute)\b/i,
            'PROPERTY': /\b(property|attribute|field|characteristic|feature)\b/i,
            'STATE': /\b(state|status|condition|phase|mode)\b/i,
            'RELATION': /\b(relation|relationship|connection|link|association)\b/i,
            'CAUSE': /\b(cause|because|since|due to|reason)\b/i,
            'EFFECT': /\b(effect|result|outcome|consequence|impact)\b/i,
            'QUANTITY': /\b(quantity|count|number|amount|total|sum)\b/i,
            'QUALITY': /\b(quality|good|bad|better|worse|optimal)\b/i,
            'CONTAINS': /\b(contains|includes|has|comprises|consists)\b/i,
            'EQUALS': /\b(equals|is|same as|identical|equivalent)\b/i
        };

        for (const [concept, pattern] of Object.entries(conceptPatterns)) {
            if (pattern.test(lower)) concepts.add(concept);
        }

        // Extract key noun-like tokens (simple heuristic: capitalized words, long words)
        const tokens = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
        tokens.forEach(t => concepts.add(t.toLowerCase()));

        return Array.from(concepts);
    }

    /**
     * Classify the type of a reasoning step.
     * @private
     */
    _classifyStepType(text) {
        const lower = text.toLowerCase();
        if (/\b(analyze|examine|consider|look at)\b/.test(lower)) return 'ANALYSIS';
        if (/\b(therefore|thus|conclude|result)\b/.test(lower)) return 'CONCLUSION';
        if (/\b(assume|if|suppose|given)\b/.test(lower)) return 'ASSUMPTION';
        if (/\b(compare|versus|contrast|differ)\b/.test(lower)) return 'COMPARISON';
        if (/\b(synthesize|combine|merge|integrate)\b/.test(lower)) return 'SYNTHESIS';
        return 'REASONING';
    }

    // ─── Stage 2: Build Concept Graph ─────────────────────────────────────

    /**
     * Build a concept graph from all reasoning steps across providers.
     * @private
     */
    _buildConceptGraph(reasoningSteps) {
        const concepts = new Map();  // concept → { frequency, providers, types }
        const relations = [];

        for (const providerChain of reasoningSteps) {
            let prevConcepts = [];

            for (const step of providerChain.steps) {
                for (const concept of step.concepts) {
                    const existing = concepts.get(concept) || {
                        frequency: 0,
                        providers: new Set(),
                        types: new Set(),
                        confidence: 0
                    };
                    existing.frequency += 1;
                    existing.providers.add(providerChain.provider);
                    existing.types.add(step.type);
                    existing.confidence = Math.max(existing.confidence, providerChain.confidence);
                    concepts.set(concept, existing);

                    // Create relations between consecutive step concepts
                    for (const prev of prevConcepts) {
                        if (prev !== concept) {
                            relations.push({
                                source: prev,
                                target: concept,
                                type: 'FOLLOWS',
                                provider: providerChain.provider
                            });
                        }
                    }
                }
                prevConcepts = step.concepts;
            }
        }

        return { concepts, relations };
    }

    // ─── Stage 3: Merge Concept Graph ─────────────────────────────────────

    /**
     * Merge overlapping concepts and relations across providers.
     * Concepts mentioned by multiple providers get boosted confidence.
     * @private
     */
    _mergeConceptGraph(graph) {
        const merged = new Map();
        const mergedRelations = [];

        // Boost concepts that appear across multiple providers
        for (const [concept, info] of graph.concepts) {
            const providerCount = info.providers.size;
            const boostedConfidence = Math.min(1, info.confidence * (1 + (providerCount - 1) * 0.15));

            merged.set(concept, {
                frequency: info.frequency,
                providerCount,
                confidence: boostedConfidence,
                types: Array.from(info.types)
            });
        }

        // Deduplicate relations
        const relationKeys = new Set();
        for (const rel of graph.relations) {
            const key = `${rel.source}→${rel.type}→${rel.target}`;
            if (!relationKeys.has(key)) {
                relationKeys.add(key);
                mergedRelations.push(rel);
            }
        }

        return { concepts: merged, relations: mergedRelations };
    }

    // ─── Stage 4: Build MOTL Thought Structure ────────────────────────────

    /**
     * Convert the merged concept graph + aggregated answer into a
     * MOTL-compatible thought structure.
     * @private
     */
    _buildThoughtStructure(mergedGraph, routerResult) {
        // Sort concepts by confidence × frequency for priority encoding
        const sortedConcepts = Array.from(mergedGraph.concepts.entries())
            .sort((a, b) => (b[1].confidence * b[1].frequency) - (a[1].confidence * a[1].frequency));

        // Build the thought object
        return {
            type: 'DISTILLED_REASONING',
            query: routerResult.query,
            concepts: sortedConcepts.map(([name, info]) => ({
                name,
                confidence: info.confidence,
                frequency: info.frequency,
                providerCount: info.providerCount,
                types: info.types
            })),
            relations: mergedGraph.relations.map(r => ({
                source: r.source,
                target: r.target,
                type: r.type
            })),
            conclusion: {
                answer: routerResult.aggregated.answer,
                confidence: routerResult.aggregated.confidence,
                consensus: routerResult.aggregated.consensus,
                bestProvider: routerResult.aggregated.bestProvider
            },
            meta: {
                providerCount: routerResult.meta.providerCount,
                timestamp: Date.now()
            }
        };
    }

    // ─── Stats ────────────────────────────────────────────────────────────

    /**
     * @private
     */
    _updateStats(rawGraph, mergedGraph, motlEncoded) {
        this.stats.distillations += 1;
        this.stats.totalConceptsExtracted += rawGraph.concepts.size;
        this.stats.totalConceptsMerged += mergedGraph.concepts.size;

        const ratio = motlEncoded.metrics?.compressionRatio || 1;
        this.stats.avgCompressionRatio =
            (this.stats.avgCompressionRatio * (this.stats.distillations - 1) + ratio) /
            this.stats.distillations;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Distiller };
} else if (typeof window !== 'undefined') {
    window.Distiller = Distiller;
}
