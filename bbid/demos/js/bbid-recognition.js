/**
 * BBID Recognition Demo
 * Demonstrates the behavioral fingerprinting capabilities of the BBID system
 */

class BBIDRecognition {
    constructor() {
        this.deviceFingerprint = null;
        this.behavioralFingerprint = null;
        this.identityStatus = 'unknown';
        this.confidenceScore = 0;
        this.knownDevices = [];
        this.currentUser = null;
        
        // DOM elements
        this.elements = {
            greetingContainer: document.getElementById('greeting-container'),
            greetingText: document.getElementById('greeting-text'),
            greetingSubtext: document.getElementById('greeting-subtext'),
            identityForm: document.getElementById('identity-form'),
            identityInput: document.getElementById('identity-input'),
            identitySubmit: document.getElementById('identity-submit'),
            deviceFingerprint: document.getElementById('device-fingerprint'),
            recognitionStatus: document.getElementById('recognition-status'),
            confidenceScore: document.getElementById('confidence-score'),
            confidenceFill: document.getElementById('confidence-fill'),
            identityStatus: document.getElementById('identity-status'),
            statusIndicator: document.getElementById('status-indicator'),
            knownDevicesContainer: document.getElementById('known-devices-container'),
            deviceList: document.getElementById('device-list'),
            
            // Device info elements
            deviceType: document.getElementById('device-type'),
            operatingSystem: document.getElementById('operating-system'),
            screenResolution: document.getElementById('screen-resolution'),
            touchSupport: document.getElementById('touch-support'),
            motionSensors: document.getElementById('motion-sensors'),
            hardwareConcurrency: document.getElementById('hardware-concurrency'),
            
            // Browser info elements
            browserName: document.getElementById('browser-name'),
            userAgent: document.getElementById('user-agent'),
            browserLanguage: document.getElementById('browser-language'),
            timezone: document.getElementById('timezone'),
            pluginsCount: document.getElementById('plugins-count'),
            
            // Behavioral info elements
            typingPattern: document.getElementById('typing-pattern'),
            mouseMovement: document.getElementById('mouse-movement'),
            scrollBehavior: document.getElementById('scroll-behavior'),
            interactionTiming: document.getElementById('interaction-timing'),
            sessionPattern: document.getElementById('session-pattern'),
            dataCollectionStatus: document.getElementById('data-collection-status'),
            
            // Network info elements
            connectionType: document.getElementById('connection-type'),
            downlinkSpeed: document.getElementById('downlink-speed'),
            rtt: document.getElementById('rtt'),
            ipType: document.getElementById('ip-type')
        };
        
        // Initialize tab switching
        this.initializeTabs();
        
        // Initialize form submission
        this.initializeForm();
        
        // Start device fingerprinting
        this.initializeDeviceFingerprinting();
    }
    
    /**
     * Initialize tab switching functionality
     */
    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }
    
    /**
     * Initialize form submission
     */
    initializeForm() {
        this.elements.identitySubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const name = this.elements.identityInput.value.trim();
            
            if (name) {
                this.confirmIdentity(name);
            }
        });
        
        this.elements.identityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const name = this.elements.identityInput.value.trim();
                
                if (name) {
                    this.confirmIdentity(name);
                }
            }
        });
    }
    
    /**
     * Initialize device fingerprinting
     */
    initializeDeviceFingerprinting() {
        // Update status
        this.elements.recognitionStatus.textContent = 'Generating device fingerprint...';
        
        // Initialize FingerprintJS
        if (typeof DeviceFingerprint !== 'undefined') {
            DeviceFingerprint.load()
                .then(fp => fp.get())
                .then(result => {
                    this.deviceFingerprint = result;
                    this.updateDeviceInfo(result);
                    this.initializeBehavioralFingerprinting(result.visitorId);
                })
                .catch(error => {
                    console.error('Error generating device fingerprint:', error);
                    this.elements.recognitionStatus.textContent = 'Error generating device fingerprint';
                });
        } else {
            console.error('DeviceFingerprint library not loaded');
            this.elements.recognitionStatus.textContent = 'Device fingerprinting unavailable';
        }
    }
    
    /**
     * Initialize behavioral fingerprinting
     * @param {string} deviceId - The device fingerprint ID
     */
    initializeBehavioralFingerprinting(deviceId) {
        // Update status
        this.elements.recognitionStatus.textContent = 'Collecting behavioral data...';
        
        // Initialize BBIDBehavioral
        if (typeof BBIDBehavioral !== 'undefined') {
            const behavioralTracker = new BBIDBehavioral({
                deviceId: deviceId,
                trackKeyboard: true,
                trackMouse: true,
                trackTouch: true,
                trackMotion: true,
                trackScroll: true,
                trackForms: true,
                trackSession: true,
                trackUI: true,
                debug: true,
                // Add API URL for sending data to MongoDB
                apiUrl: 'https://braillebuddy-5nxc9s4bm-elevate-foundry1s-projects.vercel.app/api/behavioral-fingerprint',
                onFingerprintGenerated: (data) => this.onBehavioralFingerprintGenerated(data)
            });
            
            // Store reference to the tracker
            this.behavioralTracker = behavioralTracker;
            
            // Start tracking
            behavioralTracker.start();
            
            // Simulate confidence score increasing over time
            this.simulateConfidenceIncrease();
        } else {
            console.error('BBIDBehavioral library not loaded');
            this.elements.recognitionStatus.textContent = 'Behavioral fingerprinting unavailable';
        }
    }
    
    /**
     * Handle behavioral fingerprint generation
     * @param {Object} data - The behavioral fingerprint data
     */
    onBehavioralFingerprintGenerated(data) {
        this.behavioralFingerprint = data;
        
        // Update behavioral metrics display
        this.updateBehavioralMetrics(data);
        
        // Check if user is recognized
        this.checkRecognition();
        
        // Update status
        this.elements.recognitionStatus.textContent = 'Behavioral fingerprint generated';
    }
    
    /**
     * Update device information display
     * @param {Object} fingerprint - The device fingerprint data
     */
    updateDeviceInfo(fingerprint) {
        // Update device fingerprint display
        this.elements.deviceFingerprint.textContent = fingerprint.visitorId || 'Unknown';
        
        // Update device info
        if (fingerprint.components) {
            const components = fingerprint.components;
            
            // Device info
            this.elements.deviceType.textContent = this.getDeviceType();
            this.elements.operatingSystem.textContent = components.os ? components.os.value : 'Unknown';
            this.elements.screenResolution.textContent = `${window.screen.width}x${window.screen.height}`;
            this.elements.touchSupport.textContent = this.hasTouchSupport() ? 'Yes' : 'No';
            this.elements.motionSensors.textContent = this.hasMotionSensors() ? 'Yes' : 'No';
            this.elements.hardwareConcurrency.textContent = navigator.hardwareConcurrency || 'Unknown';
            
            // Browser info
            this.elements.browserName.textContent = components.userAgent ? this.getBrowserName(components.userAgent.value) : 'Unknown';
            this.elements.userAgent.textContent = components.userAgent ? components.userAgent.value : 'Unknown';
            this.elements.browserLanguage.textContent = navigator.language || 'Unknown';
            this.elements.timezone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
            this.elements.pluginsCount.textContent = navigator.plugins ? navigator.plugins.length : 'Unknown';
            
            // Network info
            this.updateNetworkInfo();
        }
    }
    
    /**
     * Update behavioral metrics display
     * @param {Object} data - The behavioral fingerprint data
     */
    updateBehavioralMetrics(data) {
        // Typing patterns
        if (data.keyboardMetrics) {
            const typing = data.keyboardMetrics;
            const typingSpeed = typing.averageTypingSpeed || Math.round(typing.keyPressCount / (typing.keyPressTimestamps.length ? (typing.keyPressTimestamps[typing.keyPressTimestamps.length - 1] - typing.keyPressTimestamps[0]) / 1000 : 1) * 60);
            
            this.elements.typingPattern.textContent = `${typingSpeed} CPM, Error rate: ${Math.round(typing.errorRate * 100 || typing.consecutiveBackspaces / Math.max(typing.keyPressCount, 1) * 100)}%, ${Object.keys(typing.keyCodes).length} unique keys used`;
        }
        
        // Mouse movement
        if (data.mouseMetrics) {
            const mouse = data.mouseMetrics;
            this.elements.mouseMovement.textContent = `${mouse.clickCount} clicks, ${Math.round(mouse.averageSpeed || mouse.speeds.reduce((a, b) => a + b, 0) / Math.max(mouse.speeds.length, 1))} px/s avg speed, ${mouse.doubleClickCount} double-clicks`;
        }
        
        // Scroll behavior
        if (data.scrollPatterns) {
            const scroll = data.scrollPatterns;
            this.elements.scrollBehavior.textContent = `${scroll.scrollEvents} events, ${scroll.scrollDirectionChanges} direction changes, ${Math.round(scroll.scrollDepthPercentage || 0)}% page depth`;
        }
        
        // Interaction timing
        if (data.timeOnPage) {
            const time = data.timeOnPage;
            const activeTimeSeconds = Math.round((time.activeTime || Date.now() - time.startTime) / 1000);
            const idleTimeSeconds = Math.round(time.totalIdleTime / 1000);
            
            this.elements.interactionTiming.textContent = `${activeTimeSeconds}s active, ${idleTimeSeconds}s idle, ${time.idlePeriods.length} idle periods`;
        }
        
        // Session pattern
        if (data.sessionMetrics) {
            const session = data.sessionMetrics;
            this.elements.sessionPattern.textContent = `Time: ${this.getTimeOfDayPattern(session.timeOfDay)}, Day: ${this.getDayOfWeekPattern(session.dayOfWeek)}, Previous sessions: ${session.previousSessions}`;
        }
    }
    
    /**
     * Update network information
     */
    updateNetworkInfo() {
        if (navigator.connection) {
            this.elements.connectionType.textContent = navigator.connection.effectiveType || 'Unknown';
            this.elements.downlinkSpeed.textContent = navigator.connection.downlink ? `${navigator.connection.downlink} Mbps` : 'Unknown';
            this.elements.rtt.textContent = navigator.connection.rtt ? `${navigator.connection.rtt} ms` : 'Unknown';
        } else {
            this.elements.connectionType.textContent = 'API not available';
            this.elements.downlinkSpeed.textContent = 'API not available';
            this.elements.rtt.textContent = 'API not available';
        }
        
        // IP type (simplified)
        this.elements.ipType.textContent = 'Detecting...';
        setTimeout(() => {
            this.elements.ipType.textContent = 'Local network';
        }, 1500);
    }
    
    /**
     * Simulate confidence score increasing over time
     */
    simulateConfidenceIncrease() {
        let confidence = 0;
        const interval = setInterval(() => {
            confidence += 5;
            if (confidence > 85) {
                clearInterval(interval);
                confidence = 85; // Cap at 85% without identity confirmation
            }
            
            this.confidenceScore = confidence;
            this.elements.confidenceScore.textContent = `${confidence}%`;
            this.elements.confidenceFill.style.width = `${confidence}%`;
            
            // Update identity status based on confidence
            if (confidence < 30) {
                this.elements.identityStatus.textContent = 'Unknown';
            } else if (confidence < 60) {
                this.elements.identityStatus.textContent = 'Partially Recognized';
            } else if (confidence < 90) {
                this.elements.identityStatus.textContent = 'Likely Known';
            } else {
                this.elements.identityStatus.textContent = 'Verified';
            }
        }, 500);
    }
    
    /**
     * Check if the user is recognized
     */
    checkRecognition() {
        // In a real implementation, this would query a database
        // For demo purposes, we'll simulate recognition after a delay
        setTimeout(() => {
            // Simulate a recognized user from local storage
            const savedUser = localStorage.getItem('bbid_recognized_user');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    this.welcomeBack(this.currentUser.name);
                } catch (e) {
                    console.error('Error parsing saved user:', e);
                }
            } else {
                // Ask for identity if not recognized
                this.askForIdentity();
            }
        }, 3000);
    }
    
    /**
     * Ask the user for their identity
     */
    askForIdentity() {
        this.elements.greetingText.textContent = 'Hello there!';
        this.elements.greetingSubtext.textContent = 'We don\'t recognize you yet. Please tell us your name.';
        this.elements.identityForm.style.display = 'block';
    }
    
    /**
     * Confirm the user's identity
     * @param {string} name - The user's name
     */
    confirmIdentity(name) {
        // Update UI
        this.elements.greetingText.textContent = 'Confirming your identity...';
        this.elements.greetingSubtext.textContent = 'Please wait while we update your profile.';
        this.elements.identityForm.style.display = 'none';
        
        // In a real implementation, this would update a database
        // For demo purposes, we'll save to local storage
        const user = {
            name: name,
            deviceFingerprint: this.deviceFingerprint.visitorId,
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            devices: [{
                id: this.deviceFingerprint.visitorId,
                type: this.getDeviceType(),
                os: this.elements.operatingSystem.textContent,
                browser: this.elements.browserName.textContent,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                trustScore: 95
            }]
        };
        
        localStorage.setItem('bbid_recognized_user', JSON.stringify(user));
        this.currentUser = user;
        
        // Welcome the user
        setTimeout(() => {
            this.welcome(name);
        }, 1500);
    }
    
    /**
     * Welcome a new user
     * @param {string} name - The user's name
     */
    welcome(name) {
        // Update UI
        this.elements.greetingText.textContent = `Welcome, ${name}!`;
        this.elements.greetingSubtext.textContent = 'Your identity has been registered with this device.';
        
        // Update confidence score
        this.confidenceScore = 95;
        this.elements.confidenceScore.textContent = '95%';
        this.elements.confidenceFill.style.width = '95%';
        this.elements.identityStatus.textContent = 'Verified';
        
        // Display known devices
        this.displayKnownDevices();
    }
    
    /**
     * Welcome back a returning user
     * @param {string} name - The user's name
     */
    welcomeBack(name) {
        // Update UI
        this.elements.greetingText.textContent = `Welcome back, ${name}!`;
        this.elements.greetingSubtext.textContent = 'You have been recognized based on your behavioral patterns.';
        this.elements.identityForm.style.display = 'none';
        
        // Update confidence score
        this.confidenceScore = 95;
        this.elements.confidenceScore.textContent = '95%';
        this.elements.confidenceFill.style.width = '95%';
        this.elements.identityStatus.textContent = 'Verified';
        
        // Display known devices
        this.displayKnownDevices();
    }
    
    /**
     * Display known devices
     */
    displayKnownDevices() {
        if (this.currentUser && this.currentUser.devices && this.currentUser.devices.length > 0) {
            this.elements.knownDevicesContainer.style.display = 'block';
            
            // Clear existing devices
            this.elements.deviceList.innerHTML = '';
            
            // Add device cards
            this.currentUser.devices.forEach(device => {
                const deviceCard = document.createElement('div');
                deviceCard.className = 'device-card';
                
                const deviceIcon = this.getDeviceIcon(device.type);
                
                deviceCard.innerHTML = `
                    <div class="device-card-header">
                        <div class="device-icon">${deviceIcon}</div>
                        <h4 class="device-name">${device.type} (${device.os})</h4>
                    </div>
                    <div class="device-meta">
                        <div>Browser: ${device.browser}</div>
                        <div>First seen: ${this.getTimeAgo(new Date(device.firstSeen))}</div>
                        <div>Last seen: ${this.getTimeAgo(new Date(device.lastSeen))}</div>
                    </div>
                    <div class="device-trust">
                        <span class="trust-label">Trust Score:</span>
                        <span class="trust-value">${device.trustScore}%</span>
                    </div>
                `;
                
                this.elements.deviceList.appendChild(deviceCard);
            });
        }
    }
    
    /**
     * Get device type based on user agent and screen size
     * @returns {string} The device type
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const width = window.screen.width;
        const height = window.screen.height;
        
        if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            if (width > 1000 || height > 1000) {
                return 'Tablet';
            } else {
                return 'Smartphone';
            }
        } else if (/macintosh|mac os x/i.test(userAgent)) {
            return 'MacOS Desktop';
        } else if (/windows|win32/i.test(userAgent)) {
            return 'Windows Desktop';
        } else if (/linux/i.test(userAgent)) {
            return 'Linux Desktop';
        } else {
            return 'Desktop';
        }
    }
    
    /**
     * Get browser name from user agent
     * @param {string} userAgent - The user agent string
     * @returns {string} The browser name
     */
    getBrowserName(userAgent) {
        if (!userAgent) return 'Unknown';
        
        userAgent = userAgent.toLowerCase();
        
        if (userAgent.indexOf('firefox') > -1) {
            return 'Firefox';
        } else if (userAgent.indexOf('edg') > -1) {
            return 'Edge';
        } else if (userAgent.indexOf('chrome') > -1) {
            return 'Chrome';
        } else if (userAgent.indexOf('safari') > -1) {
            return 'Safari';
        } else if (userAgent.indexOf('opera') > -1 || userAgent.indexOf('opr') > -1) {
            return 'Opera';
        } else if (userAgent.indexOf('msie') > -1 || userAgent.indexOf('trident') > -1) {
            return 'Internet Explorer';
        } else {
            return 'Unknown';
        }
    }
    
    /**
     * Check if the device has touch support
     * @returns {boolean} True if touch is supported
     */
    hasTouchSupport() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Check if the device has motion sensors
     * @returns {boolean} True if motion sensors are supported
     */
    hasMotionSensors() {
        return window.DeviceMotionEvent !== undefined || window.DeviceOrientationEvent !== undefined;
    }
    
    /**
     * Get time of day pattern
     * @param {number} hour - The hour (0-23)
     * @returns {string} The time of day pattern
     */
    getTimeOfDayPattern(hour) {
        if (hour >= 5 && hour < 12) {
            return 'Morning';
        } else if (hour >= 12 && hour < 17) {
            return 'Afternoon';
        } else if (hour >= 17 && hour < 22) {
            return 'Evening';
        } else {
            return 'Night';
        }
    }
    
    /**
     * Get day of week pattern
     * @param {number} day - The day of week (0-6)
     * @returns {string} The day of week pattern
     */
    getDayOfWeekPattern(day) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[day] || 'Unknown';
    }
    
    /**
     * Get device icon
     * @param {string} deviceType - The device type
     * @returns {string} The device icon
     */
    getDeviceIcon(deviceType) {
        if (!deviceType) return '💻';
        
        deviceType = deviceType.toLowerCase();
        
        if (deviceType.includes('smartphone') || deviceType.includes('mobile')) {
            return '📱';
        } else if (deviceType.includes('tablet') || deviceType.includes('ipad')) {
            return '📱';
        } else if (deviceType.includes('mac')) {
            return '💻';
        } else if (deviceType.includes('windows')) {
            return '💻';
        } else if (deviceType.includes('linux')) {
            return '💻';
        } else {
            return '💻';
        }
    }
    
    /**
     * Get time ago string
     * @param {Date} date - The date
     * @returns {string} The time ago string
     */
    getTimeAgo(date) {
        if (!date) return 'Unknown';
        
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval === 1 ? '1 year ago' : `${interval} years ago`;
        }
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval === 1 ? '1 month ago' : `${interval} months ago`;
        }
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval === 1 ? '1 day ago' : `${interval} days ago`;
        }
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
        }
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
        }
        
        return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
    }
}

// Initialize the BBID Recognition system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    
    // Dependencies are now loaded directly in the HTML file
    
    // Initialize after dependencies are loaded
    const initRecognition = () => {
        if (typeof DeviceFingerprint !== 'undefined' && typeof BBIDBehavioral !== 'undefined') {
            new BBIDRecognition();
        } else {
            setTimeout(initRecognition, 100);
        }
    };
    
    // Start initialization process
    setTimeout(initRecognition, 500);
});
