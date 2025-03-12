/**
 * BBID Manager - Handles BrailleBuddy Identity files for cross-device fingerprinting
 * 
 * This module implements the BBID (BrailleBuddy Identity) specification for storing
 * and transferring device identities using BBES (Braille Binary Encoding Standard).
 * It provides functionality for generating, saving, loading, exporting, and importing
 * BBID files, as well as haptic representation of device fingerprints.
 */

class BBIDManager {
    constructor() {
        this.deviceFingerprint = null;
        this.devices = [];
        this.currentDevice = null;
        this.initialized = false;
        this.hapticMode = 'standard'; // 'standard', 'rhythmic', 'frequency'
        this.hapticIntensity = 1.0; // 0.5 to 2.0
    }

    /**
     * Initialize the BBID Manager
     */
    async initialize() {
        // Initialize device fingerprint
        if (typeof DeviceFingerprint !== 'undefined') {
            this.deviceFingerprint = new DeviceFingerprint();
            await this.deviceFingerprint.initialize();
        } else {
            console.error('DeviceFingerprint class not found. BBID Manager cannot initialize properly.');
            return false;
        }

        // Load saved devices
        this.loadDevices();
        
        // Check if current device exists in saved devices
        this.identifyCurrentDevice();
        
        this.initialized = true;
        
        // Dispatch initialization event
        const event = new CustomEvent('bbid:initialized', {
            detail: {
                currentDevice: this.currentDevice,
                deviceCount: this.devices.length
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Generate a new BBID for the current device with enhanced information
     * @param {string} deviceName - User-friendly name for the device
     * @param {string} deviceType - Type of device (desktop, laptop, tablet, phone, other)
     * @param {string} deviceOS - Operating system (windows, macos, linux, ios, android, other)
     * @param {Object} enhancedInfo - Optional enhanced device information object
     * @returns {Object} - The generated BBID object
     */
    async generateBBID(deviceName, deviceType = 'other', deviceOS = 'other', enhancedInfo = null) {
        console.log('DEBUG [BBID-GEN-1]: Generating new BBID for device:', deviceName);
        
        if (!this.initialized || !this.deviceFingerprint) {
            throw new Error('BBID Manager not initialized. Call initialize() first.');
        }
        
        const rawFingerprint = this.deviceFingerprint.getRawFingerprint();
        const bbesFingerprint = this.deviceFingerprint.getFingerprint();
        
        // Get detailed device information
        const detectedInfo = this.detectDeviceInfo();
        
        // Use provided values, enhanced info, or detected values
        deviceType = deviceType === 'other' ? detectedInfo.type : deviceType;
        deviceOS = deviceOS === 'other' ? detectedInfo.os : deviceOS;
        
        // Merge enhanced info with detected info if provided
        const mergedInfo = enhancedInfo ? { ...detectedInfo, ...enhancedInfo } : detectedInfo;
        console.log('DEBUG [BBID-GEN-ENHANCED]: Using merged device info:', mergedInfo);
        
        // Try to get location information if available and not already provided in enhanced info
        let locationInfo = mergedInfo.location || null;
        
        // Only try to get location if not already provided
        if (!locationInfo) {
            try {
                if (navigator.geolocation) {
                    console.log('DEBUG [BBID-GEN-2]: Attempting to get location for BBID');
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: false,
                            timeout: 5000,
                            maximumAge: 600000 // 10 minutes
                        });
                    });
                    
                    // For privacy reasons, we'll just use approximate location (city level)
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    
                    // Use a simple approximation for Salt Lake City area
                    if (latitude >= 40.5 && latitude <= 41.0 && longitude >= -112.1 && longitude <= -111.7) {
                        locationInfo = {
                            city: 'Salt Lake City',
                            region: 'UT',
                            country: 'USA',
                            coordinates: {
                                latitude: Math.round(latitude * 100) / 100, // Round to 2 decimal places for privacy
                                longitude: Math.round(longitude * 100) / 100
                            }
                        };
                    }
                    
                    console.log('DEBUG [BBID-GEN-3]: Got location info for BBID', locationInfo);
                }
            } catch (error) {
                console.warn('DEBUG [BBID-GEN-ERROR]: Error getting location for BBID', error);
            }
        } else {
            console.log('DEBUG [BBID-GEN-4]: Using provided location info', locationInfo);
        }
        
        // Create enhanced BBID structure
        const bbid = {
            version: "1.0.0",
            id: this.generateDeviceId(),
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                name: deviceName,
                type: deviceType,
                os: deviceOS,
                osVersion: mergedInfo.osVersion,
                browser: mergedInfo.browser,
                browserVersion: mergedInfo.browserVersion,
                processor: mergedInfo.processor,
                screen: mergedInfo.screen,
                language: mergedInfo.language || navigator.language,
                timezone: mergedInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                location: locationInfo,
                userAgent: navigator.userAgent
            },
            fingerprint: {
                raw: rawFingerprint,
                bbes: bbesFingerprint,
                algorithm: "sha256",
                components: this.deviceFingerprint.getComponents()
            },
            usage: {
                lastSeen: new Date().toISOString(),
                visitCount: 1,
                totalTimeSpent: 0,
                features: [],
                mcpCompatible: true // Model Context Protocol compatibility flag
            },
            preferences: {
                hapticFeedback: true,
                voiceAssistant: true,
                theme: 'system',
                accessibility: {
                    highContrast: false,
                    largeText: false,
                    screenReader: false
                }
            }
        };
        
        console.log('DEBUG [BBID-GEN-4]: Generated BBID with enhanced information');
        return bbid;
    }
    
    /**
     * Save a BBID to local storage
     * @param {Object} bbid - The BBID object to save
     * @returns {Object} - The saved BBID object
     */
    saveBBID(bbid) {
        if (!bbid || !bbid.fingerprint || !bbid.fingerprint.raw) {
            throw new Error('Invalid BBID object');
        }
        
        // Update modified timestamp
        bbid.metadata.modified = new Date().toISOString();
        
        // Check if device already exists
        const existingIndex = this.devices.findIndex(d => d.fingerprint.raw === bbid.fingerprint.raw);
        
        if (existingIndex !== -1) {
            // Update existing device
            this.devices[existingIndex] = bbid;
        } else {
            // Add new device
            this.devices.push(bbid);
        }
        
        // Save to localStorage
        this.saveDevices();
        
        // Dispatch event
        const event = new CustomEvent('bbid:deviceSaved', {
            detail: { device: bbid }
        });
        document.dispatchEvent(event);
        
        return bbid;
    }
    
    /**
     * Remove a device by its ID
     * @param {string} deviceId - The ID of the device to remove
     * @returns {boolean} - True if device was removed, false otherwise
     */
    removeDevice(deviceId) {
        const initialCount = this.devices.length;
        this.devices = this.devices.filter(d => d.id !== deviceId);
        
        if (this.devices.length !== initialCount) {
            this.saveDevices();
            
            // Dispatch event
            const event = new CustomEvent('bbid:deviceRemoved', {
                detail: { deviceId }
            });
            document.dispatchEvent(event);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all saved devices
     * @returns {Array} - Array of BBID objects
     */
    getDevices() {
        return [...this.devices];
    }
    
    /**
     * Get the current device BBID
     * @returns {Object|null} - The current device BBID or null if not identified
     */
    getCurrentDevice() {
        return this.currentDevice;
    }
    
    /**
     * Export a BBID to a file
     * @param {Object|string} bbid - The BBID object or device ID to export
     * @returns {boolean} - True if export was successful, false otherwise
     */
    exportBBID(bbid) {
        // If string is provided, assume it's a device ID
        if (typeof bbid === 'string') {
            const device = this.devices.find(d => d.id === bbid);
            if (!device) {
                console.error(`Device with ID ${bbid} not found`);
                return false;
            }
            bbid = device;
        }
        
        if (!bbid || !bbid.metadata || !bbid.fingerprint) {
            console.error('Invalid BBID object');
            return false;
        }
        
        try {
            // Convert to JSON string
            const bbidJson = JSON.stringify(bbid, null, 2);
            
            // Create blob and download link
            const blob = new Blob([bbidJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${bbid.metadata.name.replace(/\s+/g, '_')}.bbid`;
            a.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting BBID:', error);
            return false;
        }
    }
    
    /**
     * Import a BBID from a file
     * @param {File} file - The .bbid file to import
     * @returns {Promise<Object>} - Promise resolving to the imported BBID object
     */
    importBBID(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.name.split('.').pop().toLowerCase() !== 'bbid') {
                reject(new Error('Invalid file type. Expected .bbid file.'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const bbid = JSON.parse(event.target.result);
                    
                    // Validate required fields
                    if (!bbid.version || !bbid.metadata || !bbid.fingerprint || 
                        !bbid.metadata.created || !bbid.metadata.name ||
                        !bbid.fingerprint.raw || !bbid.fingerprint.bbes) {
                        reject(new Error('Invalid BBID file format'));
                        return;
                    }
                    
                    // Ensure it has an ID
                    if (!bbid.id) {
                        bbid.id = this.generateDeviceId();
                    }
                    
                    // Update modified timestamp
                    bbid.metadata.modified = new Date().toISOString();
                    
                    // Save and return
                    this.saveBBID(bbid);
                    resolve(bbid);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * Generate a QR code for a BBID
     * @param {Object|string} bbid - The BBID object or device ID
     * @param {string} elementId - The ID of the HTML element to render the QR code in
     * @returns {boolean} - True if QR code was generated, false otherwise
     */
    generateQRCode(bbid, elementId) {
        // If string is provided, assume it's a device ID
        if (typeof bbid === 'string') {
            const device = this.devices.find(d => d.id === bbid);
            if (!device) {
                console.error(`Device with ID ${bbid} not found`);
                return false;
            }
            bbid = device;
        }
        
        if (!bbid || !bbid.fingerprint || !bbid.fingerprint.bbes) {
            console.error('Invalid BBID object');
            return false;
        }
        
        // Create a simplified version with just essential data
        const qrData = {
            v: bbid.version,
            id: bbid.id,
            n: bbid.metadata.name,
            t: bbid.metadata.type,
            o: bbid.metadata.os,
            f: bbid.fingerprint.bbes.substring(0, 50) // First 50 chars of BBES fingerprint
        };
        
        // Convert to JSON
        const qrCodeData = JSON.stringify(qrData);
        
        // Check if QR code library is available
        if (typeof QRCode !== 'undefined') {
            try {
                const element = document.getElementById(elementId);
                if (!element) {
                    console.error(`Element with ID ${elementId} not found`);
                    return false;
                }
                
                // Clear previous QR code
                element.innerHTML = '';
                
                // Generate new QR code
                new QRCode(element, {
                    text: qrCodeData,
                    width: 128,
                    height: 128,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                return true;
            } catch (error) {
                console.error('Error generating QR code:', error);
                return false;
            }
        } else {
            console.error('QRCode library not found');
            return false;
        }
    }
    
    /**
     * Play a haptic pattern representing a BBID fingerprint
     * @param {Object|string} bbid - The BBID object, device ID, or BBES fingerprint string
     * @returns {boolean} - True if haptic pattern was played, false otherwise
     */
    playHapticPattern(bbid) {
        if (!window.navigator.vibrate) {
            console.warn('Vibration API not supported on this device');
            return false;
        }
        
        let bbesFingerprint;
        
        // Handle different input types
        if (typeof bbid === 'string') {
            // Check if it's a device ID
            const device = this.devices.find(d => d.id === bbid);
            if (device) {
                bbesFingerprint = device.fingerprint.bbes;
            } else {
                // Assume it's a BBES fingerprint string
                bbesFingerprint = bbid;
            }
        } else if (bbid && bbid.fingerprint && bbid.fingerprint.bbes) {
            bbesFingerprint = bbid.fingerprint.bbes;
        } else {
            console.error('Invalid input for haptic pattern');
            return false;
        }
        
        // Use only the first 8 characters for the haptic pattern
        const sampleFingerprint = bbesFingerprint.substring(0, 8);
        
        // Generate vibration pattern based on haptic mode
        let vibrationPattern;
        
        switch (this.hapticMode) {
            case 'rhythmic':
                vibrationPattern = this.generateRhythmicPattern(sampleFingerprint);
                break;
            case 'frequency':
                vibrationPattern = this.generateFrequencyPattern(sampleFingerprint);
                break;
            case 'standard':
            default:
                vibrationPattern = this.generateStandardPattern(sampleFingerprint);
                break;
        }
        
        // Apply intensity adjustment
        if (this.hapticIntensity !== 1.0) {
            vibrationPattern = vibrationPattern.map(duration => {
                if (duration > 0) {
                    return Math.round(duration * this.hapticIntensity);
                }
                return duration;
            });
        }
        
        // Trigger vibration
        try {
            window.navigator.vibrate(vibrationPattern);
            return true;
        } catch (error) {
            console.error('Error triggering vibration:', error);
            return false;
        }
    }
    
    /**
     * Set the haptic feedback mode
     * @param {string} mode - The haptic mode ('standard', 'rhythmic', 'frequency')
     * @param {number} intensity - The haptic intensity (0.5 to 2.0)
     */
    setHapticMode(mode, intensity = 1.0) {
        const validModes = ['standard', 'rhythmic', 'frequency'];
        if (validModes.includes(mode)) {
            this.hapticMode = mode;
        } else {
            console.warn(`Invalid haptic mode: ${mode}. Using 'standard' instead.`);
            this.hapticMode = 'standard';
        }
        
        // Clamp intensity between 0.5 and 2.0
        this.hapticIntensity = Math.max(0.5, Math.min(2.0, intensity));
    }
    
    /**
     * Generate a standard vibration pattern for a BBES fingerprint
     * @private
     * @param {string} bbesFingerprint - The BBES fingerprint to convert
     * @returns {Array} - Array of vibration durations
     */
    generateStandardPattern(bbesFingerprint) {
        const vibrationPattern = [];
        
        for (let i = 0; i < bbesFingerprint.length; i++) {
            const char = bbesFingerprint[i];
            
            // Skip non-Braille characters
            if (char.charCodeAt(0) < 0x2800 || char.charCodeAt(0) > 0x28FF) continue;
            
            // Convert Braille to dot pattern
            const dotPattern = char.charCodeAt(0) - 0x2800;
            
            // For each of the 6 possible dots
            for (let dot = 0; dot < 6; dot++) {
                // Check if this dot is raised (1) or not (0)
                const isDotRaised = (dotPattern & (1 << dot)) !== 0;
                
                // Add to vibration pattern: 100ms if raised, 0ms if not
                vibrationPattern.push(isDotRaised ? 100 : 0);
                // Add pause between dots
                vibrationPattern.push(50);
            }
            
            // Add pause between characters
            vibrationPattern.push(200);
        }
        
        return vibrationPattern;
    }
    
    /**
     * Generate a rhythmic vibration pattern for a BBES fingerprint
     * @private
     * @param {string} bbesFingerprint - The BBES fingerprint to convert
     * @returns {Array} - Array of vibration durations
     */
    generateRhythmicPattern(bbesFingerprint) {
        const vibrationPattern = [];
        
        for (let i = 0; i < bbesFingerprint.length; i++) {
            const char = bbesFingerprint[i];
            
            // Skip non-Braille characters
            if (char.charCodeAt(0) < 0x2800 || char.charCodeAt(0) > 0x28FF) continue;
            
            // Convert Braille to dot pattern
            const dotPattern = char.charCodeAt(0) - 0x2800;
            
            // Count raised dots
            let raisedDots = 0;
            for (let dot = 0; dot < 6; dot++) {
                if (dotPattern & (1 << dot)) {
                    raisedDots++;
                }
            }
            
            // Create a rhythm based on raised dot count
            // More dots = longer vibration
            const vibrationDuration = raisedDots * 50;
            if (vibrationDuration > 0) {
                vibrationPattern.push(vibrationDuration);
                vibrationPattern.push(100); // Pause between characters
            }
        }
        
        return vibrationPattern;
    }
    
    /**
     * Generate a frequency-based vibration pattern for a BBES fingerprint
     * @private
     * @param {string} bbesFingerprint - The BBES fingerprint to convert
     * @returns {Array} - Array of vibration durations
     */
    generateFrequencyPattern(bbesFingerprint) {
        const vibrationPattern = [];
        
        for (let i = 0; i < bbesFingerprint.length; i++) {
            const char = bbesFingerprint[i];
            
            // Skip non-Braille characters
            if (char.charCodeAt(0) < 0x2800 || char.charCodeAt(0) > 0x28FF) continue;
            
            // Convert Braille to dot pattern
            const dotPattern = char.charCodeAt(0) - 0x2800;
            
            // Create a pattern with short pulses for each character
            // The number of pulses equals the Unicode value modulo 6 + 1
            const pulseCount = (dotPattern % 6) + 1;
            
            for (let j = 0; j < pulseCount; j++) {
                vibrationPattern.push(30); // Short pulse
                vibrationPattern.push(30); // Short pause
            }
            
            vibrationPattern.push(150); // Longer pause between characters
        }
        
        return vibrationPattern;
    }
    
    /**
     * Load saved devices from localStorage
     * @private
     */
    loadDevices() {
        try {
            const devicesJson = localStorage.getItem('bbid_devices');
            this.devices = devicesJson ? JSON.parse(devicesJson) : [];
        } catch (error) {
            console.error('Error loading devices from localStorage:', error);
            this.devices = [];
        }
    }
    
    /**
     * Save devices to localStorage
     * @private
     */
    saveDevices() {
        try {
            localStorage.setItem('bbid_devices', JSON.stringify(this.devices));
        } catch (error) {
            console.error('Error saving devices to localStorage:', error);
        }
    }
    
    /**
     * Identify the current device from saved devices
     * @private
     */
    identifyCurrentDevice() {
        console.log('DEBUG [BBID-1]: Starting device identification');
        
        if (!this.deviceFingerprint) {
            console.warn('DEBUG [BBID-ERROR]: Device fingerprint not available for identification');
            return;
        }
        
        const rawFingerprint = this.deviceFingerprint.getRawFingerprint();
        console.log('DEBUG [BBID-2]: Current device fingerprint:', rawFingerprint?.substring(0, 20) + '...');
        console.log('DEBUG [BBID-3]: Number of saved devices:', this.devices.length);
        
        // Look for exact match
        let device = this.devices.find(d => d.fingerprint.raw === rawFingerprint);
        
        if (device) {
            console.log('DEBUG [BBID-4]: Device identified:', device.metadata?.name);
            // Update last seen timestamp
            device.usage.lastSeen = new Date().toISOString();
            device.usage.visitCount = (device.usage.visitCount || 0) + 1;
            this.currentDevice = device;
            this.saveDevices();
        } else {
            console.warn('DEBUG [BBID-5]: No matching device found in saved devices');
            // Log fingerprints of saved devices for comparison
            if (this.devices.length > 0) {
                console.log('DEBUG [BBID-6]: Saved device fingerprints:');
                this.devices.forEach((d, index) => {
                    console.log(`Device ${index + 1} (${d.metadata?.name}):`, 
                                d.fingerprint.raw?.substring(0, 20) + '...');
                });
            }
        }
    }
    
    /**
     * Detect detailed device information based on user agent and available APIs
     * @private
     * @returns {Object} - Object with detailed device information
     */
    detectDeviceInfo() {
        console.log('DEBUG [BBID-DETECT-1]: Detecting detailed device information');
        const userAgent = navigator.userAgent;
        const deviceInfo = {
            type: 'other',
            os: 'other',
            osVersion: 'unknown',
            browser: 'unknown',
            browserVersion: 'unknown',
            processor: 'unknown',
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth
            },
            language: navigator.language || 'en-US',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            touchSupport: 'ontouchstart' in window,
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            memory: navigator.deviceMemory || 'unknown',
            connection: navigator.connection ? {
                type: navigator.connection.effectiveType || 'unknown',
                downlink: navigator.connection.downlink || 'unknown'
            } : 'unknown'
        };
        
        // Detect device type with more detail
        if (/mobile|android|iphone|ipod|silk|blackberry|opera mini|iemobile/i.test(userAgent.toLowerCase())) {
            deviceInfo.type = 'phone';
            
            // Try to detect specific phone models
            if (/iphone/i.test(userAgent)) {
                deviceInfo.type = 'iPhone';
                // Try to detect iPhone model
                if (/iPhone1[3-9]/i.test(userAgent)) {
                    deviceInfo.type = 'iPhone 13+';
                } else if (/iPhone1[0-2]/i.test(userAgent)) {
                    deviceInfo.type = 'iPhone X/11/12';
                }
            } else if (/pixel/i.test(userAgent)) {
                deviceInfo.type = 'Google Pixel';
            } else if (/samsung|galaxy/i.test(userAgent)) {
                deviceInfo.type = 'Samsung Galaxy';
            }
        } else if (/ipad|tablet|playbook|silk/i.test(userAgent.toLowerCase())) {
            deviceInfo.type = 'tablet';
            
            // Try to detect specific tablet models
            if (/ipad/i.test(userAgent)) {
                deviceInfo.type = 'iPad';
                if (/iPad Pro/i.test(userAgent)) {
                    deviceInfo.type = 'iPad Pro';
                }
            } else if (/surface/i.test(userAgent)) {
                deviceInfo.type = 'Surface Tablet';
            }
        } else {
            // Assume desktop/laptop
            deviceInfo.type = 'desktop';
            
            // Try to distinguish between desktop and laptop with more detail
            if (/macbook/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'MacBook';
                if (/macbook pro/i.test(userAgent.toLowerCase())) {
                    deviceInfo.type = 'MacBook Pro';
                } else if (/macbook air/i.test(userAgent.toLowerCase())) {
                    deviceInfo.type = 'MacBook Air';
                }
            } else if (/thinkpad/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'ThinkPad Laptop';
            } else if (/surface/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'Surface Laptop';
            } else if (/notebook|laptop/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'laptop';
            } else if (/imac/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'iMac';
            } else if (/mac mini/i.test(userAgent.toLowerCase())) {
                deviceInfo.type = 'Mac Mini';
            }
        }
        
        // Detect OS with more detail
        if (/Windows NT 10.0/i.test(userAgent)) {
            deviceInfo.os = 'Windows';
            deviceInfo.osVersion = '10';
        } else if (/Windows NT 6.3/i.test(userAgent)) {
            deviceInfo.os = 'Windows';
            deviceInfo.osVersion = '8.1';
        } else if (/Windows NT 6.2/i.test(userAgent)) {
            deviceInfo.os = 'Windows';
            deviceInfo.osVersion = '8';
        } else if (/Windows NT 6.1/i.test(userAgent)) {
            deviceInfo.os = 'Windows';
            deviceInfo.osVersion = '7';
        } else if (/Mac OS X/i.test(userAgent)) {
            deviceInfo.os = 'macOS';
            
            // Try to extract macOS version
            const macVersionMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
            if (macVersionMatch) {
                deviceInfo.osVersion = macVersionMatch[1].replace(/_/g, '.');
            }
            
            // Try to detect Mac model
            if (/Intel Mac OS X/i.test(userAgent)) {
                deviceInfo.processor = 'Intel';
            } else if (/Mac OS X.*AppleWebKit/i.test(userAgent)) {
                deviceInfo.processor = 'Apple Silicon';
                if (/Mac OS X.*AppleWebKit.*Safari/i.test(userAgent)) {
                    deviceInfo.processor = 'M1/M2';
                }
            }
        } else if (/Android/i.test(userAgent)) {
            deviceInfo.os = 'Android';
            const match = userAgent.match(/Android (\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.osVersion = match[1];
            }
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            deviceInfo.os = 'iOS';
            const match = userAgent.match(/OS (\d+[_\d]*)/i);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (/Linux/i.test(userAgent)) {
            deviceInfo.os = 'Linux';
            if (/Ubuntu/i.test(userAgent)) {
                deviceInfo.osVersion = 'Ubuntu';
            } else if (/Fedora/i.test(userAgent)) {
                deviceInfo.osVersion = 'Fedora';
            } else if (/Debian/i.test(userAgent)) {
                deviceInfo.osVersion = 'Debian';
            }
        } else if (/CrOS/i.test(userAgent)) {
            deviceInfo.os = 'Chrome OS';
        }
        
        // Detect browser with more detail
        if (/Chrome/i.test(userAgent) && !/Chromium|Edge|OPR|Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.browserVersion = match[1];
            }
        } else if (/Firefox/i.test(userAgent)) {
            deviceInfo.browser = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.browserVersion = match[1];
            }
        } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edge|OPR|Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Safari';
            const match = userAgent.match(/Version\/(\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.browserVersion = match[1];
            }
        } else if (/Edge/i.test(userAgent)) {
            deviceInfo.browser = 'Edge';
            const match = userAgent.match(/Edge\/(\d+(\.\d+)*)/i) || userAgent.match(/Edg\/(\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.browserVersion = match[1];
            }
        } else if (/OPR/i.test(userAgent)) {
            deviceInfo.browser = 'Opera';
            const match = userAgent.match(/OPR\/(\d+(\.\d+)*)/i);
            if (match) {
                deviceInfo.browserVersion = match[1];
            }
        } else if (/Brave/i.test(userAgent)) {
            deviceInfo.browser = 'Brave';
        }
        
        // Try to get more processor information
        if (deviceInfo.processor === 'unknown') {
            if (/Intel/i.test(userAgent)) {
                deviceInfo.processor = 'Intel';
            } else if (/ARM/i.test(userAgent)) {
                deviceInfo.processor = 'ARM';
            } else if (/AppleWebKit/i.test(userAgent) && /Mac/i.test(userAgent) && !/Intel/i.test(userAgent)) {
                deviceInfo.processor = 'Apple Silicon';
            }
        }
        
        console.log('DEBUG [BBID-DETECT-2]: Detected device info:', deviceInfo);
        return deviceInfo;
    }
    
    /**
     * Generate a unique device ID
     * @private
     * @returns {string} - A unique device ID
     */
    generateDeviceId() {
        return 'bbid_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Get components that can be used for fingerprinting
     * @returns {Object} - Object containing available fingerprinting components
     */
    getAvailableComponents() {
        return {
            screen: {
                available: true,
                description: 'Screen resolution and color depth'
            },
            navigator: {
                available: true,
                description: 'Browser information, language, and plugins'
            },
            canvas: {
                available: !!window.HTMLCanvasElement,
                description: 'Canvas rendering characteristics'
            },
            webGL: {
                available: !!window.WebGLRenderingContext,
                description: 'WebGL capabilities and renderer information'
            },
            audio: {
                available: !!window.AudioContext || !!window.webkitAudioContext,
                description: 'Audio processing characteristics'
            },
            fonts: {
                available: true,
                description: 'System fonts detection'
            },
            localStorage: {
                available: !!window.localStorage,
                description: 'Local storage availability'
            },
            cpuCores: {
                available: !!navigator.hardwareConcurrency,
                description: 'CPU core count'
            },
            touchSupport: {
                available: 'ontouchstart' in window,
                description: 'Touch screen capabilities'
            },
            accelerometer: {
                available: !!window.DeviceMotionEvent,
                description: 'Device motion and orientation'
            },
            battery: {
                available: !!navigator.getBattery,
                description: 'Battery status information'
            },
            bluetooth: {
                available: !!navigator.bluetooth,
                description: 'Bluetooth capabilities'
            }
        };
    }
}

// Create global instance if in browser environment
if (typeof window !== 'undefined') {
    window.bbidManager = new BBIDManager();
    
    // Auto-initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.bbidManager.initialize();
        });
    } else {
        window.bbidManager.initialize();
    }
}
