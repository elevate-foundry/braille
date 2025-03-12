/**
 * BBID Stability Test Suite
 * 
 * This script tests the stability and uniqueness of BBID fingerprints across
 * different scenarios, comparing BBES encoding with traditional approaches.
 */

class BBIDStabilityTest {
    constructor() {
        this.testResults = {
            stability: [],
            uniqueness: [],
            performance: []
        };
        this.deviceFingerprint = null;
        this.bbidManager = null;
    }

    async initialize() {
        console.log('Initializing BBID Stability Test Suite...');
        
        // Initialize dependencies
        if (typeof DeviceFingerprint !== 'undefined') {
            this.deviceFingerprint = new DeviceFingerprint();
            await this.deviceFingerprint.initialize();
        } else {
            throw new Error('DeviceFingerprint class not found');
        }
        
        if (typeof BBIDManager !== 'undefined') {
            this.bbidManager = new BBIDManager();
            await this.bbidManager.initialize();
        } else {
            throw new Error('BBIDManager class not found');
        }
        
        console.log('BBID Stability Test Suite initialized successfully');
    }
    
    /**
     * Run all stability tests
     */
    async runAllTests() {
        console.log('Running all BBID stability tests...');
        
        await this.testStability();
        await this.testUniqueness();
        await this.testPerformance();
        
        console.log('All tests completed');
        return this.generateReport();
    }
    
    /**
     * Test fingerprint stability across multiple generations
     */
    async testStability(iterations = 10, delay = 1000) {
        console.log(`Testing stability with ${iterations} iterations...`);
        
        const results = {
            rawFingerprints: [],
            bbesFingerprints: [],
            components: [],
            matchRate: 0
        };
        
        // Generate multiple fingerprints with delay between
        for (let i = 0; i < iterations; i++) {
            console.log(`Stability test iteration ${i+1}/${iterations}`);
            
            // Force regeneration of fingerprint
            await this.deviceFingerprint.initialize(true);
            
            // Store results
            results.rawFingerprints.push(this.deviceFingerprint.getRawFingerprint());
            results.bbesFingerprints.push(this.deviceFingerprint.getFingerprint());
            results.components.push(this.deviceFingerprint.getComponents());
            
            // Wait before next iteration
            if (i < iterations - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // Calculate match rates
        let rawMatches = 0;
        let bbesMatches = 0;
        
        for (let i = 1; i < iterations; i++) {
            if (results.rawFingerprints[i] === results.rawFingerprints[0]) {
                rawMatches++;
            }
            
            if (results.bbesFingerprints[i] === results.bbesFingerprints[0]) {
                bbesMatches++;
            }
        }
        
        results.rawMatchRate = (rawMatches / (iterations - 1)) * 100;
        results.bbesMatchRate = (bbesMatches / (iterations - 1)) * 100;
        
        // Analyze component stability
        results.componentStability = this.analyzeComponentStability(results.components);
        
        this.testResults.stability.push(results);
        console.log('Stability test completed');
        
        return results;
    }
    
    /**
     * Test fingerprint uniqueness across different browser tabs/windows
     */
    async testUniqueness() {
        console.log('Testing fingerprint uniqueness...');
        
        // For browser environments, we can only simulate this
        // In a real test, you would need to collect fingerprints from different
        // browsers, devices, and users
        
        const results = {
            simulatedDevices: [],
            uniquenessScore: 0
        };
        
        // Simulate different devices by modifying components
        const baseComponents = this.deviceFingerprint.getComponents();
        const deviceTypes = ['desktop', 'laptop', 'tablet', 'phone'];
        const operatingSystems = ['windows', 'macos', 'linux', 'ios', 'android'];
        
        for (const type of deviceTypes) {
            for (const os of operatingSystems) {
                // Skip invalid combinations
                if ((os === 'ios' && type !== 'tablet' && type !== 'phone') ||
                    (os === 'android' && type !== 'tablet' && type !== 'phone')) {
                    continue;
                }
                
                // Create simulated device
                const simulatedDevice = {
                    type,
                    os,
                    components: this.simulateDeviceComponents(baseComponents, type, os),
                    fingerprint: null,
                    bbesFingerprint: null
                };
                
                // Generate fingerprint
                simulatedDevice.fingerprint = this.generateSimulatedFingerprint(simulatedDevice.components);
                simulatedDevice.bbesFingerprint = this.encodeToBBES(simulatedDevice.fingerprint);
                
                results.simulatedDevices.push(simulatedDevice);
            }
        }
        
        // Calculate uniqueness score
        results.uniquenessScore = this.calculateUniquenessScore(results.simulatedDevices);
        
        this.testResults.uniqueness.push(results);
        console.log('Uniqueness test completed');
        
        return results;
    }
    
    /**
     * Test performance of different fingerprinting and encoding methods
     */
    async testPerformance(iterations = 100) {
        console.log(`Testing performance with ${iterations} iterations...`);
        
        const results = {
            rawFingerprint: {
                totalTime: 0,
                averageTime: 0
            },
            bbesEncoding: {
                totalTime: 0,
                averageTime: 0
            },
            sha256Hashing: {
                totalTime: 0,
                averageTime: 0
            },
            bbidGeneration: {
                totalTime: 0,
                averageTime: 0
            }
        };
        
        // Test raw fingerprint generation
        console.log('Testing raw fingerprint generation performance...');
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await this.deviceFingerprint.generateFingerprint();
            const end = performance.now();
            results.rawFingerprint.totalTime += (end - start);
        }
        results.rawFingerprint.averageTime = results.rawFingerprint.totalTime / iterations;
        
        // Test BBES encoding
        console.log('Testing BBES encoding performance...');
        const rawFingerprint = this.deviceFingerprint.getRawFingerprint();
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            this.encodeToBBES(rawFingerprint);
            const end = performance.now();
            results.bbesEncoding.totalTime += (end - start);
        }
        results.bbesEncoding.averageTime = results.bbesEncoding.totalTime / iterations;
        
        // Test SHA-256 hashing (for comparison)
        console.log('Testing SHA-256 hashing performance...');
        const testData = JSON.stringify(this.deviceFingerprint.getComponents());
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await this.sha256Hash(testData);
            const end = performance.now();
            results.sha256Hashing.totalTime += (end - start);
        }
        results.sha256Hashing.averageTime = results.sha256Hashing.totalTime / iterations;
        
        // Test full BBID generation
        console.log('Testing full BBID generation performance...');
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await this.bbidManager.generateBBID(`Test Device ${i}`, 'desktop', 'windows');
            const end = performance.now();
            results.bbidGeneration.totalTime += (end - start);
        }
        results.bbidGeneration.averageTime = results.bbidGeneration.totalTime / iterations;
        
        this.testResults.performance.push(results);
        console.log('Performance test completed');
        
        return results;
    }
    
    /**
     * Generate a comprehensive test report
     */
    generateReport() {
        console.log('Generating test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            environment: this.getEnvironmentInfo(),
            results: this.testResults,
            summary: this.generateSummary()
        };
        
        console.log('Test report generated');
        return report;
    }
    
    /**
     * Generate a summary of test results
     */
    generateSummary() {
        const summary = {
            stability: {
                averageRawMatchRate: 0,
                averageBBESMatchRate: 0,
                mostStableComponents: [],
                leastStableComponents: []
            },
            uniqueness: {
                averageUniquenessScore: 0,
                mostDistinctiveComponents: []
            },
            performance: {
                rawFingerprintTime: 0,
                bbesEncodingTime: 0,
                sha256HashingTime: 0,
                bbidGenerationTime: 0,
                comparisonToTraditional: ''
            }
        };
        
        // Calculate stability summary
        if (this.testResults.stability.length > 0) {
            let totalRawMatchRate = 0;
            let totalBBESMatchRate = 0;
            
            this.testResults.stability.forEach(result => {
                totalRawMatchRate += result.rawMatchRate;
                totalBBESMatchRate += result.bbesMatchRate;
            });
            
            summary.stability.averageRawMatchRate = totalRawMatchRate / this.testResults.stability.length;
            summary.stability.averageBBESMatchRate = totalBBESMatchRate / this.testResults.stability.length;
            
            // Get most/least stable components if available
            if (this.testResults.stability[0].componentStability) {
                const componentStability = this.testResults.stability[0].componentStability;
                const components = Object.keys(componentStability);
                
                // Sort by stability score
                components.sort((a, b) => componentStability[b] - componentStability[a]);
                
                summary.stability.mostStableComponents = components.slice(0, 3);
                summary.stability.leastStableComponents = components.slice(-3).reverse();
            }
        }
        
        // Calculate uniqueness summary
        if (this.testResults.uniqueness.length > 0) {
            let totalUniquenessScore = 0;
            
            this.testResults.uniqueness.forEach(result => {
                totalUniquenessScore += result.uniquenessScore;
            });
            
            summary.uniqueness.averageUniquenessScore = totalUniquenessScore / this.testResults.uniqueness.length;
        }
        
        // Calculate performance summary
        if (this.testResults.performance.length > 0) {
            const performance = this.testResults.performance[0];
            
            summary.performance.rawFingerprintTime = performance.rawFingerprint.averageTime;
            summary.performance.bbesEncodingTime = performance.bbesEncoding.averageTime;
            summary.performance.sha256HashingTime = performance.sha256Hashing.averageTime;
            summary.performance.bbidGenerationTime = performance.bbidGeneration.averageTime;
            
            // Compare to traditional methods
            const bbesVsSha256 = (performance.bbesEncoding.averageTime / performance.sha256Hashing.averageTime) * 100;
            summary.performance.comparisonToTraditional = 
                `BBES encoding is ${bbesVsSha256 < 100 ? 'faster' : 'slower'} than SHA-256 hashing by ${Math.abs(100 - bbesVsSha256).toFixed(2)}%`;
        }
        
        return summary;
    }
    
    /**
     * Get information about the current environment
     */
    getEnvironmentInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            touchSupport: 'ontouchstart' in window,
            cpuCores: navigator.hardwareConcurrency || 'unknown'
        };
    }
    
    /**
     * Analyze the stability of individual fingerprinting components
     */
    analyzeComponentStability(componentsArray) {
        const stability = {};
        
        // Get all component keys from first iteration
        const firstComponents = componentsArray[0];
        const componentKeys = Object.keys(firstComponents);
        
        // Initialize stability scores
        componentKeys.forEach(key => {
            stability[key] = 0;
        });
        
        // Compare each iteration with the first one
        for (let i = 1; i < componentsArray.length; i++) {
            const currentComponents = componentsArray[i];
            
            componentKeys.forEach(key => {
                if (JSON.stringify(currentComponents[key]) === JSON.stringify(firstComponents[key])) {
                    stability[key]++;
                }
            });
        }
        
        // Convert to percentage
        componentKeys.forEach(key => {
            stability[key] = (stability[key] / (componentsArray.length - 1)) * 100;
        });
        
        return stability;
    }
    
    /**
     * Calculate uniqueness score for a set of simulated devices
     */
    calculateUniquenessScore(devices) {
        let uniqueFingerprints = new Set();
        let uniqueBBESFingerprints = new Set();
        
        devices.forEach(device => {
            uniqueFingerprints.add(device.fingerprint);
            uniqueBBESFingerprints.add(device.bbesFingerprint);
        });
        
        // Calculate uniqueness as percentage of unique fingerprints
        const rawUniqueness = (uniqueFingerprints.size / devices.length) * 100;
        const bbesUniqueness = (uniqueBBESFingerprints.size / devices.length) * 100;
        
        return {
            raw: rawUniqueness,
            bbes: bbesUniqueness,
            comparison: `BBES uniqueness is ${bbesUniqueness >= rawUniqueness ? 'equal to or better than' : 'worse than'} raw fingerprint uniqueness`
        };
    }
    
    /**
     * Simulate device components for a specific device type and OS
     */
    simulateDeviceComponents(baseComponents, deviceType, os) {
        // Create a deep copy of base components
        const components = JSON.parse(JSON.stringify(baseComponents));
        
        // Modify components based on device type
        switch (deviceType) {
            case 'desktop':
                components.screen = { width: 1920, height: 1080, colorDepth: 24 };
                components.hardwareConcurrency = 8;
                components.touchSupport = false;
                break;
            case 'laptop':
                components.screen = { width: 1366, height: 768, colorDepth: 24 };
                components.hardwareConcurrency = 4;
                components.touchSupport = Math.random() > 0.5;
                break;
            case 'tablet':
                components.screen = { width: 1024, height: 768, colorDepth: 24 };
                components.hardwareConcurrency = 4;
                components.touchSupport = true;
                break;
            case 'phone':
                components.screen = { width: 375, height: 812, colorDepth: 24 };
                components.hardwareConcurrency = 6;
                components.touchSupport = true;
                break;
        }
        
        // Modify components based on OS
        switch (os) {
            case 'windows':
                components.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
                components.platform = 'Win32';
                components.fonts = ['Arial', 'Calibri', 'Tahoma', 'Segoe UI'];
                break;
            case 'macos':
                components.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15';
                components.platform = 'MacIntel';
                components.fonts = ['Helvetica', 'San Francisco', 'Helvetica Neue', 'Lucida Grande'];
                break;
            case 'linux':
                components.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
                components.platform = 'Linux x86_64';
                components.fonts = ['DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Droid Sans'];
                break;
            case 'ios':
                if (deviceType === 'tablet') {
                    components.userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
                    components.platform = 'iPad';
                } else {
                    components.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
                    components.platform = 'iPhone';
                }
                components.fonts = ['Helvetica', 'San Francisco', 'Helvetica Neue'];
                break;
            case 'android':
                components.userAgent = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36';
                components.platform = 'Linux armv8l';
                components.fonts = ['Roboto', 'Droid Sans', 'Noto Sans'];
                break;
        }
        
        return components;
    }
    
    /**
     * Generate a simulated fingerprint from components
     */
    generateSimulatedFingerprint(components) {
        // In a real implementation, this would use the same hashing algorithm
        // as the DeviceFingerprint class
        return this.sha256Hash(JSON.stringify(components));
    }
    
    /**
     * Encode a fingerprint to BBES
     */
    encodeToBBES(fingerprint) {
        // Simple implementation for testing
        // In a real implementation, this would use the same encoding algorithm
        // as the DeviceFingerprint class
        let bbesFingerprint = '';
        
        for (let i = 0; i < fingerprint.length; i += 2) {
            const hexPair = fingerprint.substr(i, 2);
            const decimalValue = parseInt(hexPair, 16);
            const brailleChar = String.fromCharCode(0x2800 + (decimalValue % 64));
            bbesFingerprint += brailleChar;
        }
        
        return bbesFingerprint;
    }
    
    /**
     * Calculate SHA-256 hash of a string
     */
    async sha256Hash(str) {
        // Use Web Crypto API if available
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        // Fallback to a simple hash function
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BBIDStabilityTest;
} else if (typeof window !== 'undefined') {
    window.BBIDStabilityTest = BBIDStabilityTest;
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined' && document.readyState === 'complete') {
    runTests();
} else if (typeof window !== 'undefined') {
    window.addEventListener('load', runTests);
}

async function runTests() {
    try {
        const testSuite = new BBIDStabilityTest();
        await testSuite.initialize();
        const results = await testSuite.runAllTests();
        
        console.log('BBID Stability Test Results:', results);
        
        // Display results on page if element exists
        const resultsElement = document.getElementById('testResults');
        if (resultsElement) {
            resultsElement.textContent = JSON.stringify(results, null, 2);
        }
    } catch (error) {
        console.error('Error running BBID stability tests:', error);
    }
}
