/**
 * BrailleBuddy Device Fingerprinting with BBES Encoding
 * 
 * This module creates a unique device fingerprint for each user without requiring login.
 * It uses various browser and device characteristics to generate a consistent identifier.
 * The fingerprint is encoded using Braille Binary Encoding Standard (BBES) for compact storage
 * and alignment with the Braille learning purpose of the application.
 */

class DeviceFingerprint {
    constructor() {
        this.fingerprint = null;
        this.rawFingerprint = null;
        this.fingerprintComponents = {};
        this.storageKey = 'brailleBuddy_deviceId';
        this.bbesStorageKey = 'brailleBuddy_bbesDeviceId';
    }

    /**
     * Initialize and generate the device fingerprint
     * @returns {Promise<string>} The generated fingerprint
     */
    async initialize() {
        // Check if we already have a stored BBES fingerprint
        const storedBBESFingerprint = localStorage.getItem(this.bbesStorageKey);
        if (storedBBESFingerprint) {
            this.fingerprint = storedBBESFingerprint;
            console.log('Using stored BBES device fingerprint');
            return this.fingerprint;
        }
        
        // Check for legacy fingerprint (non-BBES)
        const storedLegacyFingerprint = localStorage.getItem(this.storageKey);
        if (storedLegacyFingerprint) {
            // Convert legacy fingerprint to BBES format
            this.rawFingerprint = storedLegacyFingerprint;
            this.fingerprint = this.encodeBBES(this.rawFingerprint);
            
            // Store the BBES fingerprint and remove legacy format
            localStorage.setItem(this.bbesStorageKey, this.fingerprint);
            console.log('Converted legacy fingerprint to BBES format');
            return this.fingerprint;
        }

        // Generate a new fingerprint
        await this.generateFingerprint();
        
        // Encode the fingerprint using BBES
        this.fingerprint = this.encodeBBES(this.rawFingerprint);
        
        // Store the BBES fingerprint for future use
        localStorage.setItem(this.bbesStorageKey, this.fingerprint);
        
        return this.fingerprint;
    }

    /**
     * Generate a device fingerprint based on browser and device characteristics
     */
    async generateFingerprint() {
        try {
            // Collect various browser and device characteristics
            this.collectBrowserData();
            this.collectScreenData();
            this.collectHardwareData();
            await this.collectCanvasFingerprint();
            await this.collectWebGLFingerprint();
            
            // Generate a hash from all collected components
            this.rawFingerprint = await this.hashComponents();
            
            console.log('Generated new raw device fingerprint');
            return this.rawFingerprint;
        } catch (error) {
            console.error('Error generating fingerprint:', error);
            // Fallback to a random ID if fingerprinting fails
            this.rawFingerprint = this.generateRandomId();
            return this.rawFingerprint;
        }
    }

    /**
     * Collect basic browser information
     */
    collectBrowserData() {
        const nav = window.navigator;
        
        this.fingerprintComponents.userAgent = nav.userAgent;
        this.fingerprintComponents.language = nav.language;
        this.fingerprintComponents.languages = Array.isArray(nav.languages) ? nav.languages.join(',') : '';
        this.fingerprintComponents.platform = nav.platform;
        this.fingerprintComponents.doNotTrack = nav.doNotTrack;
        this.fingerprintComponents.cookieEnabled = nav.cookieEnabled;
        this.fingerprintComponents.timezone = new Date().getTimezoneOffset();
        this.fingerprintComponents.timezoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Collect screen and window information
     */
    collectScreenData() {
        const screen = window.screen;
        
        this.fingerprintComponents.screenWidth = screen.width;
        this.fingerprintComponents.screenHeight = screen.height;
        this.fingerprintComponents.screenDepth = screen.colorDepth;
        this.fingerprintComponents.screenAvailWidth = screen.availWidth;
        this.fingerprintComponents.screenAvailHeight = screen.availHeight;
        this.fingerprintComponents.windowWidth = window.innerWidth;
        this.fingerprintComponents.windowHeight = window.innerHeight;
        this.fingerprintComponents.devicePixelRatio = window.devicePixelRatio;
    }

    /**
     * Collect hardware information
     */
    collectHardwareData() {
        this.fingerprintComponents.hardwareConcurrency = navigator.hardwareConcurrency || '';
        this.fingerprintComponents.deviceMemory = navigator.deviceMemory || '';
        
        // Check for touch support
        this.fingerprintComponents.touchPoints = navigator.maxTouchPoints || 0;
        this.fingerprintComponents.touchSupport = 'ontouchstart' in window;
    }

    /**
     * Generate a canvas fingerprint
     */
    async collectCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            // Draw text with different styles
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#F60';
            ctx.fillRect(8, 8, 32, 32);
            ctx.fillStyle = '#069';
            ctx.fillText('BrailleBuddy', 12, 12);
            
            // More complex drawing for better uniqueness
            ctx.strokeStyle = '#FF0000';
            ctx.arc(50, 25, 10, 0, Math.PI * 2, true);
            ctx.stroke();
            
            // Get canvas data
            const dataURL = canvas.toDataURL();
            this.fingerprintComponents.canvasFingerprint = await this.hashString(dataURL);
        } catch (error) {
            console.warn('Canvas fingerprinting not supported:', error);
            this.fingerprintComponents.canvasFingerprint = '';
        }
    }

    /**
     * Generate a WebGL fingerprint
     */
    async collectWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                this.fingerprintComponents.webglFingerprint = '';
                return;
            }
            
            // Collect WebGL information
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            
            if (debugInfo) {
                this.fingerprintComponents.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                this.fingerprintComponents.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            } else {
                this.fingerprintComponents.webglVendor = gl.getParameter(gl.VENDOR);
                this.fingerprintComponents.webglRenderer = gl.getParameter(gl.RENDERER);
            }
            
            // Additional WebGL parameters
            this.fingerprintComponents.webglVersion = gl.getParameter(gl.VERSION);
            this.fingerprintComponents.webglShadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
            
            // Create a unique string from WebGL parameters
            const webglData = [
                this.fingerprintComponents.webglVendor,
                this.fingerprintComponents.webglRenderer,
                this.fingerprintComponents.webglVersion,
                this.fingerprintComponents.webglShadingLanguageVersion
            ].join('::');
            
            this.fingerprintComponents.webglFingerprint = await this.hashString(webglData);
        } catch (error) {
            console.warn('WebGL fingerprinting not supported:', error);
            this.fingerprintComponents.webglFingerprint = '';
        }
    }

    /**
     * Hash all components into a single fingerprint string
     */
    async hashComponents() {
        // Convert components object to string
        const componentsString = JSON.stringify(this.fingerprintComponents);
        
        // Hash the string
        return await this.hashString(componentsString);
    }

    /**
     * Create a hash from a string using SubtleCrypto if available
     * @param {string} str - String to hash
     * @returns {Promise<string>} - Hashed string
     */
    async hashString(str) {
        try {
            // Use SubtleCrypto for secure hashing if available
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(str);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                
                // Convert buffer to hex string
                return Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            } else {
                // Fallback to simpler hashing method
                return this.simpleHash(str);
            }
        } catch (error) {
            console.warn('Secure hashing not available:', error);
            return this.simpleHash(str);
        }
    }

    /**
     * Simple string hashing function (fallback)
     * @param {string} str - String to hash
     * @returns {string} - Hashed string
     */
    simpleHash(str) {
        let hash = 0;
        
        if (str.length === 0) return hash.toString(16);
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to hex string and ensure positive
        return (hash >>> 0).toString(16);
    }

    /**
     * Generate a random ID as fallback
     * @returns {string} - Random ID
     */
    generateRandomId() {
        return 'r' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Encode a string using BBES (Braille Binary Encoding Standard)
     * @param {string} input - String to encode
     * @returns {string} - BBES encoded string
     */
    encodeBBES(input) {
        if (!input) return '';
        
        // Braille patterns for hexadecimal characters (0-9, a-f)
        const brailleMap = {
            '0': '⠚', '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
            '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', 'a': '⠁⠃', 'b': '⠃⠃',
            'c': '⠉⠃', 'd': '⠙⠃', 'e': '⠑⠃', 'f': '⠋⠃'
        };
        
        // Convert each character to its Braille representation
        return input.split('').map(char => {
            return brailleMap[char.toLowerCase()] || char;
        }).join('');
    }
    
    /**
     * Decode a BBES encoded string back to original format
     * @param {string} bbesString - BBES encoded string
     * @returns {string} - Decoded string
     */
    decodeBBES(bbesString) {
        if (!bbesString) return '';
        
        // Reverse mapping from Braille to hexadecimal
        const reverseMap = {
            '⠚': '0', '⠁': '1', '⠃': '2', '⠉': '3', '⠙': '4', '⠑': '5',
            '⠋': '6', '⠛': '7', '⠓': '8', '⠊': '9', '⠁⠃': 'a', '⠃⠃': 'b',
            '⠉⠃': 'c', '⠙⠃': 'd', '⠑⠃': 'e', '⠋⠃': 'f'
        };
        
        // Handle double-character codes (like ⠁⠃ for 'a')
        let result = '';
        let i = 0;
        
        while (i < bbesString.length) {
            // Check for two-character codes first
            if (i < bbesString.length - 1) {
                const twoChars = bbesString.substring(i, i + 2);
                if (reverseMap[twoChars]) {
                    result += reverseMap[twoChars];
                    i += 2;
                    continue;
                }
            }
            
            // Otherwise check for single character
            const oneChar = bbesString[i];
            result += reverseMap[oneChar] || oneChar;
            i++;
        }
        
        return result;
    }

    /**
     * Get the current BBES fingerprint
     * @returns {string} - The BBES encoded device fingerprint
     */
    getFingerprint() {
        return this.fingerprint;
    }
    
    /**
     * Get the raw (non-BBES) fingerprint if available
     * @returns {string|null} - The raw device fingerprint
     */
    getRawFingerprint() {
        return this.rawFingerprint;
    }

    /**
     * Reset the fingerprint (for testing or when requested by user)
     */
    resetFingerprint() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.bbesStorageKey);
        this.fingerprint = null;
        this.rawFingerprint = null;
        this.fingerprintComponents = {};
    }
}

// Create a global instance
const deviceFingerprint = new DeviceFingerprint();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await deviceFingerprint.initialize();
    
    // Log fingerprint info for debugging
    console.log('BBES Device Fingerprint:', deviceFingerprint.getFingerprint());
    
    // Dispatch event when fingerprinting is complete
    document.dispatchEvent(new CustomEvent('deviceFingerprint:ready', {
        detail: { fingerprint: deviceFingerprint.getFingerprint() }
    }));
});
