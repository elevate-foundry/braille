/**
 * MOTL Theological Concept Visualizer
 * 
 * Visualizes theological concept tracking results from the MOTL Bible benchmark
 * to demonstrate semantic coherence across different expressions.
 */

const fs = require('fs');
const path = require('path');

class MOTLTheologicalVisualizer {
    constructor(options = {}) {
        this.options = {
            inputPath: path.join(__dirname, '../benchmark-results/theological-concept-tracking.json'),
            outputPath: path.join(__dirname, '../benchmark-results/theological-visualization.html'),
            colorScheme: {
                salvation: '#e63946',
                covenant: '#457b9d',
                redemption: '#1d3557',
                grace: '#a8dadc',
                judgment: '#f1faee',
                resurrection: '#fca311',
                atonement: '#14213d',
                faith: '#e9c46a'
            },
            ...options
        };
        
        // Set tracking results from options or load from file
        if (options.trackingResults) {
            this.trackingResults = options.trackingResults;
        } else if (fs.existsSync(this.options.inputPath)) {
            try {
                this.trackingResults = JSON.parse(fs.readFileSync(this.options.inputPath, 'utf8'));
            } catch (err) {
                console.error(`Error loading tracking results: ${err.message}`);
            }
        } else {
            this.trackingResults = null;
        }
    }
    
    /**
     * Generate HTML visualization of theological concept tracking
     */
    generateVisualization() {
        if (!this.trackingResults) {
            console.error('No tracking results available for visualization');
            return;
        }
        
        console.log(`[MOTL] Generating theological concept visualization...`);
        
        // Generate HTML content
        const html = this._generateHTML();
        
        // Write to output file
        fs.writeFileSync(this.options.outputPath, html);
        
        console.log(`[MOTL] Theological visualization generated at ${this.options.outputPath}`);
    }
    
    /**
     * Generate HTML content for visualization
     * @private
     * @returns {string} HTML content
     */
    _generateHTML() {
        // Add null checks to prevent errors
        if (!this.trackingResults || !this.trackingResults.conceptOccurrences) {
            console.warn('[MOTL] No tracking results available for visualization');
            return `<div class="motl-visualization-container">
                <h2>Theological Concept Visualization</h2>
                <p>No theological concept data available. Run the benchmark first to generate data.</p>
            </div>`;
        }
        
        const concepts = Object.keys(this.trackingResults.conceptOccurrences);
        
        // Generate concept occurrence chart data
        const occurrenceData = this._generateOccurrenceChartData(concepts);
        
        // Generate semantic coherence chart data
        const coherenceData = this._generateCoherenceChartData(concepts);
        
        // Generate cross-reference network data
        const networkData = this._generateNetworkData(concepts);
        
        // Generate concept evolution data
        const evolutionData = this._generateEvolutionData(concepts);
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOTL Theological Concept Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #212529;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #14213d;
            margin-bottom: 10px;
        }
        .header p {
            color: #6c757d;
            max-width: 800px;
            margin: 0 auto;
        }
        .chart-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 30px;
        }
        .chart-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #14213d;
        }
        .chart-description {
            color: #6c757d;
            margin-bottom: 20px;
        }
        .network-container {
            height: 500px;
            position: relative;
        }
        .concept-tag {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            margin: 5px;
            font-size: 0.8rem;
            color: white;
        }
        .concept-evolution {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
        }
        .evolution-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 15px;
            width: calc(25% - 10px);
            box-sizing: border-box;
        }
        .evolution-card h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1rem;
        }
        .modifier-tag {
            display: inline-block;
            background-color: #e9ecef;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            margin: 2px;
        }
        .bit-depth {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 5px;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 0.8rem;
        }
        @media (max-width: 768px) {
            .evolution-card {
                width: calc(50% - 10px);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MOTL Theological Concept Visualization</h1>
            <p>Demonstrating semantic coherence across different expressions of theological concepts using Machine-Optimized Thought Language</p>
        </div>
        
        <!-- Concept Occurrences Chart -->
        <div class="chart-container">
            <div class="chart-title">Theological Concept Occurrences</div>
            <div class="chart-description">
                Distribution of theological concepts across different biblical books, showing how MOTL identifies and tracks these concepts regardless of linguistic expression.
            </div>
            <canvas id="occurrenceChart"></canvas>
        </div>
        
        <!-- Semantic Coherence Chart -->
        <div class="chart-container">
            <div class="chart-title">Semantic Coherence Scores</div>
            <div class="chart-description">
                MOTL's ability to maintain semantic coherence for each theological concept across different contexts and expressions.
            </div>
            <canvas id="coherenceChart"></canvas>
        </div>
        
        <!-- Cross-Reference Network -->
        <div class="chart-container">
            <div class="chart-title">Theological Cross-Reference Network</div>
            <div class="chart-description">
                Network visualization of semantic relationships between theological concepts across different biblical texts.
            </div>
            <div id="networkChart" class="network-container"></div>
        </div>
        
        <!-- Concept Evolution -->
        <div class="chart-container">
            <div class="chart-title">Theological Concept Evolution</div>
            <div class="chart-description">
                How theological concepts evolve and are expressed differently across biblical texts, with MOTL's adaptive bit-depth allocation.
            </div>
            <div id="conceptEvolution" class="concept-evolution">
                <!-- Evolution cards will be inserted here -->
            </div>
        </div>
    </div>
    
    <script>
        // Occurrence Chart
        const occurrenceCtx = document.getElementById('occurrenceChart').getContext('2d');
        new Chart(occurrenceCtx, ${JSON.stringify(occurrenceData)});
        
        // Coherence Chart
        const coherenceCtx = document.getElementById('coherenceChart').getContext('2d');
        new Chart(coherenceCtx, ${JSON.stringify(coherenceData)});
        
        // Network Visualization
        const networkData = ${JSON.stringify(networkData)};
        renderNetworkGraph(networkData);
        
        // Concept Evolution
        const evolutionData = ${JSON.stringify(evolutionData)};
        renderConceptEvolution(evolutionData);
        
        // Render network graph using D3
        function renderNetworkGraph(data) {
            const width = document.getElementById('networkChart').clientWidth;
            const height = 500;
            
            const svg = d3.select('#networkChart')
                .append('svg')
                .attr('width', width)
                .attr('height', height);
                
            // Create a force simulation
            const simulation = d3.forceSimulation(data.nodes)
                .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2));
                
            // Create links
            const link = svg.append('g')
                .selectAll('line')
                .data(data.links)
                .enter()
                .append('line')
                .attr('stroke', '#999')
                .attr('stroke-opacity', d => d.value)
                .attr('stroke-width', d => Math.max(1, d.value * 3));
                
            // Create nodes
            const node = svg.append('g')
                .selectAll('circle')
                .data(data.nodes)
                .enter()
                .append('circle')
                .attr('r', d => d.size)
                .attr('fill', d => d.color)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
                    
            // Add labels to nodes
            const label = svg.append('g')
                .selectAll('text')
                .data(data.nodes)
                .enter()
                .append('text')
                .text(d => d.id)
                .attr('font-size', 10)
                .attr('dx', 12)
                .attr('dy', 4);
                
            // Update positions on simulation tick
            simulation.on('tick', () => {
                link
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                    
                node
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
                    
                label
                    .attr('x', d => d.x)
                    .attr('y', d => d.y);
            });
            
            // Drag functions
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        }
        
        // Render concept evolution cards
        function renderConceptEvolution(data) {
            const container = document.getElementById('conceptEvolution');
            
            data.forEach(concept => {
                const card = document.createElement('div');
                card.className = 'evolution-card';
                
                // Create concept header with color
                const header = document.createElement('h3');
                header.textContent = concept.name;
                header.style.borderBottom = \`2px solid \${concept.color}\`;
                card.appendChild(header);
                
                // Add semantic density
                const density = document.createElement('div');
                density.textContent = \`Semantic Density: \${(concept.semanticDensity * 100).toFixed(1)}%\`;
                card.appendChild(density);
                
                // Add modifiers
                const modifiers = document.createElement('div');
                modifiers.style.marginTop = '8px';
                concept.modifiers.forEach(mod => {
                    const tag = document.createElement('span');
                    tag.className = 'modifier-tag';
                    tag.textContent = mod;
                    modifiers.appendChild(tag);
                });
                card.appendChild(modifiers);
                
                // Add bit depth allocation
                const bitDepth = document.createElement('div');
                bitDepth.className = 'bit-depth';
                bitDepth.textContent = \`Bit Depth: \${concept.bitDepth}-bit encoding\`;
                card.appendChild(bitDepth);
                
                container.appendChild(card);
            });
        }
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Generate data for the occurrence chart
     * @private
     * @param {Array<string>} concepts - List of theological concepts
     * @returns {Object} Chart.js configuration
     */
    _generateOccurrenceChartData(concepts) {
        // Handle empty concepts array
        if (!concepts || concepts.length === 0) {
            return {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Theological Concept Occurrences by Text'
                        }
                    }
                }
            };
        }
        
        // Safely get books
        const firstConcept = concepts[0];
        const conceptData = this.trackingResults.conceptOccurrences[firstConcept] || {};
        const books = Object.keys(conceptData);
        
        const datasets = concepts.map(concept => {
            const conceptData = this.trackingResults.conceptOccurrences[concept] || {};
            return {
                label: concept,
                data: books.map(book => conceptData[book] || 0),
                backgroundColor: this.options.colorScheme[concept] || '#000000'
            };
        });
        
        return {
            type: 'bar',
            data: {
                labels: books,
                datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Biblical Books'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Occurrences'
                        },
                        beginAtZero: true
                    }
                }
            }
        };
    }
    
    /**
     * Generate data for the coherence chart
     * @private
     * @param {Array<string>} concepts - List of theological concepts
     * @returns {Object} Chart.js configuration
     */
    _generateCoherenceChartData(concepts) {
        // Handle empty concepts array
        if (!concepts || concepts.length === 0) {
            return {
                type: 'radar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Semantic Coherence',
                        data: [],
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Semantic Coherence by Concept'
                        }
                    }
                }
            };
        }
        
        // Safely get coherence data
        const data = concepts.map(concept => {
            return (this.trackingResults.semanticCoherence && this.trackingResults.semanticCoherence[concept]) || 0;
        });
        
        return {
            type: 'radar',
            data: {
                labels: concepts,
                datasets: [{
                    label: 'Semantic Coherence',
                    data,
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 1
                    }
                }
            }
        };
    }
    
    /**
     * Generate data for the network visualization
     * @private
     * @param {Array<string>} concepts - List of theological concepts
     * @returns {Object} Network graph data
     */
    _generateNetworkData(concepts) {
        // Handle empty concepts array
        if (!concepts || concepts.length === 0) {
            return { nodes: [], links: [] };
        }
        
        // Create nodes for concepts
        const nodes = concepts.map(concept => ({
            id: concept,
            size: 10,
            color: this.options.colorScheme[concept] || '#000000'
        }));
        
        // Create links between concepts based on cross-references
        const links = [];
        
        // Check if cross-reference map exists
        if (!this.trackingResults.crossReferenceMap) {
            return { nodes, links };
        }
        
        concepts.forEach(concept => {
            const refs = this.trackingResults.crossReferenceMap[concept] || [];
            
            // Group references by target book
            const bookRefs = {};
            refs.forEach(ref => {
                if (!ref || !ref.target) return;
                
                const targetBook = ref.target.split(':')[0];
                if (!bookRefs[targetBook]) {
                    bookRefs[targetBook] = [];
                }
                bookRefs[targetBook].push(ref);
            });
            
            // Create links to other concepts based on shared references
            concepts.forEach(otherConcept => {
                if (concept === otherConcept) return;
                
                const otherRefs = this.trackingResults.crossReferenceMap[otherConcept] || [];
                const otherBookRefs = {};
                otherRefs.forEach(ref => {
                    if (!ref || !ref.target) return;
                    
                    const targetBook = ref.target.split(':')[0];
                    if (!otherBookRefs[targetBook]) {
                        otherBookRefs[targetBook] = [];
                    }
                    otherBookRefs[targetBook].push(ref);
                });
                
                // Calculate link strength based on shared references
                let linkStrength = 0;
                Object.keys(bookRefs).forEach(book => {
                    if (otherBookRefs[book]) {
                        linkStrength += (bookRefs[book].length * otherBookRefs[book].length) / 10;
                    }
                });
                
                if (linkStrength > 0) {
                    links.push({
                        source: concept,
                        target: otherConcept,
                        value: Math.min(1, linkStrength / 5)
                    });
                }
            });
        });
        
        return { nodes, links };
    }
    
    /**
     * Generate data for concept evolution visualization
     * @private
     * @param {Array<string>} concepts - List of theological concepts
     * @returns {Array<Object>} Concept evolution data
     */
    _generateEvolutionData(concepts) {
        // Handle empty concepts array
        if (!concepts || concepts.length === 0 || !this.trackingResults.conceptualEvolution) {
            return [];
        }
        
        return concepts.map(concept => {
            // Check if evolution data exists for this concept
            const evolution = this.trackingResults.conceptualEvolution[concept] || [];
            if (evolution.length === 0) {
                return {
                    name: concept,
                    color: this.options.colorScheme[concept] || '#000000',
                    semanticDensity: 0,
                    modifiers: [],
                    bitDepth: 0
                };
            }
            
            const latestEvolution = evolution[evolution.length - 1] || {};
            
            return {
                name: concept,
                color: this.options.colorScheme[concept] || '#000000',
                semanticDensity: latestEvolution.semanticDensity || 0,
                modifiers: latestEvolution.contextualModifiers || [],
                bitDepth: latestEvolution.bitDepthAllocation || 0
            };
        });
    }
}

// Export the class
module.exports = { MOTLTheologicalVisualizer };

// Run visualizer if executed directly
if (require.main === module) {
    const visualizer = new MOTLTheologicalVisualizer();
    visualizer.generateVisualization();
}
