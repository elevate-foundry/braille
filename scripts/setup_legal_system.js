/**
 * Setup Legal System
 * 
 * This script sets up the legal query system by:
 * 1. Fetching legal documents using the Python script
 * 2. Building the legal document index
 * 3. Running a sample query to test the system
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { LegalQuerySystem } = require('../test/legal-query-system');

// Paths
const SCRIPTS_DIR = __dirname;
const PROJECT_DIR = path.join(__dirname, '..');

/**
 * Run a command and return a promise that resolves when the command completes
 * @param {string} command Command to run
 * @param {Array<string>} args Command arguments
 * @param {Object} options Command options
 * @returns {Promise<string>} Command output
 */
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            cwd: options.cwd || SCRIPTS_DIR,
            env: { ...process.env, ...options.env },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            console.log(text);
        });
        
        proc.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            console.error(text);
        });
        
        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });
    });
}

/**
 * Fetch legal documents using the Python script
 * @param {Object} options Options for fetching documents
 * @returns {Promise<void>}
 */
async function fetchLegalDocuments(options = {}) {
    const { count = 10, query = 'constitutional law' } = options;
    
    console.log(`Fetching ${count} legal documents with query "${query}"...`);
    
    const args = [
        path.join(SCRIPTS_DIR, 'fetch_legal_documents.py'),
        '--count', count.toString()
    ];
    
    if (query) {
        args.push('--query', query);
    }
    
    try {
        await runCommand('python3', args, { cwd: PROJECT_DIR });
        console.log('Successfully fetched legal documents');
    } catch (err) {
        console.error(`Error fetching legal documents: ${err.message}`);
        throw err;
    }
}

/**
 * Initialize the legal query system
 * @returns {Promise<LegalQuerySystem>}
 */
async function initializeLegalSystem() {
    console.log('Initializing legal query system...');
    
    // Create query system
    const querySystem = new LegalQuerySystem();
    
    // Build index
    await querySystem.buildIndex();
    
    return querySystem;
}

/**
 * Run a sample query to test the system
 * @param {LegalQuerySystem} querySystem Legal query system
 * @returns {Promise<void>}
 */
async function runSampleQuery(querySystem) {
    console.log('Running sample queries to test the system...');
    
    // Query by text
    const textResults = await querySystem.query({
        text: 'constitutional rights',
        limit: 5
    });
    
    console.log('\nQuery results for "constitutional rights":');
    console.log(JSON.stringify(textResults, null, 2));
    
    // Query by concept
    const conceptResults = await querySystem.query({
        concepts: ['constitutional_law'],
        limit: 5
    });
    
    console.log('\nQuery results for concept "constitutional_law":');
    console.log(JSON.stringify(conceptResults, null, 2));
    
    // If we have results, get details for the first one
    if (textResults.length > 0) {
        const firstResult = textResults[0];
        const details = await querySystem.getDocument(firstResult.id, firstResult.type);
        
        console.log('\nDetails for first result:');
        console.log(`Title: ${details.title}`);
        console.log(`Type: ${details.type}`);
        console.log(`Jurisdiction: ${details.metadata.jurisdiction}`);
        console.log(`Concepts: ${details.metadata.concepts.join(', ')}`);
        
        // Get related documents
        const related = await querySystem.getRelated(firstResult.id, firstResult.type, 3);
        
        console.log('\nRelated documents:');
        console.log(JSON.stringify(related, null, 2));
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Fetch legal documents
        await fetchLegalDocuments({ count: 10, query: 'constitutional rights' });
        
        // Initialize legal system
        const querySystem = await initializeLegalSystem();
        
        // Run sample query
        await runSampleQuery(querySystem);
        
        console.log('\nLegal system setup complete!');
    } catch (err) {
        console.error(`Error setting up legal system: ${err.message}`);
        process.exit(1);
    }
}

// Run main function
main();
