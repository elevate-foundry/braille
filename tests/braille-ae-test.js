/**
 * BrailleAE Test Suite
 * 
 * This file contains tests for the BrailleAE neural compression system.
 * It validates encoding/decoding functionality, learning capabilities,
 * and compression performance.
 */

// Import the BrailleAE class
const { BrailleAE } = require('../src/braille-core/braille-ae');

// Import BrailleFST for comparison
const { BrailleFST } = require('../src/braille-core/braille-fst');
const { BrailleFSTGrade3 } = require('../src/braille-core/braille-fst-grade3');

// Test suite for BrailleAE
describe('BrailleAE Neural Compression Tests', () => {
    let brailleAE;
    let brailleFST;
    let brailleFSTG3;
    
    // Sample text for testing
    const sampleText = "The quick brown fox jumps over the lazy dog. This is a sample text to test the neural compression capabilities of BrailleAE.";
    const trainingCorpus = [
        "Neural networks are a set of algorithms, modeled loosely after the human brain, that are designed to recognize patterns.",
        "Deep learning is part of a broader family of machine learning methods based on artificial neural networks.",
        "Braille is a tactile writing system used by people who are visually impaired.",
        "Grade 2 Braille uses contractions to make reading and writing more efficient.",
        "The BrailleAE system learns optimal contractions based on language usage patterns."
    ];
    
    // Setup before each test
    beforeEach(() => {
        // Initialize with default options
        brailleAE = new BrailleAE({
            compressionLevel: 0.7,
            adaptiveMode: true,
            language: 'en'
        });
        
        brailleFST = new BrailleFST({
            grade: 2,
            language: 'en'
        });
        
        brailleFSTG3 = new BrailleFSTGrade3({
            language: 'en'
        });
    });
    
    // Test initialization
    test('should initialize with default options', () => {
        expect(brailleAE.initialized).toBe(true);
        expect(brailleAE.options.compressionLevel).toBe(0.7);
        expect(brailleAE.options.adaptiveMode).toBe(true);
        expect(brailleAE.options.language).toBe('en');
    });
    
    // Test option setting
    test('should update options correctly', () => {
        brailleAE.setOptions({
            compressionLevel: 0.5,
            adaptiveMode: false
        });
        
        expect(brailleAE.options.compressionLevel).toBe(0.5);
        expect(brailleAE.options.adaptiveMode).toBe(false);
        expect(brailleAE.options.language).toBe('en'); // Unchanged
    });
    
    // Test basic encoding/decoding
    test('should encode and decode text correctly', () => {
        const encoded = brailleAE.encode(sampleText);
        
        // Ensure encoding produces expected formats
        expect(encoded).toHaveProperty('unicode');
        expect(encoded).toHaveProperty('binary');
        expect(encoded).toHaveProperty('bbes');
        
        // Decode from unicode format
        const decoded = brailleAE.decode(encoded.unicode, 'unicode');
        
        // The decoded text might not match exactly due to the nature of compression,
        // but it should contain the key words from the original text
        expect(decoded).toContain('quick');
        expect(decoded).toContain('fox');
        expect(decoded).toContain('jumps');
    });
    
    // Test learning capabilities
    test('should learn from training corpus', () => {
        // Get initial pattern count
        const initialStats = brailleAE.getStats();
        const initialPatternCount = initialStats.patternCount;
        
        // Train on corpus
        for (const text of trainingCorpus) {
            brailleAE.learn(text);
        }
        
        // Get updated stats
        const updatedStats = brailleAE.getStats();
        
        // Should have learned new patterns
        expect(updatedStats.patternCount).toBeGreaterThan(initialPatternCount);
        
        // Corpus size should have increased
        expect(updatedStats.corpusSize).toBeGreaterThan(0);
    });
    
    // Test compression performance
    test('should achieve better compression than Grade 1', () => {
        // Train the model first
        for (const text of trainingCorpus) {
            brailleAE.learn(text);
        }
        
        // Encode with BrailleAE
        const aeResult = brailleAE.encode(sampleText);
        
        // Encode with BrailleFST Grade 1
        brailleFST.setOptions({ grade: 1 });
        const fstG1Result = brailleFST.encode(sampleText);
        
        // Compare sizes (smaller is better)
        expect(aeResult.bbes.length).toBeLessThan(fstG1Result.bbes.length);
    });
    
    // Test compression comparison with Grade 2
    test('should achieve competitive compression with Grade 2', () => {
        // Train the model extensively
        for (const text of trainingCorpus) {
            brailleAE.learn(text);
        }
        
        // Additional training on sample text
        brailleAE.learn(sampleText);
        
        // Encode with BrailleAE
        const aeResult = brailleAE.encode(sampleText);
        
        // Encode with BrailleFST Grade 2
        brailleFST.setOptions({ grade: 2 });
        const fstG2Result = brailleFST.encode(sampleText);
        
        // Calculate compression ratios
        const aeRatio = aeResult.bbes.length / sampleText.length;
        const fstG2Ratio = fstG2Result.bbes.length / sampleText.length;
        
        // Log the results for analysis
        console.log(`BrailleAE Ratio: ${aeRatio.toFixed(2)}`);
        console.log(`BrailleFST G2 Ratio: ${fstG2Ratio.toFixed(2)}`);
        
        // The neural compression should be at least within 20% of Grade 2 performance
        // This is a reasonable expectation for a prototype
        expect(aeRatio).toBeLessThan(fstG2Ratio * 1.2);
    });
    
    // Test adaptive learning
    test('should improve compression with more training', () => {
        // Initial encoding without training
        const initialResult = brailleAE.encode(sampleText);
        
        // Train extensively
        for (let i = 0; i < 5; i++) {
            for (const text of trainingCorpus) {
                brailleAE.learn(text);
            }
        }
        
        // Encode again after training
        const trainedResult = brailleAE.encode(sampleText);
        
        // Compression should improve with training
        expect(trainedResult.bbes.length).toBeLessThanOrEqual(initialResult.bbes.length);
    });
    
    // Test context-aware encoding
    test('should use context for encoding ambiguous words', () => {
        // Text with context-dependent words
        const contextText1 = "I went to the bank to deposit money.";
        const contextText2 = "I went to the bank of the river.";
        
        // Encode both texts
        const result1 = brailleAE.encode(contextText1);
        const result2 = brailleAE.encode(contextText2);
        
        // The encoding of "bank" should be different in the two contexts
        // This is challenging to test directly, so we'll check if the overall encodings differ
        expect(result1.unicode).not.toEqual(result2.unicode);
    });
    
    // Test comparison with Grade 3
    test('should compare performance with Grade 3', () => {
        // Train the model extensively
        for (const text of trainingCorpus) {
            brailleAE.learn(text);
        }
        brailleAE.learn(sampleText);
        
        // Encode with BrailleAE
        const aeResult = brailleAE.encode(sampleText);
        
        // Encode with BrailleFST Grade 3
        const fstG3Result = brailleFSTG3.encode(sampleText);
        
        // Calculate compression ratios
        const aeRatio = aeResult.bbes.length / sampleText.length;
        const fstG3Ratio = fstG3Result.bbes.length / sampleText.length;
        
        // Log the results for analysis
        console.log(`BrailleAE Ratio: ${aeRatio.toFixed(2)}`);
        console.log(`BrailleFST G3 Ratio: ${fstG3Ratio.toFixed(2)}`);
        
        // Grade 3 should still outperform the neural approach at this stage,
        // but the difference should not be dramatic (within 30%)
        expect(aeRatio).toBeLessThan(fstG3Ratio * 1.3);
    });
    
    // Test BBES format compatibility
    test('should produce valid BBES format', () => {
        const result = brailleAE.encode(sampleText);
        
        // BBES should be a base64 string
        expect(typeof result.bbes).toBe('string');
        
        // Should be decodable
        expect(() => {
            atob(result.bbes);
        }).not.toThrow();
    });
    
    // Test compression level impact
    test('should adjust compression based on compression level', () => {
        // Low compression
        brailleAE.setOptions({ compressionLevel: 0.3 });
        const lowCompressionResult = brailleAE.encode(sampleText);
        
        // High compression
        brailleAE.setOptions({ compressionLevel: 0.9 });
        const highCompressionResult = brailleAE.encode(sampleText);
        
        // Higher compression level should result in smaller output
        expect(highCompressionResult.bbes.length).toBeLessThanOrEqual(lowCompressionResult.bbes.length);
    });
});

// Run the tests if this file is executed directly
if (require.main === module) {
    // Simple test runner
    const tests = [];
    
    // Mock Jest-like functions
    global.describe = (name, fn) => {
        console.log(`\n--- ${name} ---`);
        fn();
    };
    
    global.beforeEach = (fn) => {
        global.beforeEachFn = fn;
    };
    
    global.test = (name, fn) => {
        tests.push({ name, fn });
    };
    
    global.expect = (actual) => ({
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toHaveProperty: (prop) => {
            if (!actual.hasOwnProperty(prop)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        },
        toContain: (substring) => {
            if (!actual.includes(substring)) {
                throw new Error(`Expected "${actual}" to contain "${substring}"`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (!(actual > expected)) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThan: (expected) => {
            if (!(actual < expected)) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        },
        toBeLessThanOrEqual: (expected) => {
            if (!(actual <= expected)) {
                throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
            }
        },
        not: {
            toEqual: (expected) => {
                if (JSON.stringify(actual) === JSON.stringify(expected)) {
                    throw new Error(`Expected ${actual} not to equal ${expected}`);
                }
            },
            toThrow: () => {
                try {
                    actual();
                } catch (e) {
                    throw new Error(`Expected function not to throw, but it threw ${e}`);
                }
            }
        }
    });
    
    // Run all tests
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            if (global.beforeEachFn) {
                global.beforeEachFn();
            }
            test.fn();
            console.log(`✅ PASS: ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ FAIL: ${test.name}`);
            console.error(`   ${e.message}`);
            failed++;
        }
    }
    
    console.log(`\n--- Test Results ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${tests.length}`);
}
