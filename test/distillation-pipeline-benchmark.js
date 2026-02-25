/**
 * Distillation Pipeline Benchmark
 * 
 * Measures throughput, compression ratios, and edge runtime performance
 * across the full ModelRouter → Distiller → EdgeRuntime pipeline.
 * 
 * Usage: node test/distillation-pipeline-benchmark.js
 */

const { DistillationPipeline } = require('../src/ai-core/pipeline');
const { ModelRouter } = require('../src/ai-core/model-router');
const { Distiller } = require('../src/ai-core/distiller');
const { EdgeRuntime } = require('../src/ai-core/edge-runtime');
const { SemanticCodec } = require('../src/ai-core/semantic-codec');

// ─── Test Queries ─────────────────────────────────────────────────────────

const BENCHMARK_QUERIES = [
    'What is the relationship between compression and entropy?',
    'How does braille compression relate to information theory?',
    'What are the key differences between Grade 1 and Grade 2 braille?',
    'How can semantic encoding improve machine-to-machine communication?',
    'What is the role of entropy in text compression?',
    'How does adaptive bit-depth encoding work?',
    'Explain the concept of variable-length codes in data compression.',
    'What makes Huffman coding efficient for text compression?',
    'How do neural autoencoders learn optimal representations?',
    'What is the Shannon limit for lossless compression?',
    'How does context-aware encoding differ from static encoding?',
    'Explain the trade-off between compression ratio and encoding speed.',
    'What role does reinforcement learning play in adaptive encoding?',
    'How can distilled reasoning be transferred to edge devices?',
    'What are the benefits of machine-native reasoning languages?'
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatBytes(bits) {
    const bytes = bits / 8;
    if (bytes < 1024) return `${bytes.toFixed(0)}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
}

function median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Benchmarks ───────────────────────────────────────────────────────────

async function benchmarkModelRouter() {
    console.log('\n═══ ModelRouter Benchmark ═══');
    const router = new ModelRouter({ dryRun: true, strategy: 'all' });
    
    const latencies = [];
    for (const query of BENCHMARK_QUERIES) {
        const start = Date.now();
        const result = await router.query(query);
        latencies.push(Date.now() - start);
    }
    
    console.log(`  Queries:         ${BENCHMARK_QUERIES.length}`);
    console.log(`  Providers/query: 3 (mock)`);
    console.log(`  Avg latency:     ${(latencies.reduce((a, b) => a + b) / latencies.length).toFixed(1)}ms`);
    console.log(`  Median latency:  ${median(latencies).toFixed(1)}ms`);
    console.log(`  Min/Max:         ${Math.min(...latencies)}ms / ${Math.max(...latencies)}ms`);
    
    return { latencies };
}

async function benchmarkDistiller() {
    console.log('\n═══ Distiller Benchmark ═══');
    const router = new ModelRouter({ dryRun: true });
    const distiller = new Distiller({ compressBBES: true });
    
    const metrics = [];
    for (const query of BENCHMARK_QUERIES) {
        const routerResult = await router.query(query);
        const start = Date.now();
        const distilled = distiller.distill(routerResult);
        const latency = Date.now() - start;
        
        metrics.push({
            query: query.substring(0, 50),
            latency,
            concepts: distilled.meta.conceptCount,
            mergedConcepts: distilled.meta.mergedConceptCount,
            motlBits: distilled.motlEncoded.size,
            bbesLength: distilled.compressed.bbes ? distilled.compressed.bbes.length : 0,
            compressionRatio: distilled.meta.compressionRatio
        });
    }
    
    const avgMotlBits = metrics.reduce((s, m) => s + m.motlBits, 0) / metrics.length;
    const avgConcepts = metrics.reduce((s, m) => s + m.mergedConcepts, 0) / metrics.length;
    const avgLatency = metrics.reduce((s, m) => s + m.latency, 0) / metrics.length;
    const avgBbes = metrics.reduce((s, m) => s + m.bbesLength, 0) / metrics.length;
    
    console.log(`  Queries:         ${BENCHMARK_QUERIES.length}`);
    console.log(`  Avg latency:     ${avgLatency.toFixed(1)}ms`);
    console.log(`  Avg MOTL size:   ${avgMotlBits.toFixed(0)} bits (${formatBytes(avgMotlBits)})`);
    console.log(`  Avg BBES size:   ${avgBbes.toFixed(0)} chars`);
    console.log(`  Avg concepts:    ${avgConcepts.toFixed(1)}`);
    console.log(`  Distillations:   ${distiller.getStats().distillations}`);
    
    return { metrics };
}

async function benchmarkEdgeRuntime() {
    console.log('\n═══ EdgeRuntime Benchmark ═══');
    const pipeline = new DistillationPipeline({ mode: 'full', dryRun: true });
    
    // Phase 1: Ingest all queries
    console.log('  Phase 1: Ingesting...');
    const ingestLatencies = [];
    for (const query of BENCHMARK_QUERIES) {
        const start = Date.now();
        await pipeline.run(query);
        ingestLatencies.push(Date.now() - start);
    }
    
    const edgeStats = pipeline.edge.getStats();
    console.log(`  Packets ingested: ${edgeStats.packetsIngested}`);
    console.log(`  Total concepts:   ${edgeStats.totalConcepts}`);
    console.log(`  Total relations:  ${edgeStats.totalRelations}`);
    console.log(`  Total conclusions: ${edgeStats.totalConclusions}`);
    console.log(`  Memory:           ${edgeStats.memoryEstimateKB}KB`);
    console.log(`  Avg ingest:       ${(ingestLatencies.reduce((a, b) => a + b) / ingestLatencies.length).toFixed(1)}ms`);
    
    // Phase 2: Cache hit queries
    console.log('  Phase 2: Cache lookups...');
    const cacheLatencies = [];
    let cacheHits = 0;
    for (const query of BENCHMARK_QUERIES) {
        const start = Date.now();
        const result = pipeline.queryEdge(query);
        cacheLatencies.push(Date.now() - start);
        if (result.source === 'cache') cacheHits++;
    }
    
    console.log(`  Cache hits:       ${cacheHits}/${BENCHMARK_QUERIES.length}`);
    console.log(`  Avg cache lookup: ${(cacheLatencies.reduce((a, b) => a + b) / cacheLatencies.length).toFixed(2)}ms`);
    
    // Phase 3: Export / import round-trip
    console.log('  Phase 3: Export/Import...');
    const exported = pipeline.exportKnowledge();
    const exportSize = JSON.stringify(exported).length;
    
    const edge2 = new EdgeRuntime();
    edge2.import(exported);
    const reimportHit = edge2.query(BENCHMARK_QUERIES[0]);
    
    console.log(`  Export size:      ${(exportSize / 1024).toFixed(1)}KB`);
    console.log(`  Reimport works:   ${reimportHit.source === 'cache' ? 'YES' : 'NO'}`);
    
    return { edgeStats, cacheHits, exportSize };
}

async function benchmarkFullPipeline() {
    console.log('\n═══ Full Pipeline Benchmark ═══');
    const pipeline = new DistillationPipeline({ mode: 'full', dryRun: true });
    
    const latencies = [];
    for (const query of BENCHMARK_QUERIES) {
        const start = Date.now();
        await pipeline.run(query);
        latencies.push(Date.now() - start);
    }
    
    const stats = pipeline.getStats();
    const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
    
    console.log(`  Total queries:    ${BENCHMARK_QUERIES.length}`);
    console.log(`  Avg e2e latency:  ${avgLatency.toFixed(1)}ms (dry-run)`);
    console.log(`  Throughput:       ${(1000 / avgLatency).toFixed(0)} queries/sec`);
    console.log(`  Edge memory:      ${stats.edge.memoryEstimateKB}KB`);
    console.log(`  Distillations:    ${stats.distiller.distillations}`);
    console.log(`  Avg compress:     ${stats.distiller.avgCompressionRatio.toFixed(4)}`);
    
    return { latencies, stats };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Distillation Pipeline Benchmark                ║');
    console.log('║  ModelRouter → Distiller → EdgeRuntime          ║');
    console.log('╚══════════════════════════════════════════════════╝');
    
    const results = {};
    
    results.router = await benchmarkModelRouter();
    results.distiller = await benchmarkDistiller();
    results.edge = await benchmarkEdgeRuntime();
    results.pipeline = await benchmarkFullPipeline();
    
    console.log('\n═══ Summary ═══');
    console.log('  All benchmarks completed successfully.');
    console.log('  Pipeline is operational in dry-run mode.');
    console.log('  To enable live API calls, set environment variables:');
    console.log('    OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_KEY');
    console.log('  Then instantiate with { dryRun: false }');
    console.log('\n  Architecture:');
    console.log('    SemanticCodec (base)');
    console.log('      ├── MOTLProtocol (thought encoding + RL)');
    console.log('      └── M2MCompression (wire compression)');
    console.log('    ModelRouter → Distiller → EdgeRuntime');
    console.log('    BBESCodec (binary packing layer)');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, BENCHMARK_QUERIES };
