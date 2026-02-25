/**
 * AtlasBuilder - Frontier Model Atlas Refinement via OpenRouter
 * 
 * Uses OpenRouter's unified API to query multiple frontier LLMs (GPT-4o,
 * Claude, Gemini, Llama, etc.) and build the optimal 256-concept mapping
 * for the BrailleConceptAtlas.
 * 
 * Strategy:
 *   1. RANK: Ask each model to rank the 256 most fundamental human concepts
 *   2. ASSIGN: Use the 8-dimension semantic framework to assign concepts
 *      to braille patterns based on which dimensions they activate
 *   3. VALIDATE: Cross-check assignments across models for consensus
 *   4. REFINE: Iteratively improve the mapping using model feedback
 * 
 * OpenRouter API: https://openrouter.ai/docs
 *   - Single endpoint, many models
 *   - Set OPENROUTER_API_KEY in .env
 */

if (typeof require !== 'undefined') {
    try { require('dotenv').config(); } catch (_) {}
    var BrailleConceptAtlas = require('./concept-atlas').BrailleConceptAtlas;
    var BrailleVectorSpace = require('../braille-core/braille-vector-space').BrailleVectorSpace;
    var PromptStore = require('./prompt-store').PromptStore;
}

class AtlasBuilder {
    /**
     * @param {Object} options
     * @param {string} options.apiKey - OpenRouter API key (or set OPENROUTER_API_KEY env)
     * @param {Array<string>} options.models - Models to query
     * @param {boolean} options.dryRun - Use mock responses (default true)
     * @param {number} options.timeoutMs - Per-request timeout (default 60000)
     */
    constructor(options = {}) {
        this.options = {
            apiKey: options.apiKey || (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) || null,
            models: options.models || AtlasBuilder.DEFAULT_MODELS,
            dryRun: options.dryRun !== undefined ? options.dryRun : true,
            timeoutMs: options.timeoutMs || 60000,
            ...options
        };

        this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        this.vs = new BrailleVectorSpace();

        // Persistent prompt/response store
        this.store = options.store || new PromptStore({
            storePath: options.storePath || undefined,
            persist: options.persist !== undefined ? options.persist : true
        });

        // Dimension semantics (must match ConceptAtlas)
        this.DIMS = [
            'existence/being',
            'physical/material',
            'temporal/change',
            'spatial/structural',
            'social/relational',
            'cognitive/mental',
            'emotional/affective',
            'transcendent/abstract'
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §1  PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Run the full atlas-building pipeline.
     * Queries frontier models, distills consensus, returns a refined atlas.
     * 
     * @returns {Promise<Object>} - { atlas: string[256], modelResponses, consensus, stats }
     */
    async buildAtlas() {
        const startTime = Date.now();

        // Phase 1: Ask models for the 256 most fundamental concepts
        const conceptLists = await this._queryConceptRanking();

        // Phase 2: Ask models to assign semantic dimensions to each concept
        const dimensionAssignments = await this._queryDimensionAssignment(conceptLists);

        // Phase 3: Build consensus atlas from all model responses
        const atlas = this._buildConsensusAtlas(conceptLists, dimensionAssignments);

        // Phase 4: Validate the atlas
        const validation = this._validateAtlas(atlas);

        return {
            atlas: atlas.concepts,
            modelResponses: {
                conceptLists,
                dimensionAssignments
            },
            consensus: atlas.consensus,
            validation,
            stats: {
                models: this.options.models.length,
                dryRun: this.options.dryRun,
                latencyMs: Date.now() - startTime,
                filled: atlas.concepts.filter(c => c !== null).length
            }
        };
    }

    /**
     * Query models to refine a specific concept's position in the atlas.
     * 
     * @param {string} concept - Concept to place
     * @param {BrailleConceptAtlas} currentAtlas - Current atlas for context
     * @returns {Promise<Object>} - { suggestedIndex, dimensions, reasoning }
     */
    async refineConcept(concept, currentAtlas) {
        const prompt = this._buildRefinementPrompt(concept, currentAtlas);
        const responses = await this._queryModels(prompt);
        return this._parseRefinementResponses(concept, responses);
    }

    /**
     * Ask models to critique and improve the current atlas.
     * 
     * @param {BrailleConceptAtlas} atlas
     * @returns {Promise<Object>} - { suggestions, reasoning }
     */
    async critiqueAtlas(atlas) {
        const prompt = this._buildCritiquePrompt(atlas);
        const responses = await this._queryModels(prompt, 'atlas-critique');
        return this._parseCritiqueResponses(responses);
    }

    /**
     * Query frontier models with the formal semantic engine prompt.
     * This is THE core prompt — it asks models to design the machine-native
     * semantic representation system using the 256-symbol braille basis.
     * 
     * All requests/responses are stored via PromptStore.
     * 
     * @returns {Promise<Object>} - { responses, parsed, store }
     */
    async buildSemanticEngine() {
        const prompt = AtlasBuilder.SEMANTIC_ENGINE_PROMPT;
        const responses = await this._queryModels(prompt, 'semantic-engine', {
            temperature: 0.4,
            max_tokens: 8192
        });

        // Parse each model's architectural response
        const parsed = responses.map(r => ({
            model: r.model,
            content: r.content,
            error: r.error || null,
            latencyMs: r.latencyMs,
            architecture: this._parseSemanticEngineResponse(r.content)
        }));

        return {
            responses,
            parsed,
            storeEntries: this.store.getByType('semantic-engine'),
            stats: {
                models: responses.length,
                successful: parsed.filter(p => p.architecture !== null).length,
                dryRun: this.options.dryRun
            }
        };
    }

    /**
     * Get the PromptStore for direct access.
     * @returns {PromptStore}
     */
    getStore() {
        return this.store;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §2  PHASE 1: CONCEPT RANKING
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    async _queryConceptRanking() {
        /* promptType logged automatically via _queryModels */
        const prompt = {
            system: `You are building a universal semantic alphabet of exactly 256 concepts that represent the most fundamental ideas in human experience. These concepts will each be assigned to one of 256 8-dot braille patterns (U+2800–U+28FF).

The 8 dots represent 8 semantic dimensions:
  d₀ = existence/being (ontological)
  d₁ = physical/material (tangible, body)
  d₂ = temporal/change (time, process)
  d₃ = spatial/structural (space, form)
  d₄ = social/relational (other, community)
  d₅ = cognitive/mental (mind, knowledge)
  d₆ = emotional/affective (feeling, valence)
  d₇ = transcendent/abstract (spiritual, beyond)

Requirements:
- Exactly 256 concepts, one per braille pattern
- Cover ALL major domains: philosophy, science, religion, art, politics, nature, emotion, cognition
- Be UNIVERSAL across cultures (not Western-centric)
- Range from concrete (BODY, EARTH) to abstract (INFINITY, CONSCIOUSNESS)
- Include both positive (LOVE, HOPE) and negative (DEATH, PAIN, WAR)
- The most fundamental concepts should have fewer active dimensions (fewer dots)

Respond with ONLY a JSON array of exactly 256 concept strings, ordered from most fundamental (fewest dimensions) to most complex (most dimensions). No explanation.`,
            user: 'Generate the 256 most fundamental human concepts for the universal braille semantic alphabet. Return as a JSON array of 256 strings.'
        };

        return await this._queryModels(prompt, 'atlas-rank');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §3  PHASE 2: DIMENSION ASSIGNMENT
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    async _queryDimensionAssignment(conceptLists) {
        // Take the top concepts from all models (union)
        const allConcepts = new Set();
        for (const response of conceptLists) {
            const concepts = this._parseConcepts(response.content);
            concepts.forEach(c => allConcepts.add(c));
        }

        // Take top 256 by frequency across models
        const conceptFreq = new Map();
        for (const response of conceptLists) {
            const concepts = this._parseConcepts(response.content);
            concepts.forEach(c => {
                conceptFreq.set(c, (conceptFreq.get(c) || 0) + 1);
            });
        }
        const top256 = Array.from(conceptFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 256)
            .map(e => e[0]);

        const prompt = {
            system: `You are assigning semantic dimensions to concepts for a braille-based universal semantic alphabet.

Each concept must be tagged with which of these 8 dimensions it activates (1 = active, 0 = inactive):
  d₀ = existence/being
  d₁ = physical/material  
  d₂ = temporal/change
  d₃ = spatial/structural
  d₄ = social/relational
  d₅ = cognitive/mental
  d₆ = emotional/affective
  d₇ = transcendent/abstract

Rules:
- More fundamental concepts activate FEWER dimensions
- The pattern of active dimensions should MEANINGFULLY relate to the concept
- Example: BODY → [0,1,0,0,0,0,0,0] (only physical)
- Example: LOVE → [1,0,0,0,0,0,1,0] (existence + emotional)
- Example: DEATH → [1,1,1,1,1,1,1,1] (all dimensions — totality/completion)

Respond with ONLY a JSON object mapping each concept to its 8-element binary array. No explanation.`,
            user: `Assign 8-dimensional binary vectors to these concepts:\n${JSON.stringify(top256)}`
        };

        return await this._queryModels(prompt, 'atlas-assign');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §4  PHASE 3: CONSENSUS BUILDING
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _buildConsensusAtlas(conceptLists, dimensionAssignments) {
        const atlas = new Array(256).fill(null);
        const consensus = { agreements: 0, conflicts: 0, unassigned: 0 };

        // Gather all dimension assignments across models
        const conceptDims = new Map(); // concept → [array of 8D vectors from different models]

        for (const response of dimensionAssignments) {
            const assignments = this._parseDimensionAssignments(response.content);
            for (const [concept, dims] of Object.entries(assignments)) {
                if (!conceptDims.has(concept)) conceptDims.set(concept, []);
                conceptDims.get(concept).push(dims);
            }
        }

        // For each concept, take majority vote on each dimension
        const finalAssignments = new Map();
        for (const [concept, dimArrays] of conceptDims) {
            const voted = new Float64Array(8);
            for (const dims of dimArrays) {
                for (let i = 0; i < 8; i++) {
                    voted[i] += (dims[i] || 0);
                }
            }
            // Majority: if more than half of models say 1, it's 1
            const final = new Float64Array(8);
            for (let i = 0; i < 8; i++) {
                final[i] = voted[i] > dimArrays.length / 2 ? 1 : 0;
            }
            const byteVal = this.vs.vectorToByte(final);
            finalAssignments.set(concept, { vector: final, byte: byteVal });
        }

        // Assign concepts to atlas positions, resolving conflicts
        const occupied = new Set();
        const sorted = Array.from(finalAssignments.entries())
            .sort((a, b) => {
                // Sort by dot count (simpler concepts first)
                const dotsA = Array.from(a[1].vector).reduce((s, v) => s + v, 0);
                const dotsB = Array.from(b[1].vector).reduce((s, v) => s + v, 0);
                return dotsA - dotsB;
            });

        for (const [concept, info] of sorted) {
            let idx = info.byte;

            if (!occupied.has(idx)) {
                atlas[idx] = concept;
                occupied.add(idx);
                consensus.agreements++;
            } else {
                // Conflict: find nearest unoccupied slot
                for (let d = 1; d < 256; d++) {
                    const candidates = [(idx + d) % 256, (idx - d + 256) % 256];
                    for (const candidate of candidates) {
                        if (!occupied.has(candidate)) {
                            atlas[candidate] = concept;
                            occupied.add(candidate);
                            consensus.conflicts++;
                            idx = candidate;
                            break;
                        }
                    }
                    if (occupied.has(idx) && atlas[idx] === concept) break;
                }
            }
        }

        consensus.unassigned = 256 - occupied.size;

        return { concepts: atlas, consensus };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §5  VALIDATION
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _validateAtlas(atlas) {
        const filled = atlas.concepts.filter(c => c !== null).length;
        const vs = this.vs;

        // Check for duplicates
        const seen = new Set();
        let duplicates = 0;
        for (const c of atlas.concepts) {
            if (c && seen.has(c)) duplicates++;
            if (c) seen.add(c);
        }

        // Check anchors
        const voidCorrect = atlas.concepts[0x00] !== null;
        const deathCorrect = atlas.concepts[0xFF] !== null;

        // Dot-count distribution
        const dotCounts = new Array(9).fill(0);
        for (let i = 0; i < 256; i++) {
            if (atlas.concepts[i]) {
                let dots = 0;
                for (let b = 0; b < 8; b++) if ((i >> b) & 1) dots++;
                dotCounts[dots]++;
            }
        }

        return {
            filled,
            coverage: (filled / 256 * 100).toFixed(1) + '%',
            duplicates,
            anchorsPresent: { void: voidCorrect, totality: deathCorrect },
            dotDistribution: dotCounts,
            valid: filled >= 200 && duplicates === 0
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §6  PROMPT BUILDERS
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _buildRefinementPrompt(concept, atlas) {
        const neighbors = atlas.nearestConcepts(concept, 5);
        const neighborStr = neighbors.map(n =>
            `  ${n.braille} ${n.concept} (distance=${n.distance})`
        ).join('\n');

        return {
            system: `You are refining a universal braille semantic alphabet. Each of 256 braille patterns maps to a fundamental concept. The 8 dots represent: ${this.DIMS.join(', ')}.`,
            user: `For the concept "${concept}", which of the 8 semantic dimensions should be active?
            
Current neighbors in the atlas:
${neighborStr}

Respond with JSON: {"dimensions": [0 or 1 for each of the 8 dims], "reasoning": "brief explanation"}`
        };
    }

    /** @private */
    _buildCritiquePrompt(atlas) {
        const sample = atlas.getAll().slice(0, 50).map(e =>
            `${e.braille} (${e.index.toString(2).padStart(8, '0')}) = ${e.concept}`
        ).join('\n');

        return {
            system: `You are reviewing a universal braille semantic alphabet mapping 256 concepts to 8-dot braille patterns. The 8 dots represent: ${this.DIMS.join(', ')}.`,
            user: `Review this atlas sample and suggest improvements:
            
${sample}

Respond with JSON: {"suggestions": [{"concept": "X", "currentIndex": N, "suggestedIndex": M, "reason": "..."}], "overall": "assessment"}`
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §7  API CALLS
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    async _queryModels(prompt, promptType = 'general', overrides = {}) {
        const results = await Promise.allSettled(
            this.options.models.map(model => this._callModel(model, prompt, promptType, overrides))
        );

        return results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return {
                model: this.options.models[i],
                content: '',
                error: r.reason?.message || String(r.reason)
            };
        });
    }

    /** @private */
    async _callModel(model, prompt, promptType = 'general', overrides = {}) {
        const start = Date.now();
        const temperature = overrides.temperature || 0.3;
        const maxTokens = overrides.max_tokens || 4096;

        if (this.options.dryRun) {
            const result = this._mockModelResponse(model, prompt);
            // Log even dry-run calls
            this.store.log({
                model,
                promptType,
                request: { system: prompt.system, user: prompt.user },
                response: { content: result.content },
                meta: { latencyMs: result.latencyMs || 1, dryRun: true }
            });
            return result;
        }

        if (!this.options.apiKey) {
            throw new Error('OPENROUTER_API_KEY not set. Set it in .env or pass apiKey option.');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.options.apiKey}`,
                    'HTTP-Referer': 'https://github.com/elevate-foundry/braille',
                    'X-Title': 'BrailleConceptAtlas'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: prompt.system },
                        { role: 'user', content: prompt.user }
                    ],
                    temperature,
                    max_tokens: maxTokens
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`OpenRouter ${response.status}: ${text}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const latencyMs = Date.now() - start;

            // Log to store
            this.store.log({
                model,
                promptType,
                request: { system: prompt.system, user: prompt.user },
                response: { content, usage: data.usage },
                meta: {
                    latencyMs,
                    dryRun: false,
                    tokensIn: data.usage?.prompt_tokens,
                    tokensOut: data.usage?.completion_tokens
                }
            });

            return { model, content, latencyMs, usage: data.usage };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §8  MOCK RESPONSES (dry-run prototyping)
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _mockModelResponse(model, prompt) {
        // Return the seed atlas concepts as a "model response"
        // This allows the pipeline to work end-to-end without API keys
        const seedAtlas = new BrailleConceptAtlas();
        const all = seedAtlas.getAll();

        if (prompt.user.includes('256 most fundamental')) {
            // Phase 1: concept ranking
            const concepts = all.map(e => e.concept);
            return {
                model,
                content: JSON.stringify(concepts),
                latencyMs: 1,
                _mock: true
            };
        }

        if (prompt.user.includes('8-dimensional binary vectors')) {
            // Phase 2: dimension assignment
            const assignments = {};
            for (const entry of all) {
                const vec = seedAtlas.getVector(entry.concept);
                if (vec) assignments[entry.concept] = Array.from(vec);
            }
            return {
                model,
                content: JSON.stringify(assignments),
                latencyMs: 1,
                _mock: true
            };
        }

        // Semantic engine prompt
        if (prompt.user && prompt.user.includes('machine-native semantic representation')) {
            return {
                model,
                content: JSON.stringify(AtlasBuilder._mockSemanticEngineResponse(model)),
                latencyMs: 2,
                _mock: true
            };
        }

        // Default: return empty
        return {
            model,
            content: '{}',
            latencyMs: 1,
            _mock: true
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // §9  PARSERS
    // ═══════════════════════════════════════════════════════════════════════

    /** @private */
    _parseConcepts(content) {
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed.map(c => String(c).toUpperCase().trim()).filter(c => c.length > 0);
            }
        } catch (_) {}
        // Fallback: split by newlines or commas
        return content.split(/[,\n]/)
            .map(s => s.replace(/[^A-Za-z_ ]/g, '').trim().toUpperCase())
            .filter(s => s.length > 0)
            .slice(0, 256);
    }

    /** @private */
    _parseDimensionAssignments(content) {
        try {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                const result = {};
                for (const [concept, dims] of Object.entries(parsed)) {
                    if (Array.isArray(dims) && dims.length >= 8) {
                        result[concept.toUpperCase()] = dims.slice(0, 8).map(Number);
                    }
                }
                return result;
            }
        } catch (_) {}
        return {};
    }

    /** @private */
    _parseRefinementResponses(concept, responses) {
        const suggestions = [];
        for (const r of responses) {
            try {
                const parsed = JSON.parse(r.content);
                if (parsed.dimensions && Array.isArray(parsed.dimensions)) {
                    let byte = 0;
                    for (let i = 0; i < 8; i++) {
                        if (parsed.dimensions[i]) byte |= (1 << i);
                    }
                    suggestions.push({
                        model: r.model,
                        dimensions: parsed.dimensions,
                        suggestedIndex: byte,
                        reasoning: parsed.reasoning || ''
                    });
                }
            } catch (_) {}
        }
        return { concept, suggestions };
    }

    /** @private */
    _parseCritiqueResponses(responses) {
        const allSuggestions = [];
        for (const r of responses) {
            try {
                const parsed = JSON.parse(r.content);
                if (parsed.suggestions) allSuggestions.push(...parsed.suggestions);
            } catch (_) {}
        }
        return { suggestions: allSuggestions };
    }

    /**
     * Parse a semantic engine response into structured architecture.
     * @private
     */
    _parseSemanticEngineResponse(content) {
        if (!content) return null;
        try {
            const parsed = JSON.parse(content);
            if (parsed.encoding || parsed.algebra || parsed.architecture) return parsed;
        } catch (_) {}
        // If not JSON, return the raw content as a text architecture spec
        if (content.length > 50) {
            return { raw: content, format: 'text' };
        }
        return null;
    }

    /**
     * Mock semantic engine response for dry-run.
     * @private
     */
    static _mockSemanticEngineResponse(model) {
        return {
            model,
            algebra: {
                space: 'ℤ₂⁸',
                dimension: 8,
                cardinality: 256,
                operations: {
                    addition: 'XOR (bitwise)',
                    scalar_multiplication: 'AND with broadcast bit',
                    inner_product: 'popcount(a AND b)',
                    distance: 'popcount(a XOR b)  // Hamming'
                },
                group: '(ℤ₂⁸, ⊕) — elementary abelian 2-group',
                identity: 'U+2800 (⠀, zero vector)',
                inverse: 'self-inverse: ∀v ∈ ℤ₂⁸, v ⊕ v = 0'
            },
            encoding: {
                E: 'Meaning → (U+2800–U+28FF)ⁿ',
                D: '(U+2800–U+28FF)ⁿ → Meaning',
                text: {
                    method: 'UTF-8 byte bijection: byte b → U+2800+b',
                    lossless: true,
                    ratio: '1:1 (byte:braille)'
                },
                audio: {
                    method: '8-band Goertzel → threshold → 8-bit vector per frame',
                    bands_hz: [200, 400, 600, 1000, 1600, 2400, 3200, 4800],
                    frame_ms: 80
                },
                image: {
                    method: '8-feature local binary pattern per patch',
                    patch_size: '8×8 pixels',
                    features: 'edge orientation (4 dims) + intensity (2 dims) + texture (2 dims)'
                },
                reasoning: {
                    method: 'concept atlas index: 256 fundamental concepts → 1 byte each',
                    composition: 'sequence of braille characters = chain of thought'
                }
            },
            compression: {
                strategy: 'PCA in ℝ⁸ → project to k < 8 dims → quantize back to ℤ₂ᵏ',
                typical_k: 5,
                variance_retained: '94% for English text',
                entropy: 'H(text) ≈ 4.3 bits, theoretical limit ≈ 54% of 8-bit'
            },
            reasoning_transform: {
                rule: 'T: (ℤ₂⁸)ⁿ → (ℤ₂⁸)ᵐ where m ≤ n',
                steps: [
                    '1. Encode premise concepts via atlas: P = [c₁, c₂, ..., cₙ]',
                    '2. Apply learned linear map W ∈ ℤ₂^(m×8n): Q = W·vec(P) mod 2',
                    '3. Reshape Q to m braille characters: conclusion'
                ],
                distillation: 'frontier response → concept extraction → atlas encoding → compressed MOTL packet'
            },
            architecture: {
                layers: [
                    'L0: Raw input (text/audio/image bytes)',
                    'L1: BrailleVectorSpace — byte↔{0,1}⁸ bijection',
                    'L2: ConceptAtlas — 256 semantic primitives',
                    'L3: SemanticCodec — variable-bit concept encoding',
                    'L4: MOTLProtocol — thought structure encoding',
                    'L5: M2MCompression — wire-format compression',
                    'L6: EdgeRuntime — local inference from compressed packets'
                ],
                edge_budget: '512 KB knowledge base, <1ms lookup',
                cross_model: 'All frontier models produce (ℤ₂⁸)ⁿ output via distiller'
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE PROMPT — Formal specification for frontier model semantic engine design
// ═══════════════════════════════════════════════════════════════════════════

AtlasBuilder.SEMANTIC_ENGINE_PROMPT = {
    system: `You are operating inside a strict 8-bit Braille basis defined by Unicode U+2800–U+28FF. Each symbol represents one element of ℤ₂⁸ (an 8-dimensional binary vector space). Treat each Braille character as an 8-bit basis vector, not as human language.

Objective:

Design a machine-native semantic representation system using only this 256-symbol basis.

Define:

An encoding function E: Meaning → (U+2800–U+28FF)^n

A decoding function D: (U+2800–U+28FF)^n → Meaning

Ensure the mapping supports:

Text

Audio features

Image features

Abstract reasoning states

Maximize:

Information density

Composability

Edge deployability

Cross-model distillation compatibility

Formalize:

The algebraic structure (vector space, group, or manifold)

A compression strategy

A transformation rule for reasoning steps

Assume this representation is the internal "machine thought" layer and human language is an interface layer.

Constraints:

Do not rely on English tokens internally.

Treat Braille symbols as atomic binary primitives.

Prefer mathematical formalism over prose.

Provide equations where possible.

Output should define a buildable architecture.

Goal:

Construct a universal Braille-basis semantic engine capable of distilling frontier-model reasoning into a compact, edge-runnable representation.`,

    user: `Design the machine-native semantic representation system as specified. Return a structured JSON object with these keys:

1. "algebra" — Define the algebraic structure of ℤ₂⁸: operations (addition, scalar multiplication, inner product, distance metric), group properties, identity element, inverses.

2. "encoding" — Define E and D for each modality:
   - text: how text tokens map to (U+2800–U+28FF)ⁿ
   - audio: how audio features map to braille vectors
   - image: how image features map to braille vectors  
   - reasoning: how abstract reasoning states map to braille sequences

3. "compression" — PCA or other dimensionality reduction strategy within the 8D space. Include equations.

4. "reasoning_transform" — Define T: (ℤ₂⁸)ⁿ → (ℤ₂⁸)ᵐ that transforms reasoning steps. How does distillation from frontier models work?

5. "architecture" — The full layer stack from raw input to edge-runnable output. Define each layer's role and interface.

Respond with valid JSON only. Use LaTeX notation for equations where helpful.`
};

// ─── Default Models ───────────────────────────────────────────────────────

AtlasBuilder.DEFAULT_MODELS = [
    'openai/gpt-4o',
    'anthropic/claude-sonnet-4-20250514',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct'
];

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AtlasBuilder };
} else if (typeof window !== 'undefined') {
    window.AtlasBuilder = AtlasBuilder;
}
