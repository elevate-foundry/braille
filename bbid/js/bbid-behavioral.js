/**
 * BBIDBehavioral - Comprehensive Behavioral Fingerprinting for BBID
 * 
 * This class implements a comprehensive behavioral fingerprinting strategy that includes:
 * 1. Device-specific metrics for laptops, smartphones, and tablets
 * 2. Key metrics collection for keyboard, mouse, touch, motion, UI, and session data
 * 3. Behavioral clustering and scoring for identity verification
 * 
 * Implementation based on the BBID behavioral fingerprinting strategy requirements:
 * - Device-specific metrics for different platforms
 * - Comprehensive key metrics collection
 * - Privacy-preserving implementation
 */

class BBIDBehavioral {
    /**
     * Initialize the behavioral fingerprinting system
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            deviceId: null,                  // Device identifier from device fingerprint
            trackKeyboard: true,             // Track keyboard dynamics
            trackMouse: true,                // Track mouse behavior
            trackTouch: true,                // Track touch interactions
            trackMotion: true,               // Track device motion
            trackUI: true,                   // Track UI interactions
            trackSession: true,              // Track session patterns
            samplingRate: 100,               // Milliseconds between samples
            maxSamples: 1000,                // Maximum samples to collect
            fingerprintInterval: 10000,      // Milliseconds between fingerprint generations
            storageKey: 'bbid_behavioral',   // Local storage key
            debug: false,                    // Debug mode
            onFingerprintGenerated: null     // Callback when fingerprint is generated
        }, options);

        // Validation
        if (!this.options.deviceId) {
            console.warn('BBIDBehavioral: No deviceId provided, using random identifier');
            this.options.deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
        }

        // Data storage
        this.data = {
            keyboard: {
                keyPresses: [],
                keyHolds: [],
                keyIntervals: [],
                errorCorrections: 0,
                totalKeyPresses: 0
            },
            mouse: {
                movements: [],
                clicks: [],
                doubleClicks: 0,
                dragOperations: 0,
                scrollEvents: []
            },
            touch: {
                taps: [],
                swipes: [],
                pinchZooms: [],
                multiTouchEvents: 0
            },
            motion: {
                accelerometer: [],
                gyroscope: [],
                orientationChanges: 0
            },
            ui: {
                tabSwitches: 0,
                appSwitches: 0,
                backButtonUsage: 0,
                shortcutUsage: {},
                formInteractions: []
            },
            session: {
                startTime: new Date(),
                timeOfDay: new Date().getHours(),
                previousSessions: [],
                pageViews: 0,
                deviceType: this.detectDeviceType(),
                screenSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };

        // State
        this.isTracking = false;
        this.lastKeystroke = null;
        this.lastMousePosition = null;
        this.lastTouchEvent = null;
        this.fingerprintGenerationTimer = null;
        this.samplingTimer = null;
        this.fingerprint = null;
        this.previousFingerprints = [];
        this.confidenceScore = 0;

        // Load previous data if available
        this.loadStoredData();
    }

    /**
     * Start behavioral tracking
     */
    start() {
        if (this.isTracking) return;
        this.isTracking = true;

        // Attach event listeners based on options
        if (this.options.trackKeyboard) this.attachKeyboardListeners();
        if (this.options.trackMouse) this.attachMouseListeners();
        if (this.options.trackTouch) this.attachTouchListeners();
        if (this.options.trackMotion) this.attachMotionListeners();
        if (this.options.trackUI) this.attachUIListeners();
        if (this.options.trackSession) this.trackSessionData();

        // Start fingerprint generation timer
        this.fingerprintGenerationTimer = setInterval(() => {
            this.generateFingerprint();
        }, this.options.fingerprintInterval);

        // Start sampling timer for continuous metrics
        this.samplingTimer = setInterval(() => {
            this.sampleContinuousMetrics();
        }, this.options.samplingRate);

        if (this.options.debug) {
            console.log('BBIDBehavioral: Tracking started');
        }

        // Generate initial fingerprint
        setTimeout(() => {
            this.generateFingerprint();
        }, 1000);

        return this;
    }

    /**
     * Stop behavioral tracking
     */
    stop() {
        if (!this.isTracking) return;
        this.isTracking = false;

        // Remove event listeners
        this.detachAllListeners();

        // Clear timers
        clearInterval(this.fingerprintGenerationTimer);
        clearInterval(this.samplingTimer);

        if (this.options.debug) {
            console.log('BBIDBehavioral: Tracking stopped');
        }

        return this;
    }

    /**
     * Detect device type
     * @returns {string} Device type (laptop, smartphone, tablet)
     */
    detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent);
        const isTablet = /tablet|ipad|playbook|silk|android(?!.*mobile)/i.test(userAgent);
        
        if (isTablet) return 'tablet';
        if (isMobile) return 'smartphone';
        return 'laptop';
    }

    /**
     * Attach keyboard event listeners
     */
    attachKeyboardListeners() {
        // Keydown event - captures key press timing and hold duration
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Keyup event - captures key release timing
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Input event - captures typing patterns and error corrections
        document.addEventListener('input', this.handleInput.bind(this));
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Keyboard listeners attached');
        }
    }

    /**
     * Attach mouse event listeners
     */
    attachMouseListeners() {
        // Mouse movement - captures cursor path and speed
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Mouse clicks - captures click frequency and patterns
        document.addEventListener('click', this.handleMouseClick.bind(this));
        
        // Double clicks - captures double-click behavior
        document.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Mouse down/up - captures hold duration
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Scroll behavior - captures scroll patterns
        document.addEventListener('wheel', this.handleScroll.bind(this));
        
        // Drag operations
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Mouse listeners attached');
        }
    }

    /**
     * Attach touch event listeners
     */
    attachTouchListeners() {
        // Touch events for mobile/tablet
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Gesture events for pinch/zoom (if supported)
        if ('ongesturestart' in window) {
            document.addEventListener('gesturestart', this.handleGestureStart.bind(this));
            document.addEventListener('gesturechange', this.handleGestureChange.bind(this));
            document.addEventListener('gestureend', this.handleGestureEnd.bind(this));
        }
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Touch listeners attached');
        }
    }

    /**
     * Attach motion event listeners
     */
    attachMotionListeners() {
        // Device orientation changes
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        // Device motion (accelerometer)
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        }
        
        // Device orientation (gyroscope)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        }
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Motion listeners attached');
        }
    }

    /**
     * Attach UI interaction listeners
     */
    attachUIListeners() {
        // Tab visibility changes (tab switching)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Form interactions
        document.addEventListener('focus', this.handleFocus.bind(this), true);
        document.addEventListener('blur', this.handleBlur.bind(this), true);
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Navigation (back button usage)
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleShortcut.bind(this));
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: UI listeners attached');
        }
    }

    /**
     * Track session-related data
     */
    trackSessionData() {
        // Increment page view counter
        this.data.session.pageViews++;
        
        // Record network information if available
        if (navigator.connection) {
            this.data.session.network = {
                type: navigator.connection.type,
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        
        // Attempt to get geolocation if available and permitted
        if (navigator.geolocation && this.options.trackLocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    // Store only general location data for privacy
                    // Round to reduce precision for privacy
                    const latitude = Math.round(position.coords.latitude * 10) / 10;
                    const longitude = Math.round(position.coords.longitude * 10) / 10;
                    
                    this.data.session.location = { latitude, longitude };
                },
                error => {
                    if (this.options.debug) {
                        console.log('BBIDBehavioral: Geolocation error', error.message);
                    }
                },
                { maximumAge: 600000, timeout: 5000, enableHighAccuracy: false }
            );
        }
        
        // Save session data periodically
        setInterval(() => {
            this.saveData();
        }, 60000); // Every minute
        
        // Save data before page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Session tracking started');
        }
    }

    /**
     * Load previously stored behavioral data
     */
    loadStoredData() {
        try {
            const storedData = localStorage.getItem(this.options.storageKey);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                if (parsedData.deviceId === this.options.deviceId) {
                    // Add to previous sessions
                    if (parsedData.data && parsedData.data.session) {
                        this.data.session.previousSessions = 
                            parsedData.data.session.previousSessions || [];
                        
                        // Add the last session to previous sessions
                        if (parsedData.data.session.startTime) {
                            this.data.session.previousSessions.push({
                                startTime: parsedData.data.session.startTime,
                                duration: parsedData.data.session.duration || 0,
                                timeOfDay: parsedData.data.session.timeOfDay || 0,
                                pageViews: parsedData.data.session.pageViews || 0
                            });
                        }
                    }

                    // Load previous fingerprints
                    if (parsedData.fingerprints) {
                        this.previousFingerprints = parsedData.fingerprints;
                    }
                }
            }
        } catch (error) {
            console.error('BBIDBehavioral: Error loading stored data', error);
        }
    }

    /**
     * Save current behavioral data to storage
     */
    saveData() {
        try {
            // Calculate session duration
            this.data.session.duration = 
                (new Date() - new Date(this.data.session.startTime)) / 1000;
            
            // Prepare data for storage
            const dataToStore = {
                deviceId: this.options.deviceId,
                data: this.data,
                fingerprints: this.previousFingerprints.slice(-5) // Keep last 5 fingerprints
            };
            
            // Add current fingerprint if available
            if (this.fingerprint) {
                dataToStore.fingerprints.push(this.fingerprint);
            }
            
            localStorage.setItem(this.options.storageKey, JSON.stringify(dataToStore));
            
            if (this.options.debug) {
                console.log('BBIDBehavioral: Data saved to storage');
            }
        } catch (error) {
            console.error('BBIDBehavioral: Error saving data', error);
        }
    }

    /**
     * Detach all event listeners
     */
    detachAllListeners() {
        // Keyboard event listeners
        if (this.options.trackKeyboard) {
            document.removeEventListener('keydown', this.handleKeyDown.bind(this));
            document.removeEventListener('keyup', this.handleKeyUp.bind(this));
            document.removeEventListener('input', this.handleInput.bind(this));
            document.removeEventListener('keydown', this.handleShortcut.bind(this));
        }
        
        // Mouse event listeners
        if (this.options.trackMouse) {
            document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            document.removeEventListener('click', this.handleMouseClick.bind(this));
            document.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
            document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
            document.removeEventListener('wheel', this.handleScroll.bind(this));
            document.removeEventListener('dragstart', this.handleDragStart.bind(this));
            document.removeEventListener('dragend', this.handleDragEnd.bind(this));
        }
        
        // Touch event listeners
        if (this.options.trackTouch) {
            document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
            
            if ('ongesturestart' in window) {
                document.removeEventListener('gesturestart', this.handleGestureStart.bind(this));
                document.removeEventListener('gesturechange', this.handleGestureChange.bind(this));
                document.removeEventListener('gestureend', this.handleGestureEnd.bind(this));
            }
        }
        
        // Motion event listeners
        if (this.options.trackMotion) {
            window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
            
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', this.handleDeviceMotion.bind(this));
            }
            
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
            }
        }
        
        // UI event listeners
        if (this.options.trackUI) {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            document.removeEventListener('focus', this.handleFocus.bind(this), true);
            document.removeEventListener('blur', this.handleBlur.bind(this), true);
            document.removeEventListener('submit', this.handleFormSubmit.bind(this));
            window.removeEventListener('popstate', this.handlePopState.bind(this));
        }
        
        // Session data
        window.removeEventListener('beforeunload', this.saveData.bind(this));
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: All listeners detached');
        }
    }

    /**
     * Sample continuous metrics (called periodically)
     */
    sampleContinuousMetrics() {
        // Sample metrics that need continuous monitoring
        // This helps reduce the amount of data collected while still
        // maintaining meaningful behavioral patterns
        
        // Limit data collection to prevent excessive memory usage
        this.trimDataArrays();
    }

    /**
     * Trim data arrays to prevent excessive memory usage
     */
    trimDataArrays() {
        // Keep arrays within reasonable limits
        if (this.data.keyboard.keyPresses.length > this.options.maxSamples) {
            this.data.keyboard.keyPresses = this.data.keyboard.keyPresses.slice(-Math.floor(this.options.maxSamples / 2));
        }
        
        if (this.data.mouse.movements.length > this.options.maxSamples) {
            this.data.mouse.movements = this.data.mouse.movements.slice(-Math.floor(this.options.maxSamples / 2));
        }
        
        if (this.data.touch.swipes.length > this.options.maxSamples) {
            this.data.touch.swipes = this.data.touch.swipes.slice(-Math.floor(this.options.maxSamples / 2));
        }
    }

    /**
     * Generate behavioral fingerprint from collected data
     */
    generateFingerprint() {
        // Process collected data to generate a behavioral fingerprint
        const metrics = this.calculateMetrics();
        
        // Create fingerprint object
        this.fingerprint = {
            deviceId: this.options.deviceId,
            timestamp: new Date().toISOString(),
            metrics: metrics,
            confidence: this.calculateConfidenceScore()
        };
        
        // Add to previous fingerprints
        this.previousFingerprints.push(this.fingerprint);
        
        // Trim previous fingerprints array
        if (this.previousFingerprints.length > 10) {
            this.previousFingerprints = this.previousFingerprints.slice(-10);
        }
        
        // Save data locally
        this.saveData();
        
        // Send data to server if API URL is provided
        if (this.options.apiUrl) {
            this.sendDataToServer(this.fingerprint);
        }
        
        // Call callback if provided
        if (typeof this.options.onFingerprintGenerated === 'function') {
            this.options.onFingerprintGenerated(this.fingerprint);
        }
        
        if (this.options.debug) {
            console.log('BBIDBehavioral: Fingerprint generated', this.fingerprint);
        }
        
        return this.fingerprint;
    }

    /**
     * Calculate metrics from raw data
     * @returns {Object} Calculated metrics
     */
    calculateMetrics() {
        const metrics = {
            keyboard: this.calculateKeyboardMetrics(),
            mouse: this.calculateMouseMetrics(),
            touch: this.calculateTouchMetrics(),
            motion: this.calculateMotionMetrics(),
            ui: this.calculateUIMetrics(),
            session: this.calculateSessionMetrics()
        };
        
        return metrics;
    }
    
    /**
     * Calculate keyboard metrics
     * @returns {Object} Keyboard metrics
     */
    calculateKeyboardMetrics() {
        const keyPresses = this.data.keyboard.keyPresses;
        const keyHolds = this.data.keyboard.keyHolds;
        const keyIntervals = this.data.keyboard.keyIntervals;
        
        // Default values
        const metrics = {
            typingSpeed: 0,
            averageHoldTime: 0,
            keyPressVariability: 0,
            errorRate: 0,
            rhythmPattern: [],
            consistencyScore: 0
        };
        
        // Calculate typing speed (keystrokes per minute)
        if (keyPresses.length > 10) {
            const firstPress = keyPresses[0];
            const lastPress = keyPresses[keyPresses.length - 1];
            const durationMinutes = (lastPress.timestamp - firstPress.timestamp) / 60000;
            
            if (durationMinutes > 0) {
                metrics.typingSpeed = Math.round(keyPresses.length / durationMinutes);
            }
        }
        
        // Calculate average hold time
        if (keyHolds.length > 0) {
            const totalHoldTime = keyHolds.reduce((sum, hold) => sum + hold.duration, 0);
            metrics.averageHoldTime = Math.round(totalHoldTime / keyHolds.length);
        }
        
        // Calculate key press variability (standard deviation of intervals)
        if (keyIntervals.length > 5) {
            const intervals = keyIntervals.map(interval => interval.duration);
            const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
            const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
            metrics.keyPressVariability = Math.sqrt(variance);
        }
        
        // Calculate error rate
        if (this.data.keyboard.totalKeyPresses > 0) {
            metrics.errorRate = this.data.keyboard.errorCorrections / this.data.keyboard.totalKeyPresses;
        }
        
        // Extract rhythm pattern (normalized intervals between key presses)
        if (keyIntervals.length > 10) {
            // Take a sample of the most recent intervals for the rhythm pattern
            const recentIntervals = keyIntervals.slice(-20);
            metrics.rhythmPattern = recentIntervals.map(interval => interval.duration);
            
            // Normalize the pattern
            const maxInterval = Math.max(...metrics.rhythmPattern);
            if (maxInterval > 0) {
                metrics.rhythmPattern = metrics.rhythmPattern.map(val => parseFloat((val / maxInterval).toFixed(2)));
            }
        }
        
        // Calculate consistency score based on variability
        if (metrics.keyPressVariability > 0) {
            // Lower variability = higher consistency
            const normalizedVariability = Math.min(metrics.keyPressVariability / 200, 1);
            metrics.consistencyScore = Math.round(100 * (1 - normalizedVariability));
        }
        
        return metrics;
    }
    
    /**
     * Calculate mouse metrics
     * @returns {Object} Mouse metrics
     */
    calculateMouseMetrics() {
        const movements = this.data.mouse.movements;
        const clicks = this.data.mouse.clicks;
        
        // Default values
        const metrics = {
            averageSpeed: 0,
            clickFrequency: 0,
            averageClickDuration: 0,
            movementPattern: [],
            doubleClickRate: 0,
            scrollBehavior: {
                speed: 0,
                direction: 'neutral'
            },
            consistencyScore: 0
        };
        
        // Calculate average movement speed
        if (movements.length > 10) {
            let totalDistance = 0;
            let totalTime = 0;
            
            for (let i = 1; i < movements.length; i++) {
                const prev = movements[i - 1];
                const curr = movements[i];
                
                // Calculate Euclidean distance
                const distance = Math.sqrt(
                    Math.pow(curr.x - prev.x, 2) + 
                    Math.pow(curr.y - prev.y, 2)
                );
                
                const time = curr.timestamp - prev.timestamp;
                
                if (time > 0) {
                    totalDistance += distance;
                    totalTime += time;
                }
            }
            
            if (totalTime > 0) {
                // Pixels per second
                metrics.averageSpeed = Math.round(totalDistance / (totalTime / 1000));
            }
        }
        
        // Calculate click frequency (clicks per minute)
        if (clicks.length > 0) {
            const firstClick = clicks[0];
            const lastClick = clicks[clicks.length - 1];
            const durationMinutes = (lastClick.timestamp - firstClick.timestamp) / 60000;
            
            if (durationMinutes > 0) {
                metrics.clickFrequency = Math.round(clicks.length / durationMinutes);
            }
        }
        
        // Calculate average click duration
        if (clicks.length > 0) {
            const totalDuration = clicks.reduce((sum, click) => sum + (click.releaseTime - click.pressTime), 0);
            metrics.averageClickDuration = Math.round(totalDuration / clicks.length);
        }
        
        // Extract movement pattern
        if (movements.length > 20) {
            // Sample movement directions
            const directions = [];
            
            for (let i = 1; i < movements.length; i++) {
                const prev = movements[i - 1];
                const curr = movements[i];
                
                // Calculate angle in radians
                const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                directions.push(angle);
            }
            
            // Convert to simplified 8-direction pattern
            metrics.movementPattern = directions.slice(-20).map(angle => {
                // Convert to degrees and normalize to 0-360
                const degrees = (angle * 180 / Math.PI + 360) % 360;
                
                // Map to 8 directions (N, NE, E, SE, S, SW, W, NW)
                const direction = Math.floor((degrees + 22.5) / 45) % 8;
                return direction;
            });
        }
        
        // Calculate double-click rate
        if (this.data.mouse.clicks.length > 0) {
            metrics.doubleClickRate = this.data.mouse.doubleClicks / this.data.mouse.clicks.length;
        }
        
        // Analyze scroll behavior
        if (this.data.mouse.scrollEvents.length > 0) {
            let totalSpeed = 0;
            let scrollUp = 0;
            let scrollDown = 0;
            
            this.data.mouse.scrollEvents.forEach(event => {
                totalSpeed += Math.abs(event.deltaY);
                if (event.deltaY < 0) scrollUp++;
                else if (event.deltaY > 0) scrollDown++;
            });
            
            metrics.scrollBehavior.speed = Math.round(totalSpeed / this.data.mouse.scrollEvents.length);
            
            // Determine preferred scroll direction
            if (scrollUp > scrollDown * 1.5) metrics.scrollBehavior.direction = 'up';
            else if (scrollDown > scrollUp * 1.5) metrics.scrollBehavior.direction = 'down';
            else metrics.scrollBehavior.direction = 'balanced';
        }
        
        // Calculate consistency score
        if (movements.length > 20 && clicks.length > 5) {
            // Calculate based on movement speed consistency
            const speeds = [];
            for (let i = 1; i < movements.length; i++) {
                const prev = movements[i - 1];
                const curr = movements[i];
                const time = curr.timestamp - prev.timestamp;
                
                if (time > 0) {
                    const distance = Math.sqrt(
                        Math.pow(curr.x - prev.x, 2) + 
                        Math.pow(curr.y - prev.y, 2)
                    );
                    speeds.push(distance / time);
                }
            }
            
            // Calculate standard deviation of speeds
            if (speeds.length > 0) {
                const mean = speeds.reduce((sum, val) => sum + val, 0) / speeds.length;
                const variance = speeds.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / speeds.length;
                const stdDev = Math.sqrt(variance);
                
                // Lower standard deviation = higher consistency
                const normalizedStdDev = Math.min(stdDev / mean, 1);
                metrics.consistencyScore = Math.round(100 * (1 - normalizedStdDev));
            }
        }
        
        return metrics;
    }
    
    /**
     * Calculate touch metrics
     * @returns {Object} Touch metrics
     */
    calculateTouchMetrics() {
        const taps = this.data.touch.taps;
        const swipes = this.data.touch.swipes;
        const pinchZooms = this.data.touch.pinchZooms;
        
        // Default values
        const metrics = {
            tapSpeed: 0,
            averagePressure: 0,
            swipePattern: [],
            pinchZoomBehavior: {
                frequency: 0,
                averageDistance: 0
            },
            multiTouchFrequency: 0,
            consistencyScore: 0
        };
        
        // Calculate tap speed (taps per minute)
        if (taps.length > 5) {
            const firstTap = taps[0];
            const lastTap = taps[taps.length - 1];
            const durationMinutes = (lastTap.timestamp - firstTap.timestamp) / 60000;
            
            if (durationMinutes > 0) {
                metrics.tapSpeed = Math.round(taps.length / durationMinutes);
            }
        }
        
        // Calculate average pressure (if available)
        let pressureSum = 0;
        let pressureCount = 0;
        
        taps.forEach(tap => {
            if (tap.force !== undefined) {
                pressureSum += tap.force;
                pressureCount++;
            }
        });
        
        if (pressureCount > 0) {
            metrics.averagePressure = pressureSum / pressureCount;
        }
        
        // Extract swipe pattern
        if (swipes.length > 5) {
            // Analyze the most recent swipes
            metrics.swipePattern = swipes.slice(-10).map(swipe => ({
                direction: swipe.direction,
                distance: swipe.distance,
                duration: swipe.duration,
                speed: swipe.distance / swipe.duration
            }));
        }
        
        // Analyze pinch-zoom behavior
        if (pinchZooms.length > 0) {
            metrics.pinchZoomBehavior.frequency = pinchZooms.length;
            
            const totalDistance = pinchZooms.reduce((sum, zoom) => sum + zoom.distance, 0);
            metrics.pinchZoomBehavior.averageDistance = totalDistance / pinchZooms.length;
        }
        
        // Calculate multi-touch frequency
        if (taps.length > 0) {
            metrics.multiTouchFrequency = this.data.touch.multiTouchEvents / taps.length;
        }
        
        // Calculate consistency score
        if (swipes.length > 5) {
            // Calculate based on swipe speed consistency
            const swipeSpeeds = swipes.map(swipe => swipe.distance / swipe.duration);
            
            const mean = swipeSpeeds.reduce((sum, val) => sum + val, 0) / swipeSpeeds.length;
            const variance = swipeSpeeds.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / swipeSpeeds.length;
            const stdDev = Math.sqrt(variance);
            
            // Lower standard deviation = higher consistency
            if (mean > 0) {
                const normalizedStdDev = Math.min(stdDev / mean, 1);
                metrics.consistencyScore = Math.round(100 * (1 - normalizedStdDev));
            }
        }
        
        return metrics;
    }
    
    /**
     * Calculate motion metrics
     * @returns {Object} Motion metrics
     */
    calculateMotionMetrics() {
        const accelerometer = this.data.motion.accelerometer;
        const gyroscope = this.data.motion.gyroscope;
        
        // Default values
        const metrics = {
            deviceStability: 0,
            orientationChanges: this.data.motion.orientationChanges,
            motionPattern: [],
            consistencyScore: 0
        };
        
        // Calculate device stability (inverse of motion variance)
        if (accelerometer.length > 10) {
            // Calculate average acceleration magnitude
            const magnitudes = accelerometer.map(reading => {
                return Math.sqrt(
                    Math.pow(reading.x, 2) + 
                    Math.pow(reading.y, 2) + 
                    Math.pow(reading.z, 2)
                );
            });
            
            const mean = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
            const variance = magnitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / magnitudes.length;
            
            // Higher stability = lower variance
            metrics.deviceStability = Math.max(0, 100 - Math.min(100, variance * 10));
        }
        
        // Extract motion pattern
        if (gyroscope.length > 10) {
            // Sample gyroscope readings
            metrics.motionPattern = gyroscope.slice(-10).map(reading => ({
                x: parseFloat(reading.x.toFixed(2)),
                y: parseFloat(reading.y.toFixed(2)),
                z: parseFloat(reading.z.toFixed(2))
            }));
        }
        
        // Calculate consistency score
        if (accelerometer.length > 10 && gyroscope.length > 10) {
            // Calculate based on motion stability over time
            const recentAccelerometer = accelerometer.slice(-20);
            const recentGyroscope = gyroscope.slice(-20);
            
            // Calculate variance of recent accelerometer readings
            const accMagnitudes = recentAccelerometer.map(reading => {
                return Math.sqrt(
                    Math.pow(reading.x, 2) + 
                    Math.pow(reading.y, 2) + 
                    Math.pow(reading.z, 2)
                );
            });
            
            const accMean = accMagnitudes.reduce((sum, val) => sum + val, 0) / accMagnitudes.length;
            const accVariance = accMagnitudes.reduce((sum, val) => sum + Math.pow(val - accMean, 2), 0) / accMagnitudes.length;
            
            // Calculate variance of recent gyroscope readings
            const gyroMagnitudes = recentGyroscope.map(reading => {
                return Math.sqrt(
                    Math.pow(reading.x, 2) + 
                    Math.pow(reading.y, 2) + 
                    Math.pow(reading.z, 2)
                );
            });
            
            const gyroMean = gyroMagnitudes.reduce((sum, val) => sum + val, 0) / gyroMagnitudes.length;
            const gyroVariance = gyroMagnitudes.reduce((sum, val) => sum + Math.pow(val - gyroMean, 2), 0) / gyroMagnitudes.length;
            
            // Combine variances (lower variance = higher consistency)
            const combinedVariance = (accVariance + gyroVariance) / 2;
            metrics.consistencyScore = Math.max(0, 100 - Math.min(100, combinedVariance * 10));
        }
        
        return metrics;
    }
    
    /**
     * Calculate UI interaction metrics
     * @returns {Object} UI metrics
     */
    calculateUIMetrics() {
        // Default values
        const metrics = {
            tabSwitchFrequency: 0,
            backButtonUsage: this.data.ui.backButtonUsage,
            formInteractionPattern: [],
            shortcutUsagePattern: {},
            interactionPatternScore: 0
        };
        
        // Calculate tab switch frequency
        if (this.data.session.duration > 0) {
            // Switches per hour
            metrics.tabSwitchFrequency = (this.data.ui.tabSwitches / (this.data.session.duration / 3600)).toFixed(2);
        }
        
        // Extract form interaction pattern
        if (this.data.ui.formInteractions.length > 0) {
            metrics.formInteractionPattern = this.data.ui.formInteractions.slice(-10);
        }
        
        // Extract shortcut usage pattern
        metrics.shortcutUsagePattern = Object.assign({}, this.data.ui.shortcutUsage);
        
        // Calculate interaction pattern score based on consistency of interactions
        if (this.data.ui.formInteractions.length > 5) {
            // Simplified score based on number of interactions
            metrics.interactionPatternScore = Math.min(100, this.data.ui.formInteractions.length * 5);
        }
        
        return metrics;
    }
    
    /**
     * Calculate session metrics
     * @returns {Object} Session metrics
     */
    calculateSessionMetrics() {
        // Default values
        const metrics = {
            timeOfDayPattern: this.data.session.timeOfDay,
            sessionDuration: this.data.session.duration || 0,
            pageViewRate: 0,
            deviceType: this.data.session.deviceType,
            screenSize: this.data.session.screenSize,
            consistencyScore: 0
        };
        
        // Calculate page view rate (views per minute)
        if (this.data.session.duration > 0) {
            metrics.pageViewRate = (this.data.session.pageViews / (this.data.session.duration / 60)).toFixed(2);
        }
        
        // Calculate consistency score based on previous sessions
        if (this.data.session.previousSessions.length > 0) {
            // Check time of day consistency
            const timeOfDayConsistency = this.calculateTimeOfDayConsistency();
            
            // Check session duration consistency
            const durationConsistency = this.calculateSessionDurationConsistency();
            
            // Combine consistency scores
            metrics.consistencyScore = Math.round((timeOfDayConsistency + durationConsistency) / 2);
        }
        
        return metrics;
    }
    
    /**
     * Calculate time of day consistency
     * @returns {number} Consistency score (0-100)
     */
    calculateTimeOfDayConsistency() {
        const currentHour = this.data.session.timeOfDay;
        const previousHours = this.data.session.previousSessions.map(session => session.timeOfDay);
        
        // Count how many previous sessions were in the same 3-hour window
        let sameTimeWindowCount = 0;
        
        previousHours.forEach(hour => {
            // Check if within 3 hours of current time
            if (Math.abs(hour - currentHour) <= 3 || Math.abs(hour - currentHour) >= 21) {
                sameTimeWindowCount++;
            }
        });
        
        // Calculate consistency percentage
        return Math.round((sameTimeWindowCount / previousHours.length) * 100);
    }
    
    /**
     * Calculate session duration consistency
     * @returns {number} Consistency score (0-100)
     */
    calculateSessionDurationConsistency() {
        const currentDuration = this.data.session.duration;
        const previousDurations = this.data.session.previousSessions.map(session => session.duration);
        
        // Calculate mean duration
        const meanDuration = previousDurations.reduce((sum, val) => sum + val, 0) / previousDurations.length;
        
        // Calculate standard deviation
        const variance = previousDurations.reduce((sum, val) => sum + Math.pow(val - meanDuration, 2), 0) / previousDurations.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate how far current duration is from mean (in terms of standard deviations)
        const zScore = stdDev > 0 ? Math.abs(currentDuration - meanDuration) / stdDev : 0;
        
        // Convert to consistency score (lower z-score = higher consistency)
        return Math.max(0, 100 - Math.min(100, zScore * 25));
    }

    /**
     * Calculate confidence score based on available data
     * @param {Object} metrics - The calculated metrics
     * @returns {number} Confidence score (0-100)
     */
    calculateConfidence(metrics) {
        // Start with base confidence
        let confidence = 0;
        let totalFactors = 0;
        let contributingFactors = 0;
        
        // Keyboard metrics contribution
        if (metrics.keyboard.typingSpeed > 0) {
            confidence += 15;
            contributingFactors++;
        }
        totalFactors++;
        
        // Mouse metrics contribution
        if (metrics.mouse.averageSpeed > 0) {
            confidence += 15;
            contributingFactors++;
        }
        totalFactors++;
        
        // Touch metrics contribution
        if (metrics.touch.tapSpeed > 0) {
            confidence += 15;
            contributingFactors++;
        }
        totalFactors++;
        
        // Session metrics contribution
        if (metrics.session.consistencyScore > 0) {
            confidence += 20;
            contributingFactors++;
        }
        totalFactors++;
        
        // UI metrics contribution
        if (metrics.ui.interactionPatternScore > 0) {
            confidence += 15;
            contributingFactors++;
        }
        totalFactors++;
        
        // Motion metrics contribution
        if (metrics.motion.consistencyScore > 0) {
            confidence += 20;
            contributingFactors++;
        }
        totalFactors++;
        
        // Previous data contribution
        if (this.previousFingerprints.length > 0) {
            confidence += Math.min(20, this.previousFingerprints.length * 4);
        }
        
        // Adjust based on contributing factors
        if (totalFactors > 0) {
            // Scale confidence by the ratio of contributing factors
            confidence = (confidence * contributingFactors / totalFactors);
        }
        
        // Ensure confidence is between 0-100
        confidence = Math.max(0, Math.min(100, Math.round(confidence)));
        
        this.confidenceScore = confidence;
        return confidence;
    }
    /**
     * Handle keydown event
     * @param {KeyboardEvent} event - The keydown event
     */
    handleKeyDown(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const key = event.key;
        
        // Record key press
        this.data.keyboard.keyPresses.push({
            key: key,
            timestamp: now,
            shift: event.shiftKey,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            meta: event.metaKey
        });
        
        // Record key interval if we have a previous keystroke
        if (this.lastKeystroke) {
            this.data.keyboard.keyIntervals.push({
                fromKey: this.lastKeystroke.key,
                toKey: key,
                duration: now - this.lastKeystroke.timestamp
            });
        }
        
        // Update last keystroke
        this.lastKeystroke = {
            key: key,
            timestamp: now,
            keyDownTime: now
        };
        
        // Increment total key presses
        this.data.keyboard.totalKeyPresses++;
    }
    
    /**
     * Handle keyup event
     * @param {KeyboardEvent} event - The keyup event
     */
    handleKeyUp(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const key = event.key;
        
        // Record key hold duration if we have the corresponding keydown
        if (this.lastKeystroke && this.lastKeystroke.key === key) {
            const holdDuration = now - this.lastKeystroke.keyDownTime;
            
            this.data.keyboard.keyHolds.push({
                key: key,
                duration: holdDuration,
                timestamp: now
            });
        }
    }
    
    /**
     * Handle input event (for error corrections)
     * @param {Event} event - The input event
     */
    handleInput(event) {
        if (!this.isTracking) return;
        
        // Check if it's a deletion (backspace or delete key)
        if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
            this.data.keyboard.errorCorrections++;
        }
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - The mousemove event
     */
    handleMouseMove(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        
        // Only sample mouse movements periodically to avoid excessive data
        if (this.lastMousePosition && (now - this.lastMousePosition.timestamp < 50)) {
            return;
        }
        
        // Record mouse position
        const position = {
            x: event.clientX,
            y: event.clientY,
            timestamp: now
        };
        
        this.data.mouse.movements.push(position);
        this.lastMousePosition = position;
    }
    
    /**
     * Handle mouse click
     * @param {MouseEvent} event - The click event
     */
    handleMouseClick(event) {
        if (!this.isTracking) return;
        
        // We'll get the press and release times from mousedown/mouseup events
        // This is just to count total clicks
        this.data.mouse.clicks.push({
            x: event.clientX,
            y: event.clientY,
            button: event.button,
            timestamp: Date.now(),
            target: event.target.tagName,
            pressTime: this.lastMouseDownTime || Date.now(),
            releaseTime: Date.now()
        });
    }
    
    /**
     * Handle double click
     * @param {MouseEvent} event - The dblclick event
     */
    handleDoubleClick(event) {
        if (!this.isTracking) return;
        
        this.data.mouse.doubleClicks++;
    }
    
    /**
     * Handle mouse down
     * @param {MouseEvent} event - The mousedown event
     */
    handleMouseDown(event) {
        if (!this.isTracking) return;
        
        this.lastMouseDownTime = Date.now();
    }
    
    /**
     * Handle mouse up
     * @param {MouseEvent} event - The mouseup event
     */
    handleMouseUp(event) {
        if (!this.isTracking) return;
        
        // Mouse up time is recorded but we don't need to store it separately
        // as it will be used in the click event
    }
    
    /**
     * Handle scroll event
     * @param {WheelEvent} event - The wheel event
     */
    handleScroll(event) {
        if (!this.isTracking) return;
        
        this.data.mouse.scrollEvents.push({
            deltaY: event.deltaY,
            deltaX: event.deltaX,
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle drag start
     * @param {DragEvent} event - The dragstart event
     */
    handleDragStart(event) {
        if (!this.isTracking) return;
        
        // Just count drag operations
        this.data.mouse.dragOperations++;
    }
    
    /**
     * Handle drag end
     * @param {DragEvent} event - The dragend event
     */
    handleDragEnd(event) {
        if (!this.isTracking) return;
        
        // No additional data needed for drag end
    }
    
    /**
     * Handle touch start
     * @param {TouchEvent} event - The touchstart event
     */
    handleTouchStart(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const touches = event.touches;
        
        // Record multi-touch events
        if (touches.length > 1) {
            this.data.touch.multiTouchEvents++;
        }
        
        // Record tap
        const touch = touches[0];
        this.lastTouchEvent = {
            x: touch.clientX,
            y: touch.clientY,
            timestamp: now,
            identifier: touch.identifier,
            force: touch.force || 0
        };
        
        this.data.touch.taps.push({
            x: touch.clientX,
            y: touch.clientY,
            timestamp: now,
            force: touch.force || 0,
            touchCount: touches.length
        });
    }
    
    /**
     * Handle touch move
     * @param {TouchEvent} event - The touchmove event
     */
    handleTouchMove(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const touch = event.touches[0];
        
        // Only process if we have a previous touch event
        if (this.lastTouchEvent) {
            // Calculate distance and direction
            const deltaX = touch.clientX - this.lastTouchEvent.x;
            const deltaY = touch.clientY - this.lastTouchEvent.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only record as a swipe if moved more than a threshold
            if (distance > 10) {
                // Determine swipe direction (8 directions)
                const angle = Math.atan2(deltaY, deltaX);
                const degrees = (angle * 180 / Math.PI + 360) % 360;
                const direction = Math.floor((degrees + 22.5) / 45) % 8;
                
                // Record swipe
                this.data.touch.swipes.push({
                    startX: this.lastTouchEvent.x,
                    startY: this.lastTouchEvent.y,
                    endX: touch.clientX,
                    endY: touch.clientY,
                    distance: distance,
                    direction: direction,
                    duration: now - this.lastTouchEvent.timestamp,
                    timestamp: now
                });
                
                // Update last touch event
                this.lastTouchEvent = {
                    x: touch.clientX,
                    y: touch.clientY,
                    timestamp: now,
                    identifier: touch.identifier,
                    force: touch.force || 0
                };
            }
        }
    }
    
    /**
     * Handle touch end
     * @param {TouchEvent} event - The touchend event
     */
    handleTouchEnd(event) {
        if (!this.isTracking) return;
        
        // Reset last touch event
        this.lastTouchEvent = null;
    }
    
    /**
     * Handle gesture start (pinch/zoom)
     * @param {GestureEvent} event - The gesturestart event
     */
    handleGestureStart(event) {
        if (!this.isTracking) return;
        
        this.lastGestureScale = event.scale;
        this.gestureStartTime = Date.now();
    }
    
    /**
     * Handle gesture change (pinch/zoom)
     * @param {GestureEvent} event - The gesturechange event
     */
    handleGestureChange(event) {
        if (!this.isTracking || !this.lastGestureScale) return;
        
        // Only record significant changes
        if (Math.abs(event.scale - this.lastGestureScale) > 0.1) {
            this.lastGestureScale = event.scale;
        }
    }
    
    /**
     * Handle gesture end (pinch/zoom)
     * @param {GestureEvent} event - The gestureend event
     */
    handleGestureEnd(event) {
        if (!this.isTracking || !this.lastGestureScale || !this.gestureStartTime) return;
        
        const now = Date.now();
        const duration = now - this.gestureStartTime;
        
        // Record pinch/zoom
        this.data.touch.pinchZooms.push({
            scale: event.scale,
            duration: duration,
            distance: Math.abs(event.scale - 1) * 100, // Normalized distance
            timestamp: now
        });
        
        // Reset gesture tracking
        this.lastGestureScale = null;
        this.gestureStartTime = null;
    }
    
    /**
     * Handle device orientation change
     * @param {Event} event - The orientationchange event
     */
    handleOrientationChange(event) {
        if (!this.isTracking) return;
        
        this.data.motion.orientationChanges++;
    }
    
    /**
     * Handle device motion (accelerometer)
     * @param {DeviceMotionEvent} event - The devicemotion event
     */
    handleDeviceMotion(event) {
        if (!this.isTracking) return;
        
        // Sample accelerometer data periodically
        const now = Date.now();
        if (this.lastAccelerometerTime && (now - this.lastAccelerometerTime < 200)) {
            return;
        }
        
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
            this.data.motion.accelerometer.push({
                x: acceleration.x || 0,
                y: acceleration.y || 0,
                z: acceleration.z || 0,
                timestamp: now
            });
            
            this.lastAccelerometerTime = now;
        }
    }
    
    /**
     * Handle device orientation (gyroscope)
     * @param {DeviceOrientationEvent} event - The deviceorientation event
     */
    handleDeviceOrientation(event) {
        if (!this.isTracking) return;
        
        // Sample gyroscope data periodically
        const now = Date.now();
        if (this.lastGyroscopeTime && (now - this.lastGyroscopeTime < 200)) {
            return;
        }
        
        this.data.motion.gyroscope.push({
            x: event.beta || 0,  // X-axis rotation
            y: event.gamma || 0, // Y-axis rotation
            z: event.alpha || 0, // Z-axis rotation
            timestamp: now
        });
        
        this.lastGyroscopeTime = now;
    }
    
    /**
     * Handle visibility change (tab switching)
     * @param {Event} event - The visibilitychange event
     */
    handleVisibilityChange(event) {
        if (!this.isTracking) return;
        
        if (document.visibilityState === 'hidden') {
            this.data.ui.tabSwitches++;
        }
    }
    
    /**
     * Handle focus event (form interactions)
     * @param {FocusEvent} event - The focus event
     */
    handleFocus(event) {
        if (!this.isTracking) return;
        
        // Only track form element interactions
        const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
        if (event.target && formElements.includes(event.target.tagName)) {
            this.data.ui.formInteractions.push({
                element: event.target.tagName,
                type: event.target.type || 'unknown',
                action: 'focus',
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Handle blur event (form interactions)
     * @param {FocusEvent} event - The blur event
     */
    handleBlur(event) {
        if (!this.isTracking) return;
        
        // Only track form element interactions
        const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
        if (event.target && formElements.includes(event.target.tagName)) {
            this.data.ui.formInteractions.push({
                element: event.target.tagName,
                type: event.target.type || 'unknown',
                action: 'blur',
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Handle form submit
     * @param {Event} event - The submit event
     */
    handleFormSubmit(event) {
        if (!this.isTracking) return;
        
        this.data.ui.formInteractions.push({
            element: 'FORM',
            action: 'submit',
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle popstate (back button usage)
     * @param {PopStateEvent} event - The popstate event
     */
    handlePopState(event) {
        if (!this.isTracking) return;
        
        this.data.ui.backButtonUsage++;
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - The keydown event
     */
    handleShortcut(event) {
        if (!this.isTracking) return;
        
        // Only process potential shortcuts (with modifier keys)
        if (event.ctrlKey || event.metaKey || event.altKey) {
            const key = event.key.toLowerCase();
            const modifiers = [];
            
            if (event.ctrlKey) modifiers.push('ctrl');
            if (event.altKey) modifiers.push('alt');
            if (event.shiftKey) modifiers.push('shift');
            if (event.metaKey) modifiers.push('meta');
            
            const shortcutKey = [...modifiers, key].join('+');
            
            // Count shortcut usage
            if (!this.data.ui.shortcutUsage[shortcutKey]) {
                this.data.ui.shortcutUsage[shortcutKey] = 0;
            }
            this.data.ui.shortcutUsage[shortcutKey]++;
        }
    }
    
    /**
     * Calculate typing speed in words per minute
     * @returns {number} Typing speed in WPM
     */
    calculateTypingSpeed() {
        if (this.data.keyboard.keyPresses.length < 5) return 0;
        
        // Calculate time between first and last keypress
        const firstPress = this.data.keyboard.keyPresses[0];
        const lastPress = this.data.keyboard.keyPresses[this.data.keyboard.keyPresses.length - 1];
        const timeSpanSeconds = (lastPress.timestamp - firstPress.timestamp) / 1000;
        
        if (timeSpanSeconds <= 0) return 0;
        
        // Estimate words (5 characters per word on average)
        const characters = this.data.keyboard.totalKeyPresses;
        const words = characters / 5;
        
        // Calculate WPM
        const minutes = timeSpanSeconds / 60;
        return Math.round(words / minutes);
    }
    
    /**
     * Calculate average key hold duration
     * @returns {number} Average hold duration in milliseconds
     */
    calculateAverageKeyHoldDuration() {
        if (this.data.keyboard.keyHolds.length === 0) return 0;
        
        const sum = this.data.keyboard.keyHolds.reduce((total, duration) => total + duration, 0);
        return Math.round(sum / this.data.keyboard.keyHolds.length);
    }
    
    /**
     * Calculate average interval between keypresses
     * @returns {number} Average interval in milliseconds
     */
    calculateAverageKeyIntervals() {
        if (this.data.keyboard.keyIntervals.length === 0) return 0;
        
        const sum = this.data.keyboard.keyIntervals.reduce((total, interval) => total + interval, 0);
        return Math.round(sum / this.data.keyboard.keyIntervals.length);
    }
    
    /**
     * Calculate error rate based on backspace and delete key usage
     * @returns {number} Error rate percentage
     */
    calculateErrorRate() {
        if (this.data.keyboard.totalKeyPresses === 0) return 0;
        
        // Count correction keys (backspace, delete)
        const correctionCount = this.data.keyboard.keyPresses.filter(press => 
            press.key === 'Backspace' || press.key === 'Delete'
        ).length;
        
        return Math.round((correctionCount / this.data.keyboard.totalKeyPresses) * 100);
    }
    
    /**
     * Calculate mouse click frequency
     * @returns {number} Clicks per minute
     */
    calculateClickFrequency() {
        if (this.data.mouse.clicks.length === 0) return 0;
        
        // Calculate time span in minutes
        const firstClick = this.data.mouse.clicks[0];
        const lastClick = this.data.mouse.clicks[this.data.mouse.clicks.length - 1];
        const timeSpanMinutes = (lastClick.timestamp - firstClick.timestamp) / (1000 * 60);
        
        if (timeSpanMinutes <= 0) return 0;
        
        return Math.round(this.data.mouse.clicks.length / timeSpanMinutes);
    }
    
    /**
     * Calculate average mouse movement speed
     * @returns {number} Average speed in pixels per second
     */
    calculateMouseMovementSpeed() {
        if (this.data.mouse.movements.length < 2) return 0;
        
        let totalDistance = 0;
        let totalTime = 0;
        
        for (let i = 1; i < this.data.mouse.movements.length; i++) {
            const prev = this.data.mouse.movements[i - 1];
            const curr = this.data.mouse.movements[i];
            
            // Calculate Euclidean distance
            const distance = Math.sqrt(
                Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
            );
            
            // Calculate time difference in seconds
            const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
            
            if (timeDiff > 0) {
                totalDistance += distance;
                totalTime += timeDiff;
            }
        }
        
        if (totalTime <= 0) return 0;
        
        return Math.round(totalDistance / totalTime);
    }
    
    /**
     * Calculate scroll behavior metrics
     * @returns {Object} Scroll behavior metrics
     */
    calculateScrollBehavior() {
        if (this.data.mouse.scrollEvents.length === 0) {
            return { scrollEvents: 0, scrollDirectionChanges: 0, scrollDepthPercentage: 0 };
        }
        
        // Count direction changes
        let directionChanges = 0;
        let lastDirection = null;
        
        for (const event of this.data.mouse.scrollEvents) {
            const direction = event.deltaY > 0 ? 'down' : 'up';
            
            if (lastDirection !== null && direction !== lastDirection) {
                directionChanges++;
            }
            
            lastDirection = direction;
        }
        
        // Calculate scroll depth percentage
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollDepth = window.scrollY;
        const scrollDepthPercentage = totalHeight > 0 ? (scrollDepth / totalHeight) * 100 : 0;
        
        return {
            scrollEvents: this.data.mouse.scrollEvents.length,
            scrollDirectionChanges: directionChanges,
            scrollDepthPercentage: Math.round(scrollDepthPercentage)
        };
    }
    
    /**
     * Calculate average tap speed for touch interactions
     * @returns {number} Average tap speed in taps per minute
     */
    calculateTapSpeed() {
        if (this.data.touch.taps.length < 2) return 0;
        
        // Calculate time span in minutes
        const firstTap = this.data.touch.taps[0];
        const lastTap = this.data.touch.taps[this.data.touch.taps.length - 1];
        const timeSpanMinutes = (lastTap.timestamp - firstTap.timestamp) / (1000 * 60);
        
        if (timeSpanMinutes <= 0) return 0;
        
        return Math.round(this.data.touch.taps.length / timeSpanMinutes);
    }
    
    /**
     * Calculate swipe patterns for touch interactions
     * @returns {Object} Swipe pattern metrics
     */
    calculateSwipePatterns() {
        if (this.data.touch.swipes.length === 0) {
            return { count: 0, averageDistance: 0, directionDistribution: {} };
        }
        
        // Calculate average swipe distance
        let totalDistance = 0;
        const directions = {};
        
        for (const swipe of this.data.touch.swipes) {
            // Calculate Euclidean distance
            const distance = Math.sqrt(
                Math.pow(swipe.endX - swipe.startX, 2) + 
                Math.pow(swipe.endY - swipe.startY, 2)
            );
            
            totalDistance += distance;
            
            // Determine direction
            const dx = swipe.endX - swipe.startX;
            const dy = swipe.endY - swipe.startY;
            let direction;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }
            
            directions[direction] = (directions[direction] || 0) + 1;
        }
        
        const averageDistance = Math.round(totalDistance / this.data.touch.swipes.length);
        
        return {
            count: this.data.touch.swipes.length,
            averageDistance,
            directionDistribution: directions
        };
    }
    
    /**
     * Calculate pinch-zoom behavior for touch interactions
     * @returns {Object} Pinch-zoom behavior metrics
     */
    calculatePinchZoomBehavior() {
        if (this.data.touch.pinchZooms.length === 0) {
            return { count: 0, averageScale: 0 };
        }
        
        // Calculate average scale factor
        const totalScale = this.data.touch.pinchZooms.reduce(
            (total, zoom) => total + zoom.scale, 0
        );
        
        const averageScale = totalScale / this.data.touch.pinchZooms.length;
        
        return {
            count: this.data.touch.pinchZooms.length,
            averageScale: Math.round(averageScale * 100) / 100
        };
    }
    
    /**
     * Calculate device stability from accelerometer data
     * @returns {number} Stability score (0-100, higher is more stable)
     */
    calculateDeviceStability() {
        if (this.data.motion.accelerometer.length < 5) return 100; // Default to stable if not enough data
        
        // Calculate variance in accelerometer readings
        const xValues = this.data.motion.accelerometer.map(a => a.x);
        const yValues = this.data.motion.accelerometer.map(a => a.y);
        const zValues = this.data.motion.accelerometer.map(a => a.z);
        
        const xVariance = this.calculateVariance(xValues);
        const yVariance = this.calculateVariance(yValues);
        const zVariance = this.calculateVariance(zValues);
        
        // Calculate total variance
        const totalVariance = xVariance + yVariance + zVariance;
        
        // Convert to stability score (inverse relationship)
        // Higher variance = lower stability
        const maxVariance = 20; // Calibrate based on typical motion
        const stabilityScore = Math.max(0, 100 - (totalVariance / maxVariance) * 100);
        
        return Math.round(stabilityScore);
    }
    
    /**
     * Calculate variance of an array of numbers
     * @param {Array<number>} values - Array of numeric values
     * @returns {number} Variance
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;
        
        // Calculate mean
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Calculate sum of squared differences
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const sumSquaredDiffs = squaredDiffs.reduce((sum, val) => sum + val, 0);
        
        // Calculate variance
        return sumSquaredDiffs / values.length;
    }
    
    /**
     * Calculate motion patterns from gyroscope and accelerometer data
     * @returns {Object} Motion pattern metrics
     */
    calculateMotionPatterns() {
        // Count significant motion events
        let significantMotions = 0;
        const threshold = 5; // Threshold for significant motion
        
        // Check accelerometer data for significant changes
        for (let i = 1; i < this.data.motion.accelerometer.length; i++) {
            const prev = this.data.motion.accelerometer[i - 1];
            const curr = this.data.motion.accelerometer[i];
            
            const deltaX = Math.abs(curr.x - prev.x);
            const deltaY = Math.abs(curr.y - prev.y);
            const deltaZ = Math.abs(curr.z - prev.z);
            
            if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
                significantMotions++;
            }
        }
        
        return {
            significantMotions,
            orientationChanges: this.data.motion.orientationChanges,
            gyroscopeReadings: this.data.motion.gyroscope.length,
            accelerometerReadings: this.data.motion.accelerometer.length
        };
    }
    
    /**
     * Send behavioral data to the server for storage and analysis
     * @param {Object} fingerprint - The behavioral fingerprint to send
     */
    sendDataToServer(fingerprint) {
        // Don't send if no API URL is provided
        if (!this.options.apiUrl) {
            if (this.options.debug) {
                console.log('BBIDBehavioral: No API URL provided, skipping server upload');
            }
            return;
        }
        
        // Prepare data for API
        const payload = {
            deviceId: fingerprint.deviceId,
            keyboardMetrics: {
                typingSpeed: this.calculateTypingSpeed(),
                keyHoldDuration: this.calculateAverageKeyHoldDuration(),
                keyIntervals: this.calculateAverageKeyIntervals(),
                errorRate: this.calculateErrorRate(),
                totalKeyPresses: this.data.keyboard.totalKeyPresses
            },
            mouseMetrics: {
                clickFrequency: this.calculateClickFrequency(),
                movementSpeed: this.calculateMouseMovementSpeed(),
                dragOperations: this.data.mouse.dragOperations,
                doubleClicks: this.data.mouse.doubleClicks,
                scrollBehavior: this.calculateScrollBehavior()
            },
            touchMetrics: {
                tapSpeed: this.calculateTapSpeed(),
                swipePatterns: this.calculateSwipePatterns(),
                pinchZoomBehavior: this.calculatePinchZoomBehavior(),
                multiTouchEvents: this.data.touch.multiTouchEvents
            },
            motionMetrics: {
                deviceStability: this.calculateDeviceStability(),
                orientationChanges: this.data.motion.orientationChanges,
                motionPatterns: this.calculateMotionPatterns()
            },
            interactionFlow: {
                tabSwitches: this.data.ui.tabSwitches,
                backButtonUsage: this.data.ui.backButtonUsage,
                formInteractions: this.data.ui.formInteractions.length
            },
            timeOnPage: {
                startTime: this.data.session.startTime,
                duration: (new Date() - new Date(this.data.session.startTime)) / 1000
            },
            confidence: fingerprint.confidence
        };
        
        // Send data to server
        fetch(this.options.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (this.options.debug) {
                console.log('BBIDBehavioral: Data sent to server successfully', data);
            }
        })
        .catch(error => {
            console.error('BBIDBehavioral: Error sending data to server:', error);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BBIDBehavioral;
} else {
    window.BBIDBehavioral = BBIDBehavioral;
}
