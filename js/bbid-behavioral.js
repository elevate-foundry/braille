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

    // Initialize data structures with enhanced metrics
    
    // Keyboard dynamics - typing speed, keystroke timing, hold duration, patterns, error rate
    this.keyboardMetrics = {
      keyPressCount: 0,
      keyPressTimestamps: [],      // When keys were pressed
      keyReleaseTimestamps: [],    // When keys were released
      keyPressIntervals: [],       // Time between key presses
      keyHoldDurations: [],        // How long keys are held down
      keyCodes: {},                // Distribution of keys used
      keyPairs: {},                // Common key combinations
      specialKeyUsage: {},         // Usage of special keys (shift, ctrl, etc.)
      averageTypingSpeed: 0,       // Characters per minute
      errorRate: 0,                // Based on backspace/delete usage
      rhythmPatterns: [],          // Timing patterns in typing
      lastKeyPressTime: 0,         // For calculating intervals
      consecutiveBackspaces: 0,    // Track error corrections
      wordCompletionTimes: []      // Time to complete words
    };

    // Mouse behavior - movement path, click frequency, hold duration, scroll behavior
    this.mouseMetrics = {
      clickCount: 0,
      moveCount: 0,
      positions: [],               // Mouse position samples
      trajectories: [],            // Movement paths between clicks
      speeds: [],                  // Movement speeds
      accelerations: [],           // Movement accelerations
      clickPositions: [],          // Where clicks occur
      clickDurations: [],          // How long clicks are held
      doubleClickCount: 0,         // Number of double clicks
      dragEvents: [],              // Drag behavior
      hoverDurations: {},          // How long mouse hovers in areas
      averageSpeed: 0,             // Average mouse movement speed
      clickHeatmap: {},            // Distribution of clicks on screen
      movementPrecision: 0,        // Steadiness of movement
      lastPosition: null,          // Last recorded position
      lastMoveTime: 0              // For calculating speed
    };

    // Touch interactions - pressure, tap speed, swipe patterns, pinch & zoom
    this.touchMetrics = {
      touchCount: 0,
      touchPositions: [],          // Where touches occur
      touchAreas: [],              // Size of touch contact area
      pressures: [],               // Touch pressure values
      swipeDirections: [],         // Directions of swipes
      swipeSpeeds: [],             // Speed of swipes
      swipeLengths: [],            // Length of swipes
      pinchEvents: [],             // Pinch gesture data
      multiTouchEvents: 0,         // Number of multi-touch events
      tapDurations: [],            // How long taps are held
      doubleTapCount: 0,           // Number of double taps
      touchPrecision: 0,           // Touch targeting accuracy
      averagePressure: 0,          // Average touch pressure
      averageTouchArea: 0,         // Average touch contact area
      lastTouchTime: 0             // For calculating tap intervals
    };

    // Motion and orientation - accelerometer, gyroscope, orientation changes
    this.motionMetrics = {
      orientationSamples: [],       // Device orientation data
      accelerationSamples: [],      // Device acceleration data
      rotationSamples: [],          // Device rotation data
      orientationChanges: 0,        // Number of significant orientation changes
      tiltAngles: [],               // Device tilt angles
      shakingEvents: 0,             // Number of shaking events
      steadinessScores: [],         // How steady the device is held
      averageTilt: 0,               // Average tilt angle
      stability: 0,                 // Overall device stability score
      lastMotionTime: 0,            // For calculating motion intervals
      motionIntensity: []           // Intensity of device movement
    };

    // Scroll behavior - patterns, speed, direction changes
    this.scrollPatterns = {
      scrollEvents: 0,
      scrollDirectionChanges: 0,
      scrollPositions: [],          // Scroll positions over time
      scrollSpeeds: [],             // Scroll speeds
      scrollAccelerations: [],      // Scroll accelerations
      scrollPauses: [],             // Pauses during scrolling
      scrollDistances: [],          // Distances scrolled
      lastScrollPosition: 0,        // Last scroll position
      lastScrollTime: 0,            // For calculating scroll speed
      lastScrollDirection: null,    // For detecting direction changes
      scrollDepthPercentage: 0      // How far down the page user scrolled
    };

    // Form interactions - focus events, completion times, input patterns
    this.formInteractions = {
      focusEvents: 0,
      blurEvents: 0,
      formFields: {},               // Interaction with specific form fields
      completionTime: {},           // Time to complete each field
      correctionCount: {},          // Number of corrections per field
      fieldSwitchingPattern: [],    // Order of field interactions
      hesitationTimes: {},          // Pauses before input
      autoCompleteUsage: 0,         // Use of browser autocomplete
      validationErrors: {},         // Form validation errors
      submissionAttempts: 0         // Number of submission attempts
    };

    // UI interaction - tab switching, app switching, back button, shortcuts
    this.uiInteractions = {
      tabSwitches: 0,              // Number of tab visibility changes
      backButtonUsage: 0,          // Back button usage count
      shortcutUsage: {},           // Keyboard shortcuts used
      navigationPatterns: [],      // Sequence of page navigations
      interactionAreas: {},        // Areas of the page interacted with
      interactionDensity: {},      // Density of interactions over time
      interactionGaps: [],         // Time gaps between interactions
      copyPasteEvents: 0,          // Number of copy/paste actions
      rightClickEvents: 0,         // Number of right-click actions
      lastInteractionType: null,   // Last type of interaction
      lastInteractionTime: 0       // Timestamp of last interaction
    };
    
    // Session-based features - time of day, geolocation, network
    this.sessionMetrics = {
      timeOfDay: new Date().getHours(),  // Hour of the day (0-23)
      dayOfWeek: new Date().getDay(),    // Day of week (0-6)
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      sessionStartTime: Date.now(),
      pageLoadTime: window.performance ? window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart : 0,
      previousSessions: parseInt(localStorage.getItem('bbid_session_count') || '0', 10)
    };
    
    // Store session count
    localStorage.setItem('bbid_session_count', (this.sessionMetrics.previousSessions + 1).toString());
    
    // Interaction flow and time tracking
    this.interactionFlow = [];
    this.timeOnPage = {
      startTime: Date.now(),
      activeTime: 0,
      lastActiveTime: Date.now(),
      idleThreshold: 2000, // 2 seconds
      idlePeriods: [],
      focusPeriods: [],
      totalIdleTime: 0,
      longestActivePeriod: 0,
      currentActiveStreak: 0
    };

    // Bind event handlers with enhanced tracking
    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),       // Added for key hold duration
      mousemove: this.handleMouseMove.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),   // Added for click duration
      dblclick: this.handleDoubleClick.bind(this),
      contextmenu: this.handleContextMenu.bind(this),
      mouseover: this.handleMouseOver.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      touchstart: this.handleTouchStart.bind(this),
      touchmove: this.handleTouchMove.bind(this),
      touchend: this.handleTouchEnd.bind(this),
      touchcancel: this.handleTouchCancel.bind(this),
      devicemotion: this.handleDeviceMotion.bind(this),
      deviceorientation: this.handleDeviceOrientation.bind(this),
      scroll: this.handleScroll.bind(this),
      focus: this.handleFocus.bind(this),
      blur: this.handleBlur.bind(this),
      submit: this.handleFormSubmit.bind(this),
      input: this.handleInput.bind(this),
      copy: this.handleCopy.bind(this),
      paste: this.handlePaste.bind(this),
      cut: this.handleCut.bind(this),
      visibilitychange: this.handleVisibilityChange.bind(this),
      popstate: this.handlePopState.bind(this),  // For back button detection
      beforeunload: this.handleBeforeUnload.bind(this)
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
    // Keyboard event tracking
    if (this.options.trackKeyboard) {
      document.addEventListener('keydown', this.boundHandlers.keydown);
      document.addEventListener('keyup', this.boundHandlers.keyup);
      document.addEventListener('copy', this.boundHandlers.copy);
      document.addEventListener('paste', this.boundHandlers.paste);
      document.addEventListener('cut', this.boundHandlers.cut);
    }

    // Mouse event tracking
    if (this.options.trackMouse) {
      document.addEventListener('mousemove', this.boundHandlers.mousemove);
      document.addEventListener('mousedown', this.boundHandlers.mousedown);
      document.addEventListener('mouseup', this.boundHandlers.mouseup);
      document.addEventListener('dblclick', this.boundHandlers.dblclick);
      document.addEventListener('contextmenu', this.boundHandlers.contextmenu);
      document.addEventListener('mouseover', this.boundHandlers.mouseover);
      document.addEventListener('mouseout', this.boundHandlers.mouseout);
    }

    // Touch event tracking
    if (this.options.trackTouch) {
      document.addEventListener('touchstart', this.boundHandlers.touchstart);
      document.addEventListener('touchmove', this.boundHandlers.touchmove);
      document.addEventListener('touchend', this.boundHandlers.touchend);
      document.addEventListener('touchcancel', this.boundHandlers.touchcancel);
    }

    // Motion and orientation tracking
    if (this.options.trackMotion) {
      window.addEventListener('devicemotion', this.boundHandlers.devicemotion);
      window.addEventListener('deviceorientation', this.boundHandlers.deviceorientation);
    }

    // Scroll behavior tracking
    if (this.options.trackScroll) {
      window.addEventListener('scroll', this.boundHandlers.scroll);
    }
    
    // Form interaction tracking
    if (this.options.trackForms) {
      document.addEventListener('focus', this.boundHandlers.focus, true);
      document.addEventListener('blur', this.boundHandlers.blur, true);
      document.addEventListener('submit', this.boundHandlers.submit);
      document.addEventListener('input', this.boundHandlers.input);
    }
    
    // UI and session tracking (always enabled)
    document.addEventListener('visibilitychange', this.boundHandlers.visibilitychange);
    window.addEventListener('popstate', this.boundHandlers.popstate);
    window.addEventListener('beforeunload', this.boundHandlers.beforeunload);
    
    // Track initial device info
    this.captureDeviceInfo();
  }

  /**
   * Capture device information
   */
  captureDeviceInfo() {
    // Capture device info for fingerprinting
    this.deviceInfo = {
      screen: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: 'ontouchstart' in window,
      orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
      connection: navigator.connection ? {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : 'unknown'
    };
    
    this.log('Device info captured:', this.deviceInfo);
  }

  /**
   * Detach all event listeners
   */
  detachEventListeners() {
    // Keyboard events
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    document.removeEventListener('keyup', this.boundHandlers.keyup);
    document.removeEventListener('copy', this.boundHandlers.copy);
    document.removeEventListener('paste', this.boundHandlers.paste);
    document.removeEventListener('cut', this.boundHandlers.cut);
    
    // Mouse events
    document.removeEventListener('mousemove', this.boundHandlers.mousemove);
    document.removeEventListener('mousedown', this.boundHandlers.mousedown);
    document.removeEventListener('mouseup', this.boundHandlers.mouseup);
    document.removeEventListener('dblclick', this.boundHandlers.dblclick);
    document.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
    document.removeEventListener('mouseover', this.boundHandlers.mouseover);
    document.removeEventListener('mouseout', this.boundHandlers.mouseout);
    
    // Touch events
    document.removeEventListener('touchstart', this.boundHandlers.touchstart);
    document.removeEventListener('touchmove', this.boundHandlers.touchmove);
    document.removeEventListener('touchend', this.boundHandlers.touchend);
    document.removeEventListener('touchcancel', this.boundHandlers.touchcancel);
    
    // Motion events
    window.removeEventListener('devicemotion', this.boundHandlers.devicemotion);
    window.removeEventListener('deviceorientation', this.boundHandlers.deviceorientation);
    
    // Scroll events
    window.removeEventListener('scroll', this.boundHandlers.scroll);
    
    // Form events
    document.removeEventListener('focus', this.boundHandlers.focus, true);
    document.removeEventListener('blur', this.boundHandlers.blur, true);
    document.removeEventListener('submit', this.boundHandlers.submit);
    document.removeEventListener('input', this.boundHandlers.input);
    
    // UI and session events
    document.removeEventListener('visibilitychange', this.boundHandlers.visibilitychange);
    window.removeEventListener('popstate', this.boundHandlers.popstate);
    window.removeEventListener('beforeunload', this.boundHandlers.beforeunload);
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
   * Handle keyboard key down events
   */
  handleKeyDown(event) {
    const now = Date.now();
    this.keyboardMetrics.keyPressCount++;
    this.keyboardMetrics.keyPressTimestamps.push(now);
    
    // Track key code frequency (without recording actual keys for privacy)
    const keyCode = event.keyCode || event.which;
    this.keyboardMetrics.keyCodes[keyCode] = (this.keyboardMetrics.keyCodes[keyCode] || 0) + 1;
    
    // Track special key usage
    if (event.shiftKey || keyCode === 16) {
      this.keyboardMetrics.specialKeyUsage['shift'] = (this.keyboardMetrics.specialKeyUsage['shift'] || 0) + 1;
    }
    if (event.ctrlKey || keyCode === 17) {
      this.keyboardMetrics.specialKeyUsage['ctrl'] = (this.keyboardMetrics.specialKeyUsage['ctrl'] || 0) + 1;
    }
    if (event.altKey || keyCode === 18) {
      this.keyboardMetrics.specialKeyUsage['alt'] = (this.keyboardMetrics.specialKeyUsage['alt'] || 0) + 1;
    }
    if (event.metaKey || keyCode === 91 || keyCode === 93) {
      this.keyboardMetrics.specialKeyUsage['meta'] = (this.keyboardMetrics.specialKeyUsage['meta'] || 0) + 1;
    }
    
    // Track backspace usage for error rate calculation
    if (keyCode === 8) { // Backspace key
      this.keyboardMetrics.consecutiveBackspaces++;
      // Update error rate - ratio of backspaces to total keypresses
      this.keyboardMetrics.errorRate = this.keyboardMetrics.consecutiveBackspaces / this.keyboardMetrics.keyPressCount;
    } else {
      this.keyboardMetrics.consecutiveBackspaces = 0;
    }
    
    // Calculate typing intervals
    if (this.keyboardMetrics.lastKeyPressTime > 0) {
      const interval = now - this.keyboardMetrics.lastKeyPressTime;
      this.keyboardMetrics.keyPressIntervals.push(interval);
      
      // Store key pairs for rhythm patterns (without storing actual keys)
      const lastKeyCode = this.keyboardMetrics.lastKeyCode;
      if (lastKeyCode) {
        const pairKey = `${lastKeyCode}-${keyCode}`;
        if (!this.keyboardMetrics.keyPairs[pairKey]) {
          this.keyboardMetrics.keyPairs[pairKey] = {
            count: 0,
            intervals: []
          };
        }
        this.keyboardMetrics.keyPairs[pairKey].count++;
        this.keyboardMetrics.keyPairs[pairKey].intervals.push(interval);
      }
    }
    
    // Store current key info for next press
    this.keyboardMetrics.lastKeyPressTime = now;
    this.keyboardMetrics.lastKeyCode = keyCode;
    
    // Calculate typing speed (characters per minute)
    if (this.keyboardMetrics.keyPressIntervals.length > 5) {
      // Use last 5 intervals for current speed calculation
      const recentIntervals = this.keyboardMetrics.keyPressIntervals.slice(-5);
      const sum = recentIntervals.reduce((a, b) => a + b, 0);
      const avgInterval = sum / recentIntervals.length;
      // Convert to characters per minute: 60000 ms / avg interval between keypresses
      this.keyboardMetrics.averageTypingSpeed = Math.round(60000 / avgInterval);
    }
    
    this.interactionFlow.push({
      type: 'keyboard',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle keyboard key up events - for measuring key hold durations
   */
  handleKeyUp(event) {
    const now = Date.now();
    this.keyboardMetrics.keyReleaseTimestamps.push(now);
    
    // Calculate key hold duration
    const keyCode = event.keyCode || event.which;
    if (this.keyboardMetrics.lastKeyCode === keyCode && this.keyboardMetrics.lastKeyPressTime > 0) {
      const holdDuration = now - this.keyboardMetrics.lastKeyPressTime;
      this.keyboardMetrics.keyHoldDurations.push(holdDuration);
      
      // Track rhythm patterns based on hold durations
      this.keyboardMetrics.rhythmPatterns.push({
        keyCode: keyCode,
        holdDuration: holdDuration
      });
      
      // Limit the size of the arrays to prevent memory issues
      if (this.keyboardMetrics.rhythmPatterns.length > 100) {
        this.keyboardMetrics.rhythmPatterns = this.keyboardMetrics.rhythmPatterns.slice(-100);
      }
      if (this.keyboardMetrics.keyHoldDurations.length > 100) {
        this.keyboardMetrics.keyHoldDurations = this.keyboardMetrics.keyHoldDurations.slice(-100);
      }
    }
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'keyboard-release',
      time: now
    });
    
    // Update active time
    this.updateActiveTime(now);
    
    // Process batch if threshold reached
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
    
    // Store click position with detailed information
    const position = {
      x: event.clientX,
      y: event.clientY,
      time: now,
      button: event.button,
      target: event.target.tagName.toLowerCase(),
      pageX: event.pageX,
      pageY: event.pageY
    };
    
    this.mouseMetrics.clickPositions.push(position);
    
    // Track click heatmap - divide screen into grid cells
    const gridSize = 50; // px per cell
    const gridX = Math.floor(event.clientX / gridSize);
    const gridY = Math.floor(event.clientY / gridSize);
    const gridKey = `${gridX},${gridY}`;
    
    if (!this.mouseMetrics.clickHeatmap[gridKey]) {
      this.mouseMetrics.clickHeatmap[gridKey] = 0;
    }
    this.mouseMetrics.clickHeatmap[gridKey]++;
    
    // Store timestamp for calculating click duration in mouseup
    this.mouseMetrics.lastClickTime = now;
    this.mouseMetrics.lastClickPosition = position;
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'mousedown',
      time: now,
      x: event.clientX,
      y: event.clientY
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle mouse up events - for measuring click durations
   */
  handleMouseUp(event) {
    const now = Date.now();
    
    // Calculate click duration if we have a matching mousedown event
    if (this.mouseMetrics.lastClickTime && this.mouseMetrics.lastClickPosition) {
      const clickDuration = now - this.mouseMetrics.lastClickTime;
      
      // Store the click duration
      this.mouseMetrics.clickDurations.push(clickDuration);
      
      // Check if this was a drag event (significant movement between down and up)
      const dx = event.clientX - this.mouseMetrics.lastClickPosition.x;
      const dy = event.clientY - this.mouseMetrics.lastClickPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) { // Threshold for considering it a drag vs. a click
        this.mouseMetrics.dragEvents.push({
          startX: this.mouseMetrics.lastClickPosition.x,
          startY: this.mouseMetrics.lastClickPosition.y,
          endX: event.clientX,
          endY: event.clientY,
          duration: clickDuration,
          distance: distance,
          direction: this.calculateDirection(dx, dy),
          time: now
        });
      }
      
      // Calculate movement precision (steadiness of cursor during click)
      // Lower values indicate more precise/steady clicks
      if (this.mouseMetrics.positions.length > 0) {
        const positions = this.mouseMetrics.positions.filter(
          pos => pos.time >= this.mouseMetrics.lastClickTime && pos.time <= now
        );
        
        if (positions.length > 1) {
          let totalDeviation = 0;
          for (let i = 1; i < positions.length; i++) {
            const prev = positions[i-1];
            const curr = positions[i];
            totalDeviation += Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          }
          
          // Average deviation per movement during click
          const precision = totalDeviation / (positions.length - 1);
          this.mouseMetrics.movementPrecision = 
            (this.mouseMetrics.movementPrecision * (this.mouseMetrics.clickCount - 1) + precision) / 
            this.mouseMetrics.clickCount;
        }
      }
    }
    
    // Reset for next click
    this.mouseMetrics.lastClickTime = 0;
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'mouseup',
      time: now,
      x: event.clientX,
      y: event.clientY
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Calculate direction from dx and dy
   */
  calculateDirection(dx, dy) {
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Convert angle to 8 cardinal directions
    if (angle > -22.5 && angle <= 22.5) return 'right';
    if (angle > 22.5 && angle <= 67.5) return 'down-right';
    if (angle > 67.5 && angle <= 112.5) return 'down';
    if (angle > 112.5 && angle <= 157.5) return 'down-left';
    if (angle > 157.5 || angle <= -157.5) return 'left';
    if (angle > -157.5 && angle <= -112.5) return 'up-left';
    if (angle > -112.5 && angle <= -67.5) return 'up';
    if (angle > -67.5 && angle <= -22.5) return 'up-right';
    return 'unknown';
  }
  
  /**
   * Handle double click events
   */
  handleDoubleClick(event) {
    const now = Date.now();
    this.mouseMetrics.doubleClickCount++;
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'dblclick',
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
    const now = Date.now();
    
    // Store initial touch position if this is the first move
    if (!this.touchMetrics.lastTouchPosition && this.touchMetrics.touchPositions.length > 0) {
      this.touchMetrics.lastTouchPosition = this.touchMetrics.touchPositions[this.touchMetrics.touchPositions.length - 1];
    }
    
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
      }
      
      // Capture pressure if available
      if (touch.force) {
        touchData.pressure = touch.force;
      }
      
      // Find matching touch from start event
      const startTouch = this.touchMetrics.touchPositions.find(t => t.identifier === touch.identifier);
      
      if (startTouch) {
        // Calculate swipe metrics
        const dx = touchData.x - startTouch.x;
        const dy = touchData.y - startTouch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dt = touchData.time - startTouch.time;
        const speed = dt > 0 ? distance / dt * 1000 : 0; // pixels per second
        
        // Only record if significant movement occurred
        if (distance > 10) { // 10px threshold for considering it a swipe
          const direction = this.calculateDirection(dx, dy);
          
          this.touchMetrics.swipeDirections.push(direction);
          this.touchMetrics.swipeSpeeds.push(speed);
          this.touchMetrics.swipeLengths.push(distance);
          
          // Check for pinch/zoom gestures if we have multiple touch points
          if (event.touches.length > 1) {
            this.touchMetrics.multiTouchEvents++;
            
            // Calculate distance between first two touch points
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.sqrt(
              Math.pow(touch2.clientX - touch1.clientX, 2) + 
              Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            // If we have a previous distance, we can determine pinch/zoom
            if (this.touchMetrics.lastPinchDistance) {
              const pinchDelta = currentDistance - this.touchMetrics.lastPinchDistance;
              
              this.touchMetrics.pinchEvents.push({
                time: now,
                delta: pinchDelta, // positive for zoom, negative for pinch
                distance: currentDistance,
                speed: Math.abs(pinchDelta) / (now - this.touchMetrics.lastPinchTime) * 1000
              });
            }
            
            this.touchMetrics.lastPinchDistance = currentDistance;
            this.touchMetrics.lastPinchTime = now;
          }
        }
      }
    });
    
    this.interactionFlow.push({
      type: 'touchmove',
      time: now,
      touchCount: event.touches.length
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle touch end events
   */
  handleTouchEnd(event) {
    const now = Date.now();
    
    // Calculate tap duration if we have a matching touchstart event
    if (this.touchMetrics.lastTouchTime > 0) {
      const tapDuration = now - this.touchMetrics.lastTouchTime;
      this.touchMetrics.tapDurations.push(tapDuration);
      
      // Check for double tap
      if (this.touchMetrics.lastTapEndTime && (now - this.touchMetrics.lastTapEndTime < 300)) {
        this.touchMetrics.doubleTapCount++;
      }
      
      this.touchMetrics.lastTapEndTime = now;
    }
    
    // Reset pinch tracking
    this.touchMetrics.lastPinchDistance = null;
    this.touchMetrics.lastPinchTime = 0;
    
    // Reset touch position tracking
    this.touchMetrics.lastTouchPosition = null;
    this.touchMetrics.lastTouchTime = 0;
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'touchend',
      time: now,
      touchCount: event.touches.length
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle touch cancel events
   */
  handleTouchCancel(event) {
    const now = Date.now();
    
    // Reset touch tracking
    this.touchMetrics.lastTouchPosition = null;
    this.touchMetrics.lastTouchTime = 0;
    this.touchMetrics.lastPinchDistance = null;
    this.touchMetrics.lastPinchTime = 0;
    
    // Update interaction flow
    this.interactionFlow.push({
      type: 'touchcancel',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle device motion events
   */
  handleDeviceMotion(event) {
    const now = Date.now();
    
    // Sample at the specified rate
    if (now - this.lastProcessTime >= this.options.sampleRate) {
      // Capture linear acceleration data
      if (event.acceleration) {
        const accel = {
          x: event.acceleration.x || 0,
          y: event.acceleration.y || 0,
          z: event.acceleration.z || 0,
          time: now
        };
        
        this.motionMetrics.accelerationSamples.push(accel);
        
        // Calculate acceleration magnitude (intensity of movement)
        const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
        this.motionMetrics.motionIntensity.push(magnitude);
        
        // Detect shaking events (sudden high acceleration)
        if (magnitude > 15) { // Threshold for shaking detection
          this.motionMetrics.shakingEvents++;
        }
        
        // Calculate acceleration changes between samples
        if (this.motionMetrics.lastAcceleration) {
          const deltaX = accel.x - this.motionMetrics.lastAcceleration.x;
          const deltaY = accel.y - this.motionMetrics.lastAcceleration.y;
          const deltaZ = accel.z - this.motionMetrics.lastAcceleration.z;
          const deltaT = now - this.motionMetrics.lastAcceleration.time;
          
          if (deltaT > 0) {
            // Calculate jerk (rate of change of acceleration)
            const jerk = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ) / (deltaT / 1000);
            
            // High jerk values indicate sudden movements
            if (jerk > 20) { // Threshold for sudden movement detection
              this.motionMetrics.suddenMovements = (this.motionMetrics.suddenMovements || 0) + 1;
            }
          }
        }
        
        this.motionMetrics.lastAcceleration = accel;
      }
      
      // Capture rotation data
      if (event.rotationRate) {
        this.motionMetrics.rotationSamples.push({
          alpha: event.rotationRate.alpha || 0, // rotation around z-axis
          beta: event.rotationRate.beta || 0,   // rotation around x-axis
          gamma: event.rotationRate.gamma || 0, // rotation around y-axis
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
        const stabilityScore = 1 / (1 + variance);
        this.motionMetrics.stability = stabilityScore;
        this.motionMetrics.steadinessScores.push(stabilityScore);
      }
      
      // Limit array sizes to prevent memory issues
      if (this.motionMetrics.accelerationSamples.length > 100) {
        this.motionMetrics.accelerationSamples = this.motionMetrics.accelerationSamples.slice(-100);
      }
      if (this.motionMetrics.rotationSamples.length > 100) {
        this.motionMetrics.rotationSamples = this.motionMetrics.rotationSamples.slice(-100);
      }
      if (this.motionMetrics.motionIntensity.length > 100) {
        this.motionMetrics.motionIntensity = this.motionMetrics.motionIntensity.slice(-100);
      }
      
      this.lastProcessTime = now;
    }
    
    this.updateActiveTime(now);
    this.processBatch();
  }

  /**
   * Handle device orientation events
   */
  handleDeviceOrientation(event) {
    const now = Date.now();
    
    // Sample at the specified rate
    if (now - this.lastProcessTime >= this.options.sampleRate) {
      // Capture orientation data
      const orientation = {
        alpha: event.alpha || 0,  // z-axis rotation [0, 360)
        beta: event.beta || 0,    // x-axis rotation [-180, 180)
        gamma: event.gamma || 0,  // y-axis rotation [-90, 90)
        time: now
      };
      
      this.motionMetrics.orientationSamples.push(orientation);
      
      // Calculate tilt angle (deviation from vertical)
      const tiltAngle = Math.sqrt(orientation.beta * orientation.beta + orientation.gamma * orientation.gamma);
      this.motionMetrics.tiltAngles.push(tiltAngle);
      
      // Update average tilt
      const tiltSum = this.motionMetrics.tiltAngles.reduce((a, b) => a + b, 0);
      this.motionMetrics.averageTilt = tiltSum / this.motionMetrics.tiltAngles.length;
      
      // Detect significant orientation changes
      if (this.motionMetrics.lastOrientation) {
        const deltaAlpha = Math.abs(orientation.alpha - this.motionMetrics.lastOrientation.alpha);
        const deltaBeta = Math.abs(orientation.beta - this.motionMetrics.lastOrientation.beta);
        const deltaGamma = Math.abs(orientation.gamma - this.motionMetrics.lastOrientation.gamma);
        
        // Adjust alpha for the 0/360 boundary case
        const adjustedDeltaAlpha = deltaAlpha > 180 ? 360 - deltaAlpha : deltaAlpha;
        
        // Check if this is a significant orientation change
        if (adjustedDeltaAlpha > 45 || deltaBeta > 45 || deltaGamma > 45) {
          this.motionMetrics.orientationChanges++;
        }
      }
      
      this.motionMetrics.lastOrientation = orientation;
      
      // Limit array sizes to prevent memory issues
      if (this.motionMetrics.orientationSamples.length > 100) {
        this.motionMetrics.orientationSamples = this.motionMetrics.orientationSamples.slice(-100);
      }
      if (this.motionMetrics.tiltAngles.length > 100) {
        this.motionMetrics.tiltAngles = this.motionMetrics.tiltAngles.slice(-100);
      }
      
      this.lastProcessTime = now;
    }
    
    this.updateActiveTime(now);
    this.processBatch();
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
    
    // Calculate scroll speed, acceleration, and direction changes
    if (this.scrollPatterns.scrollPositions.length > 1) {
      const lastIndex = this.scrollPatterns.scrollPositions.length - 1;
      const prevPos = this.scrollPatterns.scrollPositions[lastIndex - 1];
      const currentPos = this.scrollPatterns.scrollPositions[lastIndex];
      
      // Calculate vertical and horizontal scroll metrics
      const dx = currentPos.x - prevPos.x;
      const dy = currentPos.y - prevPos.y;
      const dt = (currentPos.time - prevPos.time) / 1000; // seconds
      
      if (dt > 0) {
        // Calculate speed in pixels per second
        const verticalSpeed = Math.abs(dy) / dt;
        const horizontalSpeed = Math.abs(dx) / dt;
        const totalSpeed = Math.sqrt(verticalSpeed * verticalSpeed + horizontalSpeed * horizontalSpeed);
        
        this.scrollPatterns.scrollSpeeds.push(totalSpeed);
        
        // Calculate scroll distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.scrollPatterns.scrollDistances.push(distance);
        
        // Calculate acceleration if we have previous speed data
        if (this.scrollPatterns.scrollSpeeds.length > 1) {
          const prevSpeed = this.scrollPatterns.scrollSpeeds[this.scrollPatterns.scrollSpeeds.length - 2];
          const acceleration = (totalSpeed - prevSpeed) / dt;
          this.scrollPatterns.scrollAccelerations.push(acceleration);
        }
        
        // Detect scroll pauses (very low speed)
        if (totalSpeed < 5) { // threshold for pause detection
          this.scrollPatterns.scrollPauses.push({
            position: currentPos,
            duration: dt
          });
        }
        
        // Check for direction change
        if (this.scrollPatterns.scrollPositions.length > 2) {
          const prevDy = prevPos.y - this.scrollPatterns.scrollPositions[lastIndex - 2].y;
          const prevDx = prevPos.x - this.scrollPatterns.scrollPositions[lastIndex - 2].x;
          
          // Vertical direction change
          if ((prevDy > 0 && dy < 0) || (prevDy < 0 && dy > 0)) {
            this.scrollPatterns.scrollDirectionChanges++;
          }
          
          // Horizontal direction change
          if ((prevDx > 0 && dx < 0) || (prevDx < 0 && dx > 0)) {
            this.scrollPatterns.scrollDirectionChanges++;
          }
        }
        
        // Track current scroll direction
        this.scrollPatterns.lastScrollDirection = {
          vertical: dy === 0 ? 'none' : (dy > 0 ? 'down' : 'up'),
          horizontal: dx === 0 ? 'none' : (dx > 0 ? 'right' : 'left')
        };
      }
    }
    
    // Calculate scroll depth as percentage of page
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ) - window.innerHeight;
    
    if (pageHeight > 0) {
      this.scrollPatterns.scrollDepthPercentage = (window.scrollY / pageHeight) * 100;
    }
    
    // Limit array sizes to prevent memory issues
    if (this.scrollPatterns.scrollPositions.length > 100) {
      this.scrollPatterns.scrollPositions = this.scrollPatterns.scrollPositions.slice(-100);
    }
    if (this.scrollPatterns.scrollSpeeds.length > 100) {
      this.scrollPatterns.scrollSpeeds = this.scrollPatterns.scrollSpeeds.slice(-100);
    }
    if (this.scrollPatterns.scrollAccelerations.length > 100) {
      this.scrollPatterns.scrollAccelerations = this.scrollPatterns.scrollAccelerations.slice(-100);
    }
    
    this.interactionFlow.push({
      type: 'scroll',
      time: now,
      position: scrollPosition,
      depth: this.scrollPatterns.scrollDepthPercentage
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
    
    // Track tab switches
    if (isVisible) {
      this.uiInteractions.tabSwitches++;
      this.timeOnPage.focusPeriods.push({
        start: now,
        end: null
      });
    } else {
      // Update the end time of the last focus period
      if (this.timeOnPage.focusPeriods.length > 0) {
        const lastPeriod = this.timeOnPage.focusPeriods[this.timeOnPage.focusPeriods.length - 1];
        if (lastPeriod && lastPeriod.end === null) {
          lastPeriod.end = now;
          
          // Calculate the duration of this focus period
          const duration = lastPeriod.end - lastPeriod.start;
          if (duration > this.timeOnPage.longestActivePeriod) {
            this.timeOnPage.longestActivePeriod = duration;
          }
        }
      }
      
      // Track idle periods
      this.timeOnPage.idlePeriods.push({
        start: now,
        end: null
      });
    }
    
    // Calculate time gaps between interactions
    if (this.uiInteractions.lastInteractionTime) {
      const gap = now - this.uiInteractions.lastInteractionTime;
      this.uiInteractions.interactionGaps.push(gap);
    }
    
    this.uiInteractions.lastInteractionType = 'visibility';
    this.uiInteractions.lastInteractionTime = now;
    
    this.interactionFlow.push({
      type: 'visibility',
      time: now,
      isVisible
    });
    
    if (isVisible) {
      this.updateActiveTime(now);
    }
    
    this.processBatch();
  }
  
  /**
   * Handle back button usage (popstate event)
   */
  handlePopState(event) {
    const now = Date.now();
    
    this.uiInteractions.backButtonUsage++;
    
    // Track navigation patterns
    this.uiInteractions.navigationPatterns.push({
      type: 'back',
      from: document.referrer,
      to: window.location.href,
      time: now
    });
    
    // Calculate time gaps between interactions
    if (this.uiInteractions.lastInteractionTime) {
      const gap = now - this.uiInteractions.lastInteractionTime;
      this.uiInteractions.interactionGaps.push(gap);
    }
    
    this.uiInteractions.lastInteractionType = 'navigation';
    this.uiInteractions.lastInteractionTime = now;
    
    this.interactionFlow.push({
      type: 'navigation',
      time: now,
      method: 'back'
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle copy events
   */
  handleCopy(event) {
    const now = Date.now();
    
    this.uiInteractions.copyPasteEvents++;
    
    // Calculate time gaps between interactions
    if (this.uiInteractions.lastInteractionTime) {
      const gap = now - this.uiInteractions.lastInteractionTime;
      this.uiInteractions.interactionGaps.push(gap);
    }
    
    this.uiInteractions.lastInteractionType = 'copy';
    this.uiInteractions.lastInteractionTime = now;
    
    this.interactionFlow.push({
      type: 'copy',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle paste events
   */
  handlePaste(event) {
    const now = Date.now();
    
    this.uiInteractions.copyPasteEvents++;
    
    // Calculate time gaps between interactions
    if (this.uiInteractions.lastInteractionTime) {
      const gap = now - this.uiInteractions.lastInteractionTime;
      this.uiInteractions.interactionGaps.push(gap);
    }
    
    this.uiInteractions.lastInteractionType = 'paste';
    this.uiInteractions.lastInteractionTime = now;
    
    this.interactionFlow.push({
      type: 'paste',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle cut events
   */
  handleCut(event) {
    const now = Date.now();
    
    this.uiInteractions.copyPasteEvents++;
    
    // Calculate time gaps between interactions
    if (this.uiInteractions.lastInteractionTime) {
      const gap = now - this.uiInteractions.lastInteractionTime;
      this.uiInteractions.interactionGaps.push(gap);
    }
    
    this.uiInteractions.lastInteractionType = 'cut';
    this.uiInteractions.lastInteractionTime = now;
    
    this.interactionFlow.push({
      type: 'cut',
      time: now
    });
    
    this.updateActiveTime(now);
    this.processBatch();
  }
  
  /**
   * Handle beforeunload event (user leaving the page)
   */
  handleBeforeUnload(event) {
    const now = Date.now();
    
    // Update the end time of the last focus period
    if (this.timeOnPage.focusPeriods.length > 0) {
      const lastPeriod = this.timeOnPage.focusPeriods[this.timeOnPage.focusPeriods.length - 1];
      if (lastPeriod && lastPeriod.end === null) {
        lastPeriod.end = now;
      }
    }
    
    // Calculate final session metrics
    this.sessionMetrics.sessionDuration = now - this.sessionMetrics.sessionStartTime;
    
    // Submit final fingerprint data before page unload
    this.submitFingerprint();
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
        activeTime: this.timeOnPage.activeTime,
        idlePeriods: this.timeOnPage.idlePeriods.slice(-20), // Last 20 idle periods
        focusPeriods: this.timeOnPage.focusPeriods.slice(-20), // Last 20 focus periods
        longestActivePeriod: this.timeOnPage.longestActivePeriod
      },
      scrollPatterns: this.pruneMetrics(this.scrollPatterns),
      formInteractions: this.formInteractions,
      uiInteractions: this.pruneMetrics(this.uiInteractions),
      sessionMetrics: this.sessionMetrics
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
