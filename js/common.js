/**
 * Common JavaScript for the BrailleBuddy Ecosystem
 * This file should be included on all pages to provide consistent functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize BBID integration if available
    initBBID();
    
    // Log page visit
    logPageVisit();
});

/**
 * Initialize BBID integration
 */
function initBBID() {
    // Check if BBID is already loaded
    if (window.BBID) {
        console.log('BBID already initialized');
        return;
    }
    
    // Create BBID namespace
    window.BBID = {
        deviceFingerprint: null,
        behavioralData: null,
        
        /**
         * Get the current user identity
         * @returns {Promise} Promise resolving to user identity object
         */
        getIdentity: function() {
            return new Promise((resolve, reject) => {
                // If we already have a device fingerprint, use it
                if (this.deviceFingerprint) {
                    resolve({
                        id: this.deviceFingerprint.visitorId,
                        type: 'device',
                        confidence: 'medium',
                        behavioral: this.behavioralData
                    });
                    return;
                }
                
                // Otherwise try to generate one
                if (window.DeviceFingerprint) {
                    DeviceFingerprint.load()
                        .then(fp => fp.get())
                        .then(result => {
                            this.deviceFingerprint = result;
                            resolve({
                                id: result.visitorId,
                                type: 'device',
                                confidence: 'medium'
                            });
                        })
                        .catch(error => {
                            console.error('Error getting device fingerprint:', error);
                            resolve({
                                id: 'anonymous-' + Math.random().toString(36).substring(2, 15),
                                type: 'anonymous',
                                confidence: 'low'
                            });
                        });
                } else {
                    // If DeviceFingerprint is not available, return anonymous
                    resolve({
                        id: 'anonymous-' + Math.random().toString(36).substring(2, 15),
                        type: 'anonymous',
                        confidence: 'low'
                    });
                }
            });
        },
        
        /**
         * Initialize behavioral tracking
         */
        initBehavioral: function() {
            if (window.BBIDBehavioral && this.deviceFingerprint) {
                const behavioral = new BBIDBehavioral({
                    deviceId: this.deviceFingerprint.visitorId,
                    onFingerprintGenerated: (data) => {
                        this.behavioralData = data;
                        console.log('Behavioral data updated');
                        
                        // Dispatch event for other components to listen for
                        const event = new CustomEvent('bbid:behavioral-updated', { detail: data });
                        document.dispatchEvent(event);
                    }
                });
                
                behavioral.start();
            }
        }
    };
    
    // Initialize device fingerprinting
    if (window.DeviceFingerprint) {
        DeviceFingerprint.load()
            .then(fp => fp.get())
            .then(result => {
                window.BBID.deviceFingerprint = result;
                
                // Initialize behavioral tracking once we have the device fingerprint
                window.BBID.initBehavioral();
                
                // Dispatch event for other components to listen for
                const event = new CustomEvent('bbid:identity-loaded', { detail: result });
                document.dispatchEvent(event);
            });
    }
}

/**
 * Log page visit to analytics
 */
function logPageVisit() {
    // Get current page info
    const pageInfo = {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
    };
    
    // If we have a device fingerprint, include it
    if (window.BBID && window.BBID.deviceFingerprint) {
        pageInfo.visitorId = window.BBID.deviceFingerprint.visitorId;
    }
    
    // Log to console in development
    console.log('Page visit:', pageInfo);
    
    // In a production environment, you would send this to your analytics endpoint
    // Example:
    // fetch('/api/analytics/pageview', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(pageInfo)
    // });
}
