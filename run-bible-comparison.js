/**
 * Script to run the Bible compression comparison
 */

const { BibleCompressionComparison } = require('./bible-compression-comparison');
const { MOTLProtocol, MOTLReligiousTexts, M2MCompression, BrailleCompression } = require('./mock-implementations');

// Create a comparison instance with smaller chunk size for faster processing
const comparison = new BibleCompressionComparison({
    bibleFilePath: './sample-bible-text.txt', // Use our sample text file
    chunkSize: 512 * 1024, // 512KB chunks
    // Use fewer languages for faster results
    languages: ['en', 'es', 'fr', 'zh', 'ar'],
    // Use fewer compression levels for faster results
    compressionLevels: [0.8, 0.95],
    // Use our mock implementations
    mockImplementations: {
        MOTLProtocol,
        MOTLReligiousTexts,
        M2MCompression,
        BrailleCompression
    }
});

// Run the comparison
comparison.runComparison().then(() => {
    console.log('Compression comparison completed successfully');
}).catch(error => {
    console.error('Error running compression comparison:', error);
});
