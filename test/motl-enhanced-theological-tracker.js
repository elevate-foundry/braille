/**
 * Enhanced Theological Concept Tracker for MOTL
 * 
 * This module implements a more sophisticated approach to tracking theological concepts
 * using a hierarchical model and contextual understanding rather than simple keyword matching.
 */

const fs = require('fs');
const path = require('path');

class MOTLEnhancedTheologicalTracker {
    /**
     * Create a new enhanced theological concept tracker
     * @param {Object} options - Tracker options
     * @param {string} options.conceptHierarchyPath - Path to the concept hierarchy JSON file
     * @param {number} options.contextWindowSize - Size of the context window for analysis
     * @param {boolean} options.useWeightedScoring - Whether to use weighted scoring based on concept importance
     */
    constructor(options = {}) {
        this.options = {
            conceptHierarchyPath: path.join(__dirname, '../data/theological-concept-hierarchy.json'),
            contextWindowSize: 100, // Characters to consider for context
            useWeightedScoring: true,
            ...options
        };
        
        // Load concept hierarchy
        this.conceptHierarchy = this._loadConceptHierarchy();
        
        // Initialize tracking results
        this.trackingResults = {
            conceptOccurrences: {},
            conceptCoherence: {},
            crossReferenceMap: {},
            conceptualEvolution: {}
        };
        
        // Initialize concept indicators (words/phrases that indicate concepts)
        this.conceptIndicators = this._buildConceptIndicators();
    }
    
    /**
     * Load the concept hierarchy from file
     * @private
     * @returns {Object} Concept hierarchy
     */
    _loadConceptHierarchy() {
        try {
            const hierarchyData = fs.readFileSync(this.options.conceptHierarchyPath, 'utf8');
            return JSON.parse(hierarchyData);
        } catch (error) {
            console.error(`Error loading concept hierarchy: ${error.message}`);
            // Return a minimal default hierarchy if file can't be loaded
            return {
                concepts: {
                    tawhid: { name: "Tawhid", importance: 1.0 },
                    risalah: { name: "Risalah", importance: 0.9 },
                    akhirah: { name: "Akhirah", importance: 0.9 }
                },
                relationships: [],
                crossReligiousMapping: {}
            };
        }
    }
    
    /**
     * Build concept indicators from the hierarchy
     * @private
     * @returns {Object} Mapping of indicators to concepts
     */
    _buildConceptIndicators() {
        const indicators = {};
        
        // Process each primary concept
        Object.entries(this.conceptHierarchy.concepts).forEach(([conceptKey, concept]) => {
            // Add the concept name and variations as indicators
            this._addConceptIndicators(indicators, conceptKey, concept);
            
            // Process subconcepts if they exist
            if (concept.subconcepts) {
                Object.entries(concept.subconcepts).forEach(([subKey, subconcept]) => {
                    // Add subconcept as an indicator for the parent concept
                    this._addConceptIndicators(indicators, conceptKey, subconcept);
                });
            }
        });
        
        return indicators;
    }
    
    /**
     * Add concept indicators for a concept
     * @private
     * @param {Object} indicators - Indicators object to add to
     * @param {string} conceptKey - Key of the concept
     * @param {Object} concept - Concept data
     */
    _addConceptIndicators(indicators, conceptKey, concept) {
        // Add the concept name as an indicator
        const name = concept.name.toLowerCase();
        indicators[name] = indicators[name] || [];
        if (!indicators[name].includes(conceptKey)) {
            indicators[name].push(conceptKey);
        }
        
        // Add the concept key as an indicator
        indicators[conceptKey.toLowerCase()] = indicators[conceptKey.toLowerCase()] || [];
        if (!indicators[conceptKey.toLowerCase()].includes(conceptKey)) {
            indicators[conceptKey.toLowerCase()].push(conceptKey);
        }
        
        // Add variations without parentheses if they exist
        if (name.includes('(')) {
            const simpleName = name.split('(')[0].trim().toLowerCase();
            indicators[simpleName] = indicators[simpleName] || [];
            if (!indicators[simpleName].includes(conceptKey)) {
                indicators[simpleName].push(conceptKey);
            }
        }
    }
    
    /**
     * Track theological concepts in a text
     * @param {string} text - Text to analyze
     * @returns {Object} Tracking results
     */
    trackConcepts(text) {
        // Reset tracking results
        this.trackingResults = {
            conceptOccurrences: {},
            conceptCoherence: {},
            crossReferenceMap: {},
            conceptualEvolution: {}
        };
        
        // Initialize concept occurrences
        Object.keys(this.conceptHierarchy.concepts).forEach(concept => {
            this.trackingResults.conceptOccurrences[concept] = 0;
            this.trackingResults.crossReferenceMap[concept] = [];
            this.trackingResults.conceptualEvolution[concept] = [];
        });
        
        // Split text into paragraphs for context
        const paragraphs = text.split(/\\n\\n|\\r\\n\\r\\n|\\n|\\r\\n/);
        
        // Track concepts in each paragraph
        paragraphs.forEach((paragraph, paragraphIndex) => {
            this._trackConceptsInParagraph(paragraph, paragraphIndex);
        });
        
        // Calculate concept coherence
        this._calculateConceptCoherence();
        
        // Simulate conceptual evolution
        this._simulateConceptualEvolution();
        
        return this.trackingResults;
    }
    
    /**
     * Track concepts in a paragraph
     * @private
     * @param {string} paragraph - Paragraph to analyze
     * @param {number} paragraphIndex - Index of the paragraph in the text
     */
    _trackConceptsInParagraph(paragraph, paragraphIndex) {
        // Convert to lowercase for case-insensitive matching
        const lowerParagraph = paragraph.toLowerCase();
        
        // Find all concept indicators in the paragraph
        const foundConcepts = new Set();
        
        Object.entries(this.conceptIndicators).forEach(([indicator, concepts]) => {
            // Look for the indicator in the paragraph
            if (lowerParagraph.includes(indicator)) {
                // Get the context around the indicator
                const indicatorIndex = lowerParagraph.indexOf(indicator);
                const contextStart = Math.max(0, indicatorIndex - this.options.contextWindowSize / 2);
                const contextEnd = Math.min(lowerParagraph.length, indicatorIndex + indicator.length + this.options.contextWindowSize / 2);
                const context = lowerParagraph.substring(contextStart, contextEnd);
                
                // Add all associated concepts
                concepts.forEach(concept => {
                    foundConcepts.add(concept);
                    
                    // Increment occurrence count
                    this.trackingResults.conceptOccurrences[concept]++;
                    
                    // Record reference
                    this.trackingResults.crossReferenceMap[concept].push({
                        source: `paragraph:${paragraphIndex}`,
                        target: `${indicator}:${indicatorIndex}`,
                        context
                    });
                });
            }
        });
        
        // Find relationships between concepts in the same paragraph
        const conceptsArray = Array.from(foundConcepts);
        for (let i = 0; i < conceptsArray.length; i++) {
            for (let j = i + 1; j < conceptsArray.length; j++) {
                const concept1 = conceptsArray[i];
                const concept2 = conceptsArray[j];
                
                // Record cross-reference
                this.trackingResults.crossReferenceMap[concept1].push({
                    source: `paragraph:${paragraphIndex}`,
                    target: `concept:${concept2}`,
                    context: paragraph
                });
                
                this.trackingResults.crossReferenceMap[concept2].push({
                    source: `paragraph:${paragraphIndex}`,
                    target: `concept:${concept1}`,
                    context: paragraph
                });
            }
        }
    }
    
    /**
     * Calculate coherence between concepts based on co-occurrence
     * @private
     */
    _calculateConceptCoherence() {
        const concepts = Object.keys(this.conceptHierarchy.concepts);
        
        concepts.forEach(concept1 => {
            this.trackingResults.conceptCoherence[concept1] = {};
            
            concepts.forEach(concept2 => {
                if (concept1 === concept2) {
                    this.trackingResults.conceptCoherence[concept1][concept2] = 1.0;
                    return;
                }
                
                // Count paragraphs where both concepts appear
                const refs1 = this.trackingResults.crossReferenceMap[concept1];
                const refs2 = this.trackingResults.crossReferenceMap[concept2];
                
                // Get paragraph sources
                const paragraphs1 = new Set(refs1.map(ref => ref.source).filter(source => source.startsWith('paragraph:')));
                const paragraphs2 = new Set(refs2.map(ref => ref.source).filter(source => source.startsWith('paragraph:')));
                
                // Count shared paragraphs
                let sharedCount = 0;
                paragraphs1.forEach(p => {
                    if (paragraphs2.has(p)) sharedCount++;
                });
                
                // Calculate Jaccard similarity
                const unionCount = paragraphs1.size + paragraphs2.size - sharedCount;
                const coherence = unionCount > 0 ? sharedCount / unionCount : 0;
                
                this.trackingResults.conceptCoherence[concept1][concept2] = coherence;
            });
        });
    }
    
    /**
     * Simulate conceptual evolution throughout the text
     * @private
     */
    _simulateConceptualEvolution() {
        const concepts = Object.keys(this.conceptHierarchy.concepts);
        
        concepts.forEach(concept => {
            // Get concept importance from hierarchy
            const importance = this.conceptHierarchy.concepts[concept].importance || 0.5;
            
            // Get occurrence count
            const occurrences = this.trackingResults.conceptOccurrences[concept];
            
            // Simulate evolution stages (simplified)
            const stages = [0.2, 0.4, 0.6, 0.8, 1.0];
            
            stages.forEach(stage => {
                // Calculate semantic density based on importance and occurrences
                const semanticDensity = occurrences > 0 ? 
                    importance * stage * (1 + Math.log(occurrences)) / 10 : 0;
                
                // Generate contextual modifiers
                const modifiers = this._generateContextualModifiers(concept, stage);
                
                // Calculate bit depth allocation
                const bitDepthAllocation = occurrences > 0 ? 
                    Math.ceil(importance * 8 * stage) : 0;
                
                // Add evolution stage
                this.trackingResults.conceptualEvolution[concept].push({
                    stage,
                    semanticDensity,
                    contextualModifiers: modifiers,
                    bitDepthAllocation
                });
            });
        });
    }
    
    /**
     * Generate contextual modifiers for a concept at a specific stage
     * @private
     * @param {string} concept - Concept key
     * @param {number} stage - Evolution stage (0-1)
     * @returns {Array<string>} Contextual modifiers
     */
    _generateContextualModifiers(concept, stage) {
        const modifiers = [];
        
        // Add modifiers based on concept relationships
        this.conceptHierarchy.relationships.forEach(rel => {
            if (rel.source === concept || rel.target === concept) {
                const relatedConcept = rel.source === concept ? rel.target : rel.source;
                const relationType = rel.type;
                
                // Only add modifiers if the relationship is strong enough for the current stage
                if (rel.strength >= stage) {
                    modifiers.push(`${relationType}:${relatedConcept}`);
                }
            }
        });
        
        // Add subconcept modifiers if they exist
        const conceptData = this.conceptHierarchy.concepts[concept];
        if (conceptData && conceptData.subconcepts) {
            Object.entries(conceptData.subconcepts).forEach(([subKey, subconcept]) => {
                // Only add subconcepts if their importance is high enough for the current stage
                if (subconcept.importance >= stage) {
                    modifiers.push(`subconcept:${subKey}`);
                }
            });
        }
        
        return modifiers;
    }
    
    /**
     * Get cross-religious concept mappings
     * @returns {Object} Cross-religious concept mappings
     */
    getCrossReligiousMappings() {
        return this.conceptHierarchy.crossReligiousMapping || {};
    }
    
    /**
     * Calculate weighted semantic density for concepts
     * @returns {Object} Weighted semantic density for each concept
     */
    calculateWeightedSemanticDensity() {
        const result = {};
        
        Object.keys(this.conceptHierarchy.concepts).forEach(concept => {
            const importance = this.conceptHierarchy.concepts[concept].importance || 0.5;
            const occurrences = this.trackingResults.conceptOccurrences[concept];
            const evolution = this.trackingResults.conceptualEvolution[concept];
            
            if (evolution && evolution.length > 0) {
                const latestEvolution = evolution[evolution.length - 1];
                
                // Calculate weighted semantic density
                const weightedDensity = this.options.useWeightedScoring ?
                    latestEvolution.semanticDensity * importance : 
                    latestEvolution.semanticDensity;
                
                result[concept] = {
                    rawDensity: latestEvolution.semanticDensity,
                    weightedDensity,
                    importance,
                    occurrences
                };
            } else {
                result[concept] = {
                    rawDensity: 0,
                    weightedDensity: 0,
                    importance,
                    occurrences: 0
                };
            }
        });
        
        return result;
    }
}

// Export the class
module.exports = { MOTLEnhancedTheologicalTracker };

// Run tracker if executed directly
if (require.main === module) {
    const fs = require('fs');
    const path = require('path');
    
    // Load sample text
    const samplePath = path.join(__dirname, '../data/quran-sample.txt');
    const sampleText = fs.readFileSync(samplePath, 'utf8');
    
    // Create tracker
    const tracker = new MOTLEnhancedTheologicalTracker();
    
    // Track concepts
    console.log('Tracking theological concepts in sample text...');
    const results = tracker.trackConcepts(sampleText);
    
    // Display results
    console.log('\nConcept Occurrences:');
    Object.entries(results.conceptOccurrences).forEach(([concept, count]) => {
        console.log(`${concept}: ${count} occurrences`);
    });
    
    console.log('\nWeighted Semantic Density:');
    const densityResults = tracker.calculateWeightedSemanticDensity();
    Object.entries(densityResults).forEach(([concept, data]) => {
        console.log(`${concept}: Raw=${data.rawDensity.toFixed(3)}, Weighted=${data.weightedDensity.toFixed(3)}`);
    });
    
    // Save results
    const resultsPath = path.join(__dirname, '../benchmark-results/enhanced-theological-tracking.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);
}
