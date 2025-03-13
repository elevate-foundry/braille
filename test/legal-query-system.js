/**
 * Legal Query System
 * 
 * A system for efficient retrieval of legal precedents and statutes
 * using BBES-based indexing and MOTL for semantic understanding.
 */

const fs = require('fs');
const path = require('path');
const { M2MCompression } = require('../src/ai-core/m2m-compression');
const universalBrailleHandler = require('../js/universal-braille');

class LegalQuerySystem {
    constructor(options = {}) {
        this.options = {
            dataDir: path.join(__dirname, '../data/legal'),
            caseDir: path.join(__dirname, '../data/legal/cases'),
            statuteDir: path.join(__dirname, '../data/legal/statutes'),
            indexPath: path.join(__dirname, '../data/legal/legal-index.json'),
            conceptPath: path.join(__dirname, '../data/legal/legal-concept-hierarchy.json'),
            ...options
        };
        
        // Initialize components
        this.brailleHandler = universalBrailleHandler;
        this.compressor = new M2MCompression();
        
        // Load or create index
        this.index = this._loadIndex();
        
        // Load legal concept hierarchy
        this.concepts = this._loadConcepts();
    }
    
    /**
     * Load the legal document index
     * @private
     * @returns {Object} Legal document index
     */
    _loadIndex() {
        if (fs.existsSync(this.options.indexPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.options.indexPath, 'utf8'));
            } catch (err) {
                console.error(`Error loading index: ${err.message}`);
                return this._createEmptyIndex();
            }
        } else {
            return this._createEmptyIndex();
        }
    }
    
    /**
     * Create an empty index structure
     * @private
     * @returns {Object} Empty index structure
     */
    _createEmptyIndex() {
        return {
            cases: {},
            statutes: {},
            concepts: {},
            citations: {},
            lastUpdated: new Date().toISOString()
        };
    }
    
    /**
     * Load legal concept hierarchy
     * @private
     * @returns {Object} Legal concept hierarchy
     */
    _loadConcepts() {
        try {
            return JSON.parse(fs.readFileSync(this.options.conceptPath, 'utf8'));
        } catch (err) {
            console.error(`Error loading concepts: ${err.message}`);
            return { concepts: {}, relationships: [] };
        }
    }
    
    /**
     * Build or update the index of legal documents
     * @returns {Promise<void>}
     */
    async buildIndex() {
        console.log('[LEGAL] Building legal document index...');
        
        // Create directories if they don't exist
        [this.options.dataDir, this.options.caseDir, this.options.statuteDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Index cases
        await this._indexCases();
        
        // Index statutes
        await this._indexStatutes();
        
        // Build concept index
        this._buildConceptIndex();
        
        // Build citation network
        this._buildCitationNetwork();
        
        // Save index
        this._saveIndex();
        
        console.log('[LEGAL] Index built successfully.');
    }
    
    /**
     * Index legal cases
     * @private
     * @returns {Promise<void>}
     */
    async _indexCases() {
        console.log('[LEGAL] Indexing cases...');
        
        // Get all case files
        const caseFiles = fs.readdirSync(this.options.caseDir)
            .filter(file => file.endsWith('.json') || file.endsWith('.txt'));
        
        // Process each case file
        for (const file of caseFiles) {
            const filePath = path.join(this.options.caseDir, file);
            const caseId = path.basename(file, path.extname(file));
            
            try {
                // Read case content
                const content = fs.readFileSync(filePath, 'utf8');
                const caseData = file.endsWith('.json') ? JSON.parse(content) : { text: content };
                
                // Extract case metadata
                const metadata = this._extractCaseMetadata(caseData);
                
                // Generate BBES encoding
                const bbesEncoding = await this._generateBBES(caseData.text || content);
                
                // Generate compressed representation
                const compressed = await this.compressor.compress(caseData.text || content);
                
                // Store in index
                this.index.cases[caseId] = {
                    id: caseId,
                    title: metadata.title || caseId,
                    court: metadata.court || 'Unknown',
                    date: metadata.date || 'Unknown',
                    jurisdiction: metadata.jurisdiction || 'Unknown',
                    concepts: metadata.concepts || [],
                    citations: metadata.citations || [],
                    bbesEncoding,
                    compressed,
                    path: filePath
                };
            } catch (err) {
                console.error(`Error indexing case ${caseId}: ${err.message}`);
            }
        }
    }
    
    /**
     * Index legal statutes
     * @private
     * @returns {Promise<void>}
     */
    async _indexStatutes() {
        console.log('[LEGAL] Indexing statutes...');
        
        // Get all statute files
        const statuteFiles = fs.readdirSync(this.options.statuteDir)
            .filter(file => file.endsWith('.json') || file.endsWith('.txt'));
        
        // Process each statute file
        for (const file of statuteFiles) {
            const filePath = path.join(this.options.statuteDir, file);
            const statuteId = path.basename(file, path.extname(file));
            
            try {
                // Read statute content
                const content = fs.readFileSync(filePath, 'utf8');
                const statuteData = file.endsWith('.json') ? JSON.parse(content) : { text: content };
                
                // Extract statute metadata
                const metadata = this._extractStatuteMetadata(statuteData);
                
                // Generate BBES encoding
                const bbesEncoding = await this._generateBBES(statuteData.text || content);
                
                // Generate compressed representation
                const compressed = await this.compressor.compress(statuteData.text || content);
                
                // Store in index
                this.index.statutes[statuteId] = {
                    id: statuteId,
                    title: metadata.title || statuteId,
                    jurisdiction: metadata.jurisdiction || 'Unknown',
                    year: metadata.year || 'Unknown',
                    section: metadata.section || 'Unknown',
                    concepts: metadata.concepts || [],
                    citations: metadata.citations || [],
                    bbesEncoding,
                    compressed,
                    path: filePath
                };
            } catch (err) {
                console.error(`Error indexing statute ${statuteId}: ${err.message}`);
            }
        }
    }
    
    /**
     * Build concept index
     * @private
     */
    _buildConceptIndex() {
        console.log('[LEGAL] Building concept index...');
        
        // Initialize concept index
        this.index.concepts = {};
        
        // Process cases
        Object.values(this.index.cases).forEach(caseData => {
            caseData.concepts.forEach(concept => {
                if (!this.index.concepts[concept]) {
                    this.index.concepts[concept] = {
                        cases: [],
                        statutes: []
                    };
                }
                
                if (!this.index.concepts[concept].cases.includes(caseData.id)) {
                    this.index.concepts[concept].cases.push(caseData.id);
                }
            });
        });
        
        // Process statutes
        Object.values(this.index.statutes).forEach(statuteData => {
            statuteData.concepts.forEach(concept => {
                if (!this.index.concepts[concept]) {
                    this.index.concepts[concept] = {
                        cases: [],
                        statutes: []
                    };
                }
                
                if (!this.index.concepts[concept].statutes.includes(statuteData.id)) {
                    this.index.concepts[concept].statutes.push(statuteData.id);
                }
            });
        });
    }
    
    /**
     * Build citation network
     * @private
     */
    _buildCitationNetwork() {
        console.log('[LEGAL] Building citation network...');
        
        // Initialize citation index
        this.index.citations = {};
        
        // Process cases
        Object.values(this.index.cases).forEach(caseData => {
            this.index.citations[caseData.id] = {
                cites: caseData.citations,
                citedBy: []
            };
        });
        
        // Build cited-by relationships
        Object.values(this.index.cases).forEach(caseData => {
            caseData.citations.forEach(citation => {
                if (this.index.citations[citation]) {
                    if (!this.index.citations[citation].citedBy.includes(caseData.id)) {
                        this.index.citations[citation].citedBy.push(caseData.id);
                    }
                }
            });
        });
    }
    
    /**
     * Save index to file
     * @private
     */
    _saveIndex() {
        this.index.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.options.indexPath, JSON.stringify(this.index, null, 2));
    }
    
    /**
     * Extract metadata from case data
     * @private
     * @param {Object} caseData Case data
     * @returns {Object} Extracted metadata
     */
    _extractCaseMetadata(caseData) {
        // If metadata is already provided, use it
        if (caseData.metadata) {
            return caseData.metadata;
        }
        
        // Extract from text
        const text = caseData.text || '';
        
        // Simple regex-based extraction (would be more sophisticated in real implementation)
        const titleMatch = text.match(/^(.*?)(?:\n|$)/);
        const courtMatch = text.match(/Court:\s*(.*?)(?:\n|$)/i);
        const dateMatch = text.match(/Date:\s*(.*?)(?:\n|$)/i);
        const jurisdictionMatch = text.match(/Jurisdiction:\s*(.*?)(?:\n|$)/i);
        
        // Extract concepts using simple keyword matching
        const concepts = this._extractConceptsFromText(text);
        
        // Extract citations using regex
        const citations = this._extractCitationsFromText(text);
        
        return {
            title: titleMatch ? titleMatch[1].trim() : 'Unknown Case',
            court: courtMatch ? courtMatch[1].trim() : 'Unknown Court',
            date: dateMatch ? dateMatch[1].trim() : 'Unknown Date',
            jurisdiction: jurisdictionMatch ? jurisdictionMatch[1].trim() : 'Unknown Jurisdiction',
            concepts,
            citations
        };
    }
    
    /**
     * Extract metadata from statute data
     * @private
     * @param {Object} statuteData Statute data
     * @returns {Object} Extracted metadata
     */
    _extractStatuteMetadata(statuteData) {
        // If metadata is already provided, use it
        if (statuteData.metadata) {
            return statuteData.metadata;
        }
        
        // Extract from text
        const text = statuteData.text || '';
        
        // Simple regex-based extraction
        const titleMatch = text.match(/^(.*?)(?:\n|$)/);
        const jurisdictionMatch = text.match(/Jurisdiction:\s*(.*?)(?:\n|$)/i);
        const yearMatch = text.match(/Year:\s*(.*?)(?:\n|$)/i);
        const sectionMatch = text.match(/Section:\s*(.*?)(?:\n|$)/i);
        
        // Extract concepts using simple keyword matching
        const concepts = this._extractConceptsFromText(text);
        
        // Extract citations using regex
        const citations = this._extractCitationsFromText(text);
        
        return {
            title: titleMatch ? titleMatch[1].trim() : 'Unknown Statute',
            jurisdiction: jurisdictionMatch ? jurisdictionMatch[1].trim() : 'Unknown Jurisdiction',
            year: yearMatch ? yearMatch[1].trim() : 'Unknown Year',
            section: sectionMatch ? sectionMatch[1].trim() : 'Unknown Section',
            concepts,
            citations
        };
    }
    
    /**
     * Extract concepts from text using keyword matching
     * @private
     * @param {string} text Text to extract concepts from
     * @returns {Array<string>} Extracted concepts
     */
    _extractConceptsFromText(text) {
        const concepts = [];
        
        // Get all concept names from hierarchy
        const conceptNames = Object.keys(this.concepts.concepts || {});
        
        // Check each concept
        conceptNames.forEach(concept => {
            if (text.toLowerCase().includes(concept.toLowerCase())) {
                concepts.push(concept);
            }
        });
        
        return concepts;
    }
    
    /**
     * Extract citations from text using regex
     * @private
     * @param {string} text Text to extract citations from
     * @returns {Array<string>} Extracted citations
     */
    _extractCitationsFromText(text) {
        const citations = [];
        
        // Simple regex for case citations (would be more sophisticated in real implementation)
        const caseRegex = /(\w+)\s+v\.\s+(\w+)/g;
        let match;
        
        while ((match = caseRegex.exec(text)) !== null) {
            const citation = `${match[1]} v. ${match[2]}`;
            if (!citations.includes(citation)) {
                citations.push(citation);
            }
        }
        
        return citations;
    }
    
    /**
     * Generate BBES encoding for text
     * @private
     * @param {string} text Text to encode
     * @returns {Promise<string>} BBES encoding
     */
    async _generateBBES(text) {
        try {
            // Convert to braille
            const braille = this.brailleHandler.textToBraille(text);
            
            // In a real implementation, this would use the actual BBES encoding
            // For now, we'll just return the braille representation
            return braille;
        } catch (err) {
            console.error(`Error generating BBES: ${err.message}`);
            return '';
        }
    }
    
    /**
     * Query for legal documents
     * @param {Object} query Query parameters
     * @param {string} query.text Free text query
     * @param {Array<string>} query.concepts Concepts to filter by
     * @param {string} query.jurisdiction Jurisdiction to filter by
     * @param {string} query.docType Document type ('case', 'statute', or 'all')
     * @param {number} query.limit Maximum number of results
     * @returns {Promise<Array>} Query results
     */
    async query(query = {}) {
        console.log(`[LEGAL] Executing query: ${JSON.stringify(query)}`);
        
        // Default query parameters
        const {
            text = '',
            concepts = [],
            jurisdiction = null,
            docType = 'all',
            limit = 10
        } = query;
        
        // Determine which collections to search
        const searchCases = docType === 'all' || docType === 'case';
        const searchStatutes = docType === 'all' || docType === 'statute';
        
        // Collect all potential matches
        let matches = [];
        
        // If concepts are specified, use concept index
        if (concepts.length > 0) {
            concepts.forEach(concept => {
                if (this.index.concepts[concept]) {
                    if (searchCases) {
                        this.index.concepts[concept].cases.forEach(caseId => {
                            if (this.index.cases[caseId]) {
                                matches.push({
                                    type: 'case',
                                    id: caseId,
                                    data: this.index.cases[caseId],
                                    score: 0 // Will be calculated later
                                });
                            }
                        });
                    }
                    
                    if (searchStatutes) {
                        this.index.concepts[concept].statutes.forEach(statuteId => {
                            if (this.index.statutes[statuteId]) {
                                matches.push({
                                    type: 'statute',
                                    id: statuteId,
                                    data: this.index.statutes[statuteId],
                                    score: 0 // Will be calculated later
                                });
                            }
                        });
                    }
                }
            });
        } else {
            // If no concepts specified, include all documents
            if (searchCases) {
                Object.keys(this.index.cases).forEach(caseId => {
                    matches.push({
                        type: 'case',
                        id: caseId,
                        data: this.index.cases[caseId],
                        score: 0 // Will be calculated later
                    });
                });
            }
            
            if (searchStatutes) {
                Object.keys(this.index.statutes).forEach(statuteId => {
                    matches.push({
                        type: 'statute',
                        id: statuteId,
                        data: this.index.statutes[statuteId],
                        score: 0 // Will be calculated later
                    });
                });
            }
        }
        
        // Filter by jurisdiction if specified
        if (jurisdiction) {
            matches = matches.filter(match => 
                match.data.jurisdiction.toLowerCase() === jurisdiction.toLowerCase()
            );
        }
        
        // If text query is provided, calculate relevance scores
        if (text) {
            // Compress query text
            const queryCompressed = await this.compressor.compress(text);
            
            // Calculate similarity scores
            for (const match of matches) {
                match.score = this.compressor.calculateSimilarity(
                    queryCompressed,
                    match.data.compressed
                );
            }
        } else {
            // If no text query, give all matches the same score
            matches.forEach(match => match.score = 1);
        }
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        // Limit results
        matches = matches.slice(0, limit);
        
        // Format results
        const results = matches.map(match => ({
            type: match.type,
            id: match.id,
            title: match.data.title,
            jurisdiction: match.data.jurisdiction,
            score: match.score,
            concepts: match.data.concepts,
            ...(match.type === 'case' ? {
                court: match.data.court,
                date: match.data.date
            } : {
                year: match.data.year,
                section: match.data.section
            })
        }));
        
        console.log(`[LEGAL] Query returned ${results.length} results`);
        return results;
    }
    
    /**
     * Get related documents for a specific document
     * @param {string} id Document ID
     * @param {string} type Document type ('case' or 'statute')
     * @param {number} limit Maximum number of results
     * @returns {Promise<Object>} Related documents
     */
    async getRelated(id, type, limit = 10) {
        console.log(`[LEGAL] Finding related documents for ${type} ${id}`);
        
        // Check if document exists
        const docCollection = type === 'case' ? this.index.cases : this.index.statutes;
        const document = docCollection[id];
        
        if (!document) {
            throw new Error(`Document ${id} of type ${type} not found`);
        }
        
        // Get documents with similar concepts
        const conceptMatches = [];
        document.concepts.forEach(concept => {
            if (this.index.concepts[concept]) {
                // Get cases with this concept
                this.index.concepts[concept].cases.forEach(caseId => {
                    if (caseId !== id && this.index.cases[caseId]) {
                        conceptMatches.push({
                            type: 'case',
                            id: caseId,
                            data: this.index.cases[caseId],
                            score: 0 // Will be calculated later
                        });
                    }
                });
                
                // Get statutes with this concept
                this.index.concepts[concept].statutes.forEach(statuteId => {
                    if (statuteId !== id && this.index.statutes[statuteId]) {
                        conceptMatches.push({
                            type: 'statute',
                            id: statuteId,
                            data: this.index.statutes[statuteId],
                            score: 0 // Will be calculated later
                        });
                    }
                });
            }
        });
        
        // Get cited documents (for cases)
        const citationMatches = [];
        if (type === 'case' && this.index.citations[id]) {
            // Get documents cited by this case
            this.index.citations[id].cites.forEach(citedId => {
                if (this.index.cases[citedId]) {
                    citationMatches.push({
                        type: 'case',
                        id: citedId,
                        data: this.index.cases[citedId],
                        relation: 'cited'
                    });
                }
            });
            
            // Get documents citing this case
            this.index.citations[id].citedBy.forEach(citingId => {
                if (this.index.cases[citingId]) {
                    citationMatches.push({
                        type: 'case',
                        id: citingId,
                        data: this.index.cases[citingId],
                        relation: 'citing'
                    });
                }
            });
        }
        
        // Calculate similarity scores for concept matches
        for (const match of conceptMatches) {
            match.score = this.compressor.calculateSimilarity(
                document.compressed,
                match.data.compressed
            );
        }
        
        // Sort concept matches by score
        conceptMatches.sort((a, b) => b.score - a.score);
        
        // Format results
        const conceptResults = conceptMatches.slice(0, limit).map(match => ({
            type: match.type,
            id: match.id,
            title: match.data.title,
            jurisdiction: match.data.jurisdiction,
            score: match.score,
            concepts: match.data.concepts,
            ...(match.type === 'case' ? {
                court: match.data.court,
                date: match.data.date
            } : {
                year: match.data.year,
                section: match.data.section
            })
        }));
        
        const citationResults = citationMatches.map(match => ({
            type: match.type,
            id: match.id,
            title: match.data.title,
            jurisdiction: match.data.jurisdiction,
            relation: match.relation,
            court: match.data.court,
            date: match.data.date
        }));
        
        return {
            conceptRelated: conceptResults,
            citationRelated: citationResults
        };
    }
    
    /**
     * Get document details
     * @param {string} id Document ID
     * @param {string} type Document type ('case' or 'statute')
     * @returns {Promise<Object>} Document details
     */
    async getDocument(id, type) {
        console.log(`[LEGAL] Getting document ${type} ${id}`);
        
        // Check if document exists
        const docCollection = type === 'case' ? this.index.cases : this.index.statutes;
        const document = docCollection[id];
        
        if (!document) {
            throw new Error(`Document ${id} of type ${type} not found`);
        }
        
        // Read document content
        let content;
        try {
            content = fs.readFileSync(document.path, 'utf8');
            if (document.path.endsWith('.json')) {
                const data = JSON.parse(content);
                content = data.text || content;
            }
        } catch (err) {
            console.error(`Error reading document: ${err.message}`);
            content = 'Error: Document content could not be read';
        }
        
        // Get related documents
        const related = await this.getRelated(id, type, 5);
        
        return {
            id: document.id,
            type,
            title: document.title,
            content,
            metadata: {
                ...(type === 'case' ? {
                    court: document.court,
                    date: document.date
                } : {
                    year: document.year,
                    section: document.section
                }),
                jurisdiction: document.jurisdiction,
                concepts: document.concepts,
                citations: document.citations
            },
            related
        };
    }
}

// Export the class
module.exports = { LegalQuerySystem };

// Run indexer if executed directly
if (require.main === module) {
    const querySystem = new LegalQuerySystem();
    querySystem.buildIndex().then(() => {
        console.log('[LEGAL] Index built successfully. Ready for queries.');
    }).catch(err => {
        console.error(`[LEGAL] Error building index: ${err.message}`);
    });
}
