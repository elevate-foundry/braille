/**
 * Legal System Demo
 * 
 * This script demonstrates the full functionality of the legal analysis system:
 * 1. Runs the legal benchmarks
 * 2. Generates visualizations
 * 3. Performs sample queries
 */

const fs = require('fs');
const path = require('path');
const { MOTLLegalBenchmark } = require('./motl-legal-benchmark');
const { MOTLLegalVisualizer } = require('./motl-legal-visualizer');
const { LegalQuerySystem } = require('./legal-query-system');

// Ensure benchmark results directory exists
const benchmarkDir = path.join(__dirname, '../benchmark-results/legal');
if (!fs.existsSync(benchmarkDir)) {
    fs.mkdirSync(benchmarkDir, { recursive: true });
}

/**
 * Run legal benchmarks
 * @returns {Promise<Object>} Benchmark results
 */
async function runLegalBenchmarks() {
    console.log('Running MOTL legal benchmarks...');
    
    const benchmark = new MOTLLegalBenchmark();
    const results = await benchmark.runAllBenchmarks();
    
    // Save benchmark results
    const resultsPath = path.join(benchmarkDir, 'all-benchmarks.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log(`Benchmark results saved to ${resultsPath}`);
    return results;
}

/**
 * Generate legal visualizations
 * @param {Object} benchmarkResults Benchmark results
 */
function generateLegalVisualizations(benchmarkResults) {
    console.log('Generating legal visualizations...');
    
    const visualizer = new MOTLLegalVisualizer({
        benchmarkResults
    });
    
    visualizer.generateVisualization();
    
    console.log(`Visualization generated at ${visualizer.options.outputPath}`);
}

/**
 * Run sample legal queries
 * @returns {Promise<void>}
 */
async function runSampleQueries() {
    console.log('Running sample legal queries...');
    
    const querySystem = new LegalQuerySystem();
    
    // Query by text
    console.log('\n1. Query by text: "constitutional rights"');
    const textResults = await querySystem.query({
        text: 'constitutional rights',
        limit: 5
    });
    
    console.log(`Found ${textResults.length} results:`);
    textResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title} (${result.type}, score: ${result.score.toFixed(2)})`);
    });
    
    // Query by concept
    console.log('\n2. Query by concept: "constitutional_law"');
    const conceptResults = await querySystem.query({
        concepts: ['constitutional_law'],
        limit: 5
    });
    
    console.log(`Found ${conceptResults.length} results:`);
    conceptResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title} (${result.type}, score: ${result.score.toFixed(2)})`);
    });
    
    // Get document details
    if (textResults.length > 0) {
        const firstResult = textResults[0];
        console.log(`\n3. Getting details for: ${firstResult.title}`);
        
        const details = await querySystem.getDocument(firstResult.id, firstResult.type);
        
        console.log(`  Title: ${details.title}`);
        console.log(`  Type: ${details.type}`);
        console.log(`  Jurisdiction: ${details.metadata.jurisdiction}`);
        console.log(`  Concepts: ${details.metadata.concepts.join(', ')}`);
        console.log(`  Text excerpt: ${details.content.substring(0, 150)}...`);
        
        // Get related documents
        console.log(`\n4. Finding related documents for: ${firstResult.title}`);
        
        const related = await querySystem.getRelated(firstResult.id, firstResult.type, 3);
        
        console.log('  Concept-related documents:');
        related.conceptRelated.forEach((doc, index) => {
            console.log(`    ${index + 1}. ${doc.title} (${doc.type}, score: ${doc.score.toFixed(2)})`);
        });
        
        console.log('  Citation-related documents:');
        if (related.citationRelated.length === 0) {
            console.log('    No citation-related documents found');
        } else {
            related.citationRelated.forEach((doc, index) => {
                console.log(`    ${index + 1}. ${doc.title} (${doc.relation})`);
            });
        }
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Run benchmarks
        const benchmarkResults = await runLegalBenchmarks();
        
        // Generate visualizations
        generateLegalVisualizations(benchmarkResults);
        
        // Run sample queries
        await runSampleQueries();
        
        console.log('\nLegal system demo completed successfully!');
        console.log('You can view the visualization by opening:');
        console.log(`file://${path.join(benchmarkDir, 'legal-visualization.html')}`);
    } catch (err) {
        console.error(`Error running legal system demo: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
}

// Run main function
main();
