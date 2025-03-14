/**
 * BBID Identity Linker
 * 
 * This component allows users to link their identity across devices
 * using a privacy-preserving approach that minimizes PII exposure.
 */
class BBIDIdentityLinker {
    constructor(options = {}) {
        this.options = {
            apiUrl: options.apiUrl || '/api/link-identity',
            onIdentityLinked: options.onIdentityLinked || function() {},
            onError: options.onError || function() {},
            storageKey: options.storageKey || 'bbid_identity_token',
            hashAlgorithm: options.hashAlgorithm || 'SHA-256',
            salt: options.salt || 'BBID_SALT_' + (new Date().getFullYear()),
            debug: options.debug || false
        };
        
        this.identityToken = this.getStoredIdentityToken();
        
        if (this.options.debug) {
            console.log('BBIDIdentityLinker initialized', {
                hasStoredToken: !!this.identityToken,
                options: { ...this.options, salt: '[REDACTED]' }
            });
        }
    }
    
    /**
     * Get the stored identity token from localStorage
     */
    getStoredIdentityToken() {
        try {
            return localStorage.getItem(this.options.storageKey);
        } catch (error) {
            if (this.options.debug) {
                console.error('Error accessing localStorage', error);
            }
            return null;
        }
    }
    
    /**
     * Store the identity token in localStorage
     */
    storeIdentityToken(token) {
        try {
            localStorage.setItem(this.options.storageKey, token);
            this.identityToken = token;
            return true;
        } catch (error) {
            if (this.options.debug) {
                console.error('Error storing token in localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Check if the user has a linked identity
     */
    hasLinkedIdentity() {
        return !!this.identityToken;
    }
    
    /**
     * Get the current identity token
     */
    getIdentityToken() {
        return this.identityToken;
    }
    
    /**
     * Create a one-way hash of the identifier (email or phone)
     * This ensures we never store the actual PII
     */
    async hashIdentifier(identifier) {
        try {
            // Normalize the identifier (lowercase for email, remove non-digits for phone)
            const normalizedIdentifier = this.normalizeIdentifier(identifier);
            
            // Add salt to prevent rainbow table attacks
            const saltedIdentifier = this.options.salt + normalizedIdentifier;
            
            // Convert string to ArrayBuffer
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedIdentifier);
            
            // Create hash using Web Crypto API
            const hashBuffer = await crypto.subtle.digest(this.options.hashAlgorithm, data);
            
            // Convert hash to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            if (this.options.debug) {
                console.error('Error hashing identifier', error);
            }
            throw new Error('Failed to hash identifier: ' + error.message);
        }
    }
    
    /**
     * Normalize the identifier based on type (email or phone)
     */
    normalizeIdentifier(identifier) {
        // Check if it's an email (contains @)
        if (identifier.includes('@')) {
            return identifier.toLowerCase().trim();
        }
        
        // Otherwise assume it's a phone number and remove non-digits
        return identifier.replace(/\D/g, '');
    }
    
    /**
     * Link an identity using an email or phone number
     * Only stores a one-way hash of the identifier
     */
    async linkIdentity(identifier, deviceId) {
        try {
            if (!identifier) {
                throw new Error('Identifier (email or phone) is required');
            }
            
            // Create a one-way hash of the identifier
            const identifierHash = await this.hashIdentifier(identifier);
            
            // Create a payload with the hash and device ID
            const payload = {
                identifierHash,
                deviceId,
                timestamp: new Date().toISOString(),
                linkType: identifier.includes('@') ? 'email' : 'phone'
            };
            
            // Send the payload to the server
            const response = await fetch(this.options.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to link identity');
            }
            
            const data = await response.json();
            
            // Store the identity token
            this.storeIdentityToken(data.identityToken);
            
            // Call the onIdentityLinked callback
            this.options.onIdentityLinked(data);
            
            return data;
        } catch (error) {
            if (this.options.debug) {
                console.error('Error linking identity', error);
            }
            
            // Call the onError callback
            this.options.onError(error);
            
            throw error;
        }
    }
    
    /**
     * Verify an identity token against the server
     */
    async verifyIdentity() {
        try {
            if (!this.identityToken) {
                throw new Error('No identity token found');
            }
            
            const response = await fetch(this.options.apiUrl + '/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identityToken: this.identityToken
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to verify identity');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (this.options.debug) {
                console.error('Error verifying identity', error);
            }
            throw error;
        }
    }
    
    /**
     * Clear the linked identity
     */
    clearIdentity() {
        try {
            localStorage.removeItem(this.options.storageKey);
            this.identityToken = null;
            return true;
        } catch (error) {
            if (this.options.debug) {
                console.error('Error clearing identity', error);
            }
            return false;
        }
    }
    
    /**
     * Create a UI for linking identity
     */
    createLinkUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }
        
        // Create the UI elements
        const formHtml = `
            <div class="bbid-identity-linker">
                <h3>Link Your Identity</h3>
                <p>Link your identity across devices by providing your email or phone number. We only store a secure hash, not your actual information.</p>
                
                <div class="bbid-form-group">
                    <label for="bbid-identifier">Email or Phone Number</label>
                    <input type="text" id="bbid-identifier" placeholder="Enter email or phone number" class="bbid-input">
                </div>
                
                <div class="bbid-form-actions">
                    <button id="bbid-link-button" class="bbid-button bbid-button-primary">Link Identity</button>
                </div>
                
                <div id="bbid-link-status" class="bbid-status"></div>
            </div>
        `;
        
        container.innerHTML = formHtml;
        
        // Add event listeners
        const linkButton = document.getElementById('bbid-link-button');
        const identifierInput = document.getElementById('bbid-identifier');
        const statusElement = document.getElementById('bbid-link-status');
        
        linkButton.addEventListener('click', async () => {
            const identifier = identifierInput.value.trim();
            
            if (!identifier) {
                statusElement.innerHTML = '<div class="bbid-error">Please enter an email or phone number</div>';
                return;
            }
            
            try {
                statusElement.innerHTML = '<div class="bbid-info">Linking identity...</div>';
                
                // Get the device ID from DeviceFingerprint if available
                let deviceId = 'unknown';
                if (typeof DeviceFingerprint !== 'undefined') {
                    try {
                        const fp = await DeviceFingerprint.load();
                        const result = await fp.get();
                        deviceId = result.visitorId;
                        console.log('Using device ID:', deviceId);
                    } catch (error) {
                        console.error('Error getting device fingerprint:', error);
                    }
                } else {
                    console.warn('DeviceFingerprint not available, using unknown device ID');
                }
                
                const result = await this.linkIdentity(identifier, deviceId);
                
                statusElement.innerHTML = '<div class="bbid-success">Identity linked successfully!</div>';
                
                // Update the UI to show the linked status
                setTimeout(() => {
                    this.updateUIForLinkedIdentity(container, result);
                }, 1500);
            } catch (error) {
                statusElement.innerHTML = `<div class="bbid-error">Error: ${error.message}</div>`;
            }
        });
        
        // If already linked, show the linked UI
        if (this.hasLinkedIdentity()) {
            this.updateUIForLinkedIdentity(container);
        }
    }
    
    /**
     * Update the UI to show linked identity status
     */
    updateUIForLinkedIdentity(container, identityData = null) {
        container.innerHTML = `
            <div class="bbid-identity-linker">
                <h3>Identity Linked</h3>
                <p>Your identity is linked across devices. Sal will recognize you even on new devices.</p>
                
                <div class="bbid-status bbid-success">
                    <div>✓ Identity Linked</div>
                    <div class="bbid-token-preview">Token: ${this.identityToken.substring(0, 8)}...${this.identityToken.substring(this.identityToken.length - 8)}</div>
                </div>
                
                <div class="bbid-form-actions">
                    <button id="bbid-unlink-button" class="bbid-button bbid-button-secondary">Unlink Identity</button>
                </div>
            </div>
        `;
        
        // Add event listener for unlinking
        const unlinkButton = document.getElementById('bbid-unlink-button');
        unlinkButton.addEventListener('click', () => {
            this.clearIdentity();
            this.createLinkUI(container.id); // Recreate the linking UI
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BBIDIdentityLinker;
} else {
    window.BBIDIdentityLinker = BBIDIdentityLinker;
}
