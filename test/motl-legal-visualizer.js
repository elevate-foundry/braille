/**
 * MOTL Legal Concept Visualizer
 * 
 * Visualizes legal concept analysis results from the MOTL Legal benchmark
 * to demonstrate semantic coherence across different legal systems and doctrines.
 */

const fs = require('fs');
const path = require('path');

class MOTLLegalVisualizer {
    constructor(options = {}) {
        this.options = {
            inputPath: path.join(__dirname, '../benchmark-results/legal/all-benchmarks.json'),
            outputPath: path.join(__dirname, '../benchmark-results/legal/legal-visualization.html'),
            colorScheme: {
                constitutional_law: '#e63946',
                common_law: '#457b9d',
                statutory_law: '#1d3557',
                administrative_law: '#a8dadc',
                criminal_law: '#f1faee',
                civil_law: '#fca311',
                international_law: '#14213d',
                procedural_law: '#e9c46a'
            },
            ...options
        };
        
        // Set benchmark results from options or load from file
        if (options.benchmarkResults) {
            this.benchmarkResults = options.benchmarkResults;
        } else if (fs.existsSync(this.options.inputPath)) {
            try {
                this.benchmarkResults = JSON.parse(fs.readFileSync(this.options.inputPath, 'utf8'));
            } catch (err) {
                console.error(`Error loading benchmark results: ${err.message}`);
            }
        } else {
            this.benchmarkResults = null;
        }
        
        // Load legal concept hierarchy
        this.legalConcepts = this._loadLegalConcepts();
    }
    
    /**
     * Load legal concept hierarchy
     * @private
     * @returns {Object} Legal concept hierarchy
     */
    _loadLegalConcepts() {
        const conceptPath = path.join(__dirname, '../data/legal/legal-concept-hierarchy.json');
        try {
            return JSON.parse(fs.readFileSync(conceptPath, 'utf8'));
        } catch (err) {
            console.error(`Error loading legal concepts: ${err.message}`);
            return { concepts: {}, relationships: [] };
        }
    }
    
    /**
     * Generate HTML visualization of legal concept analysis
     */
    generateVisualization() {
        if (!this.benchmarkResults) {
            console.error('No benchmark results available for visualization');
            return;
        }
        
        console.log(`[MOTL] Generating legal concept visualization...`);
        
        // Generate HTML content
        const html = this._generateHTML();
        
        // Write to output file
        fs.writeFileSync(this.options.outputPath, html);
        
        console.log(`[MOTL] Legal visualization generated at ${this.options.outputPath}`);
    }
    
    /**
     * Generate HTML content for visualization
     * @private
     * @returns {string} HTML content
     */
    _generateHTML() {
        // Add null checks to prevent errors
        if (!this.benchmarkResults) {
            console.warn('[MOTL] No benchmark results available for visualization');
            return `<div class="motl-visualization-container">
                <h2>Legal Concept Visualization</h2>
                <p>No legal concept data available. Run the benchmark first to generate data.</p>
            </div>`;
        }
        
        // Generate precedent analysis chart data
        const precedentData = this._generatePrecedentChartData();
        
        // Generate statutory interpretation chart data
        const statutoryData = this._generateStatutoryChartData();
        
        // Generate legal reasoning chart data
        const reasoningData = this._generateReasoningChartData();
        
        // Generate cross-reference network data
        const networkData = this._generateNetworkData();
        
        // Generate jurisdictional comparison data
        const jurisdictionalData = this._generateJurisdictionalData();
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOTL Legal Concept Visualization</title>
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
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .comparison-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 15px;
        }
        .comparison-card h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1rem;
        }
        .jurisdiction-tag {
            display: inline-block;
            background-color: #e9ecef;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            margin: 2px;
        }
        .metric-bar {
            height: 8px;
            background-color: #e9ecef;
            border-radius: 4px;
            margin: 8px 0;
            overflow: hidden;
        }
        .metric-fill {
            height: 100%;
            border-radius: 4px;
        }
        .metric-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #6c757d;
        }
        .tabs {
            display: flex;
            border-bottom: 1px solid #dee2e6;
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .tab.active {
            border-bottom: 2px solid #14213d;
            font-weight: 600;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        @media (max-width: 768px) {
            .comparison-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MOTL Legal Concept Visualization</h1>
            <p>Demonstrating semantic coherence across different legal systems and doctrines using Machine-Optimized Thought Language</p>
        </div>
        
        <!-- Precedent Analysis -->
        <div class="chart-container">
            <div class="chart-title">Precedent Analysis</div>
            <div class="chart-description">
                Visualization of precedent similarity, application accuracy, and principle extraction across test cases.
            </div>
            <canvas id="precedentChart" height="300"></canvas>
        </div>
        
        <!-- Statutory Interpretation -->
        <div class="chart-container">
            <div class="chart-title">Statutory Interpretation</div>
            <div class="chart-description">
                Comparison of textual fidelity, purposive alignment, and internal consistency for different interpretations.
            </div>
            <div class="tabs">
                <div class="tab active" data-tab="textual">Textual Fidelity</div>
                <div class="tab" data-tab="purposive">Purposive Alignment</div>
                <div class="tab" data-tab="consistency">Internal Consistency</div>
            </div>
            <div class="tab-content active" id="textual-content">
                <canvas id="textualChart" height="300"></canvas>
            </div>
            <div class="tab-content" id="purposive-content">
                <canvas id="purposiveChart" height="300"></canvas>
            </div>
            <div class="tab-content" id="consistency-content">
                <canvas id="consistencyChart" height="300"></canvas>
            </div>
        </div>
        
        <!-- Legal Reasoning -->
        <div class="chart-container">
            <div class="chart-title">Legal Reasoning Analysis</div>
            <div class="chart-description">
                Evaluation of reasoning coherence, validity, and efficiency across test cases.
            </div>
            <canvas id="reasoningChart" height="300"></canvas>
        </div>
        
        <!-- Cross-Reference Network -->
        <div class="chart-container">
            <div class="chart-title">Legal Cross-Reference Network</div>
            <div class="chart-description">
                Network visualization of detected cross-references between legal concepts.
            </div>
            <div class="network-container" id="networkContainer"></div>
        </div>
        
        <!-- Jurisdictional Comparison -->
        <div class="chart-container">
            <div class="chart-title">Jurisdictional Comparison</div>
            <div class="chart-description">
                Comparison of legal approaches across different jurisdictions.
            </div>
            <div class="comparison-grid" id="jurisdictionGrid">
                <!-- Jurisdiction cards will be inserted here by JavaScript -->
            </div>
        </div>
    </div>
    
    <script>
        // Parse the data
        const precedentData = ${JSON.stringify(precedentData)};
        const statutoryData = ${JSON.stringify(statutoryData)};
        const reasoningData = ${JSON.stringify(reasoningData)};
        const networkData = ${JSON.stringify(networkData)};
        const jurisdictionalData = ${JSON.stringify(jurisdictionalData)};
        
        // Initialize charts when the DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Precedent Analysis Chart
            const precedentCtx = document.getElementById('precedentChart').getContext('2d');
            new Chart(precedentCtx, {
                type: 'bar',
                data: {
                    labels: precedentData.labels,
                    datasets: [
                        {
                            label: 'Similarity Score',
                            data: precedentData.similarity,
                            backgroundColor: '#457b9d',
                            borderColor: '#457b9d',
                            borderWidth: 1
                        },
                        {
                            label: 'Application Accuracy',
                            data: precedentData.application,
                            backgroundColor: '#e63946',
                            borderColor: '#e63946',
                            borderWidth: 1
                        },
                        {
                            label: 'Principle Extraction',
                            data: precedentData.principles,
                            backgroundColor: '#1d3557',
                            borderColor: '#1d3557',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
            
            // Statutory Interpretation Charts
            const textualCtx = document.getElementById('textualChart').getContext('2d');
            new Chart(textualCtx, {
                type: 'bar',
                data: {
                    labels: statutoryData.labels,
                    datasets: [
                        {
                            label: 'Interpretation 1',
                            data: statutoryData.textual.interpretation1,
                            backgroundColor: '#a8dadc',
                            borderColor: '#a8dadc',
                            borderWidth: 1
                        },
                        {
                            label: 'Interpretation 2',
                            data: statutoryData.textual.interpretation2,
                            backgroundColor: '#e9c46a',
                            borderColor: '#e9c46a',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
            
            const purposiveCtx = document.getElementById('purposiveChart').getContext('2d');
            new Chart(purposiveCtx, {
                type: 'bar',
                data: {
                    labels: statutoryData.labels,
                    datasets: [
                        {
                            label: 'Interpretation 1',
                            data: statutoryData.purposive.interpretation1,
                            backgroundColor: '#a8dadc',
                            borderColor: '#a8dadc',
                            borderWidth: 1
                        },
                        {
                            label: 'Interpretation 2',
                            data: statutoryData.purposive.interpretation2,
                            backgroundColor: '#e9c46a',
                            borderColor: '#e9c46a',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
            
            const consistencyCtx = document.getElementById('consistencyChart').getContext('2d');
            new Chart(consistencyCtx, {
                type: 'bar',
                data: {
                    labels: statutoryData.labels,
                    datasets: [
                        {
                            label: 'Interpretation 1',
                            data: statutoryData.consistency.interpretation1,
                            backgroundColor: '#a8dadc',
                            borderColor: '#a8dadc',
                            borderWidth: 1
                        },
                        {
                            label: 'Interpretation 2',
                            data: statutoryData.consistency.interpretation2,
                            backgroundColor: '#e9c46a',
                            borderColor: '#e9c46a',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
            
            // Legal Reasoning Chart
            const reasoningCtx = document.getElementById('reasoningChart').getContext('2d');
            new Chart(reasoningCtx, {
                type: 'radar',
                data: {
                    labels: ['Coherence', 'Validity', 'Efficiency'],
                    datasets: reasoningData.datasets
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
            
            // Tab functionality
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab + '-content').classList.add('active');
                });
            });
            
            // Cross-Reference Network
            createNetworkVisualization(networkData);
            
            // Jurisdictional Comparison
            createJurisdictionalComparison(jurisdictionalData);
        });
        
        // Create network visualization using D3
        function createNetworkVisualization(data) {
            const container = document.getElementById('networkContainer');
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            // Create SVG
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
            
            // Create force simulation
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
                .attr('stroke-width', d => d.value * 3)
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6);
            
            // Create nodes
            const node = svg.append('g')
                .selectAll('circle')
                .data(data.nodes)
                .enter()
                .append('circle')
                .attr('r', 10)
                .attr('fill', d => d.color)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
            
            // Add labels
            const label = svg.append('g')
                .selectAll('text')
                .data(data.nodes)
                .enter()
                .append('text')
                .text(d => d.name)
                .attr('font-size', 12)
                .attr('dx', 15)
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
        
        // Create jurisdictional comparison
        function createJurisdictionalComparison(data) {
            const container = document.getElementById('jurisdictionGrid');
            
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'comparison-card';
                
                let html = \`<h3>\${item.concept}</h3>\`;
                
                // Add jurisdiction tags
                html += '<div>';
                item.jurisdictions.forEach(j => {
                    html += \`<span class="jurisdiction-tag">\${j}</span>\`;
                });
                html += '</div>';
                
                // Add metrics
                Object.entries(item.metrics).forEach(([metric, value]) => {
                    html += \`
                        <div class="metric-label">
                            <span>\${metric}</span>
                            <span>\${value.toFixed(2)}</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: \${value * 100}%; background-color: #457b9d;"></div>
                        </div>
                    \`;
                });
                
                card.innerHTML = html;
                container.appendChild(card);
            });
        }
    </script>
</body>
</html>
`;
    }
    
    /**
     * Generate precedent chart data
     * @private
     * @returns {Object} Chart data for precedent analysis
     */
    _generatePrecedentChartData() {
        // Check if precedent data exists
        if (!this.benchmarkResults.precedent) {
            return {
                labels: [],
                similarity: [],
                application: [],
                principles: []
            };
        }
        
        const labels = Object.keys(this.benchmarkResults.precedent.similarity);
        const similarity = labels.map(id => this.benchmarkResults.precedent.similarity[id]);
        const application = labels.map(id => this.benchmarkResults.precedent.application[id].correct ? 1 : 0);
        const principles = labels.map(id => this.benchmarkResults.precedent.distinction[id].accuracy);
        
        return {
            labels,
            similarity,
            application,
            principles
        };
    }
    
    /**
     * Generate statutory chart data
     * @private
     * @returns {Object} Chart data for statutory interpretation
     */
    _generateStatutoryChartData() {
        // Check if statutory data exists
        if (!this.benchmarkResults.statutory) {
            return {
                labels: [],
                textual: { interpretation1: [], interpretation2: [] },
                purposive: { interpretation1: [], interpretation2: [] },
                consistency: { interpretation1: [], interpretation2: [] }
            };
        }
        
        const labels = Object.keys(this.benchmarkResults.statutory.textual);
        
        const textual = {
            interpretation1: labels.map(id => this.benchmarkResults.statutory.textual[id].interpretation1),
            interpretation2: labels.map(id => this.benchmarkResults.statutory.textual[id].interpretation2)
        };
        
        const purposive = {
            interpretation1: labels.map(id => this.benchmarkResults.statutory.purposive[id].interpretation1),
            interpretation2: labels.map(id => this.benchmarkResults.statutory.purposive[id].interpretation2)
        };
        
        const consistency = {
            interpretation1: labels.map(id => this.benchmarkResults.statutory.consistency[id].interpretation1),
            interpretation2: labels.map(id => this.benchmarkResults.statutory.consistency[id].interpretation2)
        };
        
        return {
            labels,
            textual,
            purposive,
            consistency
        };
    }
    
    /**
     * Generate reasoning chart data
     * @private
     * @returns {Object} Chart data for legal reasoning
     */
    _generateReasoningChartData() {
        // Check if reasoning data exists
        if (!this.benchmarkResults.reasoning) {
            return {
                datasets: []
            };
        }
        
        const datasets = [];
        const reasoningIds = Object.keys(this.benchmarkResults.reasoning.coherence);
        
        reasoningIds.forEach((id, index) => {
            datasets.push({
                label: id,
                data: [
                    this.benchmarkResults.reasoning.coherence[id],
                    this.benchmarkResults.reasoning.validity[id],
                    this.benchmarkResults.reasoning.efficiency[id] / 10 // Normalize efficiency
                ],
                backgroundColor: `rgba(${70 + index * 40}, ${100 + index * 20}, ${150 + index * 20}, 0.2)`,
                borderColor: `rgba(${70 + index * 40}, ${100 + index * 20}, ${150 + index * 20}, 1)`,
                borderWidth: 1
            });
        });
        
        return {
            datasets
        };
    }
    
    /**
     * Generate network data for cross-reference visualization
     * @private
     * @returns {Object} Network data for D3 visualization
     */
    _generateNetworkData() {
        // Check if crossref data exists
        if (!this.benchmarkResults.crossref) {
            return {
                nodes: [],
                links: []
            };
        }
        
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        
        // Process each cross-reference
        Object.entries(this.benchmarkResults.crossref.detection).forEach(([id, data], index) => {
            const crossrefData = this.testData?.crossref?.[index] || { 
                source: `Source ${index + 1}`, 
                targets: [`Target ${index + 1}A`, `Target ${index + 1}B`],
                strength: [0.7, 0.6]
            };
            
            // Add source node if not exists
            if (!nodeMap.has(crossrefData.source)) {
                const node = {
                    id: crossrefData.source,
                    name: crossrefData.source,
                    color: '#457b9d'
                };
                nodes.push(node);
                nodeMap.set(crossrefData.source, node);
            }
            
            // Add target nodes and links
            crossrefData.targets.forEach((target, i) => {
                if (!nodeMap.has(target)) {
                    const node = {
                        id: target,
                        name: target,
                        color: '#e63946'
                    };
                    nodes.push(node);
                    nodeMap.set(target, node);
                }
                
                links.push({
                    source: crossrefData.source,
                    target: target,
                    value: data.scores[i] || 0.5
                });
            });
        });
        
        return {
            nodes,
            links
        };
    }
    
    /**
     * Generate jurisdictional comparison data
     * @private
     * @returns {Array} Jurisdictional comparison data
     */
    _generateJurisdictionalData() {
        // Check if jurisdictional data exists
        if (!this.benchmarkResults.jurisdictional) {
            return [];
        }
        
        const result = [];
        
        // Process each jurisdictional comparison
        Object.entries(this.benchmarkResults.jurisdictional.similarity).forEach(([id, similarity]) => {
            const jurisdictionalData = this.testData?.jurisdictional?.[parseInt(id.split('_')[1]) - 1] || {
                concept: `Legal Concept ${id}`,
                jurisdictions: [
                    { name: "Jurisdiction A" },
                    { name: "Jurisdiction B" }
                ]
            };
            
            const distinction = this.benchmarkResults.jurisdictional.distinction[id];
            const transferability = this.benchmarkResults.jurisdictional.transferability[id];
            
            result.push({
                concept: jurisdictionalData.concept,
                jurisdictions: jurisdictionalData.jurisdictions.map(j => j.name),
                metrics: {
                    similarity: similarity,
                    distinction: distinction.difference,
                    transferability: transferability
                }
            });
        });
        
        return result;
    }
    
    // Placeholder for test data (used when actual data is not available)
    get testData() {
        return {
            crossref: [
                {
                    source: "First Amendment",
                    targets: ["Fourth Amendment", "Fifth Amendment", "Fourteenth Amendment"],
                    strength: [0.7, 0.6, 0.8]
                },
                {
                    source: "Contract Law",
                    targets: ["Promissory Estoppel", "Unjust Enrichment", "Gift Promises"],
                    strength: [0.8, 0.7, 0.5]
                }
            ],
            jurisdictional: [
                {
                    concept: "Privacy Protection",
                    jurisdictions: [
                        { name: "European Union" },
                        { name: "United States" }
                    ]
                }
            ]
        };
    }
}

// Export the class
module.exports = { MOTLLegalVisualizer };

// Run visualizer if executed directly
if (require.main === module) {
    const visualizer = new MOTLLegalVisualizer();
    visualizer.generateVisualization();
}
