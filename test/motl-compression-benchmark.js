/**
 * MOTL Compression Benchmark
 * 
 * This module benchmarks MOTL against standard compression algorithms
 * including gzip, LZMA, and BPE tokenization (similar to GPT models).
 * 
 * It provides statistical validation through bootstrap resampling and
 * confidence intervals for compression ratios.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');
const { MOTLBenchmark } = require('./motl-benchmark');

/**
 * Compression Benchmark class that compares MOTL against standard algorithms
 */
class MOTLCompressionBenchmark {
    /**
     * Create a new compression benchmark
     * @param {Object} options - Benchmark options
     * @param {string} options.dataDir - Directory containing test data
     * @param {string} options.resultsDir - Directory to save results
     * @param {number} options.trials - Number of trials for statistical validation
     * @param {Array<string>} options.algorithms - Compression algorithms to benchmark
     */
    constructor(options = {}) {
        this.options = {
            dataDir: path.join(__dirname, '../data'),
            resultsDir: path.join(__dirname, '../benchmark-results'),
            trials: 10,
            algorithms: ['gzip', 'lzma', 'bpe', 'motl'],
            ...options
        };

        // Create results directory if it doesn't exist
        if (!fs.existsSync(this.options.resultsDir)) {
            fs.mkdirSync(this.options.resultsDir, { recursive: true });
        }

        this.motlBenchmark = new MOTLBenchmark();
        this.results = {
            compressionRatios: {},
            processingTimes: {},
            confidenceIntervals: {}
        };
    }

    /**
     * Run the compression benchmark
     * @param {Array<string>} textFiles - List of text files to benchmark
     * @returns {Object} Benchmark results
     */
    async runBenchmark(textFiles = []) {
        console.log('=== MOTL COMPRESSION BENCHMARK ===\n');
        
        // If no files specified, use all text files in the data directory
        if (textFiles.length === 0) {
            textFiles = fs.readdirSync(this.options.dataDir)
                .filter(file => file.endsWith('.txt'))
                .map(file => path.join(this.options.dataDir, file));
        }

        // Initialize results for each algorithm
        this.options.algorithms.forEach(algo => {
            this.results.compressionRatios[algo] = {};
            this.results.processingTimes[algo] = {};
        });

        // Process each text file
        for (const filePath of textFiles) {
            const fileName = path.basename(filePath);
            console.log(`Processing ${fileName}...`);
            
            const text = fs.readFileSync(filePath, 'utf8');
            const originalSize = Buffer.byteLength(text, 'utf8');
            
            console.log(`Original size: ${originalSize} bytes`);
            
            // Run trials for each algorithm
            for (const algo of this.options.algorithms) {
                console.log(`Running ${algo} compression...`);
                
                const trialResults = {
                    compressionRatios: [],
                    processingTimes: []
                };
                
                for (let i = 0; i < this.options.trials; i++) {
                    const result = await this._compressWithAlgorithm(algo, text);
                    trialResults.compressionRatios.push(result.compressionRatio);
                    trialResults.processingTimes.push(result.processingTime);
                }
                
                // Calculate average results
                const avgCompressionRatio = trialResults.compressionRatios.reduce((a, b) => a + b, 0) / this.options.trials;
                const avgProcessingTime = trialResults.processingTimes.reduce((a, b) => a + b, 0) / this.options.trials;
                
                // Calculate confidence intervals
                const compressionCI = this._calculateConfidenceInterval(trialResults.compressionRatios);
                
                this.results.compressionRatios[algo][fileName] = avgCompressionRatio;
                this.results.processingTimes[algo][fileName] = avgProcessingTime;
                this.results.confidenceIntervals[algo] = this.results.confidenceIntervals[algo] || {};
                this.results.confidenceIntervals[algo][fileName] = compressionCI;
                
                console.log(`${algo} - Compression Ratio: ${avgCompressionRatio.toFixed(2)}:1 (${compressionCI.lower.toFixed(2)}-${compressionCI.upper.toFixed(2)}), Processing Time: ${avgProcessingTime.toFixed(2)}ms`);
            }
            
            console.log('');
        }
        
        // Save benchmark results
        this._saveResults();
        
        // Generate comparison report
        this._generateComparisonReport(textFiles);
        
        return this.results;
    }
    
    /**
     * Compress text with the specified algorithm
     * @private
     * @param {string} algorithm - Compression algorithm to use
     * @param {string} text - Text to compress
     * @returns {Object} Compression results
     */
    async _compressWithAlgorithm(algorithm, text) {
        const originalSize = Buffer.byteLength(text, 'utf8');
        let compressedSize = 0;
        let processingTime = 0;
        
        const startTime = process.hrtime();
        
        switch (algorithm) {
            case 'gzip':
                compressedSize = zlib.gzipSync(text).length;
                break;
                
            case 'lzma':
                // Use external lzma command if available, otherwise fall back to gzip
                try {
                    const tempFile = path.join(this.options.resultsDir, 'temp.txt');
                    fs.writeFileSync(tempFile, text);
                    execSync(`lzma -z -f -k ${tempFile}`);
                    compressedSize = fs.statSync(`${tempFile}.lzma`).size;
                    fs.unlinkSync(`${tempFile}.lzma`);
                    fs.unlinkSync(tempFile);
                } catch (error) {
                    console.warn('LZMA command not available, falling back to gzip');
                    compressedSize = zlib.gzipSync(text).length;
                }
                break;
                
            case 'bpe':
                // Simulate BPE tokenization (similar to GPT models)
                // This is a simplified approximation of BPE
                const tokens = this._simulateBPETokenization(text);
                compressedSize = tokens.length * 2; // Assuming 2 bytes per token on average
                break;
                
            case 'motl':
                // Use the MOTL benchmark for compression
                const motlResult = await this.motlBenchmark.compressText(text);
                compressedSize = motlResult.compressedSize;
                break;
                
            default:
                throw new Error(`Unknown compression algorithm: ${algorithm}`);
        }
        
        const hrend = process.hrtime(startTime);
        processingTime = hrend[0] * 1000 + hrend[1] / 1000000;
        
        const compressionRatio = originalSize / compressedSize;
        
        return {
            originalSize,
            compressedSize,
            compressionRatio,
            processingTime
        };
    }
    
    /**
     * Simulate BPE tokenization (simplified)
     * @private
     * @param {string} text - Text to tokenize
     * @returns {Array<string>} Tokens
     */
    _simulateBPETokenization(text) {
        // This is a simplified simulation of BPE tokenization
        // In a real implementation, we would use a proper BPE tokenizer
        
        // Split text into words and punctuation
        const words = text.split(/([.,!?;:'"()\s])/g).filter(Boolean);
        
        // Simulate merging of common pairs
        const tokens = [];
        for (const word of words) {
            if (word.length <= 2) {
                tokens.push(word);
            } else {
                // Split longer words into subwords
                let i = 0;
                while (i < word.length) {
                    const subwordLength = Math.min(
                        Math.max(2, Math.floor(Math.random() * 4) + 1),
                        word.length - i
                    );
                    tokens.push(word.substring(i, i + subwordLength));
                    i += subwordLength;
                }
            }
        }
        
        return tokens;
    }
    
    /**
     * Calculate 95% confidence interval using bootstrap resampling
     * @private
     * @param {Array<number>} data - Data points
     * @returns {Object} Confidence interval
     */
    _calculateConfidenceInterval(data) {
        const n = data.length;
        const bootstrapSamples = 1000;
        const means = [];
        
        // Generate bootstrap samples
        for (let i = 0; i < bootstrapSamples; i++) {
            const sample = [];
            for (let j = 0; j < n; j++) {
                const index = Math.floor(Math.random() * n);
                sample.push(data[index]);
            }
            means.push(sample.reduce((a, b) => a + b, 0) / n);
        }
        
        // Sort means for percentile calculation
        means.sort((a, b) => a - b);
        
        // Calculate 95% confidence interval
        const lower = means[Math.floor(bootstrapSamples * 0.025)];
        const upper = means[Math.floor(bootstrapSamples * 0.975)];
        
        return { lower, upper };
    }
    
    /**
     * Save benchmark results to file
     * @private
     */
    _saveResults() {
        const resultsPath = path.join(this.options.resultsDir, 'compression-benchmark-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`Benchmark results saved to ${resultsPath}`);
    }
    
    /**
     * Generate a comparison report
     * @private
     * @param {Array<string>} textFiles - List of text files benchmarked
     */
    _generateComparisonReport(textFiles) {
        console.log('\n=== COMPRESSION BENCHMARK SUMMARY ===\n');
        
        // Calculate average compression ratios across all files
        const avgCompressionRatios = {};
        const fileNames = textFiles.map(file => path.basename(file));
        
        for (const algo of this.options.algorithms) {
            const ratios = fileNames.map(file => this.results.compressionRatios[algo][file]);
            avgCompressionRatios[algo] = ratios.reduce((a, b) => a + b, 0) / ratios.length;
            
            // Calculate relative improvement compared to gzip
            if (algo !== 'gzip' && avgCompressionRatios['gzip']) {
                const improvement = avgCompressionRatios[algo] / avgCompressionRatios['gzip'];
                console.log(`${algo}: ${avgCompressionRatios[algo].toFixed(2)}:1 (${improvement.toFixed(2)}x better than gzip)`);
            } else if (algo === 'gzip') {
                console.log(`${algo}: ${avgCompressionRatios[algo].toFixed(2)}:1 (baseline)`);
            }
        }
        
        // Generate statistical significance report
        console.log('\nStatistical Significance:');
        for (const algo of this.options.algorithms) {
            if (algo === 'gzip') continue;
            
            const significant = this._isStatisticallySignificant(
                fileNames.map(file => this.results.confidenceIntervals['gzip'][file]),
                fileNames.map(file => this.results.confidenceIntervals[algo][file])
            );
            
            console.log(`${algo} vs. gzip: ${significant ? 'Significant improvement' : 'Not statistically significant'}`);
        }
        
        console.log('\nCompression benchmark completed successfully');
    }
    
    /**
     * Check if the difference between two sets of confidence intervals is statistically significant
     * @private
     * @param {Array<Object>} baselineIntervals - Baseline confidence intervals
     * @param {Array<Object>} comparisonIntervals - Comparison confidence intervals
     * @returns {boolean} Whether the difference is statistically significant
     */
    _isStatisticallySignificant(baselineIntervals, comparisonIntervals) {
        // Check if confidence intervals overlap for each file
        const overlaps = baselineIntervals.map((baseline, i) => {
            const comparison = comparisonIntervals[i];
            return !(comparison.lower > baseline.upper || comparison.upper < baseline.lower);
        });
        
        // If more than half of the files show non-overlapping intervals, consider it significant
        return overlaps.filter(Boolean).length < overlaps.length / 2;
    }
}

// Export the class
module.exports = { MOTLCompressionBenchmark };

// Run benchmark if executed directly
if (require.main === module) {
    const benchmark = new MOTLCompressionBenchmark();
    benchmark.runBenchmark();
}
