/**
 * Sal Include Script
 * This script can be included in any page to add Sal to the page
 * It will dynamically load the necessary CSS and JS files
 */

(function() {
    // Base path to Sal resources
    const basePath = getBasePath();
    
    // Load Sal CSS
    loadCSS(`${basePath}/css/sal/sal.css`);
    
    // Load dependencies
    loadScript(`${basePath}/bbid/demos/js/device-fingerprint.js`)
        .then(() => loadScript(`${basePath}/bbid/demos/js/bbid-behavioral.js`))
        .then(() => loadScript(`${basePath}/js/common.js`))
        .then(() => loadScript(`${basePath}/js/sal/sal.js`))
        .catch(error => console.error('Error loading Sal dependencies:', error));
    
    /**
     * Get the base path by analyzing the current script's path
     */
    function getBasePath() {
        // Get the current script element
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];
        const currentPath = currentScript.src;
        
        // Extract the base path (up to the domain root)
        const pathParts = currentPath.split('/');
        const domainIndex = pathParts.findIndex(part => part.includes('braillebuddy'));
        
        if (domainIndex !== -1) {
            return pathParts.slice(0, domainIndex + 1).join('/');
        }
        
        // Fallback to relative path
        return '.';
    }
    
    /**
     * Load a CSS file dynamically
     */
    function loadCSS(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Load a JavaScript file dynamically
     */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = url;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            
            document.head.appendChild(script);
        });
    }
})();
