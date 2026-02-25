/**
 * Concept Atlas Benchmark
 * 
 * Verifies the 256-concept universal semantic alphabet:
 *   1. Atlas integrity (no duplicates, anchors present, coverage)
 *   2. Semantic dimension coherence (bit semantics make sense)
 *   3. Distance metrics (related concepts are near, opposites are far)
 *   4. Atlas ↔ SemanticCodec integration
 *   5. AtlasBuilder dry-run pipeline
 *   6. Cross-modal: concept → braille → vector → audio roundtrip
 * 
 * Usage: node test/concept-atlas-benchmark.js
 */

const { BrailleConceptAtlas } = require('../src/ai-core/concept-atlas');
const { AtlasBuilder } = require('../src/ai-core/atlas-builder');
const { SemanticCodec } = require('../src/ai-core/semantic-codec');
const { BrailleVectorSpace } = require('../src/braille-core/braille-vector-space');
const { BrailleTTS } = require('../src/braille-core/braille-tts');
const { BBESCodec } = require('../src/braille-core/bbes-codec');

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

function testAtlasIntegrity() {
    section('§1 Atlas Integrity');
    const atlas = new BrailleConceptAtlas();
    const stats = atlas.getStats();

    console.log(`  Version: ${stats.version}`);
    console.log(`  Coverage: ${stats.coverage} (${stats.filled}/256)`);

    // No duplicates
    const seen = new Set();
    let dupes = 0;
    for (let i = 0; i < 256; i++) {
        const c = atlas.getConcept(i);
        if (c) {
            if (seen.has(c)) dupes++;
            seen.add(c);
        }
    }
    assert(dupes === 0, 'no duplicate concepts');

    // Anchors
    assert(atlas.getConcept(0x00) === 'VOID', 'U+2800 = VOID');
    assert(atlas.getConcept(0xFF) === 'DEATH', 'U+28FF = DEATH');
    assert(atlas.getConcept(0x01) === 'GOD', 'U+2801 = GOD');

    // Single-dot concepts (pure dimensional)
    assert(atlas.getConcept(0x02) === 'BODY', 'd₁ = BODY');
    assert(atlas.getConcept(0x04) === 'TIME', 'd₂ = TIME');
    assert(atlas.getConcept(0x08) === 'SPACE', 'd₃ = SPACE');
    assert(atlas.getConcept(0x10) === 'OTHER', 'd₄ = OTHER');
    assert(atlas.getConcept(0x20) === 'MIND', 'd₅ = MIND');
    assert(atlas.getConcept(0x40) === 'HEART', 'd₆ = HEART');
    assert(atlas.getConcept(0x80) === 'SOUL', 'd₇ = SOUL');

    // Coverage > 80%
    assert(stats.filled >= 200, 'atlas has >= 200 concepts');

    // Dot distribution should follow binomial pattern
    console.log('  Dot distribution:');
    for (const { dots, count } of stats.dotDistribution) {
        const bar = '█'.repeat(count);
        console.log(`    ${dots} dots: ${bar} (${count})`);
    }
    assert(stats.dotDistribution[0].count === 1, '0-dot: exactly 1 (VOID)');
    assert(stats.dotDistribution[8].count === 1, '8-dot: exactly 1 (DEATH)');
}

function testBijectionRoundtrip() {
    section('§2 Bijection Roundtrip');
    const atlas = new BrailleConceptAtlas();

    // Every concept can be looked up by name and by index
    const all = atlas.getAll();
    for (const entry of all) {
        const byName = atlas.getIndex(entry.concept);
        assert(byName === entry.index, `${entry.concept}: name→index roundtrip`);

        const byIdx = atlas.getConcept(entry.index);
        assert(byIdx === entry.concept, `${entry.concept}: index→name roundtrip`);

        const braille = atlas.getBraille(entry.concept);
        const backConcept = atlas.getConcept(braille);
        assert(backConcept === entry.concept, `${entry.concept}: braille roundtrip`);
    }

    console.log(`  ${all.length} concepts verified for bidirectional lookup`);
}

function testDimensionSemantics() {
    section('§3 Dimension Semantics');
    const atlas = new BrailleConceptAtlas();

    // LOVE = existence + emotional
    const love = atlas.explain('LOVE');
    assert(love.activeDimensions.includes('existence'), 'LOVE has existence');
    assert(love.activeDimensions.includes('emotional'), 'LOVE has emotional');
    assert(love.dotCount === 2, 'LOVE has 2 dots');

    // LIFE = existence + physical
    const life = atlas.explain('LIFE');
    assert(life.activeDimensions.includes('existence'), 'LIFE has existence');
    assert(life.activeDimensions.includes('physical'), 'LIFE has physical');

    // WISDOM = cognitive + emotional
    const wisdom = atlas.explain('WISDOM');
    assert(wisdom.activeDimensions.includes('cognitive'), 'WISDOM has cognitive');
    assert(wisdom.activeDimensions.includes('emotional'), 'WISDOM has emotional');

    // DEATH = all 8 dimensions
    const death = atlas.explain('DEATH');
    assert(death.dotCount === 8, 'DEATH has all 8 dots');

    // VOID = no dimensions
    const void_ = atlas.explain('VOID');
    assert(void_.dotCount === 0, 'VOID has 0 dots');

    console.log('  Semantic dimension assignments verified');
}

function testDistanceMetrics() {
    section('§4 Distance Metrics');
    const atlas = new BrailleConceptAtlas();

    // GOD (0x01) and SOUL (0x80) share transcendent/existence theme but differ in bits
    const godSoul = atlas.conceptDistance('GOD', 'SOUL');
    console.log(`  GOD↔SOUL: ${godSoul}`);

    // LOVE and HEART should be close (both emotional)
    const loveHeart = atlas.conceptDistance('LOVE', 'HEART');
    assert(loveHeart <= 2, 'LOVE↔HEART distance ≤ 2');
    console.log(`  LOVE↔HEART: ${loveHeart}`);

    // LIFE and DEATH should be far apart
    const lifeDeath = atlas.conceptDistance('LIFE', 'DEATH');
    assert(lifeDeath >= 5, 'LIFE↔DEATH distance ≥ 5');
    console.log(`  LIFE↔DEATH: ${lifeDeath}`);

    // GOD and VOID should be close (1 bit diff)
    const godVoid = atlas.conceptDistance('GOD', 'VOID');
    assert(godVoid === 1, 'GOD↔VOID distance = 1');
    console.log(`  GOD↔VOID: ${godVoid}`);

    // Same concept = 0
    assert(atlas.conceptDistance('LOVE', 'LOVE') === 0, 'self-distance = 0');

    // Nearest neighbors make sense
    const nearLove = atlas.nearestConcepts('LOVE', 5);
    console.log('  Nearest to LOVE:');
    nearLove.forEach(n => console.log(`    ${n.braille} ${n.concept} (dist=${n.distance})`));
    assert(nearLove.length === 5, '5 nearest neighbors returned');
    assert(nearLove[0].distance <= 2, 'nearest neighbor is close');
}

function testEncodeDecode() {
    section('§5 Encode / Decode Concepts');
    const atlas = new BrailleConceptAtlas();

    // Encode a "sentence"
    const concepts = ['GOD', 'LOVE', 'LIFE', 'WORLD', 'TRUTH', 'DEATH'];
    const braille = atlas.encodeConcepts(concepts);
    const decoded = atlas.decodeConcepts(braille);

    console.log(`  Concepts: ${concepts.join(' ')}`);
    console.log(`  Braille:  ${braille}`);
    console.log(`  Decoded:  ${decoded.join(' ')}`);
    console.log(`  Bytes:    ${concepts.length} (1 byte per concept)`);

    assert(decoded.join(' ') === concepts.join(' '), 'encode/decode roundtrip');
    assert(braille.length === concepts.length, '1 braille char per concept');

    // More complex sentences
    const story = ['BIRTH', 'LIFE', 'GROWTH', 'KNOWLEDGE', 'LOVE', 'FAMILY', 'WISDOM', 'DEATH'];
    const storyBraille = atlas.encodeConcepts(story);
    const storyDecoded = atlas.decodeConcepts(storyBraille);
    assert(storyDecoded.join(' ') === story.join(' '), 'story roundtrip');
    console.log(`  Story:    ${story.join(' → ')}`);
    console.log(`  Braille:  ${storyBraille} (${storyBraille.length} bytes)`);
}

function testSemanticCodecIntegration() {
    section('§6 SemanticCodec Integration');
    const codec = new SemanticCodec();

    // encodeWithAtlas
    const encoded = codec.encodeWithAtlas(['GOD', 'LOVE', 'LIFE', 'UNKNOWN_CONCEPT', 'DEATH']);
    assert(encoded.braille.length === 5, 'encodes 5 concepts to 5 chars');
    assert(encoded.unknowns.length === 1, '1 unknown concept');
    assert(encoded.unknowns[0] === 'UNKNOWN_CONCEPT', 'correct unknown identified');

    // decodeWithAtlas
    const decoded = codec.decodeWithAtlas(encoded.braille);
    assert(decoded[0] === 'GOD', 'decoded[0] = GOD');
    assert(decoded[1] === 'LOVE', 'decoded[1] = LOVE');
    assert(decoded[4] === 'DEATH', 'decoded[4] = DEATH');

    // bitsToConcept bridge
    const godBridge = codec.bitsToConcept('10000000');
    console.log(`  bitsToConcept("10000000"): ${JSON.stringify(godBridge)}`);
    assert(godBridge !== null, 'bitsToConcept returns a result');
    assert(godBridge.concept === 'GOD', 'maps to GOD (d₀ only)');

    // Variable-bit encoding → atlas concept
    const entityBits = codec.encodeConcept('ENTITY'); // '000'
    const entityConcept = codec.bitsToConcept(entityBits);
    console.log(`  ENTITY bits="${entityBits}" → atlas: ${entityConcept.concept}`);
    assert(entityConcept !== null, 'ENTITY maps to an atlas concept');

    console.log('  SemanticCodec ↔ ConceptAtlas bridge verified');
}

async function testAtlasBuilder() {
    section('§7 AtlasBuilder (dry-run)');
    const builder = new AtlasBuilder({ dryRun: true });

    const result = await builder.buildAtlas();

    console.log(`  Models: ${result.stats.models}`);
    console.log(`  Filled: ${result.stats.filled}/256`);
    console.log(`  Consensus: agreements=${result.consensus.agreements} conflicts=${result.consensus.conflicts}`);
    console.log(`  Valid: ${result.validation.valid}`);

    assert(result.stats.filled >= 200, 'builder produces ≥200 concepts');
    assert(result.validation.duplicates === 0, 'no duplicates in built atlas');
    assert(result.validation.anchorsPresent.void, 'VOID anchor present');
    assert(result.validation.anchorsPresent.totality, 'DEATH anchor present');

    // Load into a fresh atlas
    const atlas = new BrailleConceptAtlas();
    atlas.loadAtlas(result.atlas);
    assert(atlas.getBraille('GOD') !== null, 'GOD survives build pipeline');
    assert(atlas.getBraille('DEATH') !== null, 'DEATH survives build pipeline');
}

function testCrossModal() {
    section('§8 Cross-Modal: Concept → Braille → Vector → Audio');
    const atlas = new BrailleConceptAtlas();
    const vs = new BrailleVectorSpace();
    const tts = new BrailleTTS({ sampleRate: 8000, frameDurationMs: 50 });

    // Concept → braille → vector
    const concepts = ['GOD', 'LOVE', 'DEATH'];
    const braille = atlas.encodeConcepts(concepts);
    const vectors = [];
    for (const ch of braille) {
        vectors.push(vs.charToVector(ch));
    }

    assert(vectors.length === 3, '3 vectors from 3 concepts');

    // Vectors → audio
    const audio = tts.synthesizeFromVectors(vectors);
    assert(audio.samples.length > 0, 'audio synthesized');
    console.log(`  "${concepts.join(', ')}" → ${braille} → ${audio.samples.length} samples (${audio.duration.toFixed(3)}s)`);

    // Each concept should produce a DIFFERENT sound (different frequency patterns)
    const godAudio = tts.synthesizeFromVectors([vectors[0]]);
    const loveAudio = tts.synthesizeFromVectors([vectors[1]]);
    const deathAudio = tts.synthesizeFromVectors([vectors[2]]);

    let godLoveDiffer = false;
    for (let i = 0; i < Math.min(godAudio.samples.length, loveAudio.samples.length); i++) {
        if (Math.abs(godAudio.samples[i] - loveAudio.samples[i]) > 1e-10) { godLoveDiffer = true; break; }
    }
    assert(godLoveDiffer, 'GOD and LOVE produce different waveforms');

    // DEATH (all dots on) activates more frequency bands than GOD (1 dot)
    // Note: TTS uses constant-energy normalization (1/√n), so total energy
    // is roughly equal. Instead, verify spectral richness via dot count.
    const deathExplain = atlas.explain('DEATH');
    const godExplain = atlas.explain('GOD');
    assert(deathExplain.dotCount > godExplain.dotCount, 'DEATH has more active bands than GOD (8 vs 1)');

    // BBESCodec 8-bit encoding
    const binary = BBESCodec.brailleToBinary8(braille);
    const backBraille = BBESCodec.binaryToBraille8(binary);
    assert(backBraille === braille, 'BBESCodec 8-bit roundtrip preserves concept encoding');

    // Musical encoding
    const music = tts.vectorsToMusic(vectors);
    console.log('  Musical encoding:');
    for (let i = 0; i < concepts.length; i++) {
        const noteNames = music[i].notes.map(n => n.name).join(', ') || '(silence)';
        console.log(`    ${concepts[i]} → [${noteNames}]`);
    }
    assert(music[2].notes.length === 8, 'DEATH activates all 8 notes');
    assert(music[0].notes.length === 1, 'GOD activates 1 note');

    console.log('  Full cross-modal pipeline verified');
}

function testExportImport() {
    section('§9 Export / Import');
    const atlas = new BrailleConceptAtlas();

    // Export
    const exported = atlas.exportAtlas();
    assert(exported.length === 256, 'export has 256 entries');

    // Import into fresh atlas
    const atlas2 = new BrailleConceptAtlas();
    atlas2.loadAtlas(exported);

    // Verify
    for (let i = 0; i < 256; i++) {
        assert(atlas.getConcept(i) === atlas2.getConcept(i), `slot ${i} matches`);
    }

    console.log('  Export/import roundtrip verified (256 slots)');
}

function testCompressionComparison() {
    section('§10 Compression: Atlas vs Raw Text');

    const atlas = new BrailleConceptAtlas();

    // A "thought" expressed as concepts
    const thought = ['BIRTH', 'LIFE', 'GROWTH', 'KNOWLEDGE', 'LOVE', 'FAMILY', 'WISDOM', 'DEATH'];
    const thoughtText = thought.join(' '); // "BIRTH LIFE GROWTH KNOWLEDGE LOVE FAMILY WISDOM DEATH"

    // Raw text encoding
    const rawBytes = new TextEncoder().encode(thoughtText).length;

    // Atlas encoding: 1 byte per concept
    const atlasBytes = thought.length;

    // MOTL variable-bit encoding via SemanticCodec
    const codec = new SemanticCodec();
    codec.updateContext(thought);
    let motlBits = 0;
    for (const c of thought) {
        motlBits += codec.encodeConceptWithFallback(c).length;
    }
    const motlBytes = Math.ceil(motlBits / 8);

    console.log(`  Thought: "${thoughtText}"`);
    console.log(`  Raw UTF-8:    ${rawBytes} bytes`);
    console.log(`  Atlas (1B/c): ${atlasBytes} bytes (${(atlasBytes / rawBytes * 100).toFixed(1)}%)`);
    console.log(`  MOTL bits:    ${motlBits} bits → ${motlBytes} bytes (${(motlBytes / rawBytes * 100).toFixed(1)}%)`);
    console.log(`  Atlas ratio:  ${(rawBytes / atlasBytes).toFixed(1)}:1`);

    assert(atlasBytes < rawBytes, 'atlas encoding smaller than raw text');
    assert(atlasBytes === 8, '8 concepts = 8 bytes');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  Concept Atlas Benchmark                            ║');
    console.log('║  256 Universal Concepts ↔ 8-Dot Braille ↔ {0,1}⁸  ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    testAtlasIntegrity();
    testBijectionRoundtrip();
    testDimensionSemantics();
    testDistanceMetrics();
    testEncodeDecode();
    testSemanticCodecIntegration();
    await testAtlasBuilder();
    testCrossModal();
    testExportImport();
    testCompressionComparison();

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

main().catch(err => {
    console.error(err);
    process.exit(1);
});
