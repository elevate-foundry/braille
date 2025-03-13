/**
 * BBID Behavioral Fingerprinting Library
 * Captures user behavioral patterns for enhanced device fingerprinting
 */

class BBIDBehavioral {
  constructor(options = {}) {
    this.options = {
      apiEndpoint: options.apiEndpoint || '/api/behavioral-fingerprint',
      deviceId: options.deviceId || null,
      trackKeyboard: options.trackKeyboard !== false,
      trackMouse: options.trackMouse !== false,
      trackTouch: options.trackTouch !== false,
      trackMotion: options.trackMotion !== false,
      trackScroll: options.trackScroll !== false,
      trackForms: options.trackForms !== false,
      sampleRate: options.sampleRate || 100, // ms
      batchSize: options.batchSize || 50,
      autoSubmitInterval: options.autoSubmitInterval || 10000, // 10 seconds
      debug: options.debug || false
    };

    // Initialize data structures
    this.keyboardMetrics = {
      keyPressCount: 0,
      keyPressTimestamps: [],
      keyPressIntervals: [],
      keyCodes: {},
      averageTypingSpeed: 0
    };

    this.mouseMetrics = {
      clickCount: 0,
      moveCount: 0,
      positions: [],
      speeds: [],
      averageSpeed: 0,
      clickPositions: []
    };

    this.touchMetrics = {
      touchCount: 0,
      touchPositions: [],
      touchAreas: [],
      pressures: [],
      averagePressure: 0,
      averageTouchArea: 0
    };

    this.motionMetrics = {
      orientationSamples: [],
      accelerationSamples: [],
      tiltAngles: [],
      averageTilt: 0,
      stability: 0
    };

    this.scrollPatterns = {
      scrollEvents: 0,
      scrollDirectionChanges: 0,
      scrollPositions: [],
      scrollSpeeds: []
    };

    this.formInteractions = {
      focusEvents: 0,
      blurEvents: 0,
      formFields: {},
      completionTime: {}
    };

    this.interactionFlow = [];
    this.timeOnPage = {
      startTime: Date.now(),
      activeTime: 0,
      lastActiveTime: Date.now(),
      idleThreshold: 2000 // 2 seconds
    };

    // Bind event handlers
    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      touchstart: this.handleTouchStart.bind(this),
      touchmove: this.handleTouchMove.bind(this),
      devicemotion: this.handleDeviceMotion.bind(this),
      deviceorientation: this.handleDeviceOrientation.bind(this),
      scroll: this.handleScroll.bind(this),
      focus: this.handleFocus.bind(this),
      blur: this.handleBlur.bind(this),
      submit: this.handleFormSubmit.bind(this),
      visibilitychange: this.handleVisibilityChange.bind(this)
    };

    // Batch processing
    this.batchQueue = [];
    this.lastProcessTime = Date.now();
    this.autoSubmitTimer = null;
    
    // Debug logging
    this.log('BBIDBehavioral initialized with options:', this.options);
  }

  /**
   * Start tracking user behavior
   */
  start() {
    this.attachEventListeners();
    this.startAutoSubmitTimer();
    this.log('Behavioral tracking started');
    return this;
  }

  /**
   * Stop tracking user behavior
   */
  stop() {
    this.detachEventListeners();
    this.stopAutoSubmitTimer();
    this.log('Behavioral tracking stopped');
    return this;
  }

  /**
   * Attach all event listeners based on options
   */
  attachEventListeners() {
    if (this.options.trackKeyboard) {
      document.addEventListener('keydown', this.boundHandlers.keydown);
    }

    if (this.options.trackMouse) {
      document.addEventListener('mousemove', this.boundHandlers.mousemove);
      document.addEventListener('mousedown', this.boundHandlers.mousedown);
    }

    if (this.options.trackTouch) {
      document.addEventListener('touchstart', this.boundHandlers.touchstart);
      document.addEventListener('touchmove', this.boundHandlers.touchmove);
    }

    if (this.options.trackMotion) {
      window.addEventListener('devicemotion', this.boundHandlers.devicemotion);
      window.addEventListener('deviceorientation', this.boundHandlers.deviceorientation);
    }

    if (this.options.trackScroll) {
      window.addEventListener('scroll', this.boundHandlers.scroll);
    }

    if (this.options.trackForms) {
      document.addEventListener('focus', this.boundHandlers.focus, true);
      document.addEventListener('blur', this.boundHandlers.blur, true);
      document.addEventListener('submit', this.boundHandlers.submit);
    }

    // Track page visibility
    document.addEventListener('visibilitychange', this.boundHandlers.visibilitychange);
  }

  /**
   * Detach all event listeners
   */
  detachEventListeners() {
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    document.removeEventListener('mousemove', this.boundHandlers.mousemove);
    document.removeEventListener('mousedown', this.boundHandlers.mousedown);
    document.removeEventListener('touchstart', this.boundHandlers.touchstart);
    document.removeEventListener('touchmove', this.boundHandlers.touchmove);
    window.removeEventListener('devicemotion', this.boundHandlers.devicemotion);
    window.removeEventListener('deviceorientation', this.boundHandlers.deviceorientation);
    window.removeEventListener('scroll', this.boundHandlers.scroll);
    document.removeEventListener('focus', this.boundHandlers.focus, true);
    document.removeEventListener('blur', this.boundHandlers.blur, true);
    document.removeEventListener('submit', this.boundHandlers.submit);
    document.removeEventListener('visibilitychange', this.boundHandlers.visibilitychange);
  }

  /**
   * Start auto-submit timer
   */
  startAutoSubmitTimer() {
    this.autoSubmitTimer = setInterval(() => {
      this.submitFingerprint();
    }, this.options.autoSubmitInterval);
  }

  /**
   * Stop auto-submit timer
   */
  stopAutoSubmitTimer() {
    if (this.autoSubmitTimer) {
      clearInterval(this.autoSubmitTimer);
      this.autoSubmitTimer = null;
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    const now = Date.now();
    this.keyboardMetrics.keyPressCount++;
    this.keyboardMetrics.keyPressTimestamps.push(now);
    
    // Track key code frequency (without recording actual keys for privacy)
    const keyCode = event.keyCode || event.which;
    this.keyboardMetrics.keyCodes[keyCode] = (this.keyboardMetrics.keyCodes[keyCode] || 0) + 1;
    
    // Calculate typing intervals
    if (this.keyboardMetrics.keyPressTimestamps.length > 1) {
      const lastIndex = this.keyboardMetrics.keyPressTimestamps.length - 1;
      const interval = now - this.keyboardMetrics.keyPressTimestamps[lastIndex - 1];
      this.keyboardMetrics.keyPressIntervals.push(interval);
    }
    
    // Calculate typing speed (characters per minute)
    if (this.keyboardMetrics.keyPressIntervals.length > 0) {
      const sum = this.keyboardMetrics.keyPressIntervals.reduce((a, b) => a + b, 0);
      const avg = sum / this.keyboardMetrics.keyPressIntervals.length;
      this.keyboardMetrics.averageTypingSpeed = Math.round(60000 / avg);
    }
    
    this.interactionFlow.push({
      type: 'keyboard',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle mouse movement events
   */
  handleMouseMove(event) {
    const now = Date.now();
    const position = { x: event.clientX, y: event.clientY, time: now };
    
    this.mouseMetrics.moveCount++;
    
    // Sample mouse positions at the specified rate
    if (now - this.lastProcessTime >= this.options.sampleRate) {
      this.mouseMetrics.positions.push(position);
      this.lastProcessTime = now;
      
      // Calculate speed if we have at least two positions
      if (this.mouseMetrics.positions.length > 1) {
        const lastIndex = this.mouseMetrics.positions.length - 1;
        const lastPos = this.mouseMetrics.positions[lastIndex - 1];
        const dx = position.x - lastPos.x;
        const dy = position.y - lastPos.y;
        const dt = position.time - lastPos.time;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt * 1000; // pixels per second
        
        this.mouseMetrics.speeds.push(speed);
        
        // Update average speed
        const sum = this.mouseMetrics.speeds.reduce((a, b) => a + b, 0);
        this.mouseMetrics.averageSpeed = sum / this.mouseMetrics.speeds.length;
      }
    }
    
    this.updateActiveTime(now);
  }

  /**
   * Handle mouse click events
   */
  handleMouseDown(event) {
    const now = Date.now();
    this.mouseMetrics.clickCount++;
    this.mouseMetrics.clickPositions.push({
      x: event.clientX,
      y: event.clientY,
      time: now,
      button: event.button
    });
    
    this.interactionFlow.push({
      type: 'mouseclick',
      time: now,
      x: event.clientX,
      y: event.clientY
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle touch start events
   */
  handleTouchStart(event) {
    const now = Date.now();
    this.touchMetrics.touchCount++;
    
    // Process each touch point
    Array.from(event.touches).forEach(touch => {
      const touchData = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        identifier: touch.identifier
      };
      
      // Capture touch area if available
      if (touch.radiusX && touch.radiusY) {
        touchData.area = Math.PI * touch.radiusX * touch.radiusY;
        this.touchMetrics.touchAreas.push(touchData.area);
      }
      
      // Capture pressure if available
      if (touch.force) {
        touchData.pressure = touch.force;
        this.touchMetrics.pressures.push(touch.force);
      }
      
      this.touchMetrics.touchPositions.push(touchData);
    });
    
    // Calculate averages
    if (this.touchMetrics.pressures.length > 0) {
      const sum = this.touchMetrics.pressures.reduce((a, b) => a + b, 0);
      this.touchMetrics.averagePressure = sum / this.touchMetrics.pressures.length;
    }
    
    if (this.touchMetrics.touchAreas.length > 0) {
      const sum = this.touchMetrics.touchAreas.reduce((a, b) => a + b, 0);
      this.touchMetrics.averageTouchArea = sum / this.touchMetrics.touchAreas.length;
    }
    
    this.interactionFlow.push({
      type: 'touch',
      time: now,
      touchCount: event.touches.length
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle touch move events
   */
  handleTouchMove(event) {
    // Similar to handleMouseMove but for touch events
    const now = Date.now();
    this.updateActiveTime(now);
  }

  /**
   * Handle device motion events
   */
  handleDeviceMotion(event) {
    const now = Date.now();
    
    // Sample at the specified rate
    if (now - this.lastProcessTime >= this.options.sampleRate) {
      if (event.acceleration) {
        this.motionMetrics.accelerationSamples.push({
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
          time: now
        });
      }
      
      // Calculate stability based on acceleration variance
      if (this.motionMetrics.accelerationSamples.length > 10) {
        const recentSamples = this.motionMetrics.accelerationSamples.slice(-10);
        const magnitudes = recentSamples.map(sample => 
          Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z)
        );
        
        const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
        const variance = magnitudes.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / magnitudes.length;
        
        // Normalize stability between 0 and 1 (higher is more stable)
        this.motionMetrics.stability = 1 / (1 + variance);
      }
      
      this.lastProcessTime = now;
    }
    
    this.updateActiveTime(now);
  }

  /**
   * Handle device orientation events
   */
  handleDeviceOrientation(event) {
    const now = Date.now();
    
    // Sample at the specified rate
    if (now - this.lastProcessTime >= this.options.sampleRate) {
      if (event.beta !== null && event.gamma !== null) {
        this.motionMetrics.orientationSamples.push({
          alpha: event.alpha, // z-axis
          beta: event.beta,   // x-axis
          gamma: event.gamma, // y-axis
          time: now
        });
        
        // Calculate tilt angle from vertical
        const tiltAngle = Math.sqrt(event.beta * event.beta + event.gamma * event.gamma);
        this.motionMetrics.tiltAngles.push(tiltAngle);
        
        // Update average tilt
        const sum = this.motionMetrics.tiltAngles.reduce((a, b) => a + b, 0);
        this.motionMetrics.averageTilt = sum / this.motionMetrics.tiltAngles.length;
      }
      
      this.lastProcessTime = now;
    }
    
    this.updateActiveTime(now);
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const now = Date.now();
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      time: now
    };
    
    this.scrollPatterns.scrollEvents++;
    this.scrollPatterns.scrollPositions.push(scrollPosition);
    
    // Calculate scroll speed and direction changes
    if (this.scrollPatterns.scrollPositions.length > 1) {
      const lastIndex = this.scrollPatterns.scrollPositions.length - 1;
      const prevPos = this.scrollPatterns.scrollPositions[lastIndex - 1];
      const currentPos = this.scrollPatterns.scrollPositions[lastIndex];
      
      const dy = currentPos.y - prevPos.y;
      const dt = currentPos.time - prevPos.time;
      const speed = Math.abs(dy) / dt * 1000; // pixels per second
      
      this.scrollPatterns.scrollSpeeds.push(speed);
      
      // Check for direction change
      if (this.scrollPatterns.scrollPositions.length > 2) {
        const prevDy = prevPos.y - this.scrollPatterns.scrollPositions[lastIndex - 2].y;
        if ((prevDy > 0 && dy < 0) || (prevDy < 0 && dy > 0)) {
          this.scrollPatterns.scrollDirectionChanges++;
        }
      }
    }
    
    this.interactionFlow.push({
      type: 'scroll',
      time: now,
      position: scrollPosition
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle form field focus events
   */
  handleFocus(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
      const now = Date.now();
      const fieldId = event.target.id || event.target.name || `field_${Math.random().toString(36).substr(2, 9)}`;
      
      this.formInteractions.focusEvents++;
      this.formInteractions.formFields[fieldId] = this.formInteractions.formFields[fieldId] || {
        focusCount: 0,
        blurCount: 0,
        totalFocusTime: 0,
        lastFocusTime: null
      };
      
      this.formInteractions.formFields[fieldId].focusCount++;
      this.formInteractions.formFields[fieldId].lastFocusTime = now;
      
      this.interactionFlow.push({
        type: 'focus',
        time: now,
        fieldId
      });
      
      this.updateActiveTime(now);
    }
  }

  /**
   * Handle form field blur events
   */
  handleBlur(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
      const now = Date.now();
      const fieldId = event.target.id || event.target.name || `field_${Math.random().toString(36).substr(2, 9)}`;
      
      this.formInteractions.blurEvents++;
      
      if (this.formInteractions.formFields[fieldId] && this.formInteractions.formFields[fieldId].lastFocusTime) {
        const focusTime = now - this.formInteractions.formFields[fieldId].lastFocusTime;
        this.formInteractions.formFields[fieldId].totalFocusTime += focusTime;
        this.formInteractions.formFields[fieldId].blurCount++;
        this.formInteractions.formFields[fieldId].lastFocusTime = null;
      }
      
      this.interactionFlow.push({
        type: 'blur',
        time: now,
        fieldId
      });
      
      this.updateActiveTime(now);
    }
  }

  /**
   * Handle form submission events
   */
  handleFormSubmit(event) {
    const now = Date.now();
    const formId = event.target.id || event.target.name || `form_${Math.random().toString(36).substr(2, 9)}`;
    
    this.interactionFlow.push({
      type: 'formSubmit',
      time: now,
      formId
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    const now = Date.now();
    const isVisible = document.visibilityState === 'visible';
    
    this.interactionFlow.push({
      type: 'visibility',
      time: now,
      isVisible
    });
    
    if (isVisible) {
      this.updateActiveTime(now);
    }
  }

  /**
   * Update active time tracking
   */
  updateActiveTime(now) {
    const timeSinceLastActive = now - this.timeOnPage.lastActiveTime;
    
    // Only count time if user wasn't idle
    if (timeSinceLastActive < this.timeOnPage.idleThreshold) {
      this.timeOnPage.activeTime += timeSinceLastActive;
    }
    
    this.timeOnPage.lastActiveTime = now;
  }

  /**
   * Process batch of events if threshold is reached
   */
  processBatch() {
    // Add to batch queue
    this.batchQueue.push({
      time: Date.now(),
      type: 'interaction'
    });
    
    // Submit if batch size threshold is reached
    if (this.batchQueue.length >= this.options.batchSize) {
      this.submitFingerprint();
    }
  }

  /**
   * Submit behavioral fingerprint to the API
   */
  async submitFingerprint() {
    if (!this.options.deviceId) {
      this.log('No deviceId provided, cannot submit fingerprint');
      return;
    }
    
    // Clear batch queue
    this.batchQueue = [];
    
    // Prepare data for submission
    const fingerprintData = {
      deviceId: this.options.deviceId,
      keyboardMetrics: this.pruneMetrics(this.keyboardMetrics),
      mouseMetrics: this.pruneMetrics(this.mouseMetrics),
      touchMetrics: this.pruneMetrics(this.touchMetrics),
      motionMetrics: this.pruneMetrics(this.motionMetrics),
      interactionFlow: this.interactionFlow.slice(-100), // Keep only the last 100 interactions
      timeOnPage: {
        totalTime: Date.now() - this.timeOnPage.startTime,
        activeTime: this.timeOnPage.activeTime
      },
      scrollPatterns: this.pruneMetrics(this.scrollPatterns),
      formInteractions: this.formInteractions
    };
    
    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fingerprintData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.log('Behavioral fingerprint submitted successfully', result);
        
        // Store BBID fingerprint if callback provided
        if (this.options.onFingerprintGenerated && result.bbidFingerprint) {
          this.options.onFingerprintGenerated(result.bbidFingerprint);
        }
      } else {
        this.log('Error submitting behavioral fingerprint:', result.error);
      }
    } catch (error) {
      this.log('Failed to submit behavioral fingerprint:', error);
    }
  }

  /**
   * Prune metrics to reduce payload size
   */
  pruneMetrics(metrics) {
    const pruned = { ...metrics };
    
    // Limit array sizes
    Object.keys(pruned).forEach(key => {
      if (Array.isArray(pruned[key]) && pruned[key].length > 50) {
        // Keep first 10 and last 40 items
        pruned[key] = [
          ...pruned[key].slice(0, 10),
          ...pruned[key].slice(-40)
        ];
      }
    });
    
    return pruned;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.options.debug) {
      console.log('[BBIDBehavioral]', ...args);
    }
  }
}

// Export for browser and Node.js environments
if (typeof window !== 'undefined') {
  window.BBIDBehavioral = BBIDBehavioral;
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = BBIDBehavioral;
}
