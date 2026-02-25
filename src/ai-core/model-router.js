/**
 * ModelRouter - Multi-Model API Orchestrator
 * 
 * Queries multiple frontier LLM APIs in parallel, normalizes their responses
 * into a common structured format ready for distillation into MOTL.
 * 
 * Pipeline position:  [User Query] → ModelRouter → [Normalized Responses] → Distiller
 * 
 * Supports:
 *   - Parallel fan-out to N providers
 *   - Provider-specific prompt formatting
 *   - Response normalization into { provider, content, reasoning, confidence, latency }
 *   - Configurable timeout, retry, and fallback
 *   - Dry-run / mock mode for offline prototyping
 */

// Import for Node.js environments
if (typeof require !== 'undefined') {
    // dotenv is optional — only used when real API keys are present
    try { require('dotenv').config(); } catch (_) {}
}

class ModelRouter {
    /**
     * @param {Object} options
     * @param {Array<Object>} options.providers - Array of provider configs
     * @param {number} options.timeoutMs - Per-request timeout (default 30 000)
     * @param {number} options.maxRetries - Retries per provider (default 1)
     * @param {string} options.strategy - 'all' | 'fastest' | 'consensus' (default 'all')
     * @param {boolean} options.dryRun - Return mock responses without hitting APIs
     */
    constructor(options = {}) {
        this.options = {
            timeoutMs: 30000,
            maxRetries: 1,
            strategy: 'all',
            dryRun: options.dryRun !== undefined ? options.dryRun : true,
            ...options
        };

        // Default provider registry — each entry describes how to call one model
        this.providers = this.options.providers || ModelRouter.DEFAULT_PROVIDERS;
    }

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Send a query to all configured providers and return normalized results.
     * @param {string} query - Natural-language question or reasoning prompt
     * @param {Object} context - Optional context object (prior distilled knowledge, etc.)
     * @returns {Promise<Object>} - { query, responses[], aggregated, meta }
     */
    async query(query, context = {}) {
        const startTime = Date.now();

        // Build provider-specific prompts
        const requests = this.providers.map(provider => ({
            provider,
            prompt: this._buildPrompt(query, context, provider)
        }));

        // Execute based on strategy
        let responses;
        switch (this.options.strategy) {
            case 'fastest':
                responses = [await this._queryFastest(requests)];
                break;
            case 'consensus':
            case 'all':
            default:
                responses = await this._queryAll(requests);
                break;
        }

        // Aggregate results
        const aggregated = this._aggregate(responses);

        return {
            query,
            responses,
            aggregated,
            meta: {
                strategy: this.options.strategy,
                providerCount: this.providers.length,
                responseCount: responses.length,
                totalLatencyMs: Date.now() - startTime,
                dryRun: this.options.dryRun
            }
        };
    }

    /**
     * Add a provider at runtime.
     * @param {Object} providerConfig
     */
    addProvider(providerConfig) {
        this.providers.push(providerConfig);
    }

    /**
     * Remove a provider by name.
     * @param {string} name
     */
    removeProvider(name) {
        this.providers = this.providers.filter(p => p.name !== name);
    }

    // ─── Internal: Prompt Building ────────────────────────────────────────

    /**
     * Format a prompt with optional provider-specific system instructions.
     * @private
     */
    _buildPrompt(query, context, provider) {
        const systemPrefix = provider.systemPrompt || 
            'You are a precise reasoning engine. Respond with structured JSON containing ' +
            '"reasoning" (step-by-step chain of thought), "answer" (concise conclusion), ' +
            'and "confidence" (0-1 float).';

        const contextBlock = Object.keys(context).length > 0
            ? `\n\nContext:\n${JSON.stringify(context, null, 2)}`
            : '';

        return {
            system: systemPrefix,
            user: `${query}${contextBlock}`
        };
    }

    // ─── Internal: Execution ──────────────────────────────────────────────

    /**
     * Fan-out to all providers in parallel.
     * @private
     */
    async _queryAll(requests) {
        const settled = await Promise.allSettled(
            requests.map(r => this._callProvider(r.provider, r.prompt))
        );

        return settled.map((result, i) => {
            if (result.status === 'fulfilled') return result.value;
            return this._errorResponse(requests[i].provider, result.reason);
        });
    }

    /**
     * Race all providers, return the first successful response.
     * @private
     */
    async _queryFastest(requests) {
        return Promise.any(
            requests.map(r => this._callProvider(r.provider, r.prompt))
        );
    }

    /**
     * Call a single provider (with retry). Returns normalized response.
     * @private
     */
    async _callProvider(provider, prompt, attempt = 0) {
        const start = Date.now();

        try {
            let raw;

            if (this.options.dryRun) {
                raw = this._mockResponse(provider, prompt);
            } else {
                raw = await this._httpCall(provider, prompt);
            }

            const latencyMs = Date.now() - start;
            return this._normalizeResponse(provider, raw, latencyMs);

        } catch (error) {
            if (attempt < this.options.maxRetries) {
                return this._callProvider(provider, prompt, attempt + 1);
            }
            return this._errorResponse(provider, error);
        }
    }

    /**
     * Actual HTTP call to a provider's API.
     * @private
     */
    async _httpCall(provider, prompt) {
        const apiKey = this._getApiKey(provider);
        if (!apiKey) {
            throw new Error(`No API key configured for ${provider.name}. ` +
                `Set ${provider.envKey} environment variable.`);
        }

        const body = provider.buildBody
            ? provider.buildBody(prompt, provider)
            : this._defaultBuildBody(prompt, provider);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

        try {
            const response = await fetch(provider.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...(provider.headers || {})
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`${provider.name} HTTP ${response.status}: ${text}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Default request body builder (OpenAI-compatible chat format).
     * @private
     */
    _defaultBuildBody(prompt, provider) {
        return {
            model: provider.model,
            messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user }
            ],
            temperature: provider.temperature || 0.3,
            max_tokens: provider.maxTokens || 2048
        };
    }

    /**
     * Retrieve API key from environment.
     * @private
     */
    _getApiKey(provider) {
        if (provider.apiKey) return provider.apiKey;
        if (typeof process !== 'undefined' && process.env) {
            return process.env[provider.envKey];
        }
        return null;
    }

    // ─── Internal: Response Normalization ──────────────────────────────────

    /**
     * Normalize a raw API response into the standard schema.
     * @private
     */
    _normalizeResponse(provider, raw, latencyMs) {
        const extractor = provider.extractResponse || this._defaultExtractResponse;
        const extracted = extractor(raw, provider);

        return {
            provider: provider.name,
            model: provider.model,
            content: extracted.content || '',
            reasoning: extracted.reasoning || '',
            answer: extracted.answer || extracted.content || '',
            confidence: this._parseConfidence(extracted.confidence),
            latencyMs,
            error: null,
            raw: raw
        };
    }

    /**
     * Default response extractor (OpenAI chat completion format).
     * @private
     */
    _defaultExtractResponse(raw, provider) {
        const message = raw?.choices?.[0]?.message?.content || '';

        // Try to parse as JSON for structured responses
        try {
            const parsed = JSON.parse(message);
            return {
                content: message,
                reasoning: parsed.reasoning || '',
                answer: parsed.answer || message,
                confidence: parsed.confidence
            };
        } catch (_) {
            return { content: message, answer: message };
        }
    }

    /**
     * Parse confidence to a 0-1 float.
     * @private
     */
    _parseConfidence(raw) {
        if (typeof raw === 'number') return Math.max(0, Math.min(1, raw));
        if (typeof raw === 'string') {
            const num = parseFloat(raw);
            if (!isNaN(num)) return Math.max(0, Math.min(1, num));
        }
        return 0.5; // default when not provided
    }

    /**
     * Create an error response object.
     * @private
     */
    _errorResponse(provider, error) {
        return {
            provider: provider.name,
            model: provider.model,
            content: '',
            reasoning: '',
            answer: '',
            confidence: 0,
            latencyMs: 0,
            error: error?.message || String(error),
            raw: null
        };
    }

    // ─── Internal: Mock / Dry-Run ─────────────────────────────────────────

    /**
     * Generate a realistic mock response for prototyping without API keys.
     * @private
     */
    _mockResponse(provider, prompt) {
        const query = prompt.user || '';
        
        // Simulate different reasoning styles per provider
        const mockStyles = {
            'openai': {
                reasoning: `Step 1: Analyze "${query.substring(0, 50)}..."\nStep 2: Consider implications\nStep 3: Synthesize answer`,
                answer: `Based on analysis, the key insight is that ${query.substring(0, 30)} requires structured decomposition.`,
                confidence: 0.85
            },
            'anthropic': {
                reasoning: `Let me think through this carefully.\n- First, "${query.substring(0, 40)}..." involves multiple concepts\n- The core relationship is hierarchical\n- Edge cases should be considered`,
                answer: `The structured response indicates that ${query.substring(0, 30)} can be decomposed into semantic primitives.`,
                confidence: 0.82
            },
            'google': {
                reasoning: `Analysis of query: "${query.substring(0, 50)}..."\nKey entities identified.\nRelationships mapped.\nConfidence assessment complete.`,
                answer: `Query analysis reveals ${query.substring(0, 30)} maps to fundamental concept patterns.`,
                confidence: 0.79
            }
        };

        const style = mockStyles[provider.name] || mockStyles['openai'];

        // Return in OpenAI-compatible format for uniform extraction
        return {
            choices: [{
                message: {
                    content: JSON.stringify(style)
                }
            }],
            usage: { prompt_tokens: query.length, completion_tokens: 150, total_tokens: query.length + 150 },
            _mock: true
        };
    }

    // ─── Internal: Aggregation ────────────────────────────────────────────

    /**
     * Aggregate multiple provider responses into a single distillation-ready structure.
     * @private
     */
    _aggregate(responses) {
        const successful = responses.filter(r => !r.error);
        if (successful.length === 0) {
            return { reasoning: [], answer: '', confidence: 0, consensus: false };
        }

        // Collect all reasoning chains
        const reasoningChains = successful.map(r => ({
            provider: r.provider,
            reasoning: r.reasoning,
            confidence: r.confidence
        }));

        // Weighted answer selection (highest confidence wins)
        const best = successful.reduce((a, b) => a.confidence >= b.confidence ? a : b);

        // Simple consensus check: do answers agree?
        const answers = successful.map(r => r.answer.toLowerCase().trim().substring(0, 100));
        const uniqueAnswers = new Set(answers);
        const consensus = uniqueAnswers.size === 1 || 
            (uniqueAnswers.size <= Math.ceil(successful.length / 2));

        // Average confidence
        const avgConfidence = successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length;

        return {
            reasoningChains,
            answer: best.answer,
            confidence: avgConfidence,
            bestProvider: best.provider,
            consensus,
            providerCount: successful.length
        };
    }
}

// ─── Default Provider Registry ────────────────────────────────────────────

ModelRouter.DEFAULT_PROVIDERS = [
    {
        name: 'openai',
        model: 'gpt-4o',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        envKey: 'OPENAI_API_KEY',
        temperature: 0.3,
        maxTokens: 2048
    },
    {
        name: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        endpoint: 'https://api.anthropic.com/v1/messages',
        envKey: 'ANTHROPIC_API_KEY',
        temperature: 0.3,
        maxTokens: 2048,
        headers: { 'anthropic-version': '2023-06-01' },
        buildBody: (prompt, provider) => ({
            model: provider.model,
            max_tokens: provider.maxTokens,
            system: prompt.system,
            messages: [{ role: 'user', content: prompt.user }]
        }),
        extractResponse: (raw) => {
            const text = raw?.content?.[0]?.text || '';
            try {
                const parsed = JSON.parse(text);
                return { content: text, reasoning: parsed.reasoning, answer: parsed.answer, confidence: parsed.confidence };
            } catch (_) {
                return { content: text, answer: text };
            }
        }
    },
    {
        name: 'google',
        model: 'gemini-2.0-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        envKey: 'GOOGLE_AI_KEY',
        temperature: 0.3,
        maxTokens: 2048,
        buildBody: (prompt, provider) => ({
            contents: [{ parts: [{ text: `${prompt.system}\n\n${prompt.user}` }] }],
            generationConfig: { temperature: provider.temperature, maxOutputTokens: provider.maxTokens }
        }),
        extractResponse: (raw) => {
            const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            try {
                const parsed = JSON.parse(text);
                return { content: text, reasoning: parsed.reasoning, answer: parsed.answer, confidence: parsed.confidence };
            } catch (_) {
                return { content: text, answer: text };
            }
        }
    }
];

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModelRouter };
} else if (typeof window !== 'undefined') {
    window.ModelRouter = ModelRouter;
}
