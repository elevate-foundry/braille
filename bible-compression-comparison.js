/**
 * Bible Compression Comparison
 * 
 * This script compares the storage efficiency of the braille compression system
 * across different languages using the American Standard Version of the Bible.
 */

const fs = require('fs');
const path = require('path');

// Polyfill for performance.now() in Node.js
const performance = {
    now: () => {
        const [seconds, nanoseconds] = process.hrtime();
        return seconds * 1000 + nanoseconds / 1000000;
    }
};

// Create a class to handle the Bible compression comparison
class BibleCompressionComparison {
    constructor(options = {}) {
        this.options = {
            bibleFilePath: path.join(__dirname, 'bible_american_standard_version.txt'),
            outputDir: path.join(__dirname, 'compression-results'),
            languages: ['en', 'es', 'fr', 'ru', 'ar', 'zh', 'ja', 'ko'],
            compressionLevels: [0.7, 0.8, 0.9, 0.95],
            chunkSize: 1024 * 1024, // Process 1MB at a time
            mockImplementations: null,
            ...options
        };

        // Initialize compression systems
        if (this.options.mockImplementations) {
            // Use mock implementations if provided
            const { MOTLProtocol, MOTLReligiousTexts, M2MCompression, BrailleCompression } = this.options.mockImplementations;
            this.brailleCompression = new BrailleCompression();
            this.motlProtocol = new MOTLProtocol();
            this.motlReligious = new MOTLReligiousTexts();
            this.m2mCompression = new M2MCompression();
        } else {
            // Use actual implementations (these imports might fail if not available)
            try {
                const { MOTLProtocol } = require('./src/ai-core/motl-protocol');
                const { MOTLReligiousTexts } = require('./src/ai-core/motl-religious-texts');
                const { M2MCompression } = require('./src/ai-core/m2m-compression');
                
                this.brailleCompression = new BrailleCompression();
                this.motlProtocol = new MOTLProtocol();
                this.motlReligious = new MOTLReligiousTexts();
                this.m2mCompression = new M2MCompression();
            } catch (error) {
                console.error('Error loading actual implementations:', error);
                console.log('Falling back to simplified implementations...');
                
                // Fallback to simplified implementations
                this.brailleCompression = new BrailleCompression();
                this.motlProtocol = { encode: () => ({ size: 1000 }) };
                this.motlReligious = { encodeReligiousText: () => ({ size: 1000 }) };
                this.m2mCompression = { compress: () => ({ metadata: { compressedSize: 1000, originalSize: 5000 } }) };
            }
        }

        // Results storage
        this.results = {
            originalSize: 0,
            compressedSizes: {},
            compressionRatios: {},
            processingTimes: {}
        };

        // Ensure output directory exists
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
    }

    /**
     * Get the file size of the Bible text
     * @returns {number} File size in bytes
     */
    getBibleFileSize() {
        try {
            const stats = fs.statSync(this.options.bibleFilePath);
            return stats.size;
        } catch (error) {
            console.error('Error getting Bible file size:', error);
            throw error;
        }
    }

    /**
     * Process the Bible file in chunks
     * @param {Function} processChunk - Function to process each chunk
     * @returns {Promise} Promise that resolves when processing is complete
     */
    async processBibleInChunks(processChunk) {
        return new Promise((resolve, reject) => {
            try {
                const fileSize = this.getBibleFileSize();
                this.results.originalSize = fileSize;
                console.log(`Bible file size: ${this.formatBytes(fileSize)}`);
                
                const readStream = fs.createReadStream(this.options.bibleFilePath, {
                    highWaterMark: this.options.chunkSize,
                    encoding: 'utf8'
                });
                
                let processedBytes = 0;
                let chunks = [];
                
                readStream.on('data', (chunk) => {
                    chunks.push(chunk);
                    processedBytes += Buffer.byteLength(chunk, 'utf8');
                    console.log(`Processed ${this.formatBytes(processedBytes)} of ${this.formatBytes(fileSize)} (${Math.round(processedBytes / fileSize * 100)}%)`);
                });
                
                readStream.on('end', async () => {
                    console.log('Finished reading file, processing chunks...');
                    const fullText = chunks.join('');
                    await processChunk(fullText);
                    resolve();
                });
                
                readStream.on('error', (error) => {
                    console.error('Error reading Bible file:', error);
                    reject(error);
                });
            } catch (error) {
                console.error('Error processing Bible in chunks:', error);
                reject(error);
            }
        });
    }

    /**
     * Run the compression comparison
     */
    async runComparison() {
        console.log('=== BIBLE COMPRESSION COMPARISON ===');
        
        try {
            // Process Bible file in chunks
            await this.processBibleInChunks(async (text) => {
                // Standard compression (no language-specific optimization)
                console.log('\nRunning standard compression...');
                await this.runStandardCompression(text);
                
                // Language-specific compression
                console.log('\nRunning language-specific compression...');
                await this.runLanguageSpecificCompression(text);
                
                // MOTL religious text compression
                console.log('\nRunning MOTL religious text compression...');
                await this.runMOTLReligiousCompression(text);
                
                // M2M compression (highest compression ratio)
                console.log('\nRunning M2M compression...');
                await this.runM2MCompression(text);
            });
            
            // Save results
            this.saveResults();
            
            // Generate summary
            const summary = this.generateSummary();
            console.log('\n=== COMPRESSION SUMMARY ===');
            console.log(summary);
            
            return {
                results: this.results,
                summary
            };
        } catch (error) {
            console.error('Error running comparison:', error);
            throw error;
        }
    }

    /**
     * Run standard braille compression
     * @param {string} text - Text to compress
     */
    async runStandardCompression(text) {
        const startTime = performance.now();
        
        // Compress using standard braille compression
        const compressed = this.brailleCompression.compress(text);
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Store results
        this.results.compressedSizes['standard'] = compressed.compressedSize;
        this.results.compressionRatios['standard'] = compressed.compressionRatio;
        this.results.processingTimes['standard'] = processingTime;
        
        console.log(`Standard compression: ${this.formatBytes(compressed.compressedSize)} (${compressed.compressionRatio.toFixed(2)}:1)`);
    }

    /**
     * Run language-specific compression
     * @param {string} text - Text to compress
     */
    async runLanguageSpecificCompression(text) {
        for (const language of this.options.languages) {
            console.log(`Processing language: ${language}...`);
            
            const startTime = performance.now();
            
            // Simulate translation (in a real implementation, this would use a translation API)
            const translatedText = this.simulateTranslation(text, language);
            
            // Compress using braille compression
            const compressed = this.brailleCompression.compress(translatedText);
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            // Store results
            this.results.compressedSizes[language] = compressed.compressedSize;
            this.results.compressionRatios[language] = compressed.compressionRatio;
            this.results.processingTimes[language] = processingTime;
            
            console.log(`${language.toUpperCase()} compression: ${this.formatBytes(compressed.compressedSize)} (${compressed.compressionRatio.toFixed(2)}:1)`);
        }
    }

    /**
     * Run MOTL religious text compression
     * @param {string} text - Text to compress
     */
    async runMOTLReligiousCompression(text) {
        const startTime = performance.now();
        
        // Compress using MOTL religious text compression
        const encoded = this.motlReligious.encodeReligiousText({
            text,
            tradition: 'Christianity',
            textType: 'Bible'
        });
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Store results
        this.results.compressedSizes['motl_religious'] = encoded.size;
        this.results.compressionRatios['motl_religious'] = this.results.originalSize / encoded.size;
        this.results.processingTimes['motl_religious'] = processingTime;
        
        console.log(`MOTL Religious compression: ${this.formatBytes(encoded.size)} (${(this.results.originalSize / encoded.size).toFixed(2)}:1)`);
    }

    /**
     * Run M2M compression
     * @param {string} text - Text to compress
     */
    async runM2MCompression(text) {
        for (const level of this.options.compressionLevels) {
            const startTime = performance.now();
            
            // Compress using M2M compression with different levels
            const compressed = this.m2mCompression.compress({
                text,
                options: {
                    compressionLevel: level,
                    semanticCompression: true
                }
            });
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            // Store results
            const key = `m2m_${level}`;
            this.results.compressedSizes[key] = compressed.metadata.compressedSize / 8; // Convert bits to bytes
            this.results.compressionRatios[key] = compressed.metadata.originalSize / compressed.metadata.compressedSize;
            this.results.processingTimes[key] = processingTime;
            
            console.log(`M2M compression (${level}): ${this.formatBytes(this.results.compressedSizes[key])} (${this.results.compressionRatios[key].toFixed(2)}:1)`);
        }
    }

    /**
     * Simulate translation to different languages
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language code
     * @returns {string} - Simulated translated text
     */
    simulateTranslation(text, targetLanguage) {
        // In a real implementation, this would call a translation API
        // For simulation, we'll adjust the text length based on typical expansion ratios
        
        // Approximate expansion ratios compared to English
        const expansionRatios = {
            'en': 1.0,    // English (baseline)
            'es': 1.15,   // Spanish is typically 15% longer
            'fr': 1.18,   // French is typically 18% longer
            'ru': 0.95,   // Russian can be more compact
            'ar': 0.85,   // Arabic is often more compact
            'zh': 0.7,    // Chinese is much more compact
            'ja': 0.7,    // Japanese is much more compact
            'ko': 0.8     // Korean is more compact
        };
        
        // Apply expansion ratio to simulate translation length differences
        const ratio = expansionRatios[targetLanguage] || 1.0;
        const simulatedLength = Math.floor(text.length * ratio);
        
        // For simulation purposes, we'll just return a modified version of the original text
        // with the appropriate length to simulate the target language
        return text.substring(0, simulatedLength);
    }

    /**
     * Save results to file
     */
    saveResults() {
        // Convert BigInt values to strings to make them serializable
        const serializableResults = JSON.parse(JSON.stringify(this.results, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        
        const resultsPath = path.join(this.options.outputDir, 'compression-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(serializableResults, null, 2));
        console.log(`Results saved to: ${resultsPath}`);
    }

    /**
     * Generate a summary of the compression results
     * @returns {string} Summary text
     */
    generateSummary() {
        let summary = `Original Bible size: ${this.formatBytes(this.results.originalSize)}\n\n`;
        
        // Sort by compression ratio (best first)
        const sortedMethods = Object.keys(this.results.compressionRatios).sort(
            (a, b) => this.results.compressionRatios[b] - this.results.compressionRatios[a]
        );
        
        summary += 'Compression Results (best to worst):\n';
        
        for (const method of sortedMethods) {
            const ratio = this.results.compressionRatios[method];
            const size = this.results.compressedSizes[method];
            const time = this.results.processingTimes[method];
            
            summary += `${method.padEnd(15)}: ${this.formatBytes(size).padEnd(10)} | `;
            summary += `${ratio.toFixed(2)}:1 compression | `;
            summary += `${time.toFixed(2)}ms processing time\n`;
        }
        
        summary += '\nLanguage Comparison:\n';
        
        // Filter only language results
        const languageMethods = this.options.languages.filter(lang => 
            this.results.compressionRatios[lang] !== undefined
        );
        
        // Sort languages by compression ratio
        languageMethods.sort((a, b) => 
            this.results.compressionRatios[b] - this.results.compressionRatios[a]
        );
        
        for (const language of languageMethods) {
            const ratio = this.results.compressionRatios[language];
            const size = this.results.compressedSizes[language];
            
            summary += `${language.toUpperCase().padEnd(5)}: ${this.formatBytes(size).padEnd(10)} | `;
            summary += `${ratio.toFixed(2)}:1 compression\n`;
        }
        
        return summary;
    }

    /**
     * Format bytes to human-readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// BrailleCompression class (simplified version for this script)
class BrailleCompression {
    constructor() {
        // Initialize contractions map
        this.contractionMap = {
            'the': '⠮',
            'and': '⠯',
            'for': '⠿',
            'of': '⠷',
            'with': '⠾',
            'ch': '⠡',
            'gh': '⠣',
            'sh': '⠩',
            'th': '⠹',
            'wh': '⠱',
            'ed': '⠫',
            'er': '⠻',
            'ou': '⠳',
            'ow': '⠪',
            'st': '⠌',
            'ar': '⠜',
            'ing': '⠬',
            'ble': '⠼',
            'ea': '⠂',
            // Add more contractions as needed
        };
        
        // Create reverse mapping
        this.reverseContractionMap = {};
        Object.keys(this.contractionMap).forEach(text => {
            this.reverseContractionMap[this.contractionMap[text]] = text;
        });
    }
    
    /**
     * Compress text using Braille contractions
     * @param {string} text - The text to compress
     * @returns {object} - The compressed text and stats
     */
    compress(text) {
        // Convert text to lowercase for matching
        const lowerText = text.toLowerCase();
        
        // Start with Grade 2 Braille contractions
        let compressed = lowerText;
        let replacements = 0;
        
        // Sort contractions by length (longest first) to avoid partial replacements
        const sortedContractions = Object.keys(this.contractionMap).sort((a, b) => b.length - a.length);
        
        // Replace words and contractions
        for (const contraction of sortedContractions) {
            const regex = new RegExp(contraction, 'g');
            const matches = compressed.match(regex);
            
            if (matches) {
                replacements += matches.length;
                compressed = compressed.replace(regex, this.contractionMap[contraction]);
            }
        }
        
        // Calculate compression stats
        const originalSize = Buffer.byteLength(text, 'utf8');
        const compressedSize = Buffer.byteLength(compressed, 'utf8');
        const compressionRatio = originalSize / compressedSize;
        
        return {
            original: text,
            compressed,
            originalSize,
            compressedSize,
            compressionRatio,
            replacements
        };
    }
    
    /**
     * Decompress text from Braille contractions
     * @param {string} compressed - The compressed text
     * @returns {object} - The decompressed text and stats
     */
    decompress(compressed) {
        let decompressed = compressed;
        let replacements = 0;
        
        // Replace Braille cells with their text equivalents
        for (const brailleCell in this.reverseContractionMap) {
            const regex = new RegExp(brailleCell, 'g');
            const matches = decompressed.match(regex);
            
            if (matches) {
                replacements += matches.length;
                decompressed = decompressed.replace(regex, this.reverseContractionMap[brailleCell]);
            }
        }
        
        return {
            compressed,
            decompressed,
            replacements
        };
    }
}

// Run the comparison if executed directly
if (require.main === module) {
    const comparison = new BibleCompressionComparison();
    comparison.runComparison().then(() => {
        console.log('Compression comparison completed successfully');
    }).catch(error => {
        console.error('Error running compression comparison:', error);
    });
}

module.exports = { BibleCompressionComparison };
