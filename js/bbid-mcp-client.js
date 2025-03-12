/**
 * BBID MCP Client - Model Context Protocol client for BrailleBuddy Identity
 * 
 * This module implements a client for interacting with MCP-compatible BBID services.
 * It provides functionality for registering, verifying, and sharing BBIDs across devices
 * while maintaining privacy and security.
 */

class BBIDMCPClient {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || 'https://api.braillebuddy.com/mcp';
        this.apiVersion = options.apiVersion || 'v1';
        this.useEncryption = options.useEncryption !== false;
        this.autoRetry = options.autoRetry !== false;
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 10000; // 10 seconds
        
        // Authentication
        this.authToken = options.authToken || null;
        
        // Encryption
        this.encryptionKey = null;
        this.publicKey = null;
        this.privateKey = null;
        
        // Cache
        this.cache = new Map();
        this.cacheExpiry = options.cacheExpiry || 3600000; // 1 hour
        
        // Initialize crypto if needed
        if (this.useEncryption) {
            this.initializeCrypto();
        }
    }
    
    /**
     * Initialize cryptography for secure BBID operations
     */
    async initializeCrypto() {
        try {
            // Check if Web Crypto API is available
            if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
                // Generate key pair for asymmetric encryption
                const keyPair = await window.crypto.subtle.generateKey(
                    {
                        name: "RSA-OAEP",
                        modulusLength: 2048,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: "SHA-256",
                    },
                    true,
                    ["encrypt", "decrypt"]
                );
                
                this.publicKey = keyPair.publicKey;
                this.privateKey = keyPair.privateKey;
                
                // Export public key for sharing
                const exportedPublicKey = await window.crypto.subtle.exportKey(
                    "spki",
                    this.publicKey
                );
                
                // Convert to base64 for storage and transmission
                const exportedPublicKeyBase64 = this._arrayBufferToBase64(exportedPublicKey);
                
                console.log('Crypto initialized successfully');
                return exportedPublicKeyBase64;
            } else {
                console.warn('Web Crypto API not available, falling back to less secure methods');
                // Implement fallback encryption if needed
                return null;
            }
        } catch (error) {
            console.error('Failed to initialize crypto:', error);
            this.useEncryption = false;
            return null;
        }
    }
    
    /**
     * Register a new BBID with the MCP service
     * @param {Object} bbid - The BBID object to register
     * @returns {Promise<Object>} - The registered BBID with server-assigned properties
     */
    async registerBBID(bbid) {
        try {
            // Validate BBID against schema
            if (!this._validateBBID(bbid)) {
                throw new Error('Invalid BBID format');
            }
            
            // Add MCP-specific properties
            const mcpBBID = this._prepareBBIDForMCP(bbid);
            
            // Encrypt sensitive data if enabled
            const preparedBBID = this.useEncryption ? 
                await this._encryptSensitiveData(mcpBBID) : 
                mcpBBID;
            
            // Make API request
            const response = await this._apiRequest('/bbid/register', {
                method: 'POST',
                body: JSON.stringify(preparedBBID)
            });
            
            // Cache the result
            this._cacheResult(response.id, response);
            
            return response;
        } catch (error) {
            console.error('Failed to register BBID:', error);
            throw error;
        }
    }
    
    /**
     * Verify a BBID against the current device fingerprint
     * @param {string} bbidId - The ID of the BBID to verify
     * @param {string} deviceFingerprint - The current device fingerprint
     * @returns {Promise<Object>} - Verification result with confidence score
     */
    async verifyBBID(bbidId, deviceFingerprint) {
        try {
            // Make API request
            const response = await this._apiRequest('/bbid/verify', {
                method: 'POST',
                body: JSON.stringify({
                    bbidId,
                    fingerprint: deviceFingerprint
                })
            });
            
            return response;
        } catch (error) {
            console.error('Failed to verify BBID:', error);
            throw error;
        }
    }
    
    /**
     * Retrieve a BBID by its ID
     * @param {string} bbidId - The ID of the BBID to retrieve
     * @returns {Promise<Object>} - The retrieved BBID
     */
    async getBBID(bbidId) {
        try {
            // Check cache first
            const cachedResult = this._getCachedResult(bbidId);
            if (cachedResult) {
                return cachedResult;
            }
            
            // Make API request
            const response = await this._apiRequest(`/bbid/${bbidId}`, {
                method: 'GET'
            });
            
            // Decrypt sensitive data if needed
            const decryptedBBID = this.useEncryption ? 
                await this._decryptSensitiveData(response) : 
                response;
            
            // Cache the result
            this._cacheResult(bbidId, decryptedBBID);
            
            return decryptedBBID;
        } catch (error) {
            console.error(`Failed to retrieve BBID ${bbidId}:`, error);
            throw error;
        }
    }
    
    /**
     * Share a BBID with another device or user
     * @param {string} bbidId - The ID of the BBID to share
     * @param {string} targetPublicKey - Public key of the recipient
     * @param {Array<string>} permissions - Permissions to grant ["read", "write", "share"]
     * @returns {Promise<Object>} - Sharing result with access token
     */
    async shareBBID(bbidId, targetPublicKey, permissions = ["read"]) {
        try {
            // Make API request
            const response = await this._apiRequest('/bbid/share', {
                method: 'POST',
                body: JSON.stringify({
                    bbidId,
                    targetPublicKey,
                    permissions
                })
            });
            
            return response;
        } catch (error) {
            console.error('Failed to share BBID:', error);
            throw error;
        }
    }
    
    /**
     * Update an existing BBID
     * @param {string} bbidId - The ID of the BBID to update
     * @param {Object} updates - The properties to update
     * @returns {Promise<Object>} - The updated BBID
     */
    async updateBBID(bbidId, updates) {
        try {
            // Encrypt sensitive updates if needed
            const preparedUpdates = this.useEncryption ? 
                await this._encryptSensitiveData(updates) : 
                updates;
            
            // Make API request
            const response = await this._apiRequest(`/bbid/${bbidId}`, {
                method: 'PATCH',
                body: JSON.stringify(preparedUpdates)
            });
            
            // Invalidate cache
            this._invalidateCache(bbidId);
            
            return response;
        } catch (error) {
            console.error(`Failed to update BBID ${bbidId}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete a BBID
     * @param {string} bbidId - The ID of the BBID to delete
     * @returns {Promise<boolean>} - True if deletion was successful
     */
    async deleteBBID(bbidId) {
        try {
            // Make API request
            await this._apiRequest(`/bbid/${bbidId}`, {
                method: 'DELETE'
            });
            
            // Invalidate cache
            this._invalidateCache(bbidId);
            
            return true;
        } catch (error) {
            console.error(`Failed to delete BBID ${bbidId}:`, error);
            throw error;
        }
    }
    
    /**
     * Sync learning progress across devices
     * @param {string} bbidId - The ID of the BBID to sync
     * @param {Object} learningProgress - The learning progress data
     * @returns {Promise<Object>} - The synced learning progress
     */
    async syncLearningProgress(bbidId, learningProgress) {
        try {
            // Make API request
            const response = await this._apiRequest(`/bbid/${bbidId}/learning`, {
                method: 'PUT',
                body: JSON.stringify(learningProgress)
            });
            
            return response;
        } catch (error) {
            console.error(`Failed to sync learning progress for BBID ${bbidId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get all BBIDs associated with the current user
     * @returns {Promise<Array<Object>>} - Array of BBIDs
     */
    async getUserBBIDs() {
        try {
            // Make API request
            const response = await this._apiRequest('/bbid/user', {
                method: 'GET'
            });
            
            return response;
        } catch (error) {
            console.error('Failed to get user BBIDs:', error);
            throw error;
        }
    }
    
    /**
     * Make an API request to the MCP service
     * @private
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - API response
     */
    async _apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}/${this.apiVersion}${endpoint}`;
        
        // Add headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Version': this.apiVersion
        };
        
        // Add auth token if available
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        // Prepare request options
        const requestOptions = {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            },
            timeout: this.timeout
        };
        
        // Implement retry logic
        let retries = 0;
        let lastError = null;
        
        while (retries <= this.maxRetries) {
            try {
                // Use fetch for browser or node-fetch for Node.js
                const fetchFunc = typeof window !== 'undefined' ? window.fetch : require('node-fetch');
                const response = await fetchFunc(url, requestOptions);
                
                // Check if response is ok
                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `HTTP error ${response.status}`);
                }
                
                // Parse response
                const data = await response.json();
                return data;
            } catch (error) {
                lastError = error;
                retries++;
                
                // Only retry if auto-retry is enabled and it's not the last attempt
                if (this.autoRetry && retries <= this.maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, retries), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    break;
                }
            }
        }
        
        throw lastError;
    }
    
    /**
     * Validate a BBID against the MCP schema
     * @private
     * @param {Object} bbid - The BBID to validate
     * @returns {boolean} - True if valid
     */
    _validateBBID(bbid) {
        // Basic validation
        if (!bbid || typeof bbid !== 'object') {
            return false;
        }
        
        // Check required fields
        const requiredFields = ['version', 'metadata', 'fingerprint'];
        for (const field of requiredFields) {
            if (!bbid[field]) {
                return false;
            }
        }
        
        // More detailed validation could be implemented here
        
        return true;
    }
    
    /**
     * Prepare a BBID for MCP by adding required properties
     * @private
     * @param {Object} bbid - The BBID to prepare
     * @returns {Object} - MCP-compatible BBID
     */
    _prepareBBIDForMCP(bbid) {
        // Clone to avoid modifying the original
        const mcpBBID = JSON.parse(JSON.stringify(bbid));
        
        // Add MCP entity type
        mcpBBID.entity = 'bbid';
        
        // Add permissions if not present
        if (!mcpBBID.permissions) {
            mcpBBID.permissions = {
                read: ['self'],
                write: ['self'],
                share: []
            };
        }
        
        // Add public key if available
        if (this.publicKey) {
            mcpBBID.metadata.publicKey = this._getPublicKeyBase64();
        }
        
        return mcpBBID;
    }
    
    /**
     * Encrypt sensitive data in a BBID
     * @private
     * @param {Object} bbid - The BBID with sensitive data
     * @returns {Promise<Object>} - BBID with encrypted sensitive data
     */
    async _encryptSensitiveData(bbid) {
        if (!this.useEncryption || !this.publicKey) {
            return bbid;
        }
        
        try {
            // Clone to avoid modifying the original
            const encryptedBBID = JSON.parse(JSON.stringify(bbid));
            
            // Encrypt identity information if present
            if (encryptedBBID.identity) {
                // Convert to string
                const identityString = JSON.stringify(encryptedBBID.identity);
                
                // Encrypt using public key
                const encoder = new TextEncoder();
                const data = encoder.encode(identityString);
                
                const encryptedData = await window.crypto.subtle.encrypt(
                    {
                        name: "RSA-OAEP"
                    },
                    this.publicKey,
                    data
                );
                
                // Convert to base64
                encryptedBBID.identity = this._arrayBufferToBase64(encryptedData);
                encryptedBBID._identityEncrypted = true;
            }
            
            // Encrypt raw fingerprint if present
            if (encryptedBBID.fingerprint && encryptedBBID.fingerprint.raw) {
                // Similar encryption process for raw fingerprint
                const encoder = new TextEncoder();
                const data = encoder.encode(encryptedBBID.fingerprint.raw);
                
                const encryptedData = await window.crypto.subtle.encrypt(
                    {
                        name: "RSA-OAEP"
                    },
                    this.publicKey,
                    data
                );
                
                // Convert to base64
                encryptedBBID.fingerprint.raw = this._arrayBufferToBase64(encryptedData);
                encryptedBBID.fingerprint._rawEncrypted = true;
            }
            
            return encryptedBBID;
        } catch (error) {
            console.error('Failed to encrypt sensitive data:', error);
            return bbid;
        }
    }
    
    /**
     * Decrypt sensitive data in a BBID
     * @private
     * @param {Object} bbid - The BBID with encrypted sensitive data
     * @returns {Promise<Object>} - BBID with decrypted sensitive data
     */
    async _decryptSensitiveData(bbid) {
        if (!this.useEncryption || !this.privateKey) {
            return bbid;
        }
        
        try {
            // Clone to avoid modifying the original
            const decryptedBBID = JSON.parse(JSON.stringify(bbid));
            
            // Decrypt identity information if encrypted
            if (decryptedBBID._identityEncrypted && decryptedBBID.identity) {
                // Convert from base64
                const encryptedData = this._base64ToArrayBuffer(decryptedBBID.identity);
                
                // Decrypt using private key
                const decryptedData = await window.crypto.subtle.decrypt(
                    {
                        name: "RSA-OAEP"
                    },
                    this.privateKey,
                    encryptedData
                );
                
                // Convert to string and parse
                const decoder = new TextDecoder();
                const identityString = decoder.decode(decryptedData);
                decryptedBBID.identity = JSON.parse(identityString);
                delete decryptedBBID._identityEncrypted;
            }
            
            // Decrypt raw fingerprint if encrypted
            if (decryptedBBID.fingerprint && decryptedBBID.fingerprint._rawEncrypted) {
                // Similar decryption process for raw fingerprint
                const encryptedData = this._base64ToArrayBuffer(decryptedBBID.fingerprint.raw);
                
                const decryptedData = await window.crypto.subtle.decrypt(
                    {
                        name: "RSA-OAEP"
                    },
                    this.privateKey,
                    encryptedData
                );
                
                // Convert to string
                const decoder = new TextDecoder();
                decryptedBBID.fingerprint.raw = decoder.decode(decryptedData);
                delete decryptedBBID.fingerprint._rawEncrypted;
            }
            
            return decryptedBBID;
        } catch (error) {
            console.error('Failed to decrypt sensitive data:', error);
            return bbid;
        }
    }
    
    /**
     * Get base64 representation of the public key
     * @private
     * @returns {string|null} - Base64 encoded public key
     */
    async _getPublicKeyBase64() {
        if (!this.publicKey) {
            return null;
        }
        
        try {
            const exportedPublicKey = await window.crypto.subtle.exportKey(
                "spki",
                this.publicKey
            );
            
            return this._arrayBufferToBase64(exportedPublicKey);
        } catch (error) {
            console.error('Failed to export public key:', error);
            return null;
        }
    }
    
    /**
     * Convert ArrayBuffer to Base64 string
     * @private
     * @param {ArrayBuffer} buffer - The buffer to convert
     * @returns {string} - Base64 encoded string
     */
    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    /**
     * Convert Base64 string to ArrayBuffer
     * @private
     * @param {string} base64 - The base64 string to convert
     * @returns {ArrayBuffer} - Decoded array buffer
     */
    _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    /**
     * Cache a result for future use
     * @private
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    _cacheResult(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get a cached result if not expired
     * @private
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if expired/not found
     */
    _getCachedResult(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    /**
     * Invalidate a cached result
     * @private
     * @param {string} key - Cache key
     */
    _invalidateCache(key) {
        this.cache.delete(key);
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BBIDMCPClient;
} else if (typeof window !== 'undefined') {
    window.BBIDMCPClient = BBIDMCPClient;
}
