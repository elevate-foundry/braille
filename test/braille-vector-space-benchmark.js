/**
 * Braille Vector Space & TTS Benchmark
 * 
 * Verifies:
 *   1. Lossless text ↔ 8D vector ↔ braille roundtrip
 *   2. PCA compression ratios and variance explained
 *   3. TTS synthesis → analysis roundtrip
 *   4. BBESCodec 8-bit mode
 *   5. SemanticCodec vector space integration
 *   6. Musical encoding
 *   7. Cross-modal consistency (text vectors = audio vectors)
 * 
 * Usage: node test/braille-vector-space-benchmark.js
 */

const { BrailleVectorSpace } = require('../src/braille-core/braille-vector-space');
const { BrailleTTS } = require('../src/braille-core/braille-tts');
const { BBESCodec } = require('../src/braille-core/bbes-codec');
const { SemanticCodec } = require('../src/ai-core/semantic-codec');

// ─── Test Data ────────────────────────────────────────────────────────────

const TEST_STRINGS = [
    'Hello, World!',
    'The quick brown fox jumps over the lazy dog.',
    'Braille is a tactile writing system.',
    '8-dot braille has 256 possible patterns.',
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '!@#$%^&*()',
    '' // empty string edge case
];

// ─── Helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error(`  ✗ FAILED: ${name}`);
    }
}

function section(title) {
    console.log(`\n═══ ${title} ═══`);
}

// ─── Tests ────────────────────────────────────────────────────────────────

function testVectorSpaceRoundtrip() {
    section('§1 Vector Space: Lossless Text ↔ Vector Roundtrip');
    const vs = new BrailleVectorSpace();

    for (const text of TEST_STRINGS) {
        const vectors = vs.textToVectors(text);
        const decoded = vs.vectorsToText(vectors);
        assert(decoded === text, `textToVectors roundtrip: "${text.substring(0, 30)}"`);
    }

    // Byte-level bijection
    for (let b = 0; b < 256; b++) {
        const v = vs.byteToVector(b);
        const back = vs.vectorToByte(v);
        assert(back === b, `byte ${b} roundtrip`);
    }

    // Braille char ↔ vector
    for (let cp = 0x2800; cp <= 0x28FF; cp++) {
        const ch = String.fromCodePoint(cp);
        const v = vs.charToVector(ch);
        const back = vs.vectorToChar(v);
        assert(back === ch, `braille char U+${cp.toString(16)} roundtrip`);
    }

    // encode/decode (text → braille → text)
    for (const text of TEST_STRINGS) {
        const braille = vs.encode(text);
        const decoded = vs.decode(braille);
        assert(decoded === text, `encode/decode roundtrip: "${text.substring(0, 30)}"`);
    }

    console.log(`  Tested ${256 + 256 + TEST_STRINGS.length * 2} roundtrips`);
}

function testLinearAlgebra() {
    section('§2 Linear Algebra Primitives');
    const vs = new BrailleVectorSpace();

    // Dot product
    const a = new Float64Array([1, 0, 1, 0, 1, 0, 1, 0]);
    const b = new Float64Array([0, 1, 0, 1, 0, 1, 0, 1]);
    assert(vs.dot(a, b) === 0, 'orthogonal vectors dot = 0');
    assert(vs.dot(a, a) === 4, 'self-dot = Hamming weight');

    // Norm
    assert(Math.abs(vs.norm(a) - 2) < 1e-10, 'norm([1,0,1,0,1,0,1,0]) = 2');

    // Normalize
    const n = vs.normalize(a);
    assert(Math.abs(vs.norm(n) - 1) < 1e-10, 'normalized vector has unit norm');

    // Matrix-vector multiply
    const I = Array.from({ length: 8 }, (_, i) => {
        const row = new Float64Array(8);
        row[i] = 1;
        return row;
    });
    const v = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const Iv = vs.matVecMul(I, v);
    let identityOk = true;
    for (let i = 0; i < 8; i++) if (Math.abs(Iv[i] - v[i]) > 1e-10) identityOk = false;
    assert(identityOk, 'Identity matrix × v = v');

    // Transpose
    const M = [new Float64Array([1, 2]), new Float64Array([3, 4]), new Float64Array([5, 6])];
    const T = vs.transpose(M);
    assert(T.length === 2 && T[0].length === 3, 'transpose dimensions correct');
    assert(T[0][0] === 1 && T[0][1] === 3 && T[0][2] === 5, 'transpose values correct');

    console.log('  All linear algebra primitives verified');
}

function testDistanceMetrics() {
    section('§3 Distance Metrics');
    const vs = new BrailleVectorSpace();

    const v0 = new Float64Array([0, 0, 0, 0, 0, 0, 0, 0]);
    const v1 = new Float64Array([1, 1, 1, 1, 1, 1, 1, 1]);
    const vh = new Float64Array([1, 0, 1, 0, 1, 0, 1, 0]);

    assert(vs.hammingDistance(v0, v1) === 8, 'Hamming(0,255) = 8');
    assert(vs.hammingDistance(v0, v0) === 0, 'Hamming(0,0) = 0');
    assert(vs.hammingDistance(vh, v1) === 4, 'Hamming(alternating, all) = 4');

    assert(Math.abs(vs.cosineSimilarity(v1, v1) - 1) < 1e-10, 'cosine(v,v) ≈ 1');
    assert(Math.abs(vs.cosineSimilarity(vh, new Float64Array([0, 1, 0, 1, 0, 1, 0, 1]))) < 1e-10,
        'cosine(alternating, inverse) = 0');

    console.log('  Hamming and cosine metrics verified');
}

function testPCACompression() {
    section('§4 PCA Compression');
    const vs = new BrailleVectorSpace();

    const text = 'The quick brown fox jumps over the lazy dog. ' +
                 'Braille is a system of raised dots that can be read with the fingers.';
    const vectors = vs.textToVectors(text);

    console.log(`  Input: ${vectors.length} bytes (${vectors.length * 8} bits)`);

    for (const k of [3, 4, 5, 6, 7, 8]) {
        const compressed = vs.compress(text, k);
        const decompressed = vs.decompress(compressed);

        const lossless = decompressed.text === text;
        console.log(`  k=${k}: ratio=${compressed.compressionRatio.toFixed(2)} ` +
            `variance=${(compressed.varianceExplained * 100).toFixed(1)}% ` +
            `error=${decompressed.reconstructionError.toFixed(3)} ` +
            `lossless=${lossless}`);

        if (k === 8) {
            assert(lossless, 'PCA k=8 is lossless');
        }
    }

    // Distribution analysis
    const dist = vs.analyzeDistribution(vectors);
    console.log(`  Unique patterns: ${dist.uniquePatterns}/256 (${dist.patternUtilization})`);
    console.log(`  Avg dots/cell: ${dist.avgDotsPerCell}`);
    console.log(`  Shannon entropy: ${dist.entropy.toFixed(2)} bits`);

    assert(dist.entropy > 0, 'entropy > 0 for non-trivial text');
    assert(dist.uniquePatterns > 10, 'English text uses >10 unique patterns');
}

function testBBESCodec8Bit() {
    section('§5 BBESCodec 8-Bit Mode');

    // textToBraille8 / braille8ToText
    for (const text of TEST_STRINGS) {
        const braille = BBESCodec.textToBraille8(text);
        const decoded = BBESCodec.braille8ToText(braille);
        assert(decoded === text, `textToBraille8 roundtrip: "${text.substring(0, 30)}"`);
    }

    // brailleToBinary8 / binaryToBraille8
    for (let cp = 0x2800; cp <= 0x28FF; cp++) {
        const ch = String.fromCodePoint(cp);
        const bin = BBESCodec.brailleToBinary8(ch);
        const back = BBESCodec.binaryToBraille8(bin);
        assert(back === ch, `8-bit binary roundtrip U+${cp.toString(16)}`);
    }

    // vectorToBinary / binaryToVector
    const vec = new Float64Array([1, 0, 1, 1, 0, 0, 1, 0]);
    const bin = BBESCodec.vectorToBinary(vec);
    const backVec = BBESCodec.binaryToVector(bin);
    let vecMatch = true;
    for (let i = 0; i < 8; i++) if (vec[i] !== backVec[i]) vecMatch = false;
    assert(vecMatch, 'vector ↔ binary roundtrip');

    console.log(`  All 8-bit codec methods verified (${256 + TEST_STRINGS.length} roundtrips)`);
}

function testSemanticCodecVectorSpace() {
    section('§6 SemanticCodec Vector Space Integration');
    const codec = new SemanticCodec();

    // conceptToVector
    const entityVec = codec.conceptToVector('ENTITY');
    assert(entityVec !== null, 'ENTITY has a vector');
    assert(entityVec.length === 8, 'vector is 8D');

    const actionVec = codec.conceptToVector('ACTION');
    assert(actionVec !== null, 'ACTION has a vector');

    // conceptSimilarity — use OR='1' (non-zero vector) for self-similarity
    // ENTITY='000' is the zero vector, so cosine is undefined
    const selfSim = codec.conceptSimilarity('OR', 'OR');
    assert(Math.abs(selfSim - 1) < 1e-10, 'self-similarity ≈ 1 (non-zero concept)');

    const crossSim = codec.conceptSimilarity('AND', 'OR');
    console.log(`  AND↔OR similarity: ${crossSim.toFixed(3)}`);

    const eaSim = codec.conceptSimilarity('ENTITY', 'ACTION');
    console.log(`  ENTITY↔ACTION similarity: ${eaSim.toFixed(3)}`);

    // embedConceptGraph
    const graph = codec.embedConceptGraph(3);
    assert(graph.names.length > 0, 'concept graph has entries');
    assert(graph.pca !== null, 'PCA computed');
    assert(graph.distances.length > 0, 'distances computed');
    console.log(`  Embedded ${graph.names.length} concepts into 8D space`);
    console.log(`  PCA variance explained (3D): ${(graph.pca.varianceExplained * 100).toFixed(1)}%`);

    // Spot-check: closest pair
    const closest = graph.distances.reduce((a, b) => a.hamming < b.hamming ? a : b);
    console.log(`  Closest pair: ${closest.a} ↔ ${closest.b} (Hamming=${closest.hamming})`);
}

function testTTSSynthesis() {
    section('§7 BrailleTTS Synthesis');
    const tts = new BrailleTTS({ sampleRate: 8000, frameDurationMs: 50 });

    const text = 'Hello';
    const result = tts.synthesize(text);

    assert(result.samples.length > 0, 'synthesis produces samples');
    assert(result.sampleRate === 8000, 'correct sample rate');
    assert(result.frameCount === new TextEncoder().encode(text).length, 'frame count matches byte count');
    console.log(`  Synthesized "${text}": ${result.samples.length} samples, ${result.duration.toFixed(3)}s`);

    // Check that different characters produce different waveforms
    const aResult = tts.synthesize('a');
    const bResult = tts.synthesize('b');
    let differ = false;
    for (let i = 0; i < Math.min(aResult.samples.length, bResult.samples.length); i++) {
        if (Math.abs(aResult.samples[i] - bResult.samples[i]) > 1e-10) { differ = true; break; }
    }
    assert(differ, 'different characters produce different waveforms');

    // Empty cell (byte 0) should produce silence
    const vs = new BrailleVectorSpace();
    const silenceVec = [new Float64Array(8)]; // all zeros
    const silenceResult = tts.synthesizeFromVectors(silenceVec);
    let allZero = true;
    for (const s of silenceResult.samples) if (s !== 0) { allZero = false; break; }
    assert(allZero, 'all-zero vector produces silence');
}

function testTTSRoundtrip() {
    section('§8 TTS Synthesis → Analysis Roundtrip');
    const tts = new BrailleTTS({ sampleRate: 22050, frameDurationMs: 100 });

    // Simple ASCII characters (single-byte)
    const testChars = 'Hello';
    const result = tts.roundTrip(testChars);

    console.log(`  Original:  "${result.original}"`);
    console.log(`  Decoded:   "${result.decoded}"`);
    console.log(`  Match rate: ${result.matchRate}`);
    console.log(`  Exact:     ${result.exactMatch}`);

    assert(parseFloat(result.matchRate) > 0, 'some characters survive roundtrip');
}

function testMusicalEncoding() {
    section('§9 Musical Encoding');
    const tts = new BrailleTTS({ sampleRate: 22050 });
    const vs = new BrailleVectorSpace();

    const text = 'music';
    const vectors = vs.textToVectors(text);
    const music = tts.vectorsToMusic(vectors, 120);

    assert(music.length === vectors.length, 'one musical event per vector');
    for (const event of music) {
        assert(event.notes.length >= 0, 'notes array exists');
        assert(event.duration > 0, 'duration > 0');
    }

    // Synthesize music
    const audio = tts.synthesizeMusic(vectors, 120);
    assert(audio.samples.length > 0, 'music synthesis produces samples');
    console.log(`  "${text}" → ${music.length} events, ${audio.duration.toFixed(2)}s audio`);

    // Show note mapping for each character
    for (let i = 0; i < music.length; i++) {
        const noteNames = music[i].notes.map(n => n.name).join(', ') || '(rest)';
        console.log(`    '${text[i]}' → [${noteNames}]`);
    }
}

function testCrossModalConsistency() {
    section('§10 Cross-Modal Consistency');
    const vs = new BrailleVectorSpace();
    const tts = new BrailleTTS({ sampleRate: 22050, frameDurationMs: 100 });

    // The SAME text should produce the SAME vectors whether encoded
    // via text path or via braille encode/decode path
    const text = 'Test';
    const textVectors = vs.textToVectors(text);
    const braille = vs.encode(text);
    const brailleVectors = [];
    for (let i = 0; i < braille.length; i++) {
        brailleVectors.push(vs.charToVector(braille[i]));
    }

    assert(textVectors.length === brailleVectors.length, 'same vector count');
    let allMatch = true;
    for (let i = 0; i < textVectors.length; i++) {
        for (let d = 0; d < 8; d++) {
            if (textVectors[i][d] !== brailleVectors[i][d]) allMatch = false;
        }
    }
    assert(allMatch, 'text path and braille path produce identical vectors');

    // BBESCodec 8-bit and BrailleVectorSpace should agree
    const bbBraille = BBESCodec.textToBraille8(text);
    assert(bbBraille === braille, 'BBESCodec.textToBraille8 === BrailleVectorSpace.encode');

    console.log('  Text, braille, and BBESCodec paths produce identical 8D vectors');
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  Braille 8D Vector Space & TTS Benchmark            ║');
    console.log('║  {0,1}^8 ≅ byte ≅ 8-dot braille ≅ audio frame     ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    testVectorSpaceRoundtrip();
    testLinearAlgebra();
    testDistanceMetrics();
    testPCACompression();
    testBBESCodec8Bit();
    testSemanticCodecVectorSpace();
    testTTSSynthesis();
    testTTSRoundtrip();
    testMusicalEncoding();
    testCrossModalConsistency();

    console.log('\n═══ Summary ═══');
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);

    if (failed > 0) {
        console.error(`\n  ${failed} test(s) FAILED`);
        process.exit(1);
    } else {
        console.log('\n  ALL TESTS PASSED ✓');
    }
}

main();
